# 质量门禁

> 门禁由技能强制实施，非外部工具。每个技能在继续之前检查前提门禁条件。
> 如果条件不满足，技能拒绝运行并引导用户回到前提技能。

## 门禁映射

```
/ra-spec ──────► CLAUDE.md 存在
     │
     ▼
/ra-plan ──────► 方案经人类批准
     │
     ▼
/ra-build ─────► 每个切片测试通过
     │
     ▼
/ra-verify ──────► G1: 新代码有对应测试，全部通过
     │                   G2: 100% 测试通过，0 lint，构建成功，风格规范已检查
     ▼
/ra-log ────────► 遥测覆盖确认
     │
     ▼
/ra-request-review ─► G3: 所有 Critical 已修复，Important 已修复或记录，Optional 已记录
     │
     ▼
/ra-receive-review ─► 所有审查关注点已解决
     │
     ▼
/ra-update-doc ─► 文档同步
     │
     ▼
/ra-ship ───────► G4: commit 格式正确，PR 描述完整
     │
     ▼
/ra-evolve ───────► G5: 经验已提取，session 可追溯
```

## 门禁条件

| 门禁 | 从 → 到 | 条件 | 阻塞？ |
|------|---------|------|--------|
| G1 | build → verify | 新代码有对应测试，全部通过 | 是 |
| G2 | verify → review | 100% 测试通过，0 lint 错误，构建成功，风格规范已检查 | 是 |
| G3 | review → ship | 所有 Critical 已修复，Important 已修复或记录，Optional 已记录 | 是 |
| G4 | ship → evolve | commit 符合 CLAUDE.md 格式，PR 描述完整 | 是 |
| G5 | evolve 结束 | 当前 session 经验已提取，标记为可追溯 | 是 |

## 门禁强制示例

`ra-request-review` 检查 ra-verify 是否通过：
- 如果未通过：返回 "G2 未满足：ra-verify 必须在审查前通过。先运行 /ra-verify。"
- 如果已通过：继续执行审查。

`ra-ship` 检查 review 状态：
- 如果有未解决的 Critical：返回 "G3 未满足：存在未解决的 Critical 审查发现。回到 /ra-receive-review。"

## 跳过门禁

**门禁不得跳过。** 即使变更"很小"或"很简单"。每个门禁都在预防某一类具体的失败：
- G1 防止无测试的代码进入验证
- G2 防止破损的代码进入审查（浪费审查者时间）
- G3 防止有已知漏洞的代码发布
- G4 防止无法追溯的变更进入仓库
- G5 防止经验丢失
