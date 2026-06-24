# IO/磁盘优化技法

> 适用场景: iowait 高、磁盘吞吐低、文件读写慢、数据库存储性能瓶颈
> 前置条件: 已通过 iostat/iotop 确认 IO 为瓶颈维度

---

## 1. IO 瓶颈诊断

### 1.1 快速定位
```bash
# 系统级 IO 统计
iostat -x 1           # %util > 70% 或 await > 10ms 需关注
iotop -o              # 找出 IO 最多的进程

# 进程级 IO 统计
pidstat -d 1

# 系统调用追踪（注意开销）
strace -c -p <pid>    # 统计系统调用频率和时间
strace -T -e trace=read,write -p <pid>  # 追踪具体调用耗时
```

### 1.2 关键指标解读
| 指标 | 含义 | 阈值 |
|------|------|------|
| **await** | IO 请求平均等待时间 | > 10ms 需关注（SSD）、> 30ms（HDD） |
| **%util** | 磁盘繁忙比例 | > 70% 可能饱和 |
| **r_await/w_await** | 读/写平均等待 | 分开看，定位是读还是写慢 |
| **avgrq-sz** | 平均请求大小 | 太小=碎片化 IO；太大=大块读写 |
| **svctm** | 平均服务时间 | 接近 await 说明队列等待少 |

### 1.3 文件系统级诊断
```bash
# 查看进程打开了哪些文件及读写量
lsof -p <pid>
cat /proc/<pid>/io     # read_bytes, write_bytes 等

# 页缓存命中率
# 高 free + 低 available → 可能有页缓存竞争
free -h
```

---

## 2. 有代码优化

### 2.1 缓冲 IO → 直接 IO
```c
// 绕过页缓存（适用于数据库等自管理缓存的场景）
int fd = open(path, O_DIRECT | O_RDWR);
// 注意: O_DIRECT 需要对齐的缓冲区（通常 512B 或 4KB）
void* buf;
posix_memalign(&buf, 4096, size);
```

### 2.2 零拷贝技术
```c
// sendfile: 内核态完成文件→socket 拷贝（无用户态拷贝）
ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);

// splice: 两个 fd 之间在内核态传输数据
ssize_t splice(int fd_in, loff_t *off_in, int fd_out,
               loff_t *off_out, size_t len, unsigned int flags);

// mmap: 文件映射到内存，减少 read/write 系统调用
void *addr = mmap(NULL, size, PROT_READ, MAP_SHARED, fd, 0);
```

### 2.3 异步 IO
```c
// io_uring（Linux 5.1+）—— 现代异步 IO 首选
// 相比 libaio 优势: 更少的系统调用、支持 buffered IO
// ⚠️ io_uring 有已知内核漏洞历史（CVE-2023-25947 等），部分安全加固系统已禁用
// 检查: sysctl kernel.io_uring_disabled（0=启用, 2=禁用）

// 关键系统调用: io_uring_setup, io_uring_enter, io_uring_register
// 推荐使用 liburing 封装库: https://github.com/axboe/liburing
```

### 2.4 批量写入
```c
// BAD: 频繁小写入
for (int i = 0; i < N; i++)
    write(fd, &data[i], sizeof(data[i]));

// GOOD: 批量缓冲写入
char buf[BUF_SIZE];
size_t pos = 0;
for (int i = 0; i < N; i++) {
    memcpy(buf + pos, &data[i], sizeof(data[i]));
    pos += sizeof(data[i]);
    if (pos >= BUF_SIZE - sizeof(data[i])) {
        write(fd, buf, pos);
        pos = 0;
    }
}
if (pos > 0) write(fd, buf, pos);  // 刷尾
```

---

## 3. 无代码优化（系统级）

> ⚠️ **内核参数修改警告**: 以下所有参数修改为**全局系统级变更**，影响所有进程。修改前：
> 1. 记录当前值：`sysctl <参数名>` 或 `cat /sys/.../相应文件`
> 2. 保存恢复命令：以便出问题时快速回退
> 3. **不**在生产系统上试验性修改
> 4. 挂载参数（`mount -o`）需在挂载时指定，修改通常需要卸载/重新挂载

### 3.1 IO 调度器
```bash
# 查看当前调度器
cat /sys/block/sda/queue/scheduler
# [mq-deadline] none

# NVMe SSD 推荐: none（无调度器，硬件自己调度）
# SATA SSD 推荐: mq-deadline
# HDD 推荐: bfq（桌面）/ mq-deadline（服务器）
# 恢复: echo <原始值> > /sys/block/sda/queue/scheduler
echo mq-deadline > /sys/block/sda/queue/scheduler
```

### 3.2 文件系统选择与挂载参数
```bash
# XFS（大文件、高吞吐）挂载参数
mount -o noatime,nodiratime,logbufs=8,allocsize=256m /dev/sda1 /data

# ext4（通用）挂载参数
# WARNING: barrier=0 禁用写屏障，断电或崩溃可导致文件系统损坏和数据丢失
#         仅在不关心数据完整性的临时场景使用
mount -o noatime,data=ordered /dev/sda1 /data

# btrfs（快照/压缩场景）
mount -o noatime,compress=zstd,ssd /dev/sda1 /data
```

### 3.3 页缓存与脏页刷新
```bash
# 降低脏页比例（减少突发 IO）
# 恢复: sysctl -w vm.dirty_ratio=20（kernel 5.9+ 默认）
sysctl -w vm.dirty_ratio=10          # 脏页占总内存 10% 时开始同步写
# 恢复: sysctl -w vm.dirty_background_ratio=10（默认）
sysctl -w vm.dirty_background_ratio=5 # 脏页 5% 时后台刷新

# 减少脏页过期时间
# 恢复: sysctl -w vm.dirty_expire_centisecs=3000（默认 30 秒）
sysctl -w vm.dirty_expire_centisecs=1500   # 15 秒
# 恢复: sysctl -w vm.dirty_writeback_centisecs=500（默认）
sysctl -w vm.dirty_writeback_centisecs=500  # 5 秒刷新间隔（已是默认值，无需修改）
```

### 3.4 使用 tmpfs 或 ramdisk
```bash
# 临时文件场景：用内存替代磁盘
mount -t tmpfs -o size=2G tmpfs /tmp/ramdisk
```

---

## 4. eBPF/bpftrace 深度诊断

```bash
# 跟踪 IO 延迟分布
bpftrace -e 'kprobe:blk_account_io_done { @usecs = hist((nsecs - arg1) / 1000); }'

# 按进程统计读/写延迟
bpftrace -e 'tracepoint:block:block_rq_issue {
    @start[args->dev, args->sector] = nsecs; }
    tracepoint:block:block_rq_complete /@start[args->dev, args->sector]/ {
    @lat_us = hist((nsecs - @start[args->dev, args->sector]) / 1000);
    delete(@start[args->dev, args->sector]); }'

# 找出哪个文件消耗最多 IO
# 需要 biolatency + filetop 工具 (bcc-tools)
/usr/share/bcc/tools/filetop -C
```

---

## 5. 快速检查清单

- [ ] iostat await 是否 < 10ms（SSD）/ < 30ms（HDD）？
- [ ] %util 是否 < 70%？
- [ ] 是否使用了批量写入代替频繁小写入？
- [ ] 读多写少场景是否充分利用了页缓存？
- [ ] 数据库等自管理缓存场景是否启用了 O_DIRECT？
- [ ] 是否考虑了 sendfile/splice/mmap 零拷贝？
- [ ] 是否有大量随机 IO 可改为顺序 IO？
