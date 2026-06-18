# 安装指南

## Claude Code 插件市场安装

```bash
claude plugins install reliable-agent
```

## 本地开发安装

```bash
git clone https://github.com/reliable-agent/reliable-agent.git
cd your-project
claude plugins install /path/to/reliable-agent
```

## 手动安装（无需 Claude Code 插件系统）

复制技能到 Claude Code skills 目录：

```bash
cp -r skills/* ~/.claude/skills/
cp -r agents/* ~/.claude/agents/
cp -r .claude/commands/* ~/.claude/commands/
```

## 验证安装

安装后，启动新的 Claude Code session。你应该看到：

```
You have reliable-agent installed. This plugin provides 11 phase-gated 
engineering workflow skills for reliable code engineering.
```

输入 `/spec-reliable` 测试第一个命令是否可被发现。

## 卸载

```bash
claude plugins uninstall reliable-agent
```

## 依赖

- **Claude Code** — 提供 Skill 工具、Agent 工具、斜杠命令支持、SessionStart 钩子
- **Bash 4.x+** — 用于 session-start 钩子脚本
- `jq`（可选）— 用于 JSON 构造的增强支持；缺少时优雅降级
