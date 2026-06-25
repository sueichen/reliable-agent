# 内存泄漏与内存错误诊断 (Memory Analysis)

> 覆盖内存泄漏、越界访问、use-after-free、double free、栈溢出、OOM、文件描述符泄漏的诊断方法。

## 内存泄漏 (Memory Leak)

### 泄漏分类

| 类型 | valgrind 标注 | 含义 | 严重度 |
|------|-------------|------|--------|
| 确定泄漏 | definitely lost | 没有任何指针指向这块内存 | Critical |
| 间接泄漏 | indirectly lost | 指针本身在已泄漏的块中 | High (伴随 definitely) |
| 可能泄漏 | possibly lost | 内部指针指向块中间 | Medium |
| 仍可达 | still reachable | 程序结束时仍被全局/静态变量持有 | Low (通常不是泄漏) |

### 方法一：ASan/LeakSanitizer（最精确）

```bash
gcc -fsanitize=address -fno-omit-frame-pointer -g -O1 <sources>
export ASAN_OPTIONS=detect_leaks=1
./program

# LSan 输出:
# Direct leak of 1024 byte(s) in 1 object(s) allocated from:
#     #0 0x... in operator new(unsigned long)
#     #1 0x... in DataBuffer::DataBuffer() at buffer.cpp:15
#     #2 0x... in main at main.cpp:30
# SUMMARY: AddressSanitizer: 1024 byte(s) leaked in 1 allocation(s).
```

### 方法二：valgrind memcheck（无需重编译）

```bash
valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all \
         --track-origins=yes --log-file=valgrind.log \
         ./program

# 报告解读优先级:
# 1. definitely lost → 必须修复（从分配调用栈定位代码）
# 2. indirectly lost → 通常伴随 definitely，修复 definitely 后消失
# 3. possibly lost → 检查是否真的泄漏（某些 STL 实现会产生）
# 4. still reachable → 审视是否应该释放（如 shutdown 未清理）
```

### 方法三：heaptrack（运行时 heap profiler）

```bash
heaptrack ./program
heaptrack_print heaptrack.<pid>.gz | head -50
# 输出: 按分配大小排序的热点分配位置
# Top 10 allocations by peak memory consumption:
#   42.5 MB  DataBuffer::load() at buffer.cpp:15
#   12.1 MB  Connection::read() at conn.cpp:88
#   8.3 MB   Logger::flush() at log.cpp:42
```

### 泄漏增长监控（运行中进程）

```bash
# 方法 1: /proc 对比
while true; do
  echo "$(date): $(cat /proc/<pid>/status | grep VmRSS)"
  sleep 60
done

# 方法 2: heaptrack 动态 attach
heaptrack -p <pid>
# Ctrl-C 后生成报告

# 方法 3: bpftrace 追踪热点分配位置
bpftrace -e 'uprobe:<binary>:*alloc* { @alloc[tid, ustack] = count(); }'
```

## Use-After-Free (UAF)

**最常见的内存错误之一**。ASan 是最佳检测工具。

```bash
gcc -fsanitize=address -g -O0 ...

# ASan 输出示例:
# ==12345==ERROR: AddressSanitizer: heap-use-after-free on address 0x614000000040
# READ of size 8 at 0x614000000040 thread T0
#     #0 0x... in Foo::use(Object* this) at foo.cpp:20
# freed by thread T0 here:
#     #0 0x... in operator delete(void*)
#     #1 0x... in Manager::cleanup() at mgr.cpp:15
# previously allocated by thread T0 here:
#     #0 0x... in operator new(unsigned long)
#     #1 0x... in Manager::create() at mgr.cpp:10
# → 路径: create() 分配 → cleanup() 释放 → Foo::use() 使用(错误!)
```

**无 ASan 时的排查方法**:
- valgrind memcheck（会检测 UAF）
- gdb watchpoint: 在释放后对内存地址设 watchpoint
- glibc `MALLOC_CHECK_=3` + 复现

## Double Free

```bash
gcc -fsanitize=address -g -O0 ...
# ASan 输出:
# ERROR: AddressSanitizer: attempting double-free on 0x...

# glibc 检测:
MALLOC_CHECK_=3 ./program
# *** Error in `./program': free(): invalid pointer: 0x... ***
```

**排查方向**: gdb 在 `free()` 上设断点，追踪谁做了第二次 free。常见模式：两个对象持有同一指针且都执行了 delete、浅拷贝导致、异常路径中重复清理。

## 栈溢出 (Stack Overflow)

```bash
# 症状: SIGSEGV with rsp near stack limit
(gdb) info registers rsp
(gdb) info proc mappings         # 找 [stack] 段
# 如果 rsp 接近或超出 stack 段范围 → 栈溢出

# ASan 检测:
gcc -fsanitize=address -g ...
# ASan 自动报告栈溢出

# ulimit 分析:
ulimit -s                          # 当前栈大小限制 (KB)
# 太深的递归? 大局部数组? alloca() 过大?
```

## 文件描述符泄漏 (FD Leak)

### 检测

```bash
# 监控 FD 数量变化
watch -n 1 "ls /proc/<pid>/fd | wc -l"
# 如果持续增长 → FD 泄漏

# 查看 FD 分布
ls -la /proc/<pid>/fd/ | awk '{print $11}' | sort | uniq -c | sort -rn
# 大量的 socket: → socket 泄漏
# 大量的 pipe: → pipe 泄漏
# 大量的 <path>: → 文件未关闭
```

### 定位泄漏源

```bash
# strace 追踪 open/close 不匹配
strace -f -e trace=open,openat,close -p <pid> -o strace_fd.log
# 分析: open 的数量 - close 的数量 = 泄漏基数

# bpftrace 脚本追踪 open 调用栈
bpftrace -e 'tracepoint:syscalls:sys_enter_openat {
               @opens[pid, ustack] = count(); }
             tracepoint:syscalls:sys_enter_close {
               @closes[pid] = count(); }'
```

**常见根因**:
- 异常路径中未关闭 FD（缺少 RAII 封装）
- 循环中 open 但作用域没退出导致无 close
- socket 连接未设置 SO_REUSEADDR + 未关闭
- fork 后子进程继承了父进程的 FD 未关闭

## OOM (Out of Memory Killer)

```bash
# 确认 OOM Killer 触发
dmesg | grep -i "out of memory"
dmesg | grep -i "killed process"

# 典型日志解读:
# oom-kill:constraint=CONSTRAINT_NONE ...    ← 无 cgroup 限制
# oom-kill:constraint=CONSTRAINT_MEMCG ...   ← cgroup 内存限制触发
#
# Killed process 12345 (program) total-vm:8GB,
# anon-rss:7.5GB → 匿名内存 (malloc/mmap) 7.5GB
# file-rss:100MB → 文件映射内存 100MB
# → 7.5GB 的匿名内存是可疑方向

# 分析 OOM score
cat /proc/<pid>/oom_score             # 内核的 OOM 评分
cat /proc/<pid>/oom_score_adj         # 手动调整
# oom_score_adj = 1000 → 100% 优先被杀
# oom_score_adj = -1000 → 完全避免被杀
```

## 完整案例：缓慢内存泄漏

```
现象: 生产服务 RSS 每 24 小时增长 ~200MB，7 天后 OOM

排查:
  1. heaptrack 录制 1 小时:
     Top allocation: Connection::read() 500,000 次 × 平均 1KB = 500MB
     → 每次 read 分配，但只有在 Connection::close() 时才释放

  2. strace 确认:
     strace -c -p <pid>
     → recvfrom 500K calls, close 450K calls (500K - 450K = 50K 泄漏的连接)

  3. 代码审查:
     → Connection::read() 在异常路径（recvfrom EAGAIN 后）直接 return
     → 没有调用 close()，没有 RAII 包装

5 Whys:
  Why 1: Connection 对象在异常路径未释放
  Why 2: read() 中 EAGAIN 处理直接 return，未调用 cleanup
  Why 3: 资源管理使用的是裸 new/delete，异常路径未覆盖
  Why 4: 缺少 RAII 包装——资源生命周期不绑定到对象生命周期
  Why 5: 团队代码规范未要求资源获取即初始化 (RAII)，code review 未检查异常安全
  → 第 5 层根因: 编码规范缺失 + 代码审查未覆盖异常安全
```
