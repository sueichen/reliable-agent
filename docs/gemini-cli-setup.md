# 在 Gemini CLI 中使用 Reliable Agent 可靠工程技能

## 安装

### 方式一：安装为 Skills（推荐）

Gemini CLI 拥有原生 skills 系统，可自动发现 `.gemini/skills/` 或 `.agents/skills/` 目录中的 `SKILL.md` 文件。

**从仓库安装：**

```bash
gemini skills install https://github.com/reliable-agent/reliable-agent.git --path skills
```

**或从本地克隆安装：**

```bash
git clone https://github.com/reliable-agent/reliable-agent.git
gemini skills install /path/to/reliable-agent/skills/
```

**仅为特定工作区安装：**

```bash
gemini skills install /path/to/reliable-agent/skills/ --scope workspace
```

工作区级别的 skills 安装到 `.gemini/skills/`（或 `.agents/skills/`）。用户级别的 skills 安装到 `~/.gemini/skills/`。

安装后，使用以下命令验证：

```
/skills list
```

Gemini CLI 自动将 skill 名称和描述注入提示。当识别到匹配任务时，会请求加载 skill 的完整指令，你批准即可激活。

### 方式二：GEMINI.md（持久上下文）

对于想要始终加载的技能，将其添加到项目的 `GEMINI.md` 中：

```markdown
# Project Instructions

@skills/ra-build/SKILL.md
@skills/ra-request-review/SKILL.md
```

> **Skills vs GEMINI.md:** Skills 按需激活，仅在相关时触发，保持上下文窗口清洁。GEMINI.md 提供持久上下文，每次 prompt 都加载。对阶段特定工作流使用 skills，对始终在线的项目约定使用 GEMINI.md。

## 推荐配置

### 始终加载（GEMINI.md）

- `ra-build` — TDD 增量实现
- `ra-request-review` — 多角度代码审查

### 按需（Skills）

- `ra-spec` — 初始化项目时激活
- `ra-plan` — 规划功能时激活
- `ra-verify` — 验证代码时激活
- `ra-log` — 补充可观测性时激活
- `ra-evolve` — Session 回顾时激活

## 斜杠命令

本仓库在 `.gemini/commands/` 下提供了 11 个斜杠命令。Gemini CLI 从项目根目录运行时自动发现。

| 命令 | 作用 |
|------|------|
| `ra-spec` | 初始化项目宪法 |
| `ra-plan` | 需求分析与方案设计 |
| `ra-auto` | 一键自动化工作流 |
| `ra-build` | TDD 增量实现 |
| `ra-verify` | 自动化验证 |
| `ra-log` | 可观测性检查 |
| `ra-request-review` | 多角度代码审查 |
| `ra-receive-review` | 审查反馈处理 |
| `ra-update-doc` | 文档同步更新 |
| `ra-ship` | 提交+PR+合并 |
| `ra-evolve` | Session 回顾+进化 |

每个命令自动调用对应 skill。

## 使用技巧

1. **优先使用 Skills 而非 GEMINI.md** — Skills 按需激活，保持上下文聚焦
2. **Skill 描述很重要** — 每个 `SKILL.md` 的 `description` frontmatter 针对跨工具自动发现进行了优化
3. **使用 agent 进行审查** — 在请求结构化代码审查时引用 `agents/` 目录中的角色定义
4. **结合 references** — 在处理测试或性能等特定质量领域时引用 `references/` 中的检查清单
