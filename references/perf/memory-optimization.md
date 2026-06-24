# 内存/Cache 优化技法

> 适用场景: 缓存未命中率高、内存带宽饱和、数据结构访问慢、NUMA 远端访问过多
> 前置条件: 已通过 TMA 或 perf stat 确认 Memory Bound

---

## 1. 内存瓶颈诊断

### 1.1 快速定位 Memory Bound
```bash
# LLC miss 率
perf stat -e cycles,instructions,LLC-loads,LLC-load-misses -- ./prog
# MPKI = (LLC-load-misses * 1000) / instructions
# MPKI > 5 通常是问题

# 内存带宽（Intel）
perf stat -e uncore_imc/cas_count_read/,uncore_imc/cas_count_write/ -- ./prog
# AMD 使用不同 PMU: perf list | grep -E 'amd_l3|amd_df' 查看可用事件

# NUMA 远端访问（鲲鹏 — HiSilicon DDR PMU）
# 先查可用 PMU: perf list | grep -i ddr
# 示例（PMU 名称因系统而异）: perf stat -e hisi_sccl1_ddrc0/noc_ddr_read/ -- ./prog
perf list | grep -i ddr
```

### 1.2 三种 Memory Bound 类型的区分

| 类型 | 特征 | 优化方向 |
|------|------|---------|
| **带宽瓶颈** | 高带宽利用率、多核竞争 | 减少数据量、压缩、对齐 |
| **延迟瓶颈** | 高 MPKI、随机访问 | 改善局部性、预取、数据重排 |
| **NUMA 远端** | 跨节点访问延迟高 | 绑核、numactl、数据分区 |

---

## 2. 数据局部性与布局

### 2.1 缓存友好访问模式
```c
// BAD: 按列访问（跨步大，Cache Line 利用率低）
for (int i = 0; i < N; i++)
    for (int j = 0; j < N; j++)
        c[i][j] = a[i][j] + b[j][i];  // b[j][i] 按列读取

// GOOD: 按行访问（连续内存，Cache Line 满利用）
for (int i = 0; i < N; i++)
    for (int j = 0; j < N; j++)
        c[i][j] = a[i][j] + b[i][j];
// 鲲鹏实测: 按行访问耗时 235722μs，按列 544939μs（2.3x 差距）
```

### 2.2 循环分块（Tiling/Blocking）
```c
// 将大矩阵分块处理，使工作集适合 L1/L2 Cache
for (int ii = 0; ii < N; ii += BLOCK)
    for (int jj = 0; jj < N; jj += BLOCK)
        for (int kk = 0; kk < N; kk += BLOCK)
            for (int i = ii; i < min(ii+BLOCK, N); i++)
                ... // 块内按行计算
```

### 2.3 结构体布局优化
```c
// BAD: 自然对齐浪费 1/3 空间（24 字节 → 实际需要 15 字节）
struct Bad { char a; double b; int c; short d; };

// GOOD: 按对齐要求降序排列（16 字节）
struct Good { double b; int c; short d; char a; };
```

### 2.4 AoS vs SoA 选择
```
结构体数组 (AoS): x0 y0 x1 y1 x2 y2 x3 y3
  → 适合同时访问 x 和 y

数组结构体 (SoA): x0 x1 x2 x3 | y0 y1 y2 y3
  → 适合只访问 x 或只访问 y，SIMD 友好
```

---

## 3. Cache Line 对齐与伪共享

> 伪共享是多线程现象，详细检测与修复见 `concurrency-optimization.md` 第 3 节。此处侧重内存布局视角和鲲鹏平台差异。

### 3.1 伪共享原理（内存视角）
两个线程修改不同变量，但它们落在同一 Cache Line（鲲鹏 128B，x86 64B），导致互相失效对方缓存。

### 3.2 检测与修复
```c
// 检测: perf c2c（Intel/AMD 支持 Cache-to-Cache 分析）
perf c2c record -- ./multi_thread_prog
perf c2c report

// 修复: 高频访问变量 Cache Line 对齐
struct alignas(128) AlignedCounter {
    atomic<int64_t> val;
    // 剩余空间自动填充到 128B
};

// 动态内存对齐
posix_memalign(&ptr, 128, size);
```

### 3.3 鲲鹏特定
- 鲲鹏 920 L3 Cache Line = **128 字节**（x86 为 64 字节）
- x86 上优化好的代码迁移到鲲鹏可能仍需重新对齐
- MySQL 在鲲鹏上将 Cache Line 对齐改为 128B 后 TPM 提升 3%~4%

---

## 4. 软件预取

### 4.1 使用 __builtin_prefetch
```c
// 在循环中提前预取未来将要访问的数据
for (int i = 0; i < n; i++) {
    __builtin_prefetch(&data[i + PREFETCH_DISTANCE], 0, 3);
    // locality: 0=流式(立即淘汰), 3=保持(多次使用)
    process(data[i]);
}
// PREFETCH_DISTANCE 需要根据 Cache 延迟和循环体耗时调优
```

### 4.2 预取时机
- 太早: 数据在被使用前被淘汰
- 太晚: 数据还未到达即被使用 → 仍然 stall
- 经验值: L1 约 4-8 次循环迭代，L2 约 16-32 次

### 4.3 ARM NEON 预取指令
```c
__asm__ volatile("prfm PLDL1STRM, [%[addr]]" :: [addr] "r" (ptr));
// PLDL1KEEP: 保持; PLDL1STRM: 流式（用完即弃）
```

---

## 5. DTLB 优化

### 5.1 诊断
```bash
# Intel/AMD:
perf stat -e dTLB-loads,dTLB-load-misses -- ./prog
# ARM/鲲鹏（事件名可能因 PMU 实现不同而异）:
perf stat -e armv8_pmuv3/l1d_tlb/ -- ./prog  # 具体事件名请用 perf list 确认
# DTLB miss rate > 1% 需要关注
```

### 5.2 优化手段
- **大页（Huge Pages）**: 减少 TLB miss
  ```bash
  # 1. 先检查当前状态和可用内存
  grep Huge /proc/meminfo
  # Hugepagesize: 2048 kB（通常 2MB）
  # HugePages_Free 必须 >= 你想分配的数量

  # 2. 分配 512 个大页（= 1GB 预留内存）
  # WARNING: 大页是永久内存预留，此内存对其他进程不可用。
  #          如果过度分配，其他进程可能 OOM。
  # 恢复: echo 0 > /proc/sys/vm/nr_hugepages
  echo 512 > /proc/sys/vm/nr_hugepages
  ```
- **透明大页（THP）**: 自动管理
  ```bash
  # WARNING: THP "always" 可能导致 compaction 延迟峰值和内存碎片化，
  #          对某些工作负载（数据库如 MySQL/PostgreSQL、Redis）有负面影响。
  # 推荐使用 "madvise" 而不是 "always"，由应用自行决定。
  # 检查当前设置: cat /sys/kernel/mm/transparent_hugepage/enabled
  # 恢复: echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
  ```
- **减少工作集大小**: 分块处理、数据压缩
- **使用连续内存**: `mmap` 代替多次 `malloc`

---

## 6. NUMA 亲和性优化

### 6.1 NUMA 拓扑查看
```bash
numactl -H              # 查看节点和 CPU 分布
numastat -p <pid>       # 查看进程的 NUMA 内存分布
```

### 6.2 绑核与绑内存
```bash
# 将进程绑定到 node 0 的 CPU 和内存
numactl --cpunodebind=0 --membind=0 ./prog

# 绑定到具体 CPU 核心
numactl -C 0-7 --membind=0 ./prog
```

### 6.3 代码级绑核
```c
#include <sched.h>
cpu_set_t mask;
CPU_ZERO(&mask);
CPU_SET(core_id, &mask);
sched_setaffinity(0, sizeof(mask), &mask);
```

### 6.4 NUMA 优化策略
- 数据首次接触（First Touch）策略: 哪个线程先写数据，数据就分配在那个线程所在的 NUMA 节点
- 显式分配: `numa_alloc_onnode()` 在指定节点分配
- 线程池 + 数据分区: 按 NUMA 节点分区数据，线程仅在本地节点操作

---

## 7. 快速检查清单

- [ ] MPKI（LLC miss per 1000 instructions）是否 < 5？
- [ ] 数组按行访问（连续）？
- [ ] 结构体成员按对齐要求降序排列？
- [ ] 高频数据分离到不同 Cache Line？
- [ ] 循环是否已分块以适合 Cache？
- [ ] 预取距离是否调优？
- [ ] DTLB miss rate < 1%？
- [ ] NUMA 远端访问占比 < 10%？
