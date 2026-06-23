# 在 Cursor 中使用 Reliable Agent 可靠工程技能

## 安装

### 方式一：作为 Cursor 规则

将任何 `SKILL.md` 复制到 `.cursor/rules/`：

```bash
mkdir -p .cursor/rules
cp reliable-agent/skills/ra-build/SKILL.md .cursor/rules/
```

或引用完整的 `skills/` 目录。

### 方式二：作为插件

将 reliable-agent 仓库克隆到本地，然后在 Cursor 设置中将其指定为插件目录。

Cursor 会自动发现 `.cursor-plugin/plugin.json` 中声明的 skills。

## 推荐配置

### 始终加载（.cursorrules）

```bash
cp skills/ra-build/SKILL.md .cursor/rules/
cp skills/ra-verify/SKILL.md .cursor/rules/
cp skills/ra-request-review/SKILL.md .cursor/rules/
```

### 按需引用

对于阶段特定的技能，在聊天中引用：

```
Use the reliable-agent:ra-plan skill to break down this feature into tasks.
```

## 注意事项

- Cursor 不原生支持所有 Claude Code 工具（如 `Agent`、`Workflow`、`Skill`）
- 某些技能中的并发 fan-out 模式不可直接使用，智能体会顺序执行等效步骤
- 最大的价值在于技能的工作流纪律和验证检查清单
