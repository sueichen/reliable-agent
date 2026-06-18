# 质量门禁

> 门禁由技能强制实施，非外部工具。每个技能在继续之前检查前提门禁条件。
> 如果条件不满足，技能拒绝运行并引导用户回到前提技能。

## 门禁映射

```
/spec-reliable ──────► CLAUDE.md 存在
     │
     ▼
/plan-reliable ──────► 方案经人类批准
     │
     ▼
/build-reliable ─────► 每个切片测试通过
     │
     ▼
/verify-reliable ──────► G1: 新代码有测试，全部通过
     │                   G2: 100% 测试通过，0 lint，构建成功
     ▼
/log-reliable ────────► 遥测覆盖确认
     │
     ▼
/request-review-reliable ─► G3: 所有 Critical 已修复，Optional 已记录
     │
     ▼
/receive-review-reliable ─► 所有审查关注点已解决
     │
     ▼
/evolve-reliable ─────► (可选，周期性) 建议经人类审查
     │
     ▼
/update-doc-reliable ─► 文档同步
     │
     ▼
/ship-reliable ───────► G4: commit 格式正确，PR 描述完整
     │
     ▼
/session-retro ───────► G5: 经验已提取，session 可追溯
```

## 门禁条件

| 门禁 | 从 → 到 | 条件 | 阻塞？ |
|------|---------|------|--------|
| G1 | build → verify | 新代码有对应测试，全部通过 | 是 |
| G2 | verify → review | 100% 测试通过，0 lint 错误，构建成功 | 是 |
| G3 | review → ship | 所有 Critical 已修复，Optional 已记录 | 是 |
| G4 | ship → retro | commit 符合 CLAUDE.md 格式，PR 描述完整 | 是 |
| G5 | retro 结束 | 当前 session 经验已提取，标记为可追溯 | 是 |

## 门禁强制示例

`request-review-reliable` 检查 verify-reliable 是否通过：
- 如果未通过：返回 "G2 未满足：verify-reliable 必须在审查前通过。先运行 /verify-reliable。"
- 如果已通过：继续执行审查。

`ship-reliable` 检查 review 状态：
- 如果有未解决的 Critical：返回 "G3 未满足：存在未解决的 Critical 审查发现。回到 /receive-review-reliable。"

## 跳过门禁

**门禁不得跳过。** 即使变更"很小"或"很简单"。每个门禁都在预防某一类具体的失败：
- G1 防止无测试的代码进入验证
- G2 防止破损的代码进入审查（浪费审查者时间）
- G3 防止有已知漏洞的代码发布
- G4 防止无法追溯的变更进入仓库
- G5 防止经验丢失
