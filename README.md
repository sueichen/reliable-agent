# Reliable-Agent

可靠工程工作流技能集 — 11 个阶段门控工作流，覆盖从规范到回顾的完整可靠工程循环。

## 核心理念

- **人类审查是通用闸门** — 所有改变行为的修改必须经人类批准
- **质量门禁制** — 阶段间有明确通过条件，不满足则拒绝前进
- **TDD 优先** — 测试先于代码，测试多于代码，测试通过是审查前置条件
- **完整可观测性** — log/trace/metrics 随代码一起交付
- **Session 可追溯** — 每轮 session 成果和教训持久化

## 技能列表

| 命令 | 阶段 | 功能 |
|------|------|------|
| `/spec-reliable` | Define | 项目初始化 — 生成 CLAUDE.md + 宪法 |
| `/plan-reliable` | Plan | 需求分析 + grill-me + 设计方案 |
| `/build-reliable` | Build | TDD 增量实现（红绿重构） |
| `/verify-reliable` | Verify | 自动化验证（测试+lint+构建） |
| `/log-reliable` | Observe | 可观测性检查与补充 |
| `/request-review-reliable` | Review | 多角度代码审查（4-agent 并行） |
| `/receive-review-reliable` | Review | 审查反馈处理与修复 |
| `/evolve-reliable` | Evolve | 经验分析 → 进化建议 |
| `/update-doc-reliable` | Doc | 文档同步更新 |
| `/ship-reliable` | Ship | 提交 + PR + 合并 |
| `/session-retro` | Retro | Session 回顾 + 经验提取 |

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
/spec-reliable

# 规划功能
/plan-reliable

# TDD 实现
/build-reliable

# 验证
/verify-reliable

# 可观测性检查
/log-reliable

# 代码审查
/request-review-reliable

# 处理审查反馈
/receive-review-reliable

# 更新文档
/update-doc-reliable

# 发布
/ship-reliable

# 回顾与经验提取
/session-retro

# 周期性进化（积累经验后）
/evolve-reliable
```

## 文件结构

```
skills/         → 12 个技能（1 元技能 + 11 工作流）
agents/         → 4 个 agent 角色定义
templates/      → 5 个项目模板
references/     → 7 个交叉引用检查清单
hooks/          → SessionStart 生命周期钩子
docs/           → 用户文档
```

## 许可证

MIT
