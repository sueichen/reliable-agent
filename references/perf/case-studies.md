# 深度迭代优化案例

> 每个案例演示热点驱动的 5+ 轮深度迭代——不是一轮就停。

---

## 案例 1: C 字符串处理程序 — 7 轮深度迭代

**场景**: 日志解析程序，处理 800MB 文本文件，提取并统计字段。
**初始基线**: `time` 32.4s, IPC 0.78, cache-miss rate 31%

### Round 1: 编译器优化（零代码改动）

```
perf record -g + perf report → 无特别集中的热点，整体慢
perf stat → IPC 0.78, 无可向量化代码
```
**发现**: Makefile 里 `-O2`，没开 `-march=native`
**优化**: `-O2` → `-O3 -march=native`
**验证**: 32.4s → 26.1s (-19%), IPC 0.78 → 0.91

### Round 2: 字符串比较

```
perf record → strcmp 占 38%, #1 热点
perf annotate strcmp → 逐字节比较
```
**发现**: 代码用 `strcmp` 匹配固定前缀（5 个候选），每次都是逐字节循环
**优化**: 前 4 字节转 `uint32_t`，用 switch-case 分发
**验证**: 26.1s → 18.7s (-28%), strcmp 热点消失

### Round 3: 内存分配

```
perf record → malloc 占 21% (#1), free 占 9% (#3)
perf annotate → 频繁的小对象分配+释放
```
**发现**: 每行日志都 malloc 一个临时输出 buffer。实际最大行长约 4KB
**优化**: 栈上 8KB 固定 buffer（或 thread_local arena）
**验证**: 18.7s → 13.2s (-29%), malloc/free 热点消失

### Round 4: Cache miss (数据布局)

```
perf stat → cache-misses/cache-references = 18% (仍偏高)
perf record → parse_line 占 27% (#1)
perf annotate → 循环内按字段 ID 跳转访问字段描述表（间接引用）
```
**发现**: 字段描述表是指针数组——每次访问一个字段都做一个指针追逐
**优化**: 将字段描述表从指针数组改为 flat array（值数组），sizeof 字段描述 16 字节直接在表内
**验证**: 13.2s → 9.8s (-26%), cache-miss 18% → 8%

### Round 5: 分支预测

```
perf stat → branch-misses/branches = 6.3%
perf record → classify_field 占 15% (#2)
perf annotate → 一大串 if-else 做字段类型分类
```
**发现**: 字段分类是数据依赖分支——输入不可预测
**优化**: 查表替代（256 个条目按首字符映射类型）
**验证**: 9.8s → 7.4s (-24%), branch-miss 6.3% → 1.8%

### Round 6: 编译器 PGO

```
perf stat → IPC 1.52, 仍有提升空间
perf record --topdown → Frontend Bound 19% (代码布局)
```
**优化**: PGO: `-fprofile-generate` → 跑代表性输入 → `-fprofile-use`
**验证**: 7.4s → 6.5s (-12%), Frontend Bound 19% → 11%

### Round 7: 饱和

```
perf record → top hotspot 2.8% (已 < 3%)
perf stat → IPC 1.74
perf annotate → 任何单函数 < 3%，无主导热点
```
**停止**: 无单一可优化目标。剩余开销均匀分散在 I/O 和解析逻辑中。

**总收益**: 32.4s → 6.5s (**5.0x**), IPC 0.78 → 1.74
**手段**: 编译器 2 + 代码 4 + 运行时 0

---

## 案例 2: 哈希表基准测试 — 5 轮深度迭代

**场景**: 自定义 hash table benchmark，insert 1 千万条 KV 对。
**初始基线**: 11.8s, IPC 0.61, cache-miss 42%

### Round 1: Hash 函数

```
perf record → fnv_hash 占 44% (#1)
perf annotate fnv_hash → 小循环, 没内联
```
**发现**: hash 函数在 .c 文件中定义，调用方在另一个 .c → 跨编译单元无法内联
**优化**: 改 `static inline` 放头文件 + `-flto`
**验证**: 11.8s → 8.3s (-30%), fnv_hash 热点消失

### Round 2: 链式冲突解决 → 开放寻址

```
perf record → find_slot 占 35% (#1)
perf annotate → 链表遍历（每次 miss 一个 cache miss）
```
**发现**: 链式 hash table，每个 bucket 是链表头。冲突遍历=指针追逐=每步一个 cache miss
**优化**: 改为开放寻址（linear probing），bucket 是 flat array
**验证**: 8.3s → 5.1s (-39%), cache-miss 42% → 19%

### Round 3: 内存分配

```
perf record → malloc 占 18% (#2)
perf stat → 1 千万次 malloc = 1 千万次系统调用相关
```
**发现**: insert 每次 create entry = malloc。总共 1 千万次
**优化**: arena 分配器（预分配大块，bump pointer）
**验证**: 5.1s → 3.6s (-29%), malloc 热点消失

### Round 4: NUMA

```
perf stat -e node-loads,node-load-misses → 22% 远端访问
numactl -H → 2 socket, 测试进程只绑了一个 node
```
**发现**: 内存分配在了远端 NUMA node
**优化**: `numactl --membind=0 --cpunodebind=0`
**验证**: 3.6s → 2.9s (-19%), 远端访问 22% → 2%

### Round 5: 饱和

```
perf record → top hotspot 2.5% (< 3%), 其余均匀分散
perf stat → IPC 1.91
```
**停止**: 无单一可优化目标。

**总收益**: 11.8s → 2.9s (**4.1x**), IPC 0.61 → 1.91
**手段**: 编译器 1 + 代码 2 + 运行时 1 + 数据布局 1

---

## 模式总结

| 特征 | 案例 1（字符串处理） | 案例 2（哈希表） |
|------|-------------------|-----------------|
| 轮次数 | 7 | 5 |
| 总改善 | 5.0x | 4.1x |
| 编译器手段 | -O3 -march=native, PGO | -flto |
| 代码手段 | switch 替代 strcmp, arena, flat array, LUT | inline hash, 开放寻址, arena |
| 运行时手段 | — | numactl |
| 每轮归因 | 一次一个变量 | 一次一个变量 |
| 停止原因 | 热点 < 3% | 热点 < 3% + IPC 饱和 |

**核心教训**:
1. **每轮只有一个热点主导** ——修完后新热点自然出现。这就是为什么要循环。
2. **编译器手段先行** ——零代码改动收益 10-30%，先拿再说。
3. **数据布局往往是瓶颈** ——案例 1 的 Round 4、案例 2 的 Round 2 都是布局问题。
4. **不要提前猜测** ——每轮的数据告诉你下一轮的方向。案例 2 的 NUMA 直到 Round 4 才浮现。
