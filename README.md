# Reliable-Agent

可靠工程工作流技能集 — 14 个阶段门控工作流，覆盖从规范到回顾的完整可靠工程循环。支持 **Claude Code、Gemini CLI、Antigravity CLI、OpenCode、Codex、Cursor、GitHub Copilot** 等 7 个平台。

## 核心理念

- **人类审查是通用闸门** — 所有改变行为的修改必须经人类批准
- **质量门禁制** — 阶段间有明确通过条件，不满足则拒绝前进
- **TDD 优先** — 测试先于代码，测试多于代码，测试通过是审查前置条件
- **完整可观测性** — log/trace/metrics 随代码一起交付
- **Session 可追溯** — 每轮 session 成果和教训持久化
- **多平台支持** — 一次安装，多平台可用

## 技能列表

| 技能 | 阶段 | 功能 |
|------|------|------|
| `ra-auto` | Auto | 自动检测阶段，一次性执行 plan→update-doc |
| `ra-spec` | Define | 项目初始化 — 生成 CLAUDE.md + 宪法 |
| `ra-plan` | Plan | 需求分析 + grill-me + 设计方案 |
| `ra-build` | Build | TDD 增量实现（红绿重构） |
| `ra-verify` | Verify | 自动化验证（测试+lint+构建） |
| `ra-log` | Observe | 可观测性检查与补充 |
| `ra-request-review` | Review | 多角度代码审查（5-agent 并行） |
| `ra-receive-review` | Review | 审查反馈处理与修复 |
| `ra-update-doc` | Doc | 文档同步更新 |
| `ra-perf` | Perf | 数据驱动性能优化 — 五维遍历+TMA+技法匹配 |
| `ra-debug` | Debug | 结构化根因排查 — crash/死锁/内存泄漏/竞态等系统级诊断 |
| `ra-ship` | Ship | 提交 + PR + 合并 |
| `ra-evolve` | Evolve | Session 回顾+经验提取+进化建议 |

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

# 2. 使用技能（通过斜杠命令或 Skill 工具调用）
#     对 AI 说："使用 ra-spec 初始化项目宪法"
#     对 AI 说："使用 ra-plan 设计实现方案"
#     对 AI 说："使用 ra-build 开始 TDD 实现"
#     对 AI 说："使用 ra-auto 一键自动化"
```

详细用法参见 [用户文档](docs/getting-started.md)。

## 文件结构

```
skills/            → 14 个技能目录（1 元技能 + 1 自动化 + 12 工作流）
agents/            → 5 个可复用智能体角色定义
.gemini/commands/  → 13 个斜杠命令（Gemini CLI，TOML 格式）
commands/          → 13 个斜杠命令（Antigravity CLI，TOML 格式）
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
