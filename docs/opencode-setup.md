# 在 OpenCode 中使用 Reliable Agent 可靠工程技能

本指南说明如何在 OpenCode 中使用 Reliable Agent，实现接近 Claude Code 的体验。

## 概述

OpenCode 通过以下方式实现等效体验：

- 强大的系统提示（`AGENTS.md`）
- 内建 `skill` 工具
- 从 `/skills` 目录一致的 skill 发现

这创建了一个**智能体驱动的工作流**，skills 被自动选择和执行。

## 安装

1. 克隆仓库：

```bash
git clone https://github.com/reliable-agent/reliable-agent.git
```

2. 在 OpenCode 中打开项目。

3. 确保工作区中存在以下文件：
   - `AGENTS.md`（根目录）
   - `skills/` 目录

无需额外安装。

## 工作原理

### Skill 发现

所有 skills 位于 `skills/<skill-name>/SKILL.md`。

OpenCode 智能体被指示（通过 `AGENTS.md`）：
- 检测 skill 何时适用
- 调用 `skill` 工具
- 严格遵循 skill

### 自动 Skill 调用

智能体评估每个请求并映射到适当的 skill：

- "构建一个功能" → `reliable-agent:ra-spec` → `reliable-agent:ra-build`
- "修复一个 bug" → `reliable-agent:ra-plan` → `reliable-agent:ra-build`
- "审查这段代码" → `reliable-agent:ra-request-review`

用户**不需要**显式请求 skills。

### 生命周期映射

- DEFINE → `reliable-agent:ra-spec`
- PLAN → `reliable-agent:ra-plan`
- BUILD → `reliable-agent:ra-build`
- VERIFY → `reliable-agent:ra-verify`
- REVIEW → `reliable-agent:ra-request-review`
- SHIP → `reliable-agent:ra-ship`

## 使用示例

**功能开发：** 用户说 "Add authentication to this app"，智能体会检测到功能工作，调用 `reliable-agent:ra-spec`，在写代码前生成规范。

**Bug 修复：** 用户说 "This endpoint is returning 500 errors"，智能体会调用 `reliable-agent:ra-plan` 分析问题、生成修复方案。

## 智能体期望（关键）

- 行动前始终检查是否有 skill 适用
- 如果 skill 适用，必须使用
- 绝不跳过必需的工作流（spec、plan、test 等）
- 不直接跳到实现

这些规则通过 `AGENTS.md` 强制执行。

## 限制

- 无原生斜杠命令（通过意图映射处理）
- Skill 调用取决于模型遵从性
