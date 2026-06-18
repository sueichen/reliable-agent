# 质量门禁详解

## 什么是门禁

门禁是工作流中各阶段之间的强制检查点。每个门禁有明确的通过条件——不满足时，下一个技能拒绝运行并引导用户回到前提技能。

## 门禁矩阵

| 门禁 | 实施者 | 条件 | 失败时返回 |
|------|--------|------|-----------|
| G1 | reliable-verify | 新代码有对应测试，全部通过 | reliable-build |
| G2 | reliable-request-review | 100% 测试通过，0 lint，构建成功，风格规范已检查 | reliable-verify |
| G3 | reliable-ship | 所有 Critical 已修复，Optional 已记录 | reliable-receive-review |
| G4 | reliable-session-retro | commit 格式正确，PR 描述完整 | reliable-ship |
| G5 | 下一个 session | 经验已提取，session 可追溯 | reliable-session-retro |

## 门禁强制示例

### G2 强制

当你在 reliable-verify 尚未通过时尝试运行 reliable-request-review：

```
G2 未满足：reliable-verify 必须在审查前通过。
当前状态：
  - 测试：? (未运行)
  - Lint：? (未运行)
  - 构建：? (未运行)

请先运行 /reliable-verify。
```

### G3 强制

当存在未解决的 Critical 发现时尝试运行 reliable-ship：

```
G3 未满足：存在未解决的 Critical 审查发现。
未解决：
  - [file:line] SQL 注入漏洞 (Critical)
  - [file:line] 密钥硬编码 (Critical)

请回到 /reliable-receive-review 处理这些发现。
```

## 跳过门禁

**门禁不得跳过。** 每个门禁预防某一类具体的工程失败：

- G1 防止未测试的代码进入验证
- G2 防止破损代码进入审查（浪费审查者时间），含风格违规检查
- G3 防止有已知漏洞或风格违规的代码发布
- G4 防止不可追溯的变更进入仓库
- G5 防止经验丢失、错误重复
