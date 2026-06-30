# ra-verify 编译器警告配置

> 此文件从 CLAUDE.md 迁移至此。定义 ra-verify 的编译器警告检测行为，供 ra-verify 技能引用。

## 配置项

以下配置项可在 CLAUDE.md 中自定义：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `verify.build.enabled` | `boolean` | `true` | 设为 `false` 显式声明项目无构建步骤，跳过所有构建相关验证（含 compiler warning 检测）。未定义构建命令时等同于 `false`。 |
| `verify.build.warningAllowlist` | `object[]` | `[]` | 豁免的 warning 列表。每个条目为结构化对象。匹配项不阻塞验证，但在报告中标明 "whitelisted"。 |
| `verify.build.warningExcludes` | `string[]` | 见下方 | 额外的路径 glob 排除模式，追加到默认过滤列表。**禁止**将项目源目录（如 `src/`、`lib/`、`app/`）添加至此列表。 |

## 白名单条目格式

每个条目必须包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `file` | `string` | ✅ | 适用文件范围的 glob 模式（如 `src/legacy/*.c`），**禁止**使用 `.*` 或 `*` 等通配全部的模式 |
| `warningCode` | `string` | ✅ | 具体警告代码（如 `-Wdeprecated-declarations`、`TS6133`、`E0502`） |
| `reason` | `string` | ✅ | 豁免理由，必须引用跟踪 issue（如 `Issue #1234`） |
| `expires` | `string` | ✅ | 过期日期（`YYYY-MM-DD`）或 `"permanent"`；过期条目自动失效并触发警告 |

## 默认排除路径

`node_modules/`、`vendor/`、`*.d.ts`、`/usr/include/`、`/usr/local/include/`、`third_party/`、`thirdparty/`、`.venv/`、`venv/`、`virtualenv/`、`__pycache__/`、`build/`、`dist/`、`target/`、`out/`、`cmake-build-*/`、`bazel-*/`、`.git/`、`/lib/`、`/lib64/`、`/System/Library/`

## 配置示例

```markdown
## verify.build 配置

- `verify.build.warningAllowlist`:
  - file: "src/legacy/module.c"
    warningCode: "-Wdeprecated-declarations"
    reason: "遗留 API，计划 Q3 2026 移除 (Issue #1234)"
    expires: "2026-09-30"
  - file: "src/compat/*.ts"
    warningCode: "TS6133"
    reason: "接口占位符，外部 API 兼容性要求 (Issue #567)"
    expires: "permanent"

- `verify.build.warningExcludes`:
  - "generated/"
  - "submodules/"
```

> **建议**：优先在构建命令中使用 `-Werror`（GCC/Clang）、`--deny warnings`（Rust）等 flag，让编译器在 warning 时直接返回非零 exit code。ra-verify 的输出扫描是安全网，不应替代编译器的严格模式。白名单条目建议不超过 20 条——超过时应在编译配置中使用 `-Wno-*` 等 flag 在源头禁用 warning。

---

## 编译器严格模式 flag 参考

| 语言/工具 | 推荐 flag | 效果 |
|----------|----------|------|
| GCC/Clang (C/C++) | `-Wall -Wextra -Werror` | 启用大多数 warning，并将其提升为 error |
| Clang 额外 | `-Weverything -Werror`（谨慎使用） | 启用所有 warning |
| TypeScript | `--noUnusedLocals --noUnusedParameters --noEmit` | 启用未使用变量/参数检查 |
| Rust | `--deny warnings` 或 `#![deny(warnings)]` | 所有 warning 变为 error |
| Go | `go vet ./...` | 静态分析（Go 本身无编译 warning 概念） |
| MSVC | `/W4 /WX` | 启用 level-4 warning，并作为 error |
| Java (javac) | `-Xlint:all -Werror` | 启用所有 lint warning，作为 error |
