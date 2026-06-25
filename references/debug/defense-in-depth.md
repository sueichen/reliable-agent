# 纵深防御 (Defense-in-Depth)

> 改编自 superpowers-zh/systematic-debugging/defense-in-depth.md，扩展 C/C++ 系统级防御模式。

## 核心原则

当你修复了由无效数据/状态/时序引起的 bug 时，在一个地方加校验似乎够了。但这个单点检查可能会被不同代码路径、重构或并发绕过。

**在数据经过的每一层都做校验。让这个 bug 在结构上不可能再发生。**

## 标准四层防御

### 第 1 层：入口校验

在 API 边界拒绝明显无效的输入：

```c
int ConnectionPool::get_connection(const char* key) {
    if (!key || strlen(key) == 0) {
        fprintf(stderr, "get_connection: invalid key\n");
        return -EINVAL;
    }
    if (strlen(key) > MAX_KEY_LEN) {
        fprintf(stderr, "get_connection: key too long (%zu > %d)\n",
                strlen(key), MAX_KEY_LEN);
        return -EINVAL;
    }
    // ... 继续处理
}
```

### 第 2 层：业务逻辑校验

确保系统内部状态一致性（不变量检查）：

```c
void TaskQueue::enqueue(Task* t) {
    assert(t != nullptr);
    assert(t->state == TASK_READY);     // 不能重复入队
    assert(queue_size_ < MAX_QUEUE);    // 不能溢出

    queue_[tail_] = t;
    tail_ = (tail_ + 1) % MAX_QUEUE;
    queue_size_++;

    assert(queue_size_ <= MAX_QUEUE);   // 事后不变量检查
}
```

### 第 3 层：环境守卫

防止在错误上下文中执行危险操作：

```c
// 在开发/测试环境启用额外检查
#ifdef DEBUG
#define GUARD_NOT_IN_SIGNAL_HANDLER() \
    do { \
        if (in_signal_handler) { \
            fprintf(stderr, "FATAL: %s called from signal handler at %s:%d\n", \
                    __func__, __FILE__, __LINE__); \
            abort(); \
        } \
    } while(0)
#else
#define GUARD_NOT_IN_SIGNAL_HANDLER()
#endif
```

防止特定上下文中的危险操作：

```c
void FileManager::delete_file(const char* path) {
    // 测试环境下拒绝在 temp 目录之外删除文件
    #ifdef TEST_MODE
    if (!is_in_temp_dir(path)) {
        fprintf(stderr, "REFUSING: delete outside temp dir: %s\n", path);
        abort();
    }
    #endif
    unlink(path);
}
```

### 第 4 层：调试埋点

记录上下文信息便于事后分析：

```c
void* debug_malloc(size_t size, const char* file, int line) {
    void* p = malloc(size);
    #ifdef DEBUG_ALLOC
    fprintf(stderr, "ALLOC %p size=%zu at %s:%d\n", p, size, file, line);
    #endif
    return p;
}

void debug_free(void* p, const char* file, int line) {
    #ifdef DEBUG_ALLOC
    fprintf(stderr, "FREE  %p at %s:%d\n", p, file, line);
    #endif
    free(p);
}

#define malloc(s) debug_malloc(s, __FILE__, __LINE__)
#define free(p)   debug_free(p, __FILE__, __LINE__)
```

## 系统级防御扩展（第 5-7 层）

以下三层为系统级扩展，与核心四层配合使用。适用于长期运行的服务进程。

### 第 5 层：Signal Handler 安全兜底

```c
// 设置 signal handler 时的安全守卫
static volatile sig_atomic_t in_signal_handler = 0;

void safe_signal_handler(int sig) {
    in_signal_handler = 1;

    // 只做异步安全操作
    // ✅ write() to pipe
    // ✅ _exit()
    // ❌ printf, malloc, pthread_mutex_lock — 全部禁止

    char msg[] = "SIGSEGV received, shutting down\n";
    write(STDERR_FILENO, msg, sizeof(msg) - 1);
    _exit(128 + sig);
}

// 注册时验证
void register_handler(int sig, void (*handler)(int)) {
    // 在注册时自动检查 handler 实现是否安全
    // （编译时通过属性标记 + 静态分析）
    signal(sig, handler);
}
```

### 第 6 层：进程级 Watchdog

```c
// 父进程监控子进程健康
pid_t spawn_worker() {
    pid_t pid = fork();
    if (pid == 0) {
        // 子进程: 设置心跳
        prctl(PR_SET_PDEATHSIG, SIGKILL);  // 父进程退出时自杀
        worker_main();
        _exit(0);
    }

    // 父进程: 监控
    while (true) {
        int status;
        pid_t result = waitpid(pid, &status, WNOHANG);
        if (result == pid) {
            // 子进程退出 → 检查退出原因 → 决定是否重启
            if (WIFSIGNALED(status)) {
                log_crash(status, WTERMSIG(status));
                pid = spawn_worker();  // 重启
            } else {
                break;  // 正常退出
            }
        }
        // 心跳检查
        if (!check_heartbeat(pid)) {
            kill(pid, SIGKILL);
            pid = spawn_worker();
        }
        sleep(1);
    }
}
```

### 第 7 层：Core Dump 自动收集配置

```bash
# 确保系统能收集 core dump
# /etc/systemd/coredump.conf
[Coredump]
Storage=external
Compress=yes
ProcessSizeMax=2G
ExternalSizeMax=2G

# /etc/sysctl.d/50-coredump.conf
kernel.core_pattern=|/usr/lib/systemd/systemd-coredump %P %u %g %s %t %c %e

# /etc/security/limits.conf
* soft core unlimited
```

## 应用模式

发现 bug 后:

1. **映射数据流**: 错误值/状态从哪里产生？经过哪些节点？在哪里被使用？
2. **标注所有检查点**: 列出数据经过的每一个函数/模块边界
3. **每层添加校验**: 根据四层框架选择每层最合适的校验方式
4. **测试每一层**: 尝试绕过第 1 层，验证第 2 层能否捕获

## 真实案例：Use-After-Free 的纵深防御

原始 bug：

```c
// Worker 使用已释放的 Task*
void Worker::process() {
    Task* t = task_queue_.dequeue();  // 出队
    t->execute();                      // 执行
    delete t;                          // 释放
    // ... 后续代码可能再次访问 t
}
```

添加的四层防御：

```
第 1 层 (入口): TaskQueue::dequeue() 返回 nullptr 时中断
第 2 层 (业务): Worker::process() 中将 t 置为 nullptr 并检查后续引用
第 3 层 (环境): DEBUG 模式下使用特殊的 allocator，释放后用 0xDEAD 填充，访问时立即 crash
第 4 层 (埋点): 对 Task* 的分配/释放/访问记录调用栈日志
第 5 层 (信号): SIGSEGV handler 打印 Task 地址和访问点
第 6 层 (进程): watchdog 检测 Worker 线程 crash → 重启 Worker + 记录 crash 信息
```

结果：即使原始的 use-after-free 被其他代码路径绕过前四层，第 5/6 层也能：
- 在 crash 时提供精确的诊断信息
- 自动恢复服务
- 使后续排查有充分证据

## 与可观测性的交叉

纵深防御的前四层应配合 ra-log 技能的遥测框架：

- **第 1-2 层校验失败** → ERROR 级别日志 + 计数器指标
- **第 3 层守卫触发** → FATAL 级别日志 + 告警
- **第 4 层埋点** → DEBUG/TRACE 级别日志（生产环境可关闭）

这样安全团队可以基于指标和告警发现试图绕过入口校验的攻击模式。
