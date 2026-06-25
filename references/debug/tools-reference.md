# 调试工具参考矩阵 (Tools Reference)

> 本文档是 `ra-debug` Phase 2 的工具选择参考。按问题类型匹配工具，按降级链降级，按输出解读要点分析结果。

## 工具速查矩阵

| 工具 | 适用问题 | 需 root | 需重编译 | 性能开销 | 最佳精度 |
|------|---------|---------|---------|---------|---------|
| gdb + coredumpctl | Crash/死锁/逻辑 | 否 | 否 | 离线 | ⭐⭐⭐⭐⭐ |
| ASan (AddressSanitizer) | 内存越界/UAF/泄漏 | 否 | **是** | 2× slow | ⭐⭐⭐⭐⭐ |
| TSan (ThreadSanitizer) | 数据竞争/死锁顺序 | 否 | **是** | 5-15× slow | ⭐⭐⭐⭐⭐ |
| UBSan (UndefinedBehavior) | 未定义行为 | 否 | **是** | 1.2× slow | ⭐⭐⭐⭐⭐ |
| valgrind (memcheck) | 内存泄漏/越界/UAF | 否 | 否 | 10-30× slow | ⭐⭐⭐⭐ |
| valgrind (helgrind) | 数据竞争/锁顺序 | 否 | 否 | 10-30× slow | ⭐⭐⭐ |
| strace | 系统调用追踪 | 否 | 否 | 低 | ⭐⭐⭐ |
| bpftrace | 动态追踪 | **是** | 否 | 极低 | ⭐⭐⭐⭐ |
| perf | CPU/锁/缓存分析 | 否* | 否 | 极低 | ⭐⭐⭐⭐ |
| rr | 反向执行/复现 | 否 | 否 | 1.2× slow | ⭐⭐⭐⭐⭐ |
| heaptrack | 堆分配分析 | 否 | 否 | 1.5× slow | ⭐⭐⭐⭐ |
| lsof + /proc | FD 泄漏 | 否 | 否 | 极低 | ⭐⭐⭐⭐ |

*perf 的某些子命令需要 root（如 `perf lock` 内核锁分析）

## gdb + coredumpctl

> ⚠️ **安全警告**: Core dump 包含进程完整内存镜像（密钥、token、session cookie、PII 等）。1) 不要复制到未加密存储；2) 分析后立即删除；3) 不要共享给调查团队以外的人；4) 生产环境优先使用 `gdb -p <pid>` live attach（需用户授权）而非提取 core dump。

**用途**: 崩溃分析、死锁线程栈分析、运行时 attach 排查

**最低有效用法**:
```bash
# 1. 获取 core dump 信息
coredumpctl list                          # 列出所有 core dump
coredumpctl info <pid>                    # 信号、可执行文件路径
coredumpctl dump <pid> -o core.debug     # 导出 core 文件

# 2. gdb 加载 core dump
gdb <binary> <core>
# 或直接
coredumpctl gdb <pid>

# 3. 最小诊断序列（每个 crash 必做）
(gdb) info signals                        # 查看导致 crash 的信号
(gdb) bt full                             # 完整 backtrace + 局部变量
(gdb) frame <N>                           # 切换到第 N 帧
(gdb) info registers                      # 寄存器状态（含崩溃地址）
(gdb) info locals                         # 当前帧局部变量
(gdb) info args                           # 当前帧函数参数
(gdb) disassemble                         # 崩溃位置的汇编
(gdb) print <expression>                  # 打印变量/表达式值
(gdb) x/16x <address>                     # 查看内存内容

# 4. 多线程分析
(gdb) thread apply all bt                 # 所有线程的 backtrace（死锁必做）
(gdb) info threads                        # 线程列表和状态
# 关注: 多个线程卡在 pthread_mutex_lock / futex_wait
```

**输出解读要点**:
- `bt full` 中如果有 `??` → 缺少 debuginfo 或栈被破坏
- `info registers` 中 `rip`/`pc` 指向的地址 + `bt` 第一帧 → crash 精确位置
- SIGSEGV 的 `si_addr`（在 `info signals` 或 dmesg 中）→ 被访问的非法地址
- 多线程 bt 中 ≥ 2 个线程在 `__lll_lock_wait` → 死锁嫌疑

**降级**: 无 core dump → 启用 coredumpctl storage + 复现。符号不匹配 → `objdump -t <binary>` 静态分析。gdb 不可用 → `objdump -d` + `addr2line`。

## ASan (AddressSanitizer)

**用途**: 内存越界、use-after-free、double-free、栈溢出、内存泄漏（LSan）

**最低有效用法**:
```bash
# 编译选项
gcc -fsanitize=address -fno-omit-frame-pointer -g -O1 <sources>

# 可选：LeakSanitizer（默认随 ASan 开启）
# 运行时选项
export ASAN_OPTIONS=detect_leaks=1:halt_on_error=0:log_path=/tmp/asan.log
./program

# 报告解读
# =================================================================
# ==12345==ERROR: AddressSanitizer: heap-use-after-free on address 0x...
# READ of size 4 at 0x... thread T0
#     #0 0x... in use_after_free() /path/to/file.cpp:42
#     #1 0x... in main /path/to/file.cpp:100
# 0x... is located 0 bytes inside of 16-byte region
# freed by thread T0 here:
#     #0 0x... in operator delete(void*) (/usr/lib/libasan.so)
#     #1 0x... in release() /path/to/file.cpp:38
# previously allocated by thread T0 here:
#     #0 0x... in operator new(unsigned long)
#     #1 0x... in allocate() /path/to/file.cpp:35
```

**解读要点**: ASan 报告给出完整的 "分配→释放→非法使用" 三阶段调用栈。关注 "freed by" vs "READ/WRITE" 之间的时序关系。

**降级**: ASan 不可用（无法重编译）→ valgrind memcheck。ASan 开销太大 → 仅在测试环境使用。

## TSan (ThreadSanitizer)

**用途**: 数据竞争、锁顺序反转

**最低有效用法**:
```bash
gcc -fsanitize=thread -fno-omit-frame-pointer -g -O1 <sources>
# 运行时选项
export TSAN_OPTIONS=history_size=7:second_deadlock_stack=1
./program
```

**降级**: TSan 不可用 → valgrind helgrind → 手动 `gdb thread apply all bt` 对比多时刻快照。

## UBSan (UndefinedBehaviorSanitizer)

**用途**: 整数溢出、除零、空指针解引用（`-fsanitize=null`）、未对齐访问、错误的类型转换

```bash
gcc -fsanitize=undefined -fno-omit-frame-pointer -g <sources>
# -fsanitize=undefined 已包含 integer/bounds/alignment/null/shift/return 等
# Clang 额外支持: -fsanitize=nullability (GCC 不支持)
```

## valgrind (memcheck)

**用途**: 内存泄漏、越界、use-after-free、未初始化值使用（ASan 不可用时的首选降级）

**最低有效用法**:
```bash
valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all \
         --track-origins=yes --log-file=valgrind.log \
         ./program <args>

# 报告解读
# ==12345== LEAK SUMMARY:
# ==12345==    definitely lost: 1,024 bytes in 8 blocks    ← 必须修复
# ==12345==    indirectly lost: 512 bytes in 4 blocks      ← 通常伴随 definitely
# ==12345==    possibly lost: 256 bytes in 2 blocks        ← 需要调查
# ==12345==    still reachable: 2,048 bytes in 16 blocks   ← 通常是静态/全局变量
```

**解读要点**: `definitely lost` 是确认泄漏；关注 `definitely lost` + `indirectly lost` 的组合（链式泄漏）。`still reachable` 通常不是泄漏但值得审视。

**降级**: valgrind 未安装 → glibc MALLOC_TRACE → LD_PRELOAD malloc wrapper → heaptrack。

> ⚠️ **LD_PRELOAD 安全警告**: LD_PRELOAD 会向目标进程注入任意共享对象，运行在目标进程地址空间并拥有其全部权限（可拦截和记录密钥/PII/任意数据）。仅作为最后手段使用，优先使用 heaptrack/MALLOC_TRACE 等内建安全特性的替代方案。全局/共享环境中设置 LD_PRELOAD 可能影响无关进程。

## strace

**用途**: 系统调用级追踪——IO 错误、网络错误、信号传递、futex 阻塞、FD 泄漏

**最低有效用法**:
```bash
strace -f -o strace.log -t -T ./program          # -f 追踪子进程, -t 时间戳, -T 耗时
strace -f -p <pid> -o strace.log                 # attach 运行中进程
strace -c -p <pid>                               # 系统调用统计

# 关键系统调用诊断:
# futex(FUTEX_WAIT)       → 线程在等待锁, 多线程有大量 futex WAIT → 死锁嫌疑
# mmap/munmap             → 内存分配模式
# open/openat + close     → FD 使用情况, open 数 > close 数 → FD 泄漏
# read/write with EAGAIN  → 非阻塞 IO 模式
# kill/tgkill + signal    → 信号发送和接收
```

**解读要点**: 死锁场景下关注哪个线程卡在 `futex` 且长时间无返回。FD 泄漏场景下用 `strace -e trace=open,openat,close` 过滤，找 open 无对应 close 的模式。

**降级**: strace 不可用（高开销生产环境）→ bpftrace `tracepoint:syscalls` → `/proc/<pid>/fd` 快照对比。

## bpftrace

**用途**: 低开销动态追踪——函数调用统计、内存分配追踪、锁获取模式、数据流追踪

**最低有效用法**:
```bash
# 追踪所有 malloc/free 调用对
bpftrace -e 'uprobe:/lib64/libc.so.6:malloc { @alloc_size[tid] = arg0; }
            uretprobe:/lib64/libc.so.6:malloc /@alloc_size[tid]/ {
               @size = hist(arg0); delete(@alloc_size[tid]); }'

# 追踪 pthread_mutex_lock 调用（看哪个线程获取锁最多）
bpftrace -e 'uprobe:/lib64/libpthread.so.0:pthread_mutex_lock {
               @lock_count[tid] = count(); }'

# 追踪函数调用延迟
bpftrace -e 'uprobe:<binary>:<function> { @start[tid] = nsecs; }
             uretprobe:<binary>:<function> /@start[tid]/ {
               @latency = hist(nsecs - @start[tid]); delete(@start[tid]); }'
```

**降级**: bpftrace 不可用 → perf probe → strace → 应用内打点。

## perf

**用途**: CPU 采样、锁竞争分析、缓存分析、调用图

```bash
# 锁分析
perf lock record ./program
perf lock report              # 锁等待时间排序

# 调用图
perf record -g ./program
perf report --stdio           # 热点函数

# 上下文切换
perf stat -e context-switches,cpu-migrations ./program
```

## rr (Record & Replay)

**用途**: 录制程序执行、反向调试、竞态条件复现

```bash
rr record ./program            # 录制
rr replay                      # 回放，支持 reverse-step/reverse-continue
# 在 rr replay 中:
(gdb) reverse-step             # 反向执行一步
(gdb) reverse-continue         # 反向执行到断点
(gdb) watch -l <variable>      # watchpoint 追踪变量修改
```

**最佳用途**: 间歇性 crash 录制若干次直到一次 crash 发生 → replay 中反向追踪。竞态条件使用 rr chaos mode（随机调度）增大触发概率。

## /proc 文件系统

**最低有效用法**:
```bash
cat /proc/<pid>/status          # VmRSS/VmSize（内存）、Threads（线程数）、SigCgt/SigIgn（信号）
cat /proc/<pid>/maps            # 内存映射（heap/stack/mmap 范围）
cat /proc/<pid>/smaps           # 详细内存映射（RSS/Dirty/Swap）
cat /proc/<pid>/fd              # 打开的文件描述符
ls -la /proc/<pid>/fd | wc -l  # FD 数量
cat /proc/<pid>/stack           # 内核栈（D 状态进程）
cat /proc/<pid>/limits          # 资源限制（nofile/nproc）
cat /proc/<pid>/cgroup          # cgroup 归属
cat /proc/<pid>/oom_score       # OOM 分数（越高越优先被杀）
cat /proc/<pid>/oom_score_adj   # OOM 调整值
```

## 非 C/C++ 语言方法论适配

| 语言 | Crash | 内存 | 竞态 | 逻辑 |
|------|-------|------|------|------|
| Rust | rust-gdb, RUST_BACKTRACE=full | miri, valgrind | safe Rust 编译期消除，unsafe: TSan | dbg!() 宏, rr |
| Go | dlv core, GOTRACEBACK=crash | pprof heap, go tool trace | go run -race | dlv conditional break |
| Python | faulthandler, gdb python (py-bt) | tracemalloc, objgraph | threading 排查, GIL 分析 | pdb, icecream |

> ra-debug 不对以上语言维护完整工具链。使用 C/C++ 流程的方法论骨架 + 上表工具适配即可。

## 完整降级链汇总

```
内存错误: ASan → valgrind memcheck → heaptrack → MALLOC_TRACE → LD_PRELOAD → /proc 对比
竞态条件: TSan → valgrind helgrind → rr chaos → gdb 多时刻 bt 对比 → stress test
Crash:    gdb + coredumpctl → objdump + addr2line → ASan/UBSan 重编译 → 代码审查
死锁:     gdb thread bt + TSan → perf lock → strace futex → /proc/<pid>/stack 快照
FD 泄漏:  strace → lsof + proc/fd → 代码审查 open/close 对称性
逻辑错误: rr replay → gdb conditional bp → printf bisect → 代码审查
OOM:      dmesg + cgroup → 回到内存泄漏分支 → /proc/smaps 分析
```
