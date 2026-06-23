# 为 OpenCode 安装 Reliable Agent 可靠工程技能

## 前置条件

- 已安装 [OpenCode.ai](https://opencode.ai)

## 安装步骤

在你的 `opencode.json`（全局或项目级别）中将 reliable-agent 添加到 `plugin` 数组：

```json
{
  "plugin": ["reliable-agent@git+https://github.com/reliable-agent/reliable-agent.git"]
}
```

重启 OpenCode。完成——插件会自动安装并注册所有 skills。

通过询问来验证："告诉我你的可靠工程技能"

## 使用方法

使用 OpenCode 的原生 `skill` 工具：

```
use skill tool to list skills
use skill tool to load reliable-agent/ra-plan
```

## 更新

Reliable Agent 会在你重启 OpenCode 时自动更新。

要固定到特定版本：

```json
{
  "plugin": ["reliable-agent@git+https://github.com/reliable-agent/reliable-agent.git#v1.0.0"]
}
```

## 故障排除

### 插件未加载

1. 检查日志：`opencode run --print-logs "hello" 2>&1 | grep -i reliable`
2. 验证 `opencode.json` 中的插件配置
3. 确保你运行的是最新版本的 OpenCode

### Skills 未找到

1. 使用 `skill` 工具列出已发现的内容
2. 检查插件是否已加载（见上文）

### 工具映射

当 skills 引用 Claude Code 工具时：
- `TodoWrite` → `todowrite`
- `Task` 子代理 → `@mention` 语法
- `Skill` 工具 → OpenCode 的原生 `skill` 工具
- 文件操作 → 你的原生工具

## 获取帮助

- 报告问题：https://github.com/reliable-agent/reliable-agent/issues
- 完整文档：https://github.com/reliable-agent/reliable-agent
