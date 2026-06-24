# 性能观测工具速查表

> 按分析维度和环境约束快速选取合适的工具

---

## ⚠️ 数据敏感性警告

**`perf record`、`strace`、`bpftrace` 等工具的输出可能包含：**
- 加密密钥、认证令牌、密码
- 用户 PII（个人身份信息）
- 专有算法和商业秘密（通过指令追踪/调用图暴露）
- 内核内存布局信息（KASLR 旁路辅助）

**安全准则：**
- perf.data、strace 日志、bpftrace 输出视为**机密产物**
- 采样范围尽量限制到目标进程：`perf record --no-inherit -p <pid>`
- 分析完成后立即删除诊断产物
- 处理 PII/支付数据/密钥的生产系统：**运行前需数据保护审查**
- 敏感系统上优先用 `perf stat`（纯统计数据，无内存内容）

---

## 1. 工具矩阵

| 工具 | CPU | 内存 | IO/磁盘 | 网络 | 多线程 | 需要 root | 开销 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `perf record/report` | ● | ● | ◐ | ◐ | ● | 通常需要 | 低 |
| `perf stat` | ● | ● | ○ | ○ | ◐ | 通常不需要 | 极低 |
| `perf c2c` | ○ | ● | ○ | ○ | ● | 需要 | 低 |
| `top`/`htop` | ● | ● | ○ | ○ | ● | 不需要 | 极低 |
| `vmstat` | ◐ | ◐ | ● | ○ | ◐ | 不需要 | 极低 |
| `iostat` | ○ | ○ | ● | ○ | ○ | 不需要 | 极低 |
| `iotop` | ○ | ○ | ● | ○ | ○ | 需要 | 低 |
| `sar` | ● | ● | ● | ● | ◐ | 需要安装 | 低 |
| `netstat`/`ss` | ○ | ○ | ○ | ● | ○ | 不需要 | 极低 |
| `strace` | ◐ | ◐ | ● | ● | ● | 不需要 | 中-高 |
| `bpftrace` | ● | ● | ● | ● | ● | 需要 | 中 |
| `bcc-tools` | ● | ● | ● | ● | ● | 需要 | 低-中 |
| `numactl`/`numastat` | ● | ● | ○ | ○ | ● | 不需要 | 极低 |
| `gperftools` | ● | ● | ○ | ○ | ○ | 不需要 | 中 |
| `valgrind --tool=cachegrind` | ○ | ● | ○ | ○ | ○ | 不需要 | 极高 |

- ● 强支持  ◐ 部分支持  ○ 不支持

---

## 2. 环境降级链

### 2.1 CPU 观测降级
```
最佳: perf record -F 999 --call-graph dwarf
  ↓ 无符号
perf record -F 999 (只有地址级热点)
  ↓ 无 root / perf_event_paranoid=3
perf stat -e instructions,cycles (统计级, 无需采样权限)
  ↓ perf 不可用
htop + time -v (进程级 CPU 占用 + 用户/系统时间)
  ↓ 最差
应用内 clock_gettime() 打点
```

### 2.2 内存观测降级
```
最佳: perf record -e LLC-load-misses (采样 cache miss)
  ↓ 无 PMC
perf stat -e cache-misses,cache-references
  ↓ 无 perf
/usr/bin/time -v (看 page faults、max resident set size)
  ↓ 最差
top/htop 看 RES (常驻内存)、SHR (共享内存)
```

### 2.3 IO 观测降级
```
最佳: bpftrace + iostat
  ↓ 无 eBPF
iostat -x 1 + iotop
  ↓ 无 root
strace -c -p <pid> (系统调用统计, 注意开销)
  ↓ 最差
/proc/<pid>/io (read_bytes, write_bytes 累计值)
```

### 2.4 网络观测降级
```
最佳: bpftrace / bcc-tools
  ↓ 无 eBPF
sar -n DEV,TCP,ETCP 1 + ss -s
  ↓ 无 sar
netstat -s + netstat -tan
  ↓ 最差
应用内耗时打点 + /proc/net/snmp
```

---

## 3. 常用命令模板

### 3.1 perf 系列
```bash
# CPU 热点采样（推荐采样频率 999Hz）
perf record -F 999 --call-graph dwarf -- ./prog
perf report --stdio --no-children

# CPU 统计（IPC、cache、分支）
perf stat -e cycles,instructions,cache-references,cache-misses,branches,branch-misses -- ./prog

# 内存访问采样
perf record -e LLC-loads,LLC-load-misses -- ./prog

# Cache-to-Cache 伪共享检测
perf c2c record -- ./prog
perf c2c report

# 锁分析
perf lock record -- ./prog
perf lock report

# 调度分析
perf sched record -- ./prog
perf sched latency
```

### 3.2 bpftrace 系列
```bash
# 函数调用延迟
bpftrace -e 'uprobe:/path/to/prog:func_name { @start[tid] = nsecs; }
    uretprobe:/path/to/prog:func_name /@start[tid]/ {
    @lat_us = hist((nsecs - @start[tid]) / 1000); delete(@start[tid]); }'

# 内存分配追踪
bpftrace -e 'uprobe:/lib64/libc.so.6:malloc { @bytes[ustack] = sum(arg0); }'
```

### 3.3 系统级组合拳

> **注意**: 以下为模板脚本，运行前逐条审查。**请勿在生产系统上盲目运行**。输出可能包含系统拓扑和网络配置等敏感数据，妥善保管。

```bash
# 诊断脚本模板 — 按需调整工具选择
echo "=== CPU ==="
perf stat -e cycles,instructions,branches,branch-misses,cache-misses sleep 5 2>&1

echo "=== Memory ==="
free -h
numastat -p $$ 2>/dev/null

echo "=== IO ==="
iostat -x 1 3

echo "=== Network ==="
sar -n DEV 1 3 2>/dev/null || netstat -i

echo "=== Context Switches ==="
vmstat 1 3
```

---

## 4. 权限问题处理

**WARNING**: 永远优先使用无需特权的替代方案，而非提升权限或降低安全设置。

| 问题 | 推荐方案（安全优先） | 替代方案（需确认风险） |
|------|---------------------|----------------------|
| `perf_event_paranoid=3` | `perf stat` 优先尝试<br>（paranoid=3 时仍需 root/CAP_PERFMON，否则降至 top+time） | `sudo sysctl kernel.perf_event_paranoid=1` **[见下方警告]** |
| 无 root 安装 bpftrace | 降级到可用工具链 | 安装 bpftrace |
| 无法安装新软件 | 使用 `/proc` 文件系统和 shell 内置 | — |
| perf 采样报 "No permission" | 使用 `perf stat` + `/proc` 替代 | 检查 paranoid 或 sudo |
| 鲲鹏平台 perf 不支持某些事件 | 使用 `perf list` 查看可用事件 | — |

### 4.1 `perf_event_paranoid` 安全警告

**降低 `perf_event_paranoid` 前必须了解：**
- 设为 1 允许非特权进程访问 CPU 性能计数器和采样数据
- 采样数据可能包含：**密钥、令牌、密码、PII、内核内存布局（KASLR 旁路）**
- 这是**全局系统级安全降级**，影响所有用户和进程
- **绝不**在多租户环境或生产服务器上执行，除非经过安全团队批准
- perf.data 文件应视为**机密文件**，用后立即删除

**安全操作步骤：**
```bash
# 1. 记录当前值
cat /proc/sys/kernel/perf_event_paranoid  # 通常为 2 或 3

# 2. [仅经批准后] 临时降低
sudo sysctl kernel.perf_event_paranoid=1

# 3. 分析完成后立即恢复
sudo sysctl kernel.perf_event_paranoid=<原始值>
```

**更安全的替代方案（优先使用）：**
- `perf stat` — 统计级数据，无需降级 paranoid（通常参数 ≤2 即可工作）
- Linux 5.8+ 可使用 `CAP_PERFMON` 替代完整 root：`sudo setcap cap_perfmon=ep /usr/bin/perf`
- Linux 5.8+ bpftrace 可使用 `CAP_BPF`：`sudo setcap cap_bpf=ep /usr/bin/bpftrace`
