# 多线程/并发优化技法

> 适用场景: 多核扩展差、锁竞争严重、并行效率低、伪共享
> 前置条件: 已通过 perf/htop 确认存在多线程但性能不随核心数线性扩展

---

## 1. 并行扩展诊断

### 1.1 扩展效率度量
- **加速比** = T(1) / T(N)
- **效率** = 加速比 / N
- 效率 < 70% 通常需要排查

### 1.2 诊断命令
```bash
# 上下文切换频率（过高说明线程数过多或锁竞争）
perf stat -e context-switches,cpu-migrations -- ./prog
# 理想: context-switches 远小于 instructions

# 锁竞争（内核态 futex）
perf stat -e 'syscalls:sys_enter_futex' -- ./prog

# 调度延迟
perf sched record -- ./prog
perf sched latency
```

---

## 2. 锁优化

### 2.1 锁竞争检测
```bash
# 内核态锁分析
perf lock record -- ./prog
perf lock report        # 显示竞争最激烈的锁
perf lock contention    # 锁竞争时间分布
```

### 2.2 锁优化技法
| 技法 | 说明 | 适用条件 |
|------|------|---------|
| **减小临界区** | 只锁必要代码 | 总是适用 |
| **读写锁替换互斥锁** | `pthread_rwlock` | 读多写少 |
| **RCU（Read-Copy-Update）** | 免锁读 | 读极多写极少 |
| **自旋锁替换互斥锁** | `pthread_spinlock` | 临界区极小（< 几微秒） |
| **锁分段（Lock Striping）** | 按数据分片加锁 | 数据可分区 |
| **无锁数据结构** | CAS 原子操作 | 操作简单 |

### 2.3 自旋锁 vs 互斥锁
```c
// 自旋锁: 临界区 < 几微秒
pthread_spin_lock(&spinlock);
counter++;  // 极短操作
pthread_spin_unlock(&spinlock);

// 互斥锁: 临界区可能较长或有 IO
pthread_mutex_lock(&mutex);
// 可能较长的操作
pthread_mutex_unlock(&mutex);
```

---

## 3. 伪共享检测与修复

### 3.1 检测
```bash
# perf c2c (Cache-to-Cache) —— 最直接的手段
perf c2c record -- ./multi_thread_prog
perf c2c report
# 查看 "Shared Data Cache Line Table" 和 HITM 计数
```

### 3.2 修复
```c
// 高频写变量对齐到 Cache Line
#define CACHE_LINE_SIZE 128  // 鲲鹏 128B，x86 64B

struct ThreadData {
    alignas(CACHE_LINE_SIZE) atomic<uint64_t> counter;
    // char padding[CACHE_LINE_SIZE - sizeof(atomic<uint64_t>)];
    // 其他数据...
};
```

---

## 4. NUMA-aware 并行

### 4.1 NUMA 感知的线程分配
```bash
# 查看线程在各 NUMA 节点上的分布
numastat -p <pid>

# 将子线程绑定到不同 NUMA 节点的核心
# 通常配合 taskset 或代码中 sched_setaffinity
```

### 4.2 First Touch 策略
```c
// 谁先写，数据就分配在谁的 NUMA 节点
// 在并行初始化时就要注意
#pragma omp parallel for
for (int i = 0; i < N; i++)
    data[i] = init_value;  // 按线程分区初始化
```

### 4.3 鲲鹏特定
```bash
# 查看超级 CPU Cluster (SCCL) 结构
numactl -H

# KVM 虚拟机绑核建议: 分布到多个 CPU Cluster
# 避免同一 Cluster 内多核竞争 L3 Cache
```

---

## 5. 线程数与任务划分

### 5.1 线程数选择
```bash
# 逻辑核数
nproc

# 物理核布局（避免超线程竞争）
lscpu | grep -E "Core|Thread|Socket"
lscpu -e  # 详细拓扑
```

经验规则:
- **计算密集**: 线程数 = 物理核心数
- **IO 密集**: 线程数 = 物理核心数 × 1.5~2
- **混合**: 基于 Amdahl's Law 评估

### 5.2 调度策略选择
```c
// WARNING: SCHED_FIFO 实时调度可导致系统饥饿——线程持续运行会阻塞内核线程和其他所有进程。
//          仅用于有界短执行时间的线程。需要 CAP_SYS_NICE。生产系统推荐 SCHED_OTHER + nice。
// 实时调度（需要 CAP_SYS_NICE）
struct sched_param param = { .sched_priority = 50 };
pthread_setschedparam(pthread_self(), SCHED_FIFO, &param);

// 默认 CFS 完全公平调度 —— 大多数场景适用（推荐）
```

### 5.3 负载均衡
- **静态划分**: 数据量预知且均匀，用 OpenMP `schedule(static)`
- **动态调度**: 工作量不均匀，用 `schedule(dynamic, chunk_size)`
- **任务窃取**: 工作流不均（Intel TBB、C++ async）

---

## 6. 并发数据结构选择

| 场景 | 推荐 | 避免 |
|------|------|------|
| 高并发读写 Map | 分段锁的 ConcurrentHashMap | `std::map` + 全局锁 |
| 生产者-消费者 | 无锁队列 (moodycamel, boost) | 加锁的 `std::queue` |
| 高并发计数器 | `atomic` / Per-CPU 计数器 | 加锁的 `int` |
| 引用计数 | `shared_ptr` 内置原子 | 手动计数+锁 |

---

## 7. 快速检查清单

- [ ] 加速比是否接近核心数（效率 > 70%）？
- [ ] 锁竞争是否 < 5% 总 CPU 时间？
- [ ] 是否存在伪共享（perf c2c HITM 高）？
- [ ] 线程数是否匹配硬件（不超物理核心数太多）？
- [ ] NUMA 远端访问 < 10%？
- [ ] 临界区是否足够小？
- [ ] 高频读低频写是否使用了读写锁？
