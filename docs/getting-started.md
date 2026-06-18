# 快速开始

## 安装

```bash
claude plugins install reliable-agent
```

## 第一次使用

### 1. 初始化项目宪法

在项目根目录运行：

```
/reliable-spec
```

AI 会：
- 探索你的项目结构，检测语言并匹配代码规范
- 就 7 个维度访谈你（目标、技术栈、规范、测试、安全、性能、commit 格式）
- 生成 CLAUDE.md 作为项目宪法
- 新项目会搭建基础目录结构（含 .reliable-agent/codestyle/）

### 2. 规划功能

```
/reliable-plan
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
/reliable-build
```

AI 会按照 TDD 循环实现：
- RED：为当前任务写失败的测试
- GREEN：最小实现使测试通过
- Verify：运行完整套件检查回归
- REFACTOR：测试保持绿色下清理
- Commit：原子提交

使用 `auto` 模式可一次性实现所有任务：
```
/reliable-build auto
```

### 4. 验证

```
/reliable-verify
```

运行完整验证：测试、lint、构建、类型检查。全部通过才能进入审查。

### 5. 审查

```
/reliable-request-review
```

并行运行 5 个专业审查者（正确性、安全、测试覆盖、性能、代码风格），综合生成审查报告。

### 6. 处理审查反馈

```
/reliable-receive-review
```

系统性修复每条发现，Critical 必须有证明测试，修复后重验证。

### 7. 发布

```
/reliable-ship
```

提交校验 + PR 生成 + CI 监控 + 合并。等待你批准后推送。

### 8. 回顾

```
/reliable-session-retro
```

提取 session 经验教训，记录到 .reliable-agent/experiences.md。

## 一键自动化

如果不想逐步运行上述步骤 2-7（plan 到 update-doc），可以使用自动化命令：

```
/reliable-auto
```

AI 会:
- 自动检测项目当前所处阶段（通过分析 CLAUDE.md、plan 文件、git 历史等）
- 展示检测结果并请求一次性确认（后续阶段自动执行）
- 顺序执行 plan → build → verify → log → request-review
- 自动处理审查反馈：修复 → 重验证 → 重审查（最多 3 次循环）
- 审查通过后自动更新文档
- 在 update-doc 完成后停止，生成自动决策报告
- 提示手动运行 `/reliable-evolve`、`/reliable-ship` 和 `/reliable-session-retro`

**注意**: 此命令不从 spec 开始（规范生成始终需要人工交互），也不执行 ship（发布需要人类批准）。

## 完整流程

```
手动:  /reliable-spec → /reliable-plan → /reliable-build
           → /reliable-verify → /reliable-log
           → /reliable-request-review → /reliable-receive-review
           → /reliable-evolve → /reliable-update-doc → /reliable-ship
           → /reliable-session-retro

自动化: /reliable-auto  → plan → build → verify → log
           → request-review → [审查循环] → update-doc → STOP
           （然后手动运行 evolve → ship → session-retro）
```

## 需要帮助？

- 输入 `/reliable-spec` 开始任何新项目
- 输入 `/reliable-plan` 规划任何新功能
- AI 会在每个步骤引导你
