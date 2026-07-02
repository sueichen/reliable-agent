# 优化模式速查

> 按 perf 症状组织。仅供 Phase 4 理解代码后验证优化方向时查阅——不是优化菜单，不能替代对代码的实际理解。

---

## 1. Cache Miss 高（Memory Bound）

**perf 信号**: `cache-misses/cache-references > 5%`，或 L1/LLC miss 率高

| 常见根因 | 优化方向 |
|---------|---------|
| **循环遍历顺序差**（行主 vs 列主） | 交换循环嵌套顺序，确保内层循环沿连续内存方向遍历 |
| **AoS vs SoA 布局不当** | 热路径访问多字段 → 改为 SoA（Structure of Arrays）；全字段一起用 → 保持 AoS |
| **结构体过大 / 字段分散** | 热字段前置（hot-cold splitting）、结构体重排对齐 cache line |
| **工作集大于 cache** | 循环分块（tiling/blocking），一次处理 cache 能装下的数据块 |
| **随机访存（链表/hash map）** | 考虑 flat array 替代、open addressing hash map、arena 分配器保证连续 |
| **不必要的间接引用** | 指针追逐（pointer chasing）→ 内联数据或批量预取 |

**编译器侧面**:
- `-march=native` 允许编译器生成 cache-line-aware 的 prefetch 指令
- `__builtin_prefetch(addr, 0, 3)` 手动软件预取（谨慎使用——用错更慢）

---

## 2. Branch Miss 高（Bad Speculation）

**perf 信号**: `branch-misses/branches > 3%`

| 常见根因 | 优化方向 |
|---------|---------|
| **数据依赖分支**（不可预测） | 查表替代（LUT）、cmov 条件移动、SIMD blend/mask |
| **排序可以消除分支** | `std::sort` 后遍历——分支预测器学得更快 |
| **罕见路径在热路径上** | `__builtin_expect` / `[[likely]]`/`[[unlikely]]` 标记 |
| **多态虚函数分发** | CRTP 静态多态、switch-case 分发 + 热 case 前置 |
| **错误路径检查过多** | 合并检查、提前返回、assert 仅在 debug 生效 |

**编译器侧面**:
- PGO (`-fprofile-generate` → 运行 workload → `-fprofile-use`) 让编译器知道热分支
- `-fno-semantic-interposition` 允许编译器去虚化

---

## 3. IPC 低、Cache/Branch Miss 都不高（Frontend/Backend Bound）

**perf 信号**: `IPC < 1.0`，cache-miss < 5%，branch-miss < 3%

### 3a. Frontend Bound（`--topdown` Frontend Bound > 20%）

| 常见根因 | 优化方向 |
|---------|---------|
| ICache miss（代码体积大） | 减少内联膨胀、`-Os` vs `-O3` 对比 |
| ITLB miss | 大页（2MB/1GB pages）覆盖代码段、函数重排 |
| 解码器瓶颈 | 减少复杂指令混合、避免过多的前缀 |
| 虚函数调用分散 | 去虚化、BOLT 二进制布局优化 |

**编译器侧面**:
- `-flto` 跨文件内联决策更优
- BOLT: `llvm-bolt <binary> -o <optimized> -data=perf.fdata`
- PGO 自动优化代码布局

### 3b. Backend Bound（`--topdown` Backend Bound > 20%）

| 常见根因 | 优化方向 |
|---------|---------|
| 数据依赖链（指令级并行受限） | 减少循环携带依赖、循环展开、软件流水 |
| 执行端口饱和 | SIMD 向量化（一次处理 4/8/16 个元素）、减少混用不同类型指令 |
| 存储转发失败 | 避免 store 后立即 load 同一地址（插入独立指令填充） |

---

## 4. 多线程/并发问题

**perf 信号**: 加速比远低于核心数、futex 占比高、IPC 随线程数下降

| 常见根因 | 优化方向 |
|---------|---------|
| **锁竞争** | `perf lock report` 找热锁 → 细粒度锁、读写锁、lock-free 结构 |
| **伪共享** | `perf c2c record` → 热变量加 `alignas(64)` padding |
| **线程过多** | 线程数 ≈ 物理核心数（非超线程数）；线程池复用 |
| **Amdahl 串行瓶颈** | `perf record` 找串行段 → 并行化或减少串行工作 |
| **NUMA 远端访问** | `numactl --cpunodebind --membind`、`numastat` 确认分布 |

**运行时侧面**:
- `OMP_NUM_THREADS`, `OMP_PROC_BIND=close`, `OMP_PLACES=cores`
- `MALLOC_ARENA_MAX=4` 减少多线程 malloc 竞争
- `LD_PRELOAD=jemalloc` 或 `tcmalloc` 改善多线程分配性能

---

## 5. 纯计算——IPC 高但热点仍高

**perf 信号**: `IPC > 2.0`（或接近微架构上限），热点占比仍然显著

| 常见根因 | 优化方向 |
|---------|---------|
| 算法复杂度过高 | 换算法（O(n²)→O(n log n)）、近似算法、早停 |
| 冗余计算 | 循环不变量外提（编译器通常能做，跨函数则不一定）、结果缓存/memoize |
| 精度浪费 | `double`→`float` 如果精度允许、定点数替代浮点 |
| SIMD 未用 | `-march=native` 自动向量化、`#pragma omp simd`、手写 intrinsic |

**编译器侧面**:
- `-ffast-math`（谨慎——改变浮点语义）
- 检查编译器向量化报告: `-fopt-info-vec` (GCC) / `-Rpass=vectorize` (Clang)

---

## 6. 编译器优化选项速查

> 优先检查这些编译选项是否已开启——零代码改动的收益可能很大。

| 选项 | 作用 | 风险 | 推荐 |
|------|------|------|------|
| `-O3` (vs `-O2`) | 更激进的循环/内联/向量化 | 低 | 始终对比 |
| `-march=native` | 使用本机 CPU 全部指令集 | 低（但失去可移植性） | 始终开启（非分发 build） |
| `-flto` | 跨编译单元内联+优化 | 低（编译变慢） | 函数调用链长时优先 |
| `-fprofile-generate/use` | PGO: 运行时数据驱动优化 | 中（需要代表性 workload） | 分支多/虚函数多时 |
| `-ffast-math` | 放宽浮点标准 | **高**（改变数值结果） | 仅在浮点验证通过后 |
| `-funroll-loops` | 循环展开 | 中（代码膨胀） | 小循环体 + 已知次数 |
| `-fno-exceptions` | 禁用 C++ 异常 | 高（整个依赖链不能有异常） | 仅在确认整个依赖链无异常时 |
| `-D_FORTIFY_SOURCE=0` | 禁用 fortify 缓冲区保护 | **极高**（移除堆栈保护） | **不推荐用于性能优化**（开销极低，收益远小于风险） |
| BOLT | 二进制重排 | 中 | Frontend Bound 时效果显著 |
