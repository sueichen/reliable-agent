---
name: ra-spec
description: "项目初始化——生成包含代码规范、commit 格式、测试策略、文档标准、可观测性要求、安全基线和性能基线的 CLAUDE.md 项目宪法。在新项目启动、新建仓库、或项目缺少 CLAUDE.md 时使用。"
version: "1.0.0"
license: MIT
---

# ra-spec — 项目规范初始化

**灵活技能**: 根据上下文调整原则。

## Overview

生成作为项目宪法的 CLAUDE.md。它定义了项目"怎么算好代码"、"怎么算完成"、"怎么算可靠"。此技能是项目初始化的第一步——所有下游技能依赖此技能产生的 CLAUDE.md。

**核心理念**: 没有宪法就没有标准。前 100 行代码在没有宪法的情况下写出来，就没有继承任何工程纪律。后期再建立标准是代价高昂的补救。

## When to Use

- 新项目启动
- 已有项目缺少 CLAUDE.md
- 需要更新过时的 CLAUDE.md
- 团队约定发生变化需要重新生成

**不适用**: 仅修改一两个配置项——直接编辑 CLAUDE.md。

## Core Process

```dot
digraph reliable_spec {
    rankdir=TB;
    node [shape=box, style=rounded];

    start [label="启动 /ra-spec", shape=doublecircle];
    check_existing [label="检查 CLAUDE.md\n是否存在？", shape=diamond];
    read_existing [label="读取已有\nCLAUDE.md"];
    explore [label="探索项目结构\n语言/框架/目录"];
    codestyle_check [label="代码规范检查\n已有规范？匹配指南？", shape=diamond];
    import_style [label="导入匹配的\n代码规范到\n.reliable-agent/codestyle/"];
    interview [label="访谈用户\n7 个维度"];
    generate [label="生成 CLAUDE.md\n7 部分草稿"];
    present [label="展示草稿\n人类审查"];
    approved [label="批准？", shape=diamond];
    save [label="保存 CLAUDE.md\n到项目根目录"];
    scaffold [label="新项目？\n搭建目录结构", shape=diamond];
    create_dirs [label="创建 src/\ntests/ docs/"];
    create_commands [label="创建 .claude/commands/\n11 个短命令文件"];
    done [label="完成", shape=doublecircle];

    start -> check_existing;
    check_existing -> read_existing [label="是（更新模式）"];
    check_existing -> explore [label="否（初始化模式）"];
    read_existing -> explore;
    explore -> codestyle_check;
    codestyle_check -> import_style [label="有可用指南"];
    codestyle_check -> interview [label="无匹配\n或已有规范"];
    import_style -> interview;
    interview -> generate;
    generate -> present;
    present -> approved;
    approved -> save [label="是"];
    approved -> generate [label="否（修改后重生成）"];
    save -> scaffold;
    scaffold -> create_dirs [label="是"];
    scaffold -> create_commands [label="是"];
    scaffold -> done [label="否（已有项目\n无需搭建）"];
    create_dirs -> create_commands;
    create_commands -> done;
}
```

### Step 1: 检查已有 CLAUDE.md（如存在）
- 读取已有文件了解当前约定
- 初始化模式 vs 更新模式
- 完成标准: 已确认当前项目规范状态

### Step 2: 探索项目结构
- 检测语言（package.json, tsconfig, go.mod 等）
- 检测框架（React, Express, FastAPI 等）
- 检测已有配置文件（.eslintrc, .prettierrc 等）
- 检测目录布局
- 完成标准: 已列出项目技术栈和现有约定来源

### Step 2a: 代码规范检查与导入
- 检查 `.reliable-agent/codestyle/` 是否已存在
  - 如已存在且有内容 → 提示"项目已有代码规范，是否补充？"→ 进入 Step 3
- 根据 Step 2 检测到的语言，匹配 `codestyle/`（插件内置）中的规范文件
  - 参考 `codestyle/README.md` 的语言→文件映射表
- 列出匹配结果：
  - 有匹配指南的语言 → 推荐导入
  - 无匹配指南的语言 → 提示"无 [语言] 的 Google 规范，可自行提供或跳过"
- 等待用户选择要导入的语言规范
- 将选中的规范文件复制到 `.reliable-agent/codestyle/`
- 完成标准: 代码规范已导入（或用户明确选择跳过）

### Step 3: 访谈用户 — 7 个维度
一次一个问题，等待反馈：
1. 项目目标和约束
2. 技术栈偏好
3. 团队代码风格约定
4. 测试偏好（框架、覆盖率阈值）
5. 安全需求
6. 性能目标
7. Commit 格式偏好
- 完成标准: 所有 7 个维度有明确答案

### Step 4: 生成 CLAUDE.md
使用 `templates/CLAUDE.md.template` 生成草稿，覆盖：
- Commands（构建/测试/lint/类型检查命令）
- Project Structure
- Code Style（含具体代码示例）
- Testing Strategy（框架+覆盖率阈值+测试层级）
- Boundaries（Always/Ask First/Never）
- Security Baseline（OWASP+密钥管理+依赖审计）
- Performance Baseline（响应时间+内存+模式约束）
- Commit Format（类型+范围+格式示例）
- 完成标准: 7 部分全部填充具体内容

### Step 5: 人类审查
- 展示完整草稿
- 接受修改反馈
- 如果拒绝：循环回到 Step 3 或 4
- 完成标准: 人类明确说"可以"或"批准"

### Step 6: 保存
- 写入项目根目录 CLAUDE.md
- 完成标准: 文件已保存

### Step 7: 搭建 `.reliable-agent/` 和 `.claude/commands/`

#### 7a: `.reliable-agent/` 目录结构
- 创建 `.reliable-agent/plans/` 目录
- 创建 `.reliable-agent/adrs/` 目录
- 创建 `.reliable-agent/codestyle/` 目录（如已导入规范）
- 初始化空的 `.reliable-agent/experiences.md`
- 完成标准: `.reliable-agent/` 目录结构就位

#### 7b: `.claude/commands/` 短命令别名（Claude Code 平台）
- 创建 `.claude/commands/` 目录
- 为 11 个工作流技能各创建一个命令文件：

| 文件名 | 技能 |
|--------|------|
| `ra-spec.md` | reliable-agent:ra-spec |
| `ra-plan.md` | reliable-agent:ra-plan |
| `ra-auto.md` | reliable-agent:ra-auto |
| `ra-build.md` | reliable-agent:ra-build |
| `ra-verify.md` | reliable-agent:ra-verify |
| `ra-log.md` | reliable-agent:ra-log |
| `ra-request-review.md` | reliable-agent:ra-request-review |
| `ra-receive-review.md` | reliable-agent:ra-receive-review |
| `ra-update-doc.md` | reliable-agent:ra-update-doc |
| `ra-ship.md` | reliable-agent:ra-ship |
| `ra-evolve.md` | reliable-agent:ra-evolve |

- 每个文件格式（与插件 `.claude/commands/` 一致）：

```markdown
---
description: <技能简短描述>
---
Invoke the reliable-agent:<skill-name> skill.

<技能工作流简述>
```

- **幂等规则**：
  - 新项目初始化模式：创建全部 11 个文件
  - 已有 CLAUDE.md 的更新模式：检查 `.claude/commands/`，缺失则补全，已存在则覆盖（保持与插件版本同步）
  - 文件内容的 description 和简述从插件的 `.claude/commands/` 对应文件中读取
- 完成标准: `.claude/commands/` 包含 11 个命令文件，每个格式正确

<HARD-GATE>
在 CLAUDE.md 被保存之前，不要开始任何实现工作。在人类批准之前，不要保存 CLAUDE.md。
在不经过用户访谈的情况下，不要臆测项目需求。
</HARD-GATE>

## Common Rationalizations

| 借口 | 现实 |
|------|------|
| "稍后可以添加 CLAUDE.md" | 前 100 行不受约束的代码没有任何标准。后期添加意味着回溯改造。 |
| "我们团队不需要正式规范" | 规范不是为简单情况准备的——而是为模糊性导致冲突的困难情况准备的。 |
| "简单 README 足够了" | README 记录"是什么"。CLAUDE.md 管治"如何构建"。不同的目的。 |
| "我已经知道项目规范了" | 规范需要被写下来才能被 AI 代理一致地遵守。大脑里的规范不存在。 |
| "技术栈很标准，用默认值就行" | 每个项目都有独特的边界决定。默认值只存在于你的想象中。 |

## Red Flags

- 跳过用户访谈直接生成
- 「这个我帮用户填了」——臆测项目需求
- 生成只有占位符的模板内容
- 省略某些部分（尤其是安全和性能基线）
- CLAUDE.md 未保存就开始写代码

## Verification

- [ ] 代码规范已检查并根据用户选择导入（Step 2a）
- [ ] CLAUDE.md 覆盖全部 7 个必需部分
- [ ] 每个部分包含具体、可执行的内容（非泛泛建议）
- [ ] Commands 部分列出实际可执行命令含参数
- [ ] Boundaries 部分有具体的 Always/Ask First/Never 条目
- [ ] Commit 格式模板存在且可匹配
- [ ] `.claude/commands/` 已创建 11 个短命令文件（Step 7b，Claude Code 平台）
- [ ] `.reliable-agent/` 目录结构完整（plans/、adrs/、codestyle/、experiences.md）
- [ ] 人类审查并批准了完整的 CLAUDE.md

## 下一步指引

**推荐路径** → `/ra-plan` — 项目规范已就绪，开始规划首个功能的设计方案

**其他选项**:
- `/ra-spec` — 继续完善或修改项目规范（如 CLAUDE.md 需调整）
