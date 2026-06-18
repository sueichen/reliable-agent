# Commit 格式规范

> 由 `/reliable-ship` 强制执行，在 `/reliable-spec` 中初始化到 CLAUDE.md。

## 标准格式

```
[type]([scope]): [简洁描述]

[可选的详细描述 — 为什么，不是什么]

Co-Authored-By: [name] <[email]>
```

## 类型（Type）

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

## 范围（Scope）

可选，标识受影响的模块或组件。例如：`auth`, `api`, `db`, `ui`, `config`。

## 规则

1. 描述用祈使语气，小写开头（"add" 而非 "Added" 或 "adding"）
2. 描述简洁（建议 72 字符以内）
3. 正文解释 **为什么** 以及 **怎么做的**，而非重复描述说了什么
4. 一个提交一个关注点（原子提交）
5. 不超过 ~100 行变更（超过 1000 行必须拆分）

## 示例

### 好的
```
feat(auth): add refresh token rotation

Store refresh tokens in Redis with TTL matching token expiry.
Rotate on each refresh to prevent replay attacks.

Co-Authored-By: Claude <noreply@anthropic.com>
```

```
fix(db): prevent N+1 query on user list endpoint

Added eager loading for user.profile association.
Before: SELECT users (1 query) + SELECT profile per user (N queries).
After: SELECT users JOIN profiles (1 query).

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 坏的

```
fixed bug  # 祈使语气，小写开头
```
```
refactor: clean up code  # 不具体
```
```
feat(db, ui, api, tests): implement user CRUD  # 范围过大，应拆分
```
