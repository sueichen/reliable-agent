# Reliable-Agent

可靠工程工作流技能集 — 12 个阶段门控工作流，覆盖从规范到回顾的完整可靠工程循环。支持 **Claude Code、Gemini CLI、Antigravity CLI、OpenCode、Codex、Cursor、GitHub Copilot** 等 7 个平台。

## 核心理念

- **人类审查是通用闸门** — 所有改变行为的修改必须经人类批准
- **质量门禁制** — 阶段间有明确通过条件，不满足则拒绝前进
- **TDD 优先** — 测试先于代码，测试多于代码，测试通过是审查前置条件
- **完整可观测性** — log/trace/metrics 随代码一起交付
- **Session 可追溯** — 每轮 session 成果和教训持久化
- **多平台支持** — 一次安装，多平台可用

## 技能列表

| 命令 | 阶段 | 功能 |
|------|------|------|
| `/ra-auto` | Auto | 自动检测阶段，一次性执行 plan→update-doc |
| `/ra-spec` | Define | 项目初始化 — 生成 CLAUDE.md + 宪法 |
| `/ra-plan` | Plan | 需求分析 + grill-me + 设计方案 |
| `/ra-build` | Build | TDD 增量实现（红绿重构） |
| `/ra-verify` | Verify | 自动化验证（测试+lint+构建） |
| `/ra-log` | Observe | 可观测性检查与补充 |
| `/ra-request-review` | Review | 多角度代码审查（5-agent 并行） |
| `/ra-receive-review` | Review | 审查反馈处理与修复 |
| `/ra-update-doc` | Doc | 文档同步更新 |
| `/ra-ship` | Ship | 提交 + PR + 合并 |
| `/ra-evolve` | Evolve | Session 回顾+经验提取+进化建议 |

## 质量门禁

| 门禁 | 条件 |
|------|------|
| G1 | 新代码有对应测试，全部通过 |
| G2 | 100% 测试通过，0 lint，构建成功，风格规范已检查 |
| G3 | Critical 已修复，Important 已修复或记录，Optional 已记录 |
| G4 | commit 格式正确，PR 描述完整 |
| G5 | 经验已提取，session 可追溯 |

## 平台支持

| 平台 | 安装方式 | 斜杠命令 | 安装指南 |
|------|---------|:---:|------|
| Claude Code | `claude --plugin-dir .` | ✅ | [安装指南](docs/installation.md) |
| Gemini CLI | `gemini skills install` | ✅ | [Gemini 安装](docs/gemini-cli-setup.md) |
| Antigravity CLI | `agy plugin install` | ✅ | [快速开始](docs/getting-started.md#antigravity-cli-安装) |
| OpenCode | `opencode.json` plugin | ❌ (agent-driven) | [OpenCode 安装](docs/opencode-setup.md) |
| Codex | Git clone + symlink | ❌ (agent-driven) | [Codex 安装](docs/codex-setup.md) |
| Cursor | Copy to `.cursor/rules/` | ❌ (rules-based) | [Cursor 安装](docs/cursor-setup.md) |
| GitHub Copilot | Copy to `.github/agents/` | ❌ (agent-driven) | [Copilot 安装](docs/copilot-setup.md) |

## 快速开始

```bash
# 1. 安装（Claude Code）
git clone https://github.com/reliable-agent/reliable-agent.git
claude --plugin-dir /path/to/reliable-agent

# 2. 初始化项目
/ra-spec

# 3. 一键自动化（或按需使用下方各命令）
/ra-auto

# 4. 按需使用各阶段命令
/ra-plan           # 方案设计
/ra-build          # TDD 实现
/ra-verify         # 验证
/ra-request-review # 代码审查
/ra-ship           # 发布
/ra-evolve         # 回顾与进化
```

## 文件结构

```
skills/            → 12 个技能目录（1 元技能 + 1 自动化 + 10 工作流）
agents/            → 5 个可复用智能体角色定义
.claude/commands/  → 11 个斜杠命令（Claude Code，MD 格式）
.gemini/commands/  → 11 个斜杠命令（Gemini CLI，TOML 格式）
commands/          → 11 个斜杠命令（Antigravity CLI，TOML 格式）
.claude-plugin/    → Claude Code 插件清单 + Marketplace
.codex-plugin/     → Codex 插件清单
.cursor-plugin/    → Cursor 插件清单
hooks/             → SessionStart 生命周期钩子
templates/         → 5 个项目初始化模板
references/        → 8 个交叉引用检查清单（含严重度规范化映射）
codestyle/         → 17 个语言的代码规范源文件
docs/              → 用户文档（含 7 个平台安装指南）
.reliable-agent/   → 项目级配置（codestyle/、plans/、experiences.md）
```

## 许可证

MIT
