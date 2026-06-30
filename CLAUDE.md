# reliable-agent — 项目宪法

> 可靠工程工作流技能集 — 14 个技能，覆盖从规范到回顾的完整可靠工程循环。
>
> 本文件是项目宪法（规则+约束+边界），所有贡献者和 AI 智能体必须遵守。由 `/ra-spec` 生成，`/ra-evolve` 建议更新，人类审批后生效。非规则类内容（教程、示例、操作配置）不在此文件中。

---

## 目录

1. [核心使命](#1-核心使命)
2. [技术约束](#2-技术约束)
3. [结构与约定](#3-结构与约定)
4. [代码规范](#4-代码规范)
5. [测试策略](#5-测试策略)
6. [安全基线](#6-安全基线)
7. [性能基线](#7-性能基线)
8. [可观测性要求](#8-可观测性要求)
9. [Commit 格式](#9-commit-格式)
10. [质量门禁](#10-质量门禁)
11. [边界与红线](#11-边界与红线)

---

## 1. 核心使命

为 Claude Code 提供可靠工程工作流技能集，通过阶段门控和自动化质量门禁确保代码变更的纪律性、可追溯性和持续改进。

---

## 2. 技术约束

| 约束 | 要求 |
|------|------|
| Bash | 5.0+ |
| Node.js | 18+ |
| 版本控制 | Git |
| 技能定义 | Markdown + YAML frontmatter |
| 配置格式 | JSON |

---

## 3. 结构与约定

### 3.1 技能文件约定

- 每个技能在 `skills/<name>/SKILL.md`；YAML frontmatter 含 `name`、`description`、`version`、`license`
- `description` 只写触发条件，不写流程细节（防止 AI 从 description 中编造响应）
- 每个技能包含：Overview、When to Use、Core Process（含 DOT 图）、Common Rationalizations、Red Flags、Verification、下一步指引
- DOT digraph 是权威流程定义，文字为辅助；`<HARD-GATE>` XML 块标记不可违反的规则
- 共享引用在 `references/` 中；辅助文件仅在内容超过 100 行时创建

### 3.2 智能体角色约定

- 角色在 `agents/` 目录中，Persona + Operations 双层架构
- 角色不得调用其他角色（**角色隔离铁律**）
- 角色包含硬性规则（Critical Rules）和量化成功指标

### 3.3 技能类型

- **刚性技能**（严格遵循，不可偏离）：ra-build、ra-verify、ra-log、ra-perf、ra-debug、ra-request-review、ra-receive-review、ra-ship
- **灵活技能**（根据上下文调整原则，不可跳过）：ra-spec、ra-plan、ra-update-doc、ra-evolve、ra-auto、using-reliable-agent

### 3.4 经验管理

- `.reliable-agent/experiences.md` — 集中式经验文件（跨技能模式），所有技能必读
- `.reliable-agent/<skill>/experiences.md` — 技能专属经验，该技能必读
- 经验写入必须遵守精简三原则（详见 `skills/ra-evolve/evolution-rules.md`）
- 硬上限 800 行，水位线 600 行；超水位触发凝练
- 经验记录由 ra-evolve 提取和写入，各 skill 自行加载

### 3.5 进化与审批

- 所有行为变更需人类审批后才应用
- 进化建议分为两类：CLAUDE.md 规则变更（Type A）、规格修订（Type C）
- 绝不对 SKILL.md 文件进行直接修改——技能行为改进由各技能从专属经验文件自行加载

---

## 4. 代码规范

本项目遵循 [Google Style Guide](https://google.github.io/styleguide/) 提炼版规范。规范文件位于 `.reliable-agent/codestyle/`，由 `style-auditor` 强制执行。

违反 `.reliable-agent/codestyle/` 中声明的规则将被 `style-auditor` 标记为 **Important**，阻塞合并。未在规范文件中声明的风格偏好降级为 `code-reviewer` 的 Suggestion 级别。

---

## 5. 测试策略

### 5.1 测试层次

| 层次 | 门禁要求 |
|------|---------|
| 技能结构验证（`scripts/validate-skills.js`） | 0 错误 |
| 技能 Verification 步骤（按技能定义执行） | 必须存在且可通过 |
| Shell 静态分析（ShellCheck） | 0 错误 |
| JS 语法检查（`node --check`） | 0 错误 |

### 5.2 测试要求

1. **技能即规格**：技能的 Verification 部分是强制性检查清单，不可跳过
2. **验证先于信任**：每个变更在合并前必须通过所有自动化验证
3. 新增技能必须包含可执行的 Verification 步骤
4. 修改技能流程后必须更新对应 Verification
5. 新增脚本必须通过 ShellCheck 或 `node --check`

---

## 6. 安全基线

### 6.1 代码安全

| 要求 | 适用对象 | 门禁 |
|------|---------|------|
| 无硬编码凭据 | 所有文件 | Critical |
| Shell 脚本禁止 `eval` | `.sh` 文件 | Critical |
| 命令注入防护（变量加引号） | `.sh` 文件 | Critical |
| 无动态代码执行 | `.js` 文件 | Critical |
| 文件操作使用安全路径 | 所有脚本 | Important |

### 6.2 数据传输

- 内部引用使用相对路径，无外部网络依赖
- 技能文件完整性由 Git 保证
- 文档中所有外部链接使用 HTTPS

### 6.3 插件安全

- 插件清单不包含可执行路径
- hooks 脚本不请求提权
- 技能不执行未经人类审批的系统级操作

### 6.4 安全审查

`security-auditor` 在每次代码审查中自动检查以上所有项。Critical 级别发现阻塞合并。

---

## 7. 性能基线

### 7.1 文件大小硬限制

| 文件 | 硬上限 | 水位线 |
|------|--------|--------|
| CLAUDE.md | 500 行 | — |
| 技能 SKILL.md | 500 行 | — |
| `.reliable-agent/experiences.md` | 800 行 | 600 行 |
| `.reliable-agent/<skill>/experiences.md` | 800 行 | 600 行 |
| 模板文件 | 200 行 | — |
| 引用文件 | 300 行 | — |

### 7.2 上下文窗口效率

| 指标 | 目标 |
|------|------|
| SessionStart hook 注入量 | ≤ 3KB |
| DOT 图复杂度 | ≤ 15 节点 |

### 7.3 性能反模式

- 技能文件超过 500 行必须拆分辅助文件
- 共享内容在 `references/` 中，通过交叉引用避免重复
- 技能中的循环必须有明确的终止条件

---

## 8. 可观测性要求

### 8.1 技能执行可追溯

每个技能执行后必须产生可审计的产物（plan 文件、审查报告、经验记录）。

### 8.2 质量门禁审计

| 门禁 | 记录内容 |
|------|---------|
| build→verify | 测试通过/失败数、覆盖率变化 |
| verify→review | lint 结果、构建状态 |
| review→ship | Critical/Important/Optional 计数和处理状态 |
| ship→evolve | commit SHA、PR 链接 |

### 8.3 经验记录

- 双层结构：`.reliable-agent/experiences.md`（集中式） + `.reliable-agent/<skill>/experiences.md`（技能专属）
- 每条经验包含：时间戳、触发阶段、类别、上下文、症状、根因、解决方案、预防

---

## 9. Commit 格式

### 9.1 格式规范

```text
[type]([scope]): [简洁描述]

[可选的详细描述 — 为什么，不是什么]

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

### 9.2 类型

| 类型 | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构（行为不变） |
| `test` | 添加或修改测试 |
| `docs` | 文档变更 |
| `chore` | 构建/工具/依赖变更 |
| `perf` | 性能改进 |
| `security` | 安全相关变更 |
| `revert` | 回滚之前的提交 |

### 9.3 规则

1. 描述用祈使语气，小写开头（"add" 而非 "Added" 或 "adding"）
2. 描述简洁（建议 72 字符以内）
3. 正文解释**为什么**以及**怎么做的**，而非重复描述说了什么
4. 一个提交一个关注点（原子提交）
5. 不超过 ~100 行变更（超过 1000 行必须拆分）

---

## 10. 质量门禁

| 门禁 | 阶段转换 | 条件 | 阻塞？ |
|------|---------|------|--------|
| G1 | build→verify | 新代码有对应测试，全部通过 | 是 |
| G2 | verify→review | 100% 测试通过，0 lint 错误，构建成功，0 compiler warnings（项目代码），风格规范已检查 | 是 |
| G3 | review→ship | 所有 Critical 已修复，Important 已修复或记录，Optional 已记录 | 是 |
| G4 | ship→evolve | commit 格式符合规范，PR 描述完整 | 是 |
| G5 | evolve 结束 | 经验已提取，session 可追溯 | 是 |

> ra-verify 的编译器警告配置和编译器严格模式 flag 详见 [`references/ra-verify-config.md`](references/ra-verify-config.md)。

---

## 11. 边界与红线

### 11.1 Always

- 遵循本文件中定义的标准结构
- 新技能包含 DOT 图（权威流程定义）
- Description 只写触发条件
- 使用 `references/` 中的共享引用
- 对所有技能执行 Verification 步骤
- 人类审批所有行为变更
- 写入经验前执行去重和水位线检查

### 11.2 Never

- 添加模糊建议而非可执行流程的技能
- 在技能之间重复内容——改用交叉引用（`references/`）
- 自动应用进化建议——所有行为变更需人类审批
- 直接修改 SKILL.md 文件——技能行为改进由各技能从专属经验文件自行加载
- 删除你不理解的注释
- "清理"与任务无关的代码
- 作为附带效果重构相邻系统
- 添加不在规格中的功能因为"它们看起来有用"
- 角色调用其他角色（违反角色隔离铁律）
- CLAUDE.md 超过 500 行不精简
- 经验文件超过 800 行不凝练

### 11.3 红线思想

这些想法意味着停下——你在合理化：

| 想法 | 现实 |
|------|------|
| "这只是一个简单的技能修改" | 技能修改影响所有用户。完整走 spec→plan→build→verify→review 流程。 |
| "让我先做这一件事" | 在任何操作之前先检查技能发现流程。 |
| "这不需要正式的技能" | 如果技能存在，就使用它。 |
| "我记得这个技能" | 技能会迭代更新。阅读当前版本。 |
| "太简单了不需要规范" | 简单恰恰是未检验假设造成最大浪费的地方。 |
| "审查可以等，先发布" | 发布后修复比发布前修复贵 10 倍。 |
| "可观测性对这么小的技能是过度设计" | 你无法诊断的 bug 总是在没有遥测的技能上。 |
| "这条经验跟已有的差不多" | 说明是重复模式，更新已有条目，不跳过。 |
| "经验文件快满了跳过这次" | 超水位线正是凝练时机。越积越难处理。 |

---

> 最后更新：2026-06-29
> 由 ra-spec 生成，ra-plan 精简（491→本行），所有非宪法内容已删除或迁移至 references/。
