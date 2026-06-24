# 安装指南

## 方式一：官方 Marketplace（推荐）

> 如插件尚未发布到官方市场，请使用方式二或方式三。

```bash
claude plugin install reliable-agent
```

或在 Claude Code 交互模式中：`/plugin install reliable-agent`

可通过 `--scope` 控制安装范围：

```bash
claude plugin install reliable-agent --scope user     # 用户级（默认）
claude plugin install reliable-agent --scope project  # 项目级
```

## 方式二：Git 克隆 + CLI 启动参数（推荐本地开发）

```bash
# 克隆仓库
git clone https://github.com/reliable-agent/reliable-agent.git
cd reliable-agent

# 启动时加载插件
claude --plugin-dir .
```

> **注意**：`--plugin-dir` 仅在当前 session 生效（CLI 帮助明确标注 "for this session only"），关闭 Claude Code 后插件不会保留。如需持久化，请使用方式一或方式三。

支持同时加载多个插件：

```bash
claude --plugin-dir ./plugin-a --plugin-dir ./plugin-b
```

也可加载 `.zip` 格式的插件：

```bash
claude --plugin-dir /path/to/plugin.zip
```

## 方式三：交互模式注册本地 Marketplace

在 Claude Code 交互模式中执行（斜杠命令，非 shell 命令）：

```
/plugin marketplace add /path/to/reliable-agent
/plugin install reliable-agent
```

此方式安装的插件会持久保留，重启后依然可用。卸载方式与方式一相同。

## 验证安装

安装后，启动新的 Claude Code session。你应该看到：

```
You have reliable-agent installed. This plugin provides 11 phase-gated 
engineering workflow skills (including an auto-pilot mode) for reliable code engineering.
```

输入 `ra-spec` 测试第一个命令是否可被发现。

## 卸载

```bash
# 通过 CLI
claude plugin uninstall reliable-agent

# 或在交互模式中
/plugin uninstall reliable-agent
```

> **注意**：如果通过方式二（`--plugin-dir`）加载插件，无需卸载 — 只需去掉启动参数即可。

## 其他平台

### Gemini CLI

```bash
# 从仓库安装 skills
gemini skills install https://github.com/reliable-agent/reliable-agent.git --path skills

# 或从本地克隆安装
git clone https://github.com/reliable-agent/reliable-agent.git
gemini skills install /path/to/reliable-agent/skills/
```

详见 [Gemini CLI 安装指南](gemini-cli-setup.md)。

### Antigravity CLI

```bash
# 从远程仓库安装
agy plugin install https://github.com/reliable-agent/reliable-agent.git

# 或从本地克隆安装
git clone https://github.com/reliable-agent/reliable-agent.git
agy plugin install /path/to/reliable-agent
```

### OpenCode

在你的 `opencode.json` 中添加到 `plugin` 数组：

```json
{
  "plugin": ["reliable-agent@git+https://github.com/reliable-agent/reliable-agent.git"]
}
```

详见 [OpenCode 安装指南](opencode-setup.md)。

### Codex

```bash
git clone https://github.com/reliable-agent/reliable-agent.git ~/.codex/reliable-agent
mkdir -p ~/.agents/skills
ln -s ~/.codex/reliable-agent/skills ~/.agents/skills/reliable-agent
```

详见 [Codex 安装指南](codex-setup.md)。

### Cursor

```bash
# 复制核心技能到 Cursor 规则目录
mkdir -p .cursor/rules
cp reliable-agent/skills/ra-build/SKILL.md .cursor/rules/
cp reliable-agent/skills/ra-verify/SKILL.md .cursor/rules/
cp reliable-agent/skills/ra-request-review/SKILL.md .cursor/rules/
```

详见 [Cursor 安装指南](cursor-setup.md)。

### GitHub Copilot

```bash
# 复制 agent 定义（注意：Copilot 要求 *.agent.md 扩展名）
mkdir -p .github/agents
cp reliable-agent/agents/code-reviewer.md .github/agents/code-reviewer.agent.md
cp reliable-agent/agents/test-engineer.md .github/agents/test-engineer.agent.md
cp reliable-agent/agents/security-auditor.md .github/agents/security-auditor.agent.md
cp reliable-agent/agents/performance-auditor.md .github/agents/performance-auditor.agent.md
cp reliable-agent/agents/style-auditor.md .github/agents/style-auditor.agent.md
```

详见 [Copilot 安装指南](copilot-setup.md)。

## 依赖

- **Claude Code** / **Gemini CLI** / **Antigravity CLI** / **OpenCode** / **Codex** / **Cursor** — 至少一个受支持的 AI 编码平台
- **Bash 4.x+** — 用于 session-start 钩子脚本（Claude Code/Cursor）
- `jq`（可选）— 用于 JSON 构造的增强支持；缺少时优雅降级
