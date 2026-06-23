# 在 Codex 中使用 Reliable Agent 可靠工程技能

通过原生 skill 发现机制在 Codex 中启用 reliable-agent skills。

## 前置条件

- Git
- 已安装 Codex CLI

## 安装步骤

1. **克隆 reliable-agent 仓库：**
   ```bash
   git clone https://github.com/reliable-agent/reliable-agent.git ~/.codex/reliable-agent
   ```

2. **创建 skills 符号链接：**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/reliable-agent/skills ~/.agents/skills/reliable-agent
   ```

   **Windows (PowerShell)：**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\reliable-agent" "$env:USERPROFILE\.codex\reliable-agent\skills"
   ```

3. **重启 Codex** 以发现 skills。

## 验证

```bash
ls -la ~/.agents/skills/reliable-agent
```

## 更新

```bash
cd ~/.codex/reliable-agent && git pull
```

## 卸载

```bash
rm ~/.agents/skills/reliable-agent
rm -rf ~/.codex/reliable-agent
```

## 使用

启动 Codex 会话后，skills 会被自动发现。也可手动加载：

```
use skill tool to list skills
use skill tool to load reliable-agent/ra-plan
```
