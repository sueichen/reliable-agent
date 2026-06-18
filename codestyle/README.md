# 代码规范索引

> 基于 Google Style Guide 的简洁版代码规范，用于 reliable-agent 代码审查。

## 语言 → 文件映射

| 语言 | 文件名 | 检测标志 |
|------|--------|---------|
| AngularJS | [angularjs.md](angularjs.md) | `*.js` + Angular 模块模式 |
| C | [c.md](c.md) | `*.c`, `*.h`, Makefile |
| C++ | [cpp.md](cpp.md) | `*.cpp`, `*.cc`, `*.hpp`, `*.h` |
| C# | [csharp.md](csharp.md) | `*.cs`, `*.csproj`, `*.sln` |
| Common Lisp | [common-lisp.md](common-lisp.md) | `*.lisp`, `*.lsp`, `*.cl` |
| Go | [go.md](go.md) | `*.go`, `go.mod`, `go.sum` |
| HTML/CSS | [html-css.md](html-css.md) | `*.html`, `*.css`, `*.scss` |
| Java | [java.md](java.md) | `*.java`, `pom.xml`, `build.gradle` |
| JavaScript | [javascript.md](javascript.md) | `*.js`, `*.mjs`, `package.json` (无 tsconfig) |
| JSON | [json.md](json.md) | `*.json` |
| Markdown | [markdown.md](markdown.md) | `*.md`, `*.mdx` |
| Objective-C | [objc.md](objc.md) | `*.m`, `*.mm`, `*.h` (含 ObjC 语法) |
| Python | [python.md](python.md) | `*.py`, `pyproject.toml`, `setup.py` |
| R | [r.md](r.md) | `*.r`, `*.R`, `DESCRIPTION` |
| Shell | [shell.md](shell.md) | `*.sh`, `*.bash`, `*.zsh` |
| TypeScript | [typescript.md](typescript.md) | `*.ts`, `*.tsx`, `tsconfig.json` |
| Vimscript | [vimscript.md](vimscript.md) | `*.vim`, `.vimrc` |
| XML | [xml.md](xml.md) | `*.xml`, `*.xsl`, `*.xsd` |

## 使用方式

### 1. 项目初始化时导入

运行 `/spec-reliable` 时，技能会自动检测项目语言，匹配合适的代码规范文件，并询问是否复制到 `.reliable-agent/codestyle/`。

### 2. 代码审查时引用

`style-auditor` 会读取 `.reliable-agent/codestyle/` 中的规范文件，对照代码进行审计。违反声明的风格规则视为 **Important**（阻塞合并）。

### 3. 无匹配规范时

如果项目语言没有对应的规范文件，style-auditor 会跳过该语言的风格审计，由 code-reviewer 回退到传统的 Suggestion 级别风格建议。

## 文件格式

所有规范文件采用统一的 YAML frontmatter + Markdown 格式：

```yaml
---
language: <语言标识>
source_url: <Google Style Guide 原始地址>
license: CC-BY-3.0
---
```

## 来源

所有规范源自 [Google Style Guides](https://google.github.io/styleguide/)，经提炼为简洁版速查表。

许可证：CC-BY-3.0（与原始 Google Style Guide 一致）
