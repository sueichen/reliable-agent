# Reliable-Agent

可靠工程工作流技能集 — 12 个阶段门控工作流（含 1 个全自动模式），覆盖从规范到回顾的完整可靠工程循环。

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
| `/reliable-evolve` | Evolve | 经验分析 → 进化建议 |
| `/reliable-update-doc` | Doc | 文档同步更新 |
| `/reliable-ship` | Ship | 提交 + PR + 合并 |
| `/reliable-session-retro` | Retro | Session 回顾 + 经验提取 |

## 质量门禁

| 门禁 | 条件 |
|------|------|
| G1 | 新代码有测试，全部通过 |
| G2 | 100% 测试通过，0 lint，构建成功 |
| G3 | Critical 修复，Optional 记录 |
| G4 | commit 格式正确，PR 完整 |
| G5 | 经验已提取，session 可追溯 |

## 安装

```bash
# 通过 Claude Code 插件市场
claude plugins install reliable-agent

# 或本地开发安装
git clone https://github.com/reliable-agent/reliable-agent.git
claude plugins install /path/to/reliable-agent
```

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

# 回顾与经验提取
/reliable-session-retro

# 周期性进化（积累经验后）
/reliable-evolve
```

## 文件结构

```
skills/         → 13 个技能（1 元技能 + 1 自动化 + 11 工作流）
agents/         → 5 个 agent 角色定义
templates/      → 5 个项目模板
references/     → 7 个交叉引用检查清单
hooks/          → SessionStart 生命周期钩子
docs/           → 用户文档
```

## 许可证

MIT
