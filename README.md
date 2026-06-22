# Reliable-Agent

可靠工程工作流技能集 — 11 个阶段门控工作流（含 1 个全自动模式），覆盖从规范到回顾的完整可靠工程循环。

## 核心理念

- **人类审查是通用闸门** — 所有改变行为的修改必须经人类批准
- **质量门禁制** — 阶段间有明确通过条件，不满足则拒绝前进
- **TDD 优先** — 测试先于代码，测试多于代码，测试通过是审查前置条件
- **完整可观测性** — log/trace/metrics 随代码一起交付
- **Session 可追溯** — 每轮 session 成果和教训持久化

## 技能列表

| 命令 | 阶段 | 功能 |
|------|------|------|
| `/reliable-auto` | Auto | 自动检测阶段，一次性执行 plan→update-doc |
| `/reliable-spec` | Define | 项目初始化 — 生成 CLAUDE.md + 宪法 |
| `/reliable-plan` | Plan | 需求分析 + grill-me + 设计方案 |
| `/reliable-build` | Build | TDD 增量实现（红绿重构） |
| `/reliable-verify` | Verify | 自动化验证（测试+lint+构建） |
| `/reliable-log` | Observe | 可观测性检查与补充 |
| `/reliable-request-review` | Review | 多角度代码审查（5-agent 并行） |
| `/reliable-receive-review` | Review | 审查反馈处理与修复 |
| `/reliable-update-doc` | Doc | 文档同步更新 |
| `/reliable-ship` | Ship | 提交 + PR + 合并 |
| `/reliable-evolve` | Evolve | Session 回顾+经验提取+进化建议 |

## 质量门禁

| 门禁 | 条件 |
|------|------|
| G1 | 新代码有对应测试，全部通过 |
| G2 | 100% 测试通过，0 lint，构建成功，风格规范已检查 |
| G3 | Critical 已修复，Important 已修复或记录，Optional 已记录 |
| G4 | commit 格式正确，PR 描述完整 |
| G5 | 经验已提取，session 可追溯 |

## 安装

### 官方 Marketplace（推荐）

> 如插件尚未发布到官方市场，请使用下方的本地安装方式。

```bash
claude plugin install reliable-agent
```

或在 Claude Code 交互模式中：`/plugin install reliable-agent`

### 本地开发安装

```bash
# 克隆仓库
git clone https://github.com/reliable-agent/reliable-agent.git
cd reliable-agent

# 启动时加载插件（仅当前 session 有效，关闭后需重新指定）
claude --plugin-dir .
```

> `--plugin-dir` 仅在当前 session 生效。如需持久化安装，在 Claude Code 交互模式中执行：
>
> ```
> /plugin marketplace add ./
> /plugin install reliable-agent
> ```

## 快速开始

```bash
# 初始化项目
/reliable-spec

# 或一键自动化全流程（检测阶段并自动执行）
/reliable-auto

# 规划功能
/reliable-plan

# TDD 实现
/reliable-build

# 验证
/reliable-verify

# 可观测性检查
/reliable-log

# 代码审查
/reliable-request-review

# 处理审查反馈
/reliable-receive-review

# 更新文档
/reliable-update-doc

# 发布
/reliable-ship

# Session 回顾与进化（经验提取+进化建议）
/reliable-evolve
```

## 文件结构

```
skills/         → 12 个技能（1 元技能 + 1 自动化 + 10 工作流）
agents/         → 5 个 agent 角色定义
templates/      → 5 个项目模板
references/     → 8 个交叉引用检查清单（含严重度规范化映射）
codestyle/      → 17 个语言的代码规范源文件
hooks/          → SessionStart 生命周期钩子
docs/           → 用户文档
.reliable-agent/ → 项目级配置（codestyle/、plans/、experiences.md）
```

## 许可证

MIT
