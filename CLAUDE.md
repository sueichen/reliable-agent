# reliable-agent — 插件开发者指南

这是 reliable-agent 项目——一套针对 Claude Code 的可靠工程工作流技能集。

## 项目结构

```
skills/         → 12 个技能目录（1 元技能 + 11 工作流技能）
agents/         → 5 个可复用的智能体角色定义
hooks/          → SessionStart 生命周期钩子
.claude/commands/ → 11 个斜杠命令（用户入口点）
templates/      → 5 个项目初始化模板
references/     → 7 个交叉引用检查清单
docs/           → 用户文档
scripts/        → 验证和管理脚本
```

## 技能组织

| 阶段 | 技能 | 简要说明 |
|------|------|---------|
| Bootstrap | using-reliable-agent | 元技能——SessionStart 注入，技能发现 |
| Define | reliable-spec | 项目初始化——生成 CLAUDE.md + 宪法 |
| Plan | reliable-plan | 需求分析 + grill-me + 设计方案 |
| Build | reliable-build | TDD 增量实现 |
| Verify | reliable-verify | 自动化验证——测试+lint+构建 |
| Observe | reliable-log | 可观测性检查——日志+指标+追踪 |
| Review | reliable-request-review | 多角度代码审查——5-agent 并行扇出 |
| Review | reliable-receive-review | 审查反馈处理+修复 |
| Evolve | reliable-evolve | 经验分析→3 类变更建议 |
| Doc | reliable-update-doc | 文档同步更新 |
| Ship | reliable-ship | 提交+PR+合并 |
| Retro | reliable-session-retro | Session 回顾+经验提取 |

## 约定

- 每个技能在 `skills/<name>/SKILL.md` 中
- YAML frontmatter 包含 `name`、`description`、`version`、`license`
- Description 只写触发条件，不写流程细节（防止 AI 从 description 中编造响应）
- 每个技能包含：Overview、When to Use、Core Process（含 DOT 图）、Common Rationalizations、Red Flags、Verification、下一步指引
- 共享引用在 `references/` 中，不在技能目录内
- 辅助文件仅在内容超过 100 行时创建
- DOT digraph 是权威流程定义，文字为辅助
- `<HARD-GATE>` XML 块标记不可违反的规则

## 智能体角色约定

- 角色在 `agents/` 目录中，YAML frontmatter 有 `name` 和 `description`
- Persona + Operations 双层架构（Identity 层 + Operation 层分离）
- 角色不得调用其他角色（角色隔离铁律）
- 角色可以调用 Skill 工具
- 角色包含硬性规则（Critical Rules）和量化成功指标

## 边界

- Always: 遵循本指南中定义的标准结构
- Never: 添加模糊建议而非可执行流程的技能
- Never: 在技能之间重复内容——改用交叉引用
- Never: 自动应用进化建议——所有行为变更需人类审批
