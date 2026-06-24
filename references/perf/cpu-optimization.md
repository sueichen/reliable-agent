# CPU 优化技法

> 适用场景: CPU 使用率高、吞吐不达标、延迟敏感的计算密集程序
> 前置条件: 已通过 TMA 或采样确认瓶颈在 CPU 侧（非 Memory Bound 导致的 stall）

---

## 1. TMA 自顶向下分析框架

CPU 瓶颈拆解为 4 个大类，按优先级排查：

| Level 1 | 含义 | 典型指示 |
|---------|------|---------|
| **Retiring** | 正常执行（理想状态） | 希望大部分 μop 在这里 |
| **Bad Speculation** | 分支预测失败导致流水线浪费 | `br_mispred_retired` 高 |
| **Frontend Bound** | 取指/解码跟不上 | `icache_misses`、`itlb_misses` |
| **Backend Bound** | 执行单元/数据供给不足 | 进一步拆 Memory/Core Bound |

### Level 2: Backend Bound 进一步拆解

```
Backend Bound
├── Memory Bound (见 memory-optimization.md)
│   ├── L1 Bound
│   ├── L2 Bound
│   ├── L3 Bound
│   ├── DRAM Bound
│   └── DTLB Bound
└── Core Bound
    ├── Divider/Port Utilization
    └── 数据依赖导致的流水线 stall
```

检测命令:
```bash
# Intel (Linux 5.14+)
perf stat -e cycles,instructions,topdown-fe-bound,topdown-bad-spec,topdown-be-bound,topdown-retiring -- ./prog
# 或直接使用: perf stat --topdown -- ./prog

# AMD (Zen 3+, Linux 5.15+)
perf stat -M TopdownL1 -- ./prog

# ARM (鲲鹏)
perf stat -e cycles,instructions,stall_frontend,stall_backend,br_mis_pred -- ./prog
```

---

## 2. 编译器优化（有代码）

### 2.1 优化等级
```bash
-O2    # 推荐基线：内联+循环优化+向量化
-O3    # 更激进：额外循环展开、更激进内联
-Ofast # 非标准优化，可能牺牲精度
-Os    # 面向体积优化
```

### 2.2 架构指定
```bash
# 鲲鹏平台
-mtune=tsv110 -march=armv8-a

# x86
-mtune=native -march=native
```

### 2.3 关键编译选项
| 选项 | 效果 | 适用场景 |
|------|------|---------|
| `-finline-functions` | 函数内联 | 小函数频繁调用 |
| `-funroll-loops` | 循环展开 | 循环体小、次数少 |
| `-ftree-vectorize` | 自动向量化 | 可向量化的循环 |
| `-fprofile-generate/use` | PGO 优化 | 有代表性的训练数据 |
| `-flto` | 链接时优化 | 多文件项目 |
| `-flto=thin` | ThinLTO | LLVM 下降低 LTO 编译时间 |

### 2.4 PGO（Profile-Guided Optimization）

两轮编译：先插桩编译运行收集 profile，再 feedback 编译优化。优化内容：寄存器分配、冷热分区、函数/分支重排、内联决策。

```bash
# GCC: gcc -O2 -fprofile-generate → ./prog（代表输入） → gcc -O2 -fprofile-use
# Clang: -fprofile-instr-generate → ./prog → llvm-profdata merge → -fprofile-instr-use
```

---

## 3. 分支预测优化

### 3.1 使用 likely/unlikely 宏
```c
#define likely(x)   __builtin_expect(!!(x), 1)
#define unlikely(x) __builtin_expect(!!(x), 0)

if (likely(ptr != NULL)) {
    // 大概率路径 —— 编译器将此分支紧跟在跳转后
}
```

### 3.2 消除分支的技术
| 技术 | 说明 | 示例场景 |
|------|------|---------|
| 查表法 | 用数组索引替代 switch | 状态机、编码转换 |
| 算术替换 | `(cond) * val` 替代 if-else | 简单条件赋值 |
| 谓词化 | `v > threshold ? v : 0` 编译器可能生成条件移动 | SIMD 友好 |

### 3.3 分支预测检测
```bash
perf stat -e branches,branch-misses -- ./prog
# 分支预测失败率 = branch-misses / branches
# 超过 2% 需要关注
```

---

## 4. 循环优化

### 4.1 循环展开
```c
// 优化前
for (int i = 0; i < n; i++)
    a[i] = b[i] + c[i];

// 编译器自动展开（-funroll-loops）或手动:
for (int i = 0; i < n; i += 4) {
    a[i]   = b[i]   + c[i];
    a[i+1] = b[i+1] + c[i+1];
    a[i+2] = b[i+2] + c[i+2];
    a[i+3] = b[i+3] + c[i+3];
}
```

### 4.2 循环不变量外提
编译器在 -O1 以上自动做，但复杂场景可能失败。
识别标志: 循环内有与迭代变量无关的计算。

### 4.3 归纳变量优化与循环重构
编译器在 -O1 以上自动完成：归纳变量（`i*stride+base` → 累加）、循环合并（两个循环合为一个）、循环分布（一个大循环拆多个小循环以改善局部性）。识别标志: 循环内有与迭代变量无关的计算。

---

## 5. SIMD/向量化

### 5.1 编译器自动向量化前提
- 循环次数可预测
- 无跨迭代数据依赖
- 内存访问连续（步长为 1）
- 使用 `__restrict__` 消除别名歧义
```c
void add(float* __restrict__ a, float* __restrict__ b, int n) {
    for (int i = 0; i < n; i++) a[i] += b[i];
}
```

### 5.2 编译器向量化报告
```bash
# GCC
gcc -O2 -ftree-vectorize -fopt-info-vec-all prog.c

# Clang
clang -O2 -Rpass=loop-vectorize -Rpass-missed=loop-vectorize prog.c
```

### 5.3 NEON Intrinsics（ARM/鲲鹏）
```c
#include <arm_neon.h>
void add_neon(int* out, int* in1, int* in2, int count) {
    for (int i = 0; i < count; i += 4) {
        int32x4_t a = vld1q_s32(in1 + i);
        int32x4_t b = vld1q_s32(in2 + i);
        vst1q_s32(out + i, vaddq_s32(a, b));
    }
}
```

---

## 6. 流水线优化（鲲鹏特定）

鲲鹏 920 处理器 8 级流水线。编译器在 `-mtune=tsv110` 下自动消除：
- **数据冒险**: 在依赖指令间插入无关指令
- **结构冒险**: 同类型资源竞争时交错调度

编程建议: 保持代码简单直接，编译器优化引擎更易识别和优化。

---

## 7. 诊断命令速查

```bash
# IPC (越高越好，>2 为佳)
perf stat -e instructions,cycles -- ./prog

# 分支预测
perf stat -e branches,branch-misses -- ./prog

# 热点采样
perf record -F 999 --call-graph dwarf -- ./prog
perf report --stdio

# Top-Down
perf stat --topdown -- ./prog        # Intel
perf stat -M TopdownL1 -- ./prog      # AMD Zen 3+
perf stat -e stall_frontend,stall_backend -- ./prog  # ARM

# 反汇编热点函数
perf annotate <function_name> --stdio
```
