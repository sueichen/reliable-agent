# 网络优化技法

> 适用场景: 网络吞吐低、延迟高、连接数瓶颈、丢包
> 前置条件: 已通过 netstat/sar/ss 确认网络为瓶颈维度

---

## 1. 网络瓶颈诊断

### 1.1 快速定位
```bash
# 网络流量与错误统计
sar -n DEV 1           # 每接口流量/包量/错误
sar -n TCP,ETCP 1      # TCP 连接统计 + 错误

# 连接状态分布
ss -s                  # 概要
ss -tan state time-wait | wc -l  # TIME_WAIT 数量

# 收发包队列溢出
netstat -s | grep -i "overflow\|pruned\|collapsed\|drop"

# 连接延迟
ping -c 100 <host>     # ICMP 延迟
mtr <host>             # 路由追踪 + 每跳统计
```

### 1.2 关键指标
| 指标 | 含义 | 关注阈值 |
|------|------|---------|
| **retransmit** | TCP 重传率 | > 0.1% |
| **timewait** | TIME_WAIT 连接数 | > 10000 |
| **Recv-Q/Send-Q** | 接收/发送队列积压 | > 0 持续 |
| **backlog drops** | 全连接队列溢出 | > 0 |
| **SYN drops** | SYN 队列溢出 | > 0 |

---

## 2. 内核参数调优

> ⚠️ **安全警告**: 以下所有 sysctl 修改为**全局内核级变更**，错误配置可导致连接失败、数据损坏或拒绝服务。
> - 不要在生产环境试验性修改 — 需要变更控制和测试
> - 修改前记录当前值（恢复路径）：`sysctl <参数名>`
> - 注意参数间的交互效应（如 `tcp_tw_reuse` 依赖 `tcp_timestamps`）

### 2.1 TCP 缓冲区
```bash
# 增大缓冲区（高带宽高延迟网络）
# 恢复: sysctl -w net.core.rmem_max=212992（默认）
# WARNING: 过大缓冲区增加内存消耗。每个 socket 可消耗至 rmem_max，大量连接时可能耗尽 RAM。
#          应根据 BDP（带宽延迟积）而不是最大值来调整。
sysctl -w net.core.rmem_max=134217728     # 128MB
# 恢复: sysctl -w net.core.wmem_max=212992（默认）
sysctl -w net.core.wmem_max=134217728
# 恢复: sysctl -w net.ipv4.tcp_rmem="4096 131072 6291456"（默认）
sysctl -w net.ipv4.tcp_rmem="4096 87380 134217728"
# 恢复: sysctl -w net.ipv4.tcp_wmem="4096 16384 4194304"（默认）
sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"

# 启用 TCP 窗口缩放（默认开启）
sysctl -w net.ipv4.tcp_window_scaling=1
```

### 2.2 连接队列
```bash
# 恢复: sysctl -w net.core.somaxconn=128（默认）
sysctl -w net.core.somaxconn=4096

# 恢复: sysctl -w net.ipv4.tcp_max_syn_backlog=256（默认）
sysctl -w net.ipv4.tcp_max_syn_backlog=8192

# 启用 SYN Cookie 防 SYN Flood（默认开启）
sysctl -w net.ipv4.tcp_syncookies=1
```

### 2.3 TIME_WAIT 优化
```bash
# 复用 TIME_WAIT 连接（服务端）
# WARNING: 必须同时启用 tcp_timestamps=1（默认），否则可导致数据损坏（RFC 6191）
# 恢复: sysctl -w net.ipv4.tcp_tw_reuse=0
sysctl -w net.ipv4.tcp_tw_reuse=1

# 减少 TIME_WAIT 持续时间（谨慎）
# 恢复: sysctl -w net.ipv4.tcp_fin_timeout=60
# sysctl -w net.ipv4.tcp_fin_timeout=30

# 端口范围扩大
# 恢复: sysctl -w net.ipv4.ip_local_port_range="32768 60999"
sysctl -w net.ipv4.ip_local_port_range="1024 65535"
```

### 2.4 拥塞控制
```bash
# 查看可用算法
sysctl net.ipv4.tcp_available_congestion_control

# 高带宽场景推荐 BBR
# 前置: modprobe tcp_bbr（部分发行版需手动加载模块）
# 检查是否可用: sysctl net.ipv4.tcp_available_congestion_control | grep bbr
# 恢复: sysctl -w net.ipv4.tcp_congestion_control=cubic
sysctl -w net.ipv4.tcp_congestion_control=bbr

# 检查当前算法
sysctl net.ipv4.tcp_congestion_control
```

---

## 3. 应用层优化

### 3.1 epoll 调优（大量连接场景）
```c
// 使用边缘触发（ET）+ 非阻塞 IO
int epfd = epoll_create1(0);
struct epoll_event ev;
ev.events = EPOLLIN | EPOLLET;  // 边缘触发
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &ev);

// 一次尽可能多地处理事件
struct epoll_event events[MAX_EVENTS];
int nfds = epoll_wait(epfd, events, MAX_EVENTS, timeout);
```

### 3.2 连接池与复用
```c
// HTTP Keep-Alive: 复用 TCP 连接
// 避免每请求一次 TCP 握手

// 连接池：预建立连接，避免频繁创建销毁
```

### 3.3 零拷贝网络发送
```c
// sendfile: 文件 → socket，内核态完成
sendfile(socket_fd, file_fd, &offset, file_size);

// send + MSG_ZEROCOPY: 减少用户态拷贝（Linux 4.14+）
setsockopt(fd, SOL_SOCKET, SO_ZEROCOPY, &one, sizeof(one));
send(fd, buf, size, MSG_ZEROCOPY);
```

### 3.4 Nagle 算法与延迟
```c
// 低延迟场景禁用 Nagle（小包即时发送）
int one = 1;
setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &one, sizeof(one));

// 同时禁用 Delayed ACK（谨慎）
setsockopt(fd, IPPROTO_TCP, TCP_QUICKACK, &one, sizeof(one));
```

---

## 4. eBPF 深度诊断

```bash
# TCP 重传追踪
bpftrace -e 'kprobe:tcp_retransmit_skb {
    printf("retransmit: %s:%d -> %s:%d\n",
           comm, pid, kstack(0), ustack(0)); }'

# 按进程统计 TCP 生命周期
/usr/share/bcc/tools/tcplife

# TCP 延迟分布
/usr/share/bcc/tools/tcplat

# 连接追踪
/usr/share/bcc/tools/tcpconnect -t
/usr/share/bcc/tools/tcpaccept -t

# 收发包延迟
/usr/share/bcc/tools/runqlat   # 调度延迟（可能影响网络处理）
```

---

## 5. 快速检查清单

- [ ] TCP 重传率 < 0.1%？
- [ ] send-Q/recv-Q 无持续积压？
- [ ] TIME_WAIT < 10000？
- [ ] 长肥网络是否调整了 TCP 缓冲区？
- [ ] 大量短连接场景是否启用了 tcp_tw_reuse？
- [ ] 高吞吐场景是否使用 BBR 拥塞控制？
- [ ] 低延迟场景是否设置了 TCP_NODELAY？
- [ ] 文件传输是否使用了 sendfile/splice 零拷贝？
