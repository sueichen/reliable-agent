# 根因追踪 (Root-Cause Tracing)

> 改编自 superpowers-zh/systematic-debugging/root-cause-tracing.md，扩展 C/C++ 系统级追踪方法。

## 核心原则

Bug 表现在调用栈深处（crash in malloc → 被非法参数触发 → 参数来自错误的数据结构 → 数据结构被竞态破坏 → 竞态因缺少同步）。你的本能是在表现处修复，但那只是症状。

**绝不只在错误出现处修复。反向追踪，找到最初的触发点。**

## 追踪流程

### 1. 观察症状

```
SIGSEGV at connection.cpp:150, t->write(buf, len)
  → t = 0x7f... (非 NULL，但内容是乱码)
```

### 2. 直接原因

哪个变量/指针导致了这个错误？

```
(gdb) frame 0
(gdb) print *t
$1 = {vptr = 0xdeadbeef, fd = -1, state = 255}
→ t 指向的对象已被破坏（vptr 不是合法的虚函数表地址）
→ 这是 use-after-free 的症状
```

### 3. 谁调用了这一层？

```
(gdb) bt
frame 1: ConnectionPool::get_connection() → 返回 t
frame 2: RequestHandler::handle() → 调用 get_connection()
frame 3: EventLoop::dispatch() → 调用 handle()
```

### 4. 数据从哪里来？

逐层追踪每个关键变量的来源：

```
frame 1: get_connection() 从 idle_list_ 中取 Connection*
  → idle_list_ 的状态是什么？
  (gdb) frame 1
  (gdb) print idle_list_
  → 发现 idle_list_ 中有重复的指针（已经被 release 了但没从 list 中移除）
```

### 5. 继续向上直到源头

```
frame 2: handle() 在异常路径中调用了 release_connection()
  → 但同时也把 Connection* 放入了 idle_list_
  → 导致同一对象既被释放又在空闲列表中

frame 3: dispatch() 中异常被吞掉了，handle() 不知道 release_connection() 已释放
  → 最初触发点: 异常路径的错误处理逻辑
```

### 6. 第 5 层根因

```
Why 5: dispatch() 的异常处理策略是"吞掉异常继续"，但子组件
        (handle/release_connection) 假设异常会向上传播并触发回滚
        → 异常处理语义不一致 → 导致资源管理状态错乱
```

## 系统级追踪技术

### gdb 反向调试（forward→backward）

```bash
rr record ./program
rr replay
(gdb) break connection.cpp:150 if t->vptr == 0xdeadbeef
(gdb) continue           # 向前执行到错误发生点
(gdb) watch -l t->vptr   # 设置 watchpoint
(gdb) reverse-continue   # 反向执行到 t->vptr 被修改的那一刻
(gdb) bt                 # 此时就是破坏 t 的代码
```

### bpftrace 数据流追踪

```bash
# 追踪一个变量在函数间的传递
bpftrace -e '
uprobe:<binary>:get_connection { @ctx[tid] = arg0; }
uretprobe:<binary>:get_connection /@ctx[tid]/ {
    printf("get_connection return=%p caller=%s\n", retval, ustack);
    delete(@ctx[tid]);
}'

# 追踪内存释放和后续访问
bpftrace -e '
uprobe:<binary>:free { @freed[arg0] = ustack; }
uprobe:<binary>:access { if (@freed[arg0]) {
    printf("USE-AFTER-FREE: addr=%p access_stack=%s free_stack=%s\n",
           arg0, ustack, @freed[arg0]);
} }'
```

### strace 因果链分析

```bash
# 追踪系统调用间的因果关系
strace -f -t -o trace.log ./program

# 分析模式:
# 1. mmap(NULL, 1GB) → 返回 -ENOMEM → 后续 malloc 返回 NULL → SIGSEGV
#    → 根因是 mmap 失败，不是 malloc
#
# 2. futex(FUTEX_WAIT) 不返回 → 后续 strace 无进展
#    → 追踪谁应该发送 FUTEX_WAKE 但没发送
```

### /proc 文件系统追踪

```bash
# 追踪进程状态变迁
while true; do
  echo "=== $(date +%T) ==="
  cat /proc/<pid>/status | grep -E "State|VmRSS|Threads"
  cat /proc/<pid>/stack
  sleep 0.5
done
# → 状态从 S(sleeping) → D(uninterruptible sleep) → Z(zombie)
# → 可能卡在内核 IO 等待
```

## 添加诊断埋点

当工具追踪不够时，编译插桩：

```c
// 在可疑的数据结构操作周围
#ifdef DEBUG_TRACE
#define TRACE_OP(op, ptr) \
  fprintf(stderr, "TRACE %s:%d %s ptr=%p caller=%s\n", \
          __FILE__, __LINE__, op, (void*)(ptr), __func__)
#else
#define TRACE_OP(op, ptr)
#endif

void* my_malloc(size_t sz) {
    void* p = malloc(sz);
    TRACE_OP("alloc", p);
    return p;
}
void my_free(void* p) {
    TRACE_OP("free", p);
    free(p);
}
```

## 找出污染源（测试场景）

多个测试中某些测试留下了污染状态：

```bash
# 二分法找污染测试
# 方法: 运行一半测试 → 检查状态 → 如果状态脏了，污染在前半段
ctest -R "test_group_a"           # 前半段 (CMake/CTest)
# 检查是否有残留状态
ctest -R "test_group_b"           # 后半段

# 或直接运行可执行测试文件
./build/tests/group_a_* --gtest_filter="*"  # Google Test 过滤
```

## 真实案例：空 projectDir 导致 git init 在源码目录执行

改编自 superpowers-zh 的案例，使用 C++ 系统级追踪：

```
症状: .git 被意外创建在 /path/to/source/

gdb 分析 (替换原来的 console.error):
  (gdb) break git_init if dir.empty()
  (gdb) run
  → 断点命中

  (gdb) bt
  #0  GitManager::git_init(dir="")
  #1  WorkspaceManager::createSessionWorkspace(projDir="", ...)
  #2  Session::initializeWorkspace(sessionId, ...)
  #3  Session::create(...)

追踪链:
  1. git_init 收到空目录 → cwd 被用作目标
  2. createSessionWorkspace 传入了空的 projDir
  3. initializeWorkspace 传递了空字符串
  4. Session::create 中 tempDir 初始化为 "" (顶层变量)
  5. setupTest 返回 { tempDir: "" }  ← 最初触发点

5 Whys:
  Why 1: tempDir 是空字符串
  Why 2: setupTest 在 beforeEach 之前被调用（顶层初始化）
  Why 3: 测试框架的初始化顺序是: 顶层变量 → beforeEach → 测试
  Why 4: 没有编译时或运行时检查阻止顶层初始化访问未就绪状态
  Why 5: 测试工具设计允许在环境就绪前执行初始化代码
  → 根因在测试框架初始化顺序依赖，而非常量检查

四层防御:
  1. Project::create() 入口校验非空
  2. WorkspaceManager 校验非空
  3. #ifdef TEST_MODE 下拒绝在 temp 目录之外执行危险 I/O 操作
  4. git_init 前记录参数 + stack trace
```
