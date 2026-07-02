# Perf 决策树与平台事件映射

> 核心原则：`perf record` 说**哪里** → `perf list` 确认事件 → `perf stat` 说**为什么** → `perf annotate` 说**哪行**。
> 本文件供 Phase 3 深挖热点时按需查阅。

---

## 0. 第一步（强制）: 确认本平台可用事件

```bash
perf list                       # 全部可用事件
perf list | grep -i l1          # L1 cache 事件
perf list | grep -i llc         # 末级 cache 事件
perf list | grep -i branch      # 分支预测事件
perf list | grep -i tlb         # TLB 事件
perf list | grep -i topdown     # TMA 事件
perf list | grep -i mem         # 内存 load/store 事件
perf list | grep -i lock        # 锁相关事件
```

**不同 CPU 的事件名不同——绝不硬编码事件名。**

---

## 1. 平台事件映射表

| 语义 | Intel Skylake+ | Intel Icelake+ | AMD Zen3/4 | ARM Neoverse N1/V1 |
|------|---------------|----------------|------------|-------------------|
| L1 data cache loads | `L1-dcache-loads` | `L1-dcache-loads` | `l1_data_cache_fills_all` | `L1D_CACHE` |
| L1 data cache misses | `L1-dcache-load-misses` | `L1-dcache-load-misses` | `l1_data_cache_misses_all` | `L1D_CACHE_REFILL` |
| LLC loads | `LLC-loads` | `LLC-loads` | `l3_cache_accesses` | `LL_CACHE_RD` |
| LLC misses | `LLC-load-misses` | `LLC-load-misses` | `l3_misses` | `LL_CACHE_MISS_RD` |
| Branch instructions | `branch-instructions` | `branch-instructions` | `retired_branch_instructions` | `BR_RETIRED` |
| Branch misses | `branch-misses` | `branch-misses` | `retired_branch_mispred` | `BR_MIS_PRED_RETIRED` |
| DTLB load misses | `dTLB-load-misses` | `dTLB-load-misses` | `dtlb_misses` | `DTLB_WALK` |
| ITLB misses | `iTLB-load-misses` | `iTLB-load-misses` | `itlb_misses` | `ITLB_WALK` |
| Instructions | `instructions` | `instructions` | `instructions` | `INST_RETIRED` |
| Cycles | `cycles` | `cycles` | `cycles` | `CPU_CYCLES` |
| TMA Level 1 | `--topdown` | `--topdown` | `--topdown` (Zen4+) | **不支持** |
| NUMA node loads | `node-loads` | `node-loads` | 不适用 | `REMOTE_ACCESS` |
| NUMA node misses | `node-load-misses` | `node-load-misses` | 不适用 | — |

> **以 `perf list` 实际输出为准**。若事件不存在，用 `perf list | grep <keyword>` 找同义事件。

---

## 2. Perf 决策树（从基础指标到深入方向）

```
perf stat 基础指标 + perf record 热点函数

┌── cache-misses / cache-references > 5%?
│   → 瓶颈: 内存子系统 (Memory Bound)
│   → 深入:
│     ✔ perf list | grep -i l1 → perf stat -e <L1-loads>,<L1-misses>
│     ✔ perf list | grep -i llc → perf stat -e <LLC-loads>,<LLC-misses>
│     ✔ perf list | grep -i tlb → perf stat -e <DTLB-misses>
│     ✔ perf mem record -- <target>          (数据来自哪级 cache)
│     ✔ LLC miss 主导 → 数据布局/预取问题 → Phase 4 理解代码
│     ✔ DTLB miss 高 → huge page / 数据结构紧凑化
│     ✔ NUMA node misses > 5% → numactl --membind / taskset
│
├── branch-misses / branches > 3%?
│   → 瓶颈: 分支预测 (Bad Speculation / Branch Mispredict)
│   → 深入:
│     ✔ perf stat -e <branch-misses>,<branch-loads>
│     ✔ perf annotate → 看具体分支指令开销
│     ✔ 对策: __builtin_expect / PGO / 查表替代 / 消除不可预测分支
│
├── IPC < 1.0 且 cache-miss 低 且 branch-miss 低?
│   → 瓶颈: 前端 (Frontend Bound) 或后端 (Backend Bound)
│   → 深入:
│     ✔ 若支持 --topdown (Intel Icelake+ / AMD Zen4+):
│       perf stat --topdown -- <target>
│       ├── Frontend Bound > 20%  → ICache/ITLB/解码器
│       │   └── BOLT 二进制重排、PGO、减少虚函数、减少内联膨胀
│       ├── Backend Bound > 20%   → 执行单元/L1/存储转发
│       │   └── SIMD 向量化、循环展开、消除数据冒险
│       └── Bad Speculation > 10% → 分支预测器
│     ✔ 若不支持 --topdown (ARM / 旧 x86):
│       低 IPC + 低 cache-miss + 低 branch-miss ≈ 前端瓶颈
│       → perf stat -e icache_misses (如可用)
│       → 检查代码: 大量小函数调用? 虚函数分发? 内联策略?
│
├── IPC > 2.0 且热点占比仍高?
│   → 瓶颈: 纯计算密集 (Core Bound / Retiring)
│   → 深入:
│     ✔ perf annotate → 哪些指令占用执行单元?
│     ✔ 检查 SIMD: 是否有手动循环可向量化? 编译器已自动向量化?
│     ✔ 精度可降? float 替代 double? 算法复杂度可降?
│
└── perf record 中 syscall / 内核函数占比 > 10%?
    → 瓶颈: 系统调用 / IO
    → 深入:
      ✔ strace -c -- <target>           (系统调用分布和耗时)
      ✔ iostat -x 1                      (磁盘延迟)
      ✔ 对策: 批量 IO、io_uring、零拷贝、连接池
```

---

## 3. 命令模板速查

> 以下 `<event>` 为占位符——使用前必须用 `perf list` 确认本平台事件名。

```bash
# === 基础观测（任何平台） ===
perf record -g -F 99 -- <workload>        # 采样 + 调用栈
perf report --stdio --sort=overhead,symbol -n  # 热点函数排行
perf annotate --stdio <function>          # 函数级汇编+源码开销

# === Cache 层次深挖 ===
perf stat -e <L1-loads>,<L1-misses>,\
<LLC-loads>,<LLC-misses> -- <workload>
perf mem record -- <workload>             # 数据来源分析

# === 分支预测 ===
perf stat -e <branch-inst>,<branch-misses> -- <workload>

# === TMA (仅 Intel Icelake+ / AMD Zen4+) ===
perf stat --topdown -- <workload>

# === 多线程 ===
perf lock record -- <workload>            # 锁竞争
perf c2c record -- <workload>             # 伪共享
```

---

## 4. 补充工具（仅当 perf 指明方向后使用）

| perf 指出的方向 | 补充工具 | 用途 |
|----------------|---------|------|
| LLC miss 主导 | `perf mem record` | 确定数据在哪个 cache 层命中 |
| NUMA 远端访问高 | `numastat`, `numactl -H` | 确认 NUMA 拓扑 |
| DTLB miss 高 | `/proc/meminfo` (HugePages) | 确认大页配置 |
| syscall 占比 > 10% | `strace -c` | 系统调用分布 |
| IO 相关 syscall 多 | `iostat -x 1` | 磁盘延迟 |
| futex 占比高 | `perf lock report` | 各锁等待时间 |
