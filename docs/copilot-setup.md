# 在 GitHub Copilot 中使用 Reliable Agent 可靠工程技能

## 安装

### Copilot Instructions

Copilot 支持使用 `.github/skills`、`.claude/skills` 或 `.agents/skills` 目录创建智能体 skills。

```bash
mkdir -p .github

# 为关键 skills 创建文件
cp reliable-agent/skills/ra-build/SKILL.md .github/skills/ra-build/SKILL.md
cp reliable-agent/skills/ra-request-review/SKILL.md .github/skills/ra-request-review/SKILL.md
```

更多详情：[GitHub Copilot 创建智能体 skills 文档](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-skills)。

### 智能体角色（*.agent.md）

Copilot 支持专用智能体角色。使用 reliable-agent 的智能体：

> **重要：** GitHub Copilot 要求自定义智能体文件命名为 `*.agent.md`。命名为 `*.md` 的文件会被 Copilot 静默忽略。

```bash
mkdir -p .github/agents
cp reliable-agent/agents/code-reviewer.md .github/agents/code-reviewer.agent.md
cp reliable-agent/agents/test-engineer.md .github/agents/test-engineer.agent.md
cp reliable-agent/agents/security-auditor.md .github/agents/security-auditor.agent.md
cp reliable-agent/agents/performance-auditor.md .github/agents/performance-auditor.agent.md
cp reliable-agent/agents/style-auditor.md .github/agents/style-auditor.agent.md
```

在 Copilot Chat 中调用智能体：
- `@code-reviewer Review this PR`
- `@test-engineer Analyze test coverage for this module`
- `@security-auditor Check this endpoint for vulnerabilities`

## 推荐配置

### .github/copilot-instructions.md

```markdown
# 项目编码标准

## 测试
- 写代码前先写测试（TDD）
- 对 bug：先写失败的测试，再修复
- 每次变更后运行测试套件

## 代码质量
- 五轴审查：正确性、可读性、架构、安全性、性能
- 每个 PR 必须通过：lint、类型检查、测试、构建

## 实现
- 以小而可验证的增量构建
- 绝不混入格式化变更与行为变更
```

## 使用技巧

1. **保持指令简洁** — 总结关键规则
2. **使用智能体进行审查** — 专为 Copilot 智能体模型设计
3. **在聊天中引用** — 处理特定阶段时粘贴相关 skill 内容
4. **结合 PR 审查** — 使用 code-reviewer 智能体角色审查 PR
