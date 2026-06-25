# 逻辑错误与竞态条件诊断 (Logic & Race Analysis)

> 覆盖逻辑错误（无 crash 但结果错误/状态机错乱/无限循环）和并发问题（数据竞争/顺序错乱/原子性破坏/共享内存损坏）的诊断方法。

## 逻辑错误诊断

逻辑错误不产生 crash，是最难排查的问题类型。核心方法论：**二分法隔离** — 将问题空间一步步缩小。

### 方法一：printf bisect（最通用）

当 bug 表现在某个函数的输出错误时：

```c
// 将函数分为前后两半
void buggy_function(Input in) {
    Data mid = process_first_half(in);
    fprintf(stderr, "DEBUG mid.value=%d, mid.state=%d\n", mid.value, mid.state);

    Result out = process_second_half(mid);
    fprintf(stderr, "DEBUG out=%d\n", out);

    return out;
}
// 如果 mid 已错误 → bug 在前半段 → 在前半段继续二分
// 如果 mid 正确但 out 错误 → bug 在后半段
```

### 方法二：gdb conditional breakpoint

```bash
(gdb) break buggy_file.cpp:100 if x < 0
(gdb) break buggy_file.cpp:100
(gdb) commands
> silent
> printf "x=%d, y=%d, ptr=%p\n", x, y, ptr
> continue
> end
(gdb) run
# 自动打印每次断点命中时的变量值，不中断执行
```

### 方法三：gdb watchpoint（追踪变量变化）

```bash
(gdb) watch global_state          # 硬件 watchpoint（最快，限制 4 个）
(gdb) watch -l global_state       # 指定位置 watchpoint
(gdb) rwatch *0x12345678          # 读 watchpoint
(gdb) awatch *0x12345678          # 读写 watchpoint
# 每次变量被修改时自动断下，显示修改者和新值
```

### 方法四：rr reverse execution（最强大）

```bash
rr record ./program
rr replay
(gdb) break crash_or_error_point
(gdb) continue
(gdb) reverse-step                # 反向执行一行
(gdb) reverse-continue            # 反向执行到上一个断点
(gdb) reverse-finish              # 反向执行到调用者
# → 从错误点"倒放"到正确状态点，找到第一个偏离的状态
```

### 方法五：状态快照对比

当有"正常情况"和"异常情况"可对比时：

```bash
# 分别在正常和异常场景下录制 rr trace
rr record ./program --good-input
rr record ./program --bad-input

# 在 replay 中设置相同的断点，对比关键变量
(gdb) break critical_function
(gdb) commands
> printf "state=%d, count=%d, ptr=%p\n", state, count, ptr
> continue
> end
# diff 两个 replay 的输出，找第一个分叉点
```

### 无限循环定位

```bash
# 方法 1: gdb attach + bt → 看循环在哪
gdb -p <pid>
(gdb) bt                          # 记录当前位置
(gdb) continue
# Ctrl-C
(gdb) bt                          # 对比两次 bt，一致的帧就是循环位置

# 方法 2: strace 系统调用模式
strace -p <pid>
# 无限循环通常分两类:
# - 纯计算循环: strace 无任何系统调用 → 看 gdb bt
# - IO 循环: strace 有重复的系统调用模式 → 分析调用参数

# 方法 3: perf top 热点
perf top -p <pid>                 # 哪个函数一直在运行
```

## 竞态条件诊断

### TSan（首选，需重编译）

```bash
gcc -fsanitize=thread -fno-omit-frame-pointer -g -O1 <sources>

# TSan 数据竞争报告:
# WARNING: ThreadSanitizer: data race
#   Read of size 4 at 0x7b0400000010 by thread T1:
#     #0 Reader::check() at reader.cpp:10
#   Previous write of size 4 at 0x7b0400000010 by thread T2:
#     #0 Writer::update() at writer.cpp:20
#   Location is global 'shared_counter' of size 4

# 解读: reader.cpp:10 和 writer.cpp:20 同时访问 shared_counter，
#       至少一个是写操作，且没有同步保护 → 数据竞争
```

### rr chaos mode（无需重编译）

```bash
# rr 的 chaos mode 随机化线程调度，大幅提高竞态触发概率
rr record --chaos ./program
rr replay
# 在 replay 中:
(gdb) break suspected_race_point
(gdb) run
# 每次 replay 的调度不同（chaos mode），多 replay 几次
```

### Helgrind（valgrind 的竞态检测）

```bash
valgrind --tool=helgrind ./program
# Helgrind 报告:
# Possible data race during read of size 4 at 0x... by thread #1
# ...
# This conflicts with a previous write of size 4 by thread #2
#
# 注意: Helgrind 误报率较高（特别是对 lock-free 代码），需确认
```

### 压力触发手段

```bash
# 增加并发度
for i in $(seq 1 100); do ./program & done; wait

# CPU 亲和性打散（增加调度随机性）
taskset -c 0,1,2,3 ./program

# 系统负载注入
stress --cpu 4 --io 2 --timeout 60s &
./program

# rr chaos mode（最推荐的随机化方案）
rr record --chaos -c 100 ./program  # 录制 100 次
```

## 共享内存 / IPC 损坏

```bash
# 检查共享内存状态
ipcs -m                           # System V 共享内存段
ipcs -s                           # 信号量
ipcs -q                           # 消息队列

# 管道状态
ls -la /proc/<pid>/fd | grep pipe
cat /proc/<pid>/fdinfo/<fd>       # 管道缓冲区使用量

# 共享内存内容分析
# 方法 1: gdb examine
(gdb) attach <pid>
(gdb) x/64x <shm_address>         # 查看共享内存内容
(gdb) watch *<shm_address>        # 监控修改

# 方法 2: 校验和方案（预防性）
# 在写入端计算校验和 → 写入共享内存
# 在读取端验证校验和 → 不匹配 = 数据损坏
```

## 信号处理错误

```bash
# 确认信号掩码
cat /proc/<pid>/status | grep -E "^Sig(Cgt|Ign|Blk)"
# SigCgt: 被捕获的信号 (Caught)
# SigIgn: 被忽略的信号 (Ignored)
# SigBlk: 被阻塞的信号 (Blocked)

# strace 追踪信号
strace -e trace=signal -p <pid>
# 关注: 信号在哪个线程被处理, handler 中做了什么系统调用

# gdb 信号调试
(gdb) info signals                 # 查看 gdb 如何转发信号
(gdb) handle SIGUSR1 stop         # 让 gdb 在收到 SIGUSR1 时停止
(gdb) break signal_handler_func   # 在 handler 函数入口断点
```

**常见信号处理错误**:
- signal handler 中调用 `printf`/`malloc`/`pthread_mutex_lock`（非异步安全函数）
- signal handler 中修改全局变量但未声明 `volatile sig_atomic_t`
- 信号被屏蔽导致永远不会被处理

## 完整案例：数据竞争导致计数器错误

```
现象: request_counter 在高并发下偶尔出现负值

TSan 报告:
  data race at stats.cpp:15 (read of counter) and stats.cpp:22 (write of counter)

gdb 分析:
  (gdb) x/4x &counter
  0x...: 0xfffffffc                   ← 负数 (!)

代码:
  // stats.cpp:15
  if (counter > 0) counter--;        // 非原子的读-修改-写

  // stats.cpp:22
  counter++;                          // 非原子的读-修改-写

复现:
  rr chaos mode + 100 并发执行 → 每次都在 ~100 次迭代后触发

5 Whys:
  Why 1: counter-- 和 counter++ 产生数据竞争
  Why 2: 使用了非原子操作
  Why 3: 开发者假设单线程访问（但实际上多线程调用）
  Why 4: stats 模块没有文档说明线程安全性，调用者不知道
  Why 5: 接口设计没有显式表达线程安全语义（const = 线程安全? mutable = 需要锁?）
  → 第 5 层根因: API 设计未考虑线程安全语义的表达
```
