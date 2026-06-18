# 快速开始

## 安装

```bash
claude plugins install reliable-agent
```

## 第一次使用

### 1. 初始化项目宪法

在项目根目录运行：

```
/spec-reliable
```

AI 会：
- 探索你的项目结构
- 就 7 个维度访谈你（目标、技术栈、规范、测试、安全、性能、commit 格式）
- 生成 CLAUDE.md 作为项目宪法
- 新项目会搭建基础目录结构

### 2. 规划功能

```
/plan-reliable
```

AI 会：
- 读取 CLAUDE.md 和相关上下文
- 暴露所有假设让你确认
- 进行对抗式提问（grill-me）——一次一个问题
- 提出 2-3 个方案含权衡
- 拆解任务含验收标准
- 等待你批准

### 3. 实现代码

```
/build-reliable
```

AI 会按照 TDD 循环实现：
- RED：为当前任务写失败的测试
- GREEN：最小实现使测试通过
- Verify：运行完整套件检查回归
- REFACTOR：测试保持绿色下清理
- Commit：原子提交

使用 `auto` 模式可一次性实现所有任务：
```
/build-reliable auto
```

### 4. 验证

```
/verify-reliable
```

运行完整验证：测试、lint、构建、类型检查。全部通过才能进入审查。

### 5. 审查

```
/request-review-reliable
```

并行运行 4 个专业审查者（正确性、安全、测试覆盖、性能），综合生成审查报告。

### 6. 处理审查反馈

```
/receive-review-reliable
```

系统性修复每条发现，Critical 必须有证明测试，修复后重验证。

### 7. 发布

```
/ship-reliable
```

提交校验 + PR 生成 + CI 监控 + 合并。等待你批准后推送。

### 8. 回顾

```
/session-retro
```

提取 session 经验教训，记录到 .reliable-agent/experiences.md。

## 完整流程

```
/spec-reliable → /plan-reliable → /build-reliable
    → /verify-reliable → /log-reliable
    → /request-review-reliable → /receive-review-reliable
    → /update-doc-reliable → /ship-reliable
    → /session-retro
```

## 需要帮助？

- 输入 `/spec-reliable` 开始任何新项目
- 输入 `/plan-reliable` 规划任何新功能
- AI 会在每个步骤引导你
