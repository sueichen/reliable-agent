# 死锁与卡死诊断 (Deadlock Analysis)

> 覆盖互斥锁死锁、自旋锁死锁、读写锁死锁、活锁、无限等待（条件变量/信号量）的诊断方法。

## 症状判断

| 症状 | 可能类型 | 快速确认 |
|------|---------|---------|
| 进程无响应，CPU 使用率 ~0% | 死锁 | gdb attach + `thread apply all bt` |
| 进程无响应，CPU 使用率 ~100% | 活锁/无限循环 | perf top + gdb attach |
| 单个线程在特定条件下卡死 | 条件变量死等 | strace futex + gdb cond var |
| 多进程都在某个操作上卡住 | 跨进程死锁 | strace 所有进程 + IPC 状态 |

## 互斥锁死锁排查

### 第一步：gdb 获取全线程快照

```bash
gdb -p <pid>
(gdb) thread apply all bt
(gdb) info threads
```

### 第二步：分析线程栈

查找关键帧：

```
线程 A 卡在:
  #0 __lll_lock_wait ()           ← futex 内核等待
  #1 __pthread_mutex_lock ()
  #2 MyClass::methodA()           ← 尝试获取 mutex_A
     ...
  #N MyClass::methodB()           ← 已经持有 mutex_B

线程 B 卡在:
  #0 __lll_lock_wait ()
  #1 __pthread_mutex_lock ()
  #2 MyClass::methodB()           ← 尝试获取 mutex_B
     ...
  #N MyClass::methodA()           ← 已经持有 mutex_A

→ 经典 AB-BA 死锁: A 持有 A 等 B，B 持有 B 等 A
```

### 第三步：确认每个锁的持有者

```
(gdb) thread <N>                          # 切换到等待锁的线程
(gdb) frame 2                             # __pthread_mutex_lock 调用帧
(gdb) print *(pthread_mutex_t*)mutex      # 打印 mutex 结构
(gdb) print ((pthread_mutex_t*)mutex)->__data.__owner  # 持有者线程 ID
# 找到持有者线程 ID → 查看该线程在干什么
(gdb) thread find <owner_tid>

# 关键字段:
# __data.__lock: 锁状态 (0 = unlocked, 1 = locked no waiters, >1 = locked with waiters)
# __data.__owner: 持有者 TID (0 = nobody)
# __data.__count: 重入计数 (>1 = 同一个线程递归获取)
```

### TSan 死锁检测（若有重编译条件）

```bash
gcc -fsanitize=thread -g -O1 ...
export TSAN_OPTIONS=second_deadlock_stack=1
./program

# TSan 输出:
# WARNING: ThreadSanitizer: lock-order-inversion (potential deadlock)
#   Cycle in lock order graph: M1 => M2 => M1
#   Mutex M1 acquired here:
#     #0 pthread_mutex_lock
#     #1 MyClass::methodA() at file.cpp:42
#   Mutex M2 acquired here:
#     #0 pthread_mutex_lock
#     #1 MyClass::methodB() at file.cpp:58
```

### perf lock 分析（无需重编译，需 root）

```bash
perf lock record ./program
perf lock report                    # 锁等待时间排序
perf lock report -c                 # 锁竞争计数
```

## 读写锁死锁

```
模式: 两个读者互相阻塞 (不常见但可能)
  - 线程 A 持有读锁 → 尝试升级为写锁（某些实现不支持升级，会死锁）
  - 线程 A 持有读锁，线程 B 持有读锁，两者都尝试升级写锁

排查:
  (gdb) thread apply all bt | grep -E "pthread_rwlock|__rwlock"
  # 找到持有 rwlock 的线程 → 看它们的锁获取模式
```

## 自旋锁死锁

```
症状: CPU 100%，进程不响应，gdb bt 显示在 spin_lock 中

排查:
  perf top -p <pid>                   # 看哪个函数占用 CPU
  (gdb) thread apply all bt           # 多个线程卡在 spin_lock 中
  # 关注: 是否同一线程尝试重复获取同一自旋锁（不可重入）
  # 关注: 是否在中断上下文中尝试获取（自旋锁在中断中使用需关中断）
```

## 活锁

```
症状: CPU 100%，线程在不断重试但没有进展

排查:
  perf top → 热点在 try_lock + backoff 循环
  strace -p <pid> → 大量重复的 futex(FUTEX_WAKE) 和无进展
  (gdb) attach → bt 看到 try_acquire + backoff 模式反复出现
```

## 条件变量无限等待

```bash
# strace futex 调用
strace -e trace=futex -p <pid>

# 常见模式:
# futex(addr, FUTEX_WAIT, val, NULL) → 永不返回
# 原因: 没有人发 FUTEX_WAKE, 或 val 不匹配导致错过唤醒

# gdb 分析:
(gdb) frame <pthread_cond_wait 帧>
(gdb) print cond_var                # 条件变量状态
(gdb) thread apply all bt          # 找谁应该 signal 但没 signal
```

## 信号处理中的死锁

**危险模式**：signal handler 中尝试获取锁

```c
// 线程 A 持有 mutex → 收到信号
// signal handler 尝试获取同一个 mutex → 死锁（同一线程重入非递归锁）

// 排查:
(gdb) bt → frame 0 在 __lll_lock_wait
(gdb) bt → 上层帧在 signal handler 中
// 查找持有者 → 就是当前线程自己 → 自死锁
```

使用 `man 7 signal-safety` 查看允许在 signal handler 中调用的函数列表。

## 跨进程死锁

```
症状: 多个进程相互等待（通过 IPC、文件锁、socket）

排查:
  strace -f -p <pid_A>               # 看 A 在等什么
  strace -f -p <pid_B>               # 看 B 在等什么
  ipcs -p                            # System V IPC 所有权
  lsof -p <pid>                      # 文件和 socket 等待
  /proc/<pid>/wchan                  # 内核等待通道
```

## 完整案例：AB-BA 死锁

```
现象: 服务运行 2 小时后请求无响应，CPU 接近 0%

gdb attach:
  (gdb) thread apply all bt

  Thread 7 (Worker):
    #0 __lll_lock_wait ()
    #1 __pthread_mutex_lock () at pthread_mutex_lock.c:81
    #2 ConnectionPool::release_connection() at pool.cpp:150
    #3 RequestHandler::process() at handler.cpp:88

  Thread 8 (Reaper):
    #0 __lll_lock_wait ()
    #1 __pthread_mutex_lock () at pthread_mutex_lock.c:81
    #2 RequestHandler::process() at handler.cpp:72
    #3 ConnectionPool::reap_idle() at pool.cpp:200

  (gdb) frame 2, thread 7
  (gdb) print pool_mutex.__data.__owner → TID=123 (Thread 8)
  → Thread 7 等 pool_mutex，被 Thread 8 持有

  (gdb) frame 2, thread 8
  (gdb) print handler_mutex.__data.__owner → TID=122 (Thread 7)
  → Thread 8 等 handler_mutex，被 Thread 7 持有

5 Whys:
  Why 1: Thread 7 等 pool_mutex, Thread 8 等 handler_mutex
  Why 2: Thread 7 持有 handler_mutex 时调用了 release_connection() (需要 pool_mutex)
         Thread 8 持有 pool_mutex 时调用了 RequestHandler::process() (需要 handler_mutex)
  Why 3: release_connection() 和 reap_idle() 互相调用对方模块函数
  Why 4: 模块边界不清晰——ConnectionPool 和 RequestHandler 互相依赖
  Why 5: 架构上缺少分层规则，模块间形成隐式锁依赖图而没有显式文档
  → 第 5 层根因: 模块边界模糊 + 缺少锁获取顺序约束
```
