# reliable-agent — 项目宪法

> 可靠工程工作流技能集 — 12 个技能（1 元技能 + 1 自动化 + 10 工作流），覆盖从规范到回顾的完整可靠工程循环。
>
> 本文件是项目宪法，所有贡献者和 AI 智能体必须遵守。由 `/ra-spec` 生成，`/ra-evolve` 建议更新，人类审批后生效。

---

## 目录

1. [项目目标](#1-项目目标)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [技能组织](#4-技能组织)
5. [团队约定](#5-团队约定)
6. [代码规范](#6-代码规范)
7. [测试策略](#7-测试策略)
8. [安全基线](#8-安全基线)
9. [性能基线](#9-性能基线)
10. [可观测性要求](#10-可观测性要求)
11. [Commit 格式](#11-commit-格式)
12. [质量门禁](#12-质量门禁)
13. [边界与红线](#13-边界与红线)
14. [下一步指引](#14-下一步指引)

---

## 1. 项目目标

### 1.1 核心使命

为 Claude Code 提供一套**可靠工程工作流技能集**，通过阶段门控和自动化质量门禁确保代码变更的纪律性、可追溯性和持续改进。

### 1.2 关键能力

- **12 个技能**：spec → plan → build → verify → log → review（request + receive）→ doc → ship → evolve 共 10 个工作流技能，外加元技能 `using-reliable-agent` 和自动化技能 `ra-auto`
- **5 个可复用审查智能体**：code-reviewer、security-auditor、test-engineer、performance-auditor、style-auditor
- **生命周期钩子**：SessionStart 自动注入元技能，确保行为准则在每次会话中生效
- **经验驱动的进化**：Session 回顾 → 结构化经验提取 → 聚类分析 → 人类审批的进化建议

### 1.3 目标用户

使用 Claude Code 进行软件开发的工程师，要求：
- 遵循 TDD 和增量交付
- 接受自动化质量门禁
- 参与经验驱动的流程改进

---

## 2. 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| 技能定义 | Markdown + YAML frontmatter | 所有技能和智能体定义 |
| 自动化脚本 | Shell（bash 5+） | 生命周期钩子、管理脚本 |
| 验证工具 | Node.js/JavaScript（ES Module） | 技能结构校验 |
| 配置格式 | JSON | 插件清单、hooks 配置 |
| 版本控制 | Git | 代码管理 |

### 2.1 语言运行时要求

| 语言 | 最低版本 | 用途 |
|------|---------|------|
| Bash | 5.0+ | hooks 脚本 |
| Node.js | 18+ | 验证脚本 |
| Markdown | — | 全部技能和文档 |

---

## 3. 项目结构

```text
skills/         → 12 个技能目录（1 元技能 + 1 自动化 + 10 工作流技能）
agents/         → 5 个可复用的智能体角色定义
hooks/          → SessionStart 生命周期钩子
.claude/commands/ → 11 个斜杠命令（用户入口点）
templates/      → 5 个项目初始化模板
references/     → 7 个交叉引用检查清单
docs/           → 用户文档
scripts/        → 验证和管理脚本
codestyle/      → 17 个语言的代码规范源文件（Google Style Guide 提炼版）
.reliable-agent/ → 本地化配置文件（codestyle/、experiences.md）
```

---

## 4. 技能组织

| 阶段 | 技能 | 类型 | 简要说明 |
|------|------|------|---------|
| Bootstrap | using-reliable-agent | 元技能 | SessionStart 注入，技能发现，6 条核心行为准则 |
| Auto | ra-auto | 灵活 | 检测阶段并自动执行 plan→update-doc（含 review-fix-verify 循环） |
| Define | ra-spec | 灵活 | 项目初始化——生成 CLAUDE.md + 宪法 |
| Plan | ra-plan | 灵活 | 需求分析 + grill-me + 设计方案 |
| Build | ra-build | 刚性 | TDD 增量实现——红绿重构循环 |
| Verify | ra-verify | 刚性 | 自动化验证——测试+lint+构建+类型检查 |
| Observe | ra-log | 刚性 | 可观测性检查——日志+指标+追踪+告警 |
| Review | ra-request-review | 刚性 | 多角度代码审查——5-agent 并行扇出 |
| Review | ra-receive-review | 刚性 | 审查反馈处理+修复，重新验证 |
| Doc | ra-update-doc | 灵活 | 文档同步更新 |
| Ship | ra-ship | 刚性 | 提交+PR+合并，含格式校验 |
| Evolve | ra-evolve | 灵活 | Session 回顾+经验提取+进化建议 |

### 4.1 技能类型说明

- **刚性技能**：严格遵循，不可偏离纪律。包括 build、verify、log、request-review、receive-review、ship
- **灵活技能**：根据上下文调整原则，但不可跳过。包括 spec、plan、update-doc、evolve

---

## 5. 团队约定

### 5.1 技能文件约定

- 每个技能在 `skills/<name>/SKILL.md` 中
- YAML frontmatter 包含 `name`、`description`、`version`、`license`
- `description` 只写触发条件，不写流程细节（防止 AI 从 description 中编造响应）
- 每个技能包含：Overview、When to Use、Core Process（含 DOT 图）、Common Rationalizations、Red Flags、Verification、下一步指引
- DOT digraph 是权威流程定义，文字为辅助
- `<HARD-GATE>` XML 块标记不可违反的规则
- 共享引用在 `references/` 中，不在技能目录内
- 辅助文件仅在内容超过 100 行时创建

### 5.2 智能体角色约定

- 角色在 `agents/` 目录中，YAML frontmatter 有 `name` 和 `description`
- Persona + Operations 双层架构（Identity 层 + Operation 层分离）
- 角色不得调用其他角色（**角色隔离铁律**）
- 角色可以调用 Skill 工具
- 角色包含硬性规则（Critical Rules）和量化成功指标

### 5.3 进化与审批

- 所有行为变更需人类审批后才应用
- 进化建议分为三类：CLAUDE.md 规则变更、技能行为变更、规格修订
- 经验记录写入 `reliable-agent/experiences.md`

---

## 6. 代码规范

本项目遵循 [Google Style Guide](https://google.github.io/styleguide/) 提炼版规范。规范文件位于 `.reliable-agent/codestyle/`，由 `style-auditor` 在代码审查阶段强制执行。

### 6.1 适用的代码规范

| 规范文件 | 适用对象 | 关键规则 |
|---------|---------|---------|
| [markdown.md](.reliable-agent/codestyle/markdown.md) | 所有 `.md` 文件（技能、文档、智能体） | 80 字符行宽、单 H1、层级不跳跃、围栏式代码块 |
| [shell.md](.reliable-agent/codestyle/shell.md) | 所有 `.sh` 脚本（hooks、管理脚本） | `set -euo pipefail`、双中括号、`$(...)` 命令替换、`local` 变量 |
| [javascript.md](.reliable-agent/codestyle/javascript.md) | 所有 `.js` 脚本（验证工具） | 命名导入/导出、分号必须、`const`/`let` 禁止 `var`、JSDoc 类型注解 |
| [json.md](.reliable-agent/codestyle/json.md) | 所有 `.json` 文件（配置） | lowerCamelCase 键名、2 空格缩进、禁止注释、禁止尾逗号 |

### 6.2 代码规范门禁

违反 `.reliable-agent/codestyle/` 中声明的规则将被 `style-auditor` 标记为 **Important**，阻塞合并。未在规范文件中声明的风格偏好降级为 `code-reviewer` 的 Suggestion 级别。

---

## 7. 测试策略

### 7.1 测试层次

| 层次 | 覆盖目标 | 工具 | 门禁要求 | 自动化？ |
|------|---------|------|---------|:---:|
| 技能结构验证 | 所有 SKILL.md 的 YAML frontmatter 完整性和格式 | `scripts/validate-skills.js` | 0 错误 | ✅ automated |
| 技能验证步骤 | 每个技能自带的 Verification 部分 | 按技能定义执行 | 必须存在且可通过 | 人工/AI 执行 |
| Shell 静态分析 | 所有 Shell 脚本 | ShellCheck（需单独安装） | 0 错误 | 待集成 CI |
| JS 语法检查 | 所有 JavaScript 脚本 | `node --check` | 0 错误 | 待集成 CI |

> **注意**：ShellCheck 和 `node --check` 是声明的质量要求，但当前依赖贡献者本地执行。CI 集成（参见 P1-7 plan）待添加自动化执行。

### 7.2 测试哲学

1. **技能即规格**：技能的 Verification 部分是强制性检查清单，不可跳过
2. **验证先于信任**：每个变更在合并前必须通过所有自动化验证
3. **防御性验证**：`validate-skills.js` 需手动执行（`node scripts/validate-skills.js`），CI 集成待 P1-7 plan 实现

### 7.3 测试编写要求

- 新增技能必须包含可执行的 Verification 步骤
- 修改技能流程后必须更新对应 Verification
- 新增脚本必须通过 ShellCheck 或 `node --check`

---

## 8. 安全基线

### 8.1 代码安全

| 要求 | 适用对象 | 门禁 |
|------|---------|------|
| 无硬编码凭据 | 所有文件 | Critical |
| Shell 脚本禁止 `eval` | `.sh` 文件 | Critical |
| 命令注入防护（变量加引号） | `.sh` 文件 | Critical |
| 无动态代码执行 | `.js` 文件 | Critical |
| 文件操作使用安全路径 | 所有脚本 | Important |

### 8.2 数据传输

| 要求 | 说明 |
|------|------|
| 内部引用使用相对路径 | 无外部网络依赖 |
| 技能文件完整性 | Git 版本控制保证完整性 |
| HTTPS 引用 | 文档中所有外部链接使用 HTTPS |

### 8.3 插件安全

- 插件清单（`.claude-plugin/plugin.json`）不包含可执行路径
- hooks 脚本运行在用户权限下，不请求提权
- 技能不执行未经人类审批的系统级操作

### 8.4 安全审查

- `security-auditor` 在每次代码审查中自动检查以上所有项
- Critical 级别安全发现阻塞合并

---

## 9. 性能基线

### 9.1 上下文窗口效率

| 指标 | 目标 | 说明 |
|------|------|------|
| 技能文件大小 | ≤ 500 行 | 超限时拆分辅助文件 |
| 模板文件大小 | ≤ 200 行 | 保持紧凑 |
| 引用文件大小 | ≤ 300 行 | 聚焦可执行检查清单 |
| DOT 图复杂度 | ≤ 15 节点 | 保持流程可理解 |

### 9.2 插件启动性能

| 指标 | 目标 |
|------|------|
| SessionStart hook 注入量 | ≤ 3KB 文本 |
| 元技能加载 | 单次 Skill 调用 |
| 斜杠命令注册 | 11 个命令，无动态加载 |

### 9.3 审查并发性能

- 5-agent 并行审查使用 `Workflow` 工具的原生并发
- 不自行实现并发控制
- 审查结果由主智能体合并，避免重复工作

### 9.4 性能反模式

| 反模式 | 说明 |
|--------|------|
| 技能文件过大 | 超过 500 行必须拆分辅助文件 |
| 重复加载 | 共享内容在 `references/` 中，通过交叉引用避免重复 |
| 无限制循环 | 技能中的循环必须有明确的终止条件 |
| 上下文污染 | 共享引用不在技能目录内，保持单一事实来源 |

---

## 10. 可观测性要求

### 10.1 技能执行可追溯

每个技能执行后应产生：
- **日志**：关键决策点和门禁结果
- **产物**：技能定义的输出文件（如 plan 文件、审查报告）

### 10.2 质量门禁可审计

| 门禁 | 记录内容 |
|------|---------|
| build→verify | 测试通过/失败数、覆盖率变化 |
| verify→review | lint 结果、构建状态 |
| review→ship | Critical/Important/Optional 计数和处理状态 |
| ship→evolve | commit SHA、PR 链接 |

### 10.3 经验记录

- `.reliable-agent/experiences.md` 记录所有结构化经验
- 每条经验包含：时间戳、触发阶段、错误模式、解决方案、相关文件

---

## 11. Commit 格式

### 11.1 格式规范

```text
[type]([scope]): [简洁描述]

[可选的详细描述 — 为什么，不是什么]

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

### 11.2 类型

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

### 11.3 规则

1. 描述用祈使语气，小写开头（"add" 而非 "Added" 或 "adding"）
2. 描述简洁（建议 72 字符以内）
3. 正文解释**为什么**以及**怎么做的**，而非重复描述说了什么
4. 一个提交一个关注点（原子提交）
5. 不超过 ~100 行变更（超过 1000 行必须拆分）

### 11.4 示例

```text
feat(skills): add ra-auto skill for automated workflow execution

Auto-detect current phase and chain through plan→build→verify→log→
review→doc without manual intervention. Stops before ship/evolve
for human approval.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## 12. 质量门禁

| 门禁 | 阶段转换 | 条件 | 阻塞？ |
|------|---------|------|--------|
| G1 | build→verify | 新代码有对应测试，全部通过 | 是 |
| G2 | verify→review | 100% 测试通过，0 lint 错误，构建成功，风格规范已检查 | 是 |
| G3 | review→ship | 所有 Critical 已修复，Important 已修复或记录，Optional 已记录 | 是 |
| G4 | ship→evolve | commit 格式符合规范，PR 描述完整 | 是 |
| G5 | evolve 结束 | 经验已提取，session 可追溯 | 是 |

---

## 13. 边界与红线

### 13.1 Always

- 遵循本文件中定义的标准结构
- 新技能包含 DOT 图（权威流程定义）
- Description 只写触发条件
- 使用 `references/` 中的共享引用
- 对所有技能执行 Verification 步骤
- 人类审批所有行为变更

### 13.2 Never

- 添加模糊建议而非可执行流程的技能
- 在技能之间重复内容——改用交叉引用（`references/`）
- 自动应用进化建议——所有行为变更需人类审批
- 删除你不理解的注释
- "清理"与任务无关的代码
- 作为附带效果重构相邻系统
- 添加不在规格中的功能因为"它们看起来有用"
- 角色调用其他角色（违反角色隔离铁律）

### 13.3 红线思想

这些想法意味着停下——你在合理化：

| 想法 | 现实 |
|------|------|
| "这只是一个简单的技能修改" | 技能修改影响所有用户。完整走 spec→plan→build→verify→review 流程 |
| "让我先做这一件事" | 在任何操作之前先检查技能发现流程 |
| "这不需要正式的技能" | 如果技能存在，就使用它 |
| "我记得这个技能" | 技能会迭代更新。阅读当前版本 |
| "太简单了不需要规范" | 简单恰恰是未检验假设造成最大浪费的地方 |
| "审查可以等，先发布" | 发布后修复比发布前修复贵 10 倍 |
| "可观测性对这么小的技能是过度设计" | 你无法诊断的 bug 总是在没有遥测的技能上 |

---

## 14. 下一步指引

### 14.1 完整生命周期序列

对于完整的功能开发，典型技能序列如下：

```text
 1. ra-spec            → 生成/更新 CLAUDE.md + 项目宪法 + 导入代码规范
 2. ra-plan            → 需求分析 + grill-me + 设计方案
 3. ra-build           → TDD 增量实现（含风格合规）
 4. ra-verify          → 自动化验证（测试+lint+风格检查+构建）
 5. ra-log             → 可观测性检查/补充
 6. ra-request-review  → 多角度代码审查（5-agent 并行）
 7. ra-receive-review  → 审查反馈处理+修复
 8. ra-update-doc      → 文档同步更新
 9. ra-ship            → 提交+PR+合并（含风格合规扫描）
10. ra-evolve          → Session 回顾+经验提取+进化建议
```

### 14.2 常用快捷路径

| 场景 | 推荐序列 |
|------|---------|
| 新功能 | spec → plan → build → verify → log → review → doc → ship → evolve |
| Bug 修复 | plan → build → verify → log → review → ship → evolve |
| 纯文档 | build → verify → ship → evolve |
| 一键自动化 | ra-auto（自动执行 plan→update-doc，在 ship 前停止） |
| 安全修补 | plan → build → verify → request-review（强制 security-auditor）→ ship |

### 14.3 会话上下文管理

1. **开始任何实现工作前先读本文件** — 它定义了项目的宪法、代码标准和边界
2. **在调试、审查、或修改有记录经验区域的代码前读 `.reliable-agent/experiences.md`**
3. **关键阶段保持在同一未中断的 context window** — spec→plan→build 三个阶段在同一上下文中完成
4. **每个 ra-build 任务从干净上下文启动** — 从 plan 中获取当前任务，避免上下文污染

---

> 最后更新：2026-06-22
> 由 ra-spec 生成，基于项目现有约定和 7 维度访谈确认。
