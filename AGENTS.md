# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot, Antigravity, OpenCode, Codex, etc.) when working with code in this repository.

## Repository Overview

可靠工程工作流技能集（reliable-agent）——为 AI 编码智能体提供 13 个阶段门控工程技能，覆盖从规范到回顾的完整可靠工程循环。

## OpenCode Integration

OpenCode 使用基于 `skill` 工具和本仓库 `/skills` 目录的**技能驱动执行模型**。

### Core Rules

- 如果任务匹配某个技能，你必须调用它
- 技能位于 `skills/<skill-name>/SKILL.md`
- 如果有匹配的技能，绝不直接实现
- 始终完全遵循技能指令（不要部分执行）

### Intent → Skill Mapping

智能体应自动将用户意图映射到技能：

- 功能 / 新特性 → `ra-spec`，然后 `ra-build`
- 规划 / 任务拆解 → `ra-plan`
- Bug / 失败 / 意外行为 → `ra-plan`，然后 `ra-build`
- 代码审查 → `ra-request-review`
- 处理审查反馈 → `ra-receive-review`
- 验证 → `ra-verify`
- 可观测性 → `ra-log`
- 文档 → `ra-update-doc`
- 发布 → `ra-ship`
- Session 回顾 → `ra-evolve`
- 性能优化 / 瓶颈分析 → `ra-perf`
- 一键自动化 → `ra-auto`

### Lifecycle Mapping (Implicit Commands)

OpenCode 不支持类似 `/ra-spec` 或 `/ra-plan` 的斜杠命令。

智能体必须在内部遵循此生命周期：

- DEFINE → `ra-spec`
- PLAN → `ra-plan`
- BUILD → `ra-build`
- VERIFY → `ra-verify`
- OBSERVE → `ra-log`
- REVIEW → `ra-request-review` + `ra-receive-review`
- DOC → `ra-update-doc`
- SHIP → `ra-ship`
- PERF → `ra-perf`
- EVOLVE → `ra-evolve`

### Execution Model

对于每个请求：

1. 判断是否有匹配的技能（哪怕 1% 可能性）
2. 使用 `skill` 工具调用匹配的技能
3. 严格遵循技能工作流
4. 仅在所需步骤（spec、plan 等）完成后才进入实现

### Anti-Rationalization

以下想法是错误的，必须忽略：

- "这太小了不配用技能"
- "我可以直接快速实现"
- "我先收集一下上下文"

正确行为：

- 始终先检查并使用技能

这确保 OpenCode 表现得与 Claude Code 完全一致，具有完整的工作流强制执行。

## Orchestration: Personas, Skills, and Commands

本仓库有三个可组合的层次。它们有不同的职责，不应混淆：

- **Skills** (`skills/<name>/SKILL.md`) — 含步骤和退出条件的工作流。*如何做*。当意图匹配时强制执行。
- **Personas** (`agents/<role>.md`) — 具有视角和输出格式的角色。*谁来做*。
- **Slash commands** (`.claude/commands/*.md`, `.gemini/commands/*.toml`, `commands/*.toml`) — 面向用户的入口点。*何时触发*。编排层。

组合规则：**用户（或斜杠命令）是编排者。角色不调用其他角色。** 角色可以调用技能。

本仓库认可的唯一多角色编排模式是**并行扇出 + 合并步骤**。
由 `/ra-request-review` 使用，并发运行 `code-reviewer`、`security-auditor`、
`test-engineer`、`performance-auditor` 和 `style-auditor` 并综合它们的报告。
不要构建一个"路由"角色来决定调用哪个其他角色；这是斜杠命令和意图映射的职责。

**Claude Code 互操作：** `agents/` 中的角色可用作 Claude Code 子智能体
（从本插件的 `agents/` 目录自动发现）和 Agent Teams 队友（按名称引用）。
两个平台约束与我们的规则一致：子智能体不能生成其他子智能体，团队不能嵌套。
插件智能体静默忽略 `hooks`、`mcpServers` 和 `permissionMode` frontmatter 字段。
