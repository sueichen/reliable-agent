# 崩溃诊断 (Crash Analysis)

> 覆盖 SIGSEGV/SIGABRT/SIGFPE/SIGBUS/SIGKILL(OOM) 五类 fatal signal 的系统级诊断方法。

## 信号快速对照

| 信号 | 编号 | 典型原因 | 关键证据 | 首选工具 |
|------|------|---------|---------|---------|
| SIGSEGV | 11 | NULL 指针、野指针、栈溢出、写只读内存、执行 NX | `si_addr` 寄存器, `rip` | gdb coredump + ASan |
| SIGABRT | 6 | `assert()` 失败、`abort()` 调用、glibc `__libc_message` | 断言条件、glibc 错误消息 | gdb assert frame |
| SIGFPE | 8 | 除零、整数溢出陷阱 | 浮点寄存器, 除法指令操作数 | gdb float regs |
| SIGBUS | 7 | 未对齐访问、mmap 失败、文件截断后访问 | mmap 返回值、文件大小 | gdb + strace mmap |
| SIGKILL | 9 | OOM Killer、systemd 资源限制、cgroup 限制 | dmesg OOM 日志, cgroup events | dmesg + cgroup |

## SIGSEGV 深度排查

### 第一步：获取 crash 现场

```bash
coredumpctl info <pid>
# 关注: Signal (SIGSEGV), si_code, 被访问的地址

# si_code 含义:
# SEGV_MAPERR (0x1) → 访问未映射地址 (NULL pointer / wild pointer)
# SEGV_ACCERR (0x2) → 权限错误 (写只读内存 / 执行不可执行内存)
```

### 第二步：gdb core dump 最小诊断序列

```
(gdb) info signals SIGSEGV          # 信号处理方式
(gdb) bt full                        # 完整调用栈 + 局部变量
(gdb) frame 0                        # crash 帧
(gdb) info registers                 # rip/rsp + 通用寄存器
(gdb) disassemble                    # crash 位置汇编
(gdb) print <ptr>                    # 被解引用的指针值
(gdb) x/16x <address>                # 尝试读取目标地址内容
(gdb) info proc mappings             # 进程内存布局 — 该地址在哪个段？
```

### 第三步：根据 si_code 分支

**SEGV_MAPERR (访问未映射地址)**:

```
指针 = NULL / 接近 NULL (0x0 - 0xFFF)?
  → 是: NULL 指针解引用。向上追踪调用者（frame 1, 2...），找谁传入了 NULL
  → 否: 野指针/悬垂指针。用 ASan 或 valgrind 复现，获取分配/释放调用栈

指针指向已被 munmap 的地址?
  → use-after-free (mmap 类型)。检查对应 mmap/munmap 调用时序

指针值看起来像被覆盖了 (0x41, 0x00 等)?
  → 缓冲区溢出覆盖了指针。ASan 可检测
```

**SEGV_ACCERR (权限错误)**:

```
(gdb) info proc mappings             # 确认目标地址的权限
  → 地址在 r-- 段但执行了写操作? → 写只读数据（const 全局变量 / 字符串字面量 / rodata 段）
  → 地址在 rw- 段但执行了跳转? → 函数指针被破坏，跳到数据段
  → 地址在 --- 段? → 栈不可执行（NX），但代码尝试执行栈上代码（shellcode / 栈溢出攻击 / setjmp 到已释放栈）
```

### 第四步：反向追踪到数据源

从 crash 帧逐层向上追踪数据流。参考 [root-cause-tracing.md](root-cause-tracing.md)。

```
frame 0: crash at foo(ptr) — ptr = NULL
frame 1: bar() 调用 foo(p)，p = NULL
frame 2: baz() 调用 bar()，p 来自返回值
frame 3: init() 返回 NULL → 最初的 NULL 产生点
```

## SIGABRT 深度排查

SIGABRT 有两种来源：显式 `abort()`/`assert()` 和 glibc 检测到的堆损坏。

### 显式 assert 失败

```
(gdb) frame 0                       # __GI_raise → __GI_abort
(gdb) frame <N>                     # 找到 __assert_fail 帧
(gdb) info locals                   # 查看断言条件字符串
(gdb) print <condition>             # 重新计算断言条件
```

### glibc 堆损坏 (__libc_message)

```
典型模式:
  *** Error in `<prog>': free(): invalid pointer: 0x... ***
  *** Error in `<prog>': double free or corruption (!prev): 0x... ***
  *** Error in `<prog>': malloc(): memory corruption: 0x... ***

排查:
  1. 启用 ASan 重编译（最精确）
  2. MALLOC_CHECK_=3 ./program  # glibc 内置检测
  3. valgrind --tool=memcheck
```

## SIGFPE 排查

```
(gdb) frame 0
(gdb) info float                    # x86_64 浮点寄存器
(gdb) info registers                # 通用寄存器的操作数值
(gdb) disassemble                   # 找 idiv/div 指令 → 除数 = 0
(gdb) print <divisor>               # 打印除数变量值
```

## SIGBUS 排查

两个最常见原因与排查方向：

1. **未对齐访问**: 在要求对齐的平台上做了未对齐内存访问（常见于 ARM/SPARC，x86 通常不触发）。gdb frame 0 + disassemble 找 `movaps` 等需要对齐的指令
2. **mmap 文件被截断**: mmap 了文件，但文件随后被截断 → 访问超出文件大小的偏移时 SIGBUS。`strace -e trace=mmap,ftruncate` 追踪

## SIGKILL / OOM 排查

虽然 SIGKILL 属于"被内核杀掉"而非传统 crash，但其排查方法与此相关：

```bash
# 确认 OOM Killer
dmesg | grep -i "out of memory"
dmesg | grep -i "killed process"

# 典型 OOM 日志:
# Out of memory: Killed process 12345 (program) total-vm:8GB,
# anon-rss:7.5GB, file-rss:100MB, shmem-rss:0MB

# 分析进程内存使用
cat /proc/<pid>/status | grep -E "VmRSS|VmSize|VmPeak|RssAnon"
cat /proc/<pid>/smaps | grep -E "^(Size|Rss|Pss):" | awk '{sum+=$2} END {print sum/1024" MB"}'

# OOM score 分析
cat /proc/<pid>/oom_score         # >500 → 高风险
cat /proc/<pid>/oom_score_adj     # 正数 → 人工调高被杀优先级

# cgroup 限制触发
cat /proc/<pid>/cgroup
# cgroups v1:
cat /sys/fs/cgroup/memory/<path>/memory.limit_in_bytes
cat /sys/fs/cgroup/memory/<path>/memory.events  # oom_kill 计数
# cgroups v2 (RHEL 8+, Ubuntu 22.04+, Debian 11+):
# 确认版本: stat -fc %T /sys/fs/cgroup (cgroup2fs=v2, tmpfs=v1)
cat /sys/fs/cgroup/<path>/memory.max
cat /sys/fs/cgroup/<path>/memory.events
```

## 完整案例：SIGSEGV use-after-free

```
现象: 服务运行数小时后 SIGSEGV，core dump 显示 crash at t->callback()

gdb 分析:
  (gdb) bt full
  #0 0x... in Worker::process(Worker* this, Task* t)
      t = 0x7f1234000a00
  (gdb) x/16x 0x7f1234000a00
  0x7f1234000a00: 0x00000000 0x00000000 ...  ← 已被清空
  (gdb) info proc mappings
  0x7f1234000000-0x7f1234001000 rw-p  ← 地址在有效映射中但内容为空

ASan 重编译后复现:
  heap-use-after-free at Worker::process()
  freed by:
      #1 TaskManager::cleanup() at task.cpp:55  ← 释放者
  previously allocated by:
      #1 TaskManager::submit() at task.cpp:20   ← 分配者
  → 根因: cleanup() 释放了仍在 Worker 队列中的 Task

5 Whys:
  Why 1: Task* t 是悬垂指针 (use-after-free)
  Why 2: TaskManager::cleanup() 释放了 Task，但 Worker 仍在引用
  Why 3: cleanup() 和 Worker::process() 之间没有同步
  Why 4: Task 的生命周期管理不明确——谁拥有 Task?
  Why 5: 设计上缺少明确的 ownership 模型（shared_ptr/unique_ptr 未使用）
  → 第 5 层根因: 缺少 ownership 模型 + 并发访问无同步
```
