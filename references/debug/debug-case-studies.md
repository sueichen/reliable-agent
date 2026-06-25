# 调试案例集 (Debug Case Studies)

> 完整端到端案例，展示 ra-debug 从 Phase 1 到 Phase 4 的完整过程。

## 案例 1: 生产服务 SIGSEGV Crash

### Phase 1: 问题分类与现场保全

**问题描述**: C++ HTTP 服务运行 4-6 小时后 SIGSEGV，`coredumpctl list` 显示多次 crash，每次间隔约 5 小时。

**复现性**: 稳定复现 — 压测 1000 QPS 下 3-5 小时必现。

**现场证据**:
```bash
coredumpctl info <pid>
# Signal: SIGSEGV (11), si_code: SEGV_MAPERR (访问未映射地址)
# si_addr: 0x7f8a3c000040

dmesg | tail -5
# program[12345]: segfault at 7f8a3c000040 ip 00007f8a4b2c1a00 sp 00007f8a4b2c0970 error 4 in libservice.so
```

**初步分类**: Crash (SIGSEGV / SEGV_MAPERR)。可能原因: use-after-free (地址不是 NULL 但未映射)、野指针。

### Phase 2: 假设驱动证据收集

**假设 1**: use-after-free — 对象被释放后仍被引用
**工具**: gdb coredump + ASan 重编译复现

```bash
(gdb) bt full
#0  process_request(HttpRequest* req) at handler.cpp:150
    req = 0x7f8a3c000040
#1  handle_connection(Connection* conn) at server.cpp:88
    conn = 0x7f8a2b000100

(gdb) frame 0
(gdb) print *req
$1 = {method = 0x0, path = 0x0, headers = {...}} ← 内存已被清空

(gdb) info proc mappings
# 0x7f8a3c000000-0x7f8a3c001000 rw-p ← 该地址区域存在
# 但 req 指针指向的内容全是 0x00 → 已被释放并可能被清零
```

ASan 重编译后复现:
```
heap-use-after-free on address 0x7f8a3c000040
READ of size 8 at 0x7f8a3c000040 thread T5
    #0 process_request(HttpRequest*) at handler.cpp:150
freed by thread T3 here:
    #0 operator delete(void*)
    #1 RequestCache::evict() at cache.cpp:55
previously allocated by thread T5 here:
    #0 operator new(unsigned long)
    #1 RequestParser::parse(const char*) at parser.cpp:30
```

**证据比对**: 支持 use-after-free 假设。Cache::evict() 释放了 Request，但 process_request() 仍在引用。

### Phase 3: 根因深度确认

**反向追踪**:
```
症状层: process_request 使用了已释放的 req
  → req 从 Connection::get_request() 获得 (frame 1)
  → Connection 保存了裸指针
  → Cache::evict() 通过另一个指针释放了同一对象
  → 两个组件共享同一对象但没有生命周期协调
```

**5 Whys**:
| 层次 | 原因 | 证据 |
|------|------|------|
| Why 1 | `req` 指针指向已释放的内存 | ASan heap-use-after-free 报告 |
| Why 2 | Cache::evict() 释放了 Connection 仍在引用的 Request | ASan freed-by vs allocated-by 在 2 个线程 |
| Why 3 | Request 对象被 Connection 和 Cache 共享，但没有明确的 owner | 代码审查: 两者都保存裸指针 |
| Why 4 | 生命周期管理使用裸指针 + 手动 delete，无 RAII | 代码审查: 没有 shared_ptr/unique_ptr |
| Why 5 | 项目代码规范未要求 ownership 语义显式表达 + Code review 未检查对象生命周期 | 没有所有权规范文档 |

**最小复现**:
```cpp
// 最小复现代码
auto req = new HttpRequest();        // 分配
Connection conn; conn.set(req);     // Connection 持有裸指针
Cache cache;    cache.add(req);     // Cache 也持有裸指针
cache.evict();                      // Cache 释放了 req
conn.process();                     // Connection 仍在使用 → SIGSEGV
```

### Phase 4: 修复策略与纵深防御

**修复 (第 5 层)**: 引入 `std::shared_ptr<HttpRequest>`，明确共享所有权。同时建立代码规范要求所有权语义文档化。

**四层防御**:
1. 入口: Request 构造函数记录创建点（file:line + stack trace）
2. 业务: Cache::add() 和 Connection::set() 使用 weak_ptr 检测已释放
3. 环境: DEBUG 模式启用 ASan 自动检测
4. 埋点: Request 分配/释放记录到环形缓冲区供事后分析

---

## 案例 2: 多线程死锁 — 数据库连接池

### Phase 1: 问题分类与现场保全

**问题描述**: 高并发场景下服务偶尔"卡死"，CPU 接近 0%，无日志输出。需重启恢复。

**复现性**: 间歇性，1000 并发连接下约 30 分钟出现一次。

**现场证据**:
```bash
gdb -p <pid>
(gdb) thread apply all bt

Thread 10 (WorkerPool::worker):
  #0 __lll_lock_wait ()
  #1 __pthread_mutex_lock () at pthread_mutex_lock.c
  #2 ConnectionPool::get_connection() at pool.cpp:45
  #3 TransactionHandler::execute() at transaction.cpp:67

Thread 11 (Reaper):
  #0 __lll_lock_wait ()
  #1 __pthread_mutex_lock () at pthread_mutex_lock.c
  #2 TransactionHandler::commit() at transaction.cpp:120
  #3 ConnectionPool::reap_idle_connections() at pool.cpp:89
```

**初步分类**: 死锁 — 两个线程互相等待对方持有的锁。

### Phase 2: 假设驱动证据收集

**假设 1**: AB-BA 锁顺序反转
**工具**: gdb mutex owner 分析

```bash
(gdb) thread 10
(gdb) frame 2   # ConnectionPool::get_connection
(gdb) print pool->mutex.__data.__owner
$1 = 12345      # Thread 11 的 TID

(gdb) thread 11
(gdb) frame 2   # TransactionHandler::commit
(gdb) print txn->mutex.__data.__owner
$2 = 12344      # Thread 10 的 TID

# Thread 10 持有 txn->mutex，等 pool->mutex (被 Thread 11 持有)
# Thread 11 持有 pool->mutex，等 txn->mutex (被 Thread 10 持有)
# → 确认 AB-BA 死锁
```

**证据比对**: 支持 AB-BA 锁顺序反转假设。

### Phase 3: 根因深度确认

**5 Whys**:
| 层次 | 原因 | 证据 |
|------|------|------|
| Why 1 | Thread 10 等 pool 锁，Thread 11 等 txn 锁 | gdb __data.__owner 交叉分析 |
| Why 2 | Thread 10 持有 txn 锁时请求 pool 锁，Thread 11 持有 pool 锁时请求 txn 锁 | 代码路径: get_connection 先锁 txn 再锁 pool; reap_idle 先锁 pool 再锁 txn |
| Why 3 | 两个函数锁获取顺序不一致 | 代码审查: get_connection() 锁 A→B，reap_idle() 锁 B→A |
| Why 4 | 没有锁顺序文档或约束机制 | 项目中没有 lock ordering rule |
| Why 5 | 模块边界模糊 — Reaper 和 Handler 互相依赖对方模块 | 架构上 ConnectionPool 和 TransactionHandler 双向依赖 |

**最小复现**:
```cpp
// 两个线程分别执行:
Thread A: get_connection() { lock(txn); lock(pool); use(); unlock(pool); unlock(txn); }
Thread B: reap_idle()      { lock(pool); lock(txn); use(); unlock(txn); unlock(pool); }
// 时序: A 获取 txn, B 获取 pool, A 等 pool, B 等 txn → 死锁
```

### Phase 4: 修复策略与纵深防御

**修复 (第 5 层)**:
1. 重构 ConnectionPool 和 TransactionHandler 移除双向依赖
2. 引入全局锁顺序表: pool→txn，所有代码路径统一
3. 编译时或运行时检测锁顺序违规（TSan 或自定义 assert）

**四层防御**:
1. 入口: mutex wrapper 记录锁获取顺序，违反时 assert
2. 业务: 每个需要多锁的函数显式列出锁顺序
3. 环境: CI 中 TSan 检测锁顺序反转
4. 埋点: 锁等待超过 100ms 打印持有者信息

---

## 案例 3: 内存泄漏 — 日志模块泄漏

### Phase 1: 问题分类与现场保全

**问题描述**: 服务 RSS 每天增长约 300MB，一周后触发 OOM。无 crash。

**复现性**: 稳定 — 运行即可观测内存增长。

**现场证据**:
```bash
# 24 小时对比
T+0h:  cat /proc/<pid>/status | grep VmRSS → 500 MB
T+24h: cat /proc/<pid>/status | grep VmRSS → 800 MB

# heaptrack 录制 1 小时
heaptrack ./service
heaptrack_print heaptrack.<pid>.gz | head -20

# 输出:
# Top allocations by peak:
#   450 MB  Logger::buffer_   ← 持续增长
#    80 MB  ConnectionPool::conns_
#    20 MB  Cache::entries_

# valgrind memcheck (退出时):
valgrind --leak-check=full ./service
# 8,192,000 bytes in 1000 blocks definitely lost at:
#     Logger::write(const char* msg) at logger.cpp:42
```

**初步分类**: 内存泄漏 — Logger 模块。

### Phase 2: 假设驱动证据收集

**假设 1**: Logger 的 buffer 不断增长未释放
**工具**: heaptrack + 代码审查

heaptrack 火焰图分析: buffer 分配全来自 `Logger::write()`:
```
Logger::write() → buffer_.append(msg) → buffer_.reserve(new_size) → realloc
```

代码审查:
```cpp
void Logger::write(const char* msg) {
    buffer_.append(msg);        // 只追加，从不清空
    if (buffer_.size() > FLUSH_THRESHOLD) {
        flush_to_disk();        // 只写磁盘，不清 buffer
        // BUG: flush_to_disk() 应该 clear buffer_ 但没有！
    }
}
```

**证据比对**: 支持假设。buffer_ 只增长不释放。

### Phase 3: 根因深度确认

**5 Whys**:
| 层次 | 原因 | 证据 |
|------|------|------|
| Why 1 | buffer_ 持续增长未释放 | heaptrack + 代码审查 |
| Why 2 | flush_to_disk() 没有调用 buffer_.clear() | 代码审查 |
| Why 3 | 开发者假设 std::string::append 后会自动管理（误解 API） | git blame: 该函数由初级工程师编写 |
| Why 4 | code review 未发现此问题 | gerrit history: flush_to_disk() review 只看写磁盘逻辑，未关注内存 |
| Why 5 | 性能测试未包含内存使用指标；code review checklist 无"资源释放"项 | 项目流程缺少内存维度的门禁 |

### Phase 4: 修复策略与纵深防御

**修复 (第 5 层)**: `flush_to_disk()` 后调用 `buffer_.clear()`。同时在编码规范中要求所有 `append`/`push` 类操作必须有对应的 `clear`/`pop` 路径。

**四层防御**:
1. 入口: flush_to_disk() 开始时检查 buffer_ 大小，记录到 metrics
2. 业务: 添加 `buffer_.max_size()` 上限，超过时强制清空
3. 环境: CI 性能测试加入内存 RSS 基线对比（+10% = 失败）
4. 埋点: Logger 的 buffer 大小暴露为 Prometheus gauge 指标，用于生产监控
