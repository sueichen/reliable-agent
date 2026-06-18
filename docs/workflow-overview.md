# 工作流概览

## 完整生命周期

```
/spec-reliable ──────► CLAUDE.md 存在（项目宪法）
     │
     ▼
/plan-reliable ──────► 方案经人类批准
     │
     ▼
/build-reliable ─────► TDD 增量实现，每个切片测试通过
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
/evolve-reliable ─────► （可选，周期性）建议经人类审查
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

## 质量门禁

每个门禁由对应的技能强制实施。如果条件不满足，技能拒绝运行并引导用户回到前提技能。

| 门禁 | 从 → 到 | 条件 | 阻塞？ |
|------|---------|------|--------|
| G1 | build → verify | 新代码有对应测试，全部通过 | 是 |
| G2 | verify → review | 100% 测试通过，0 lint 错误，构建成功 | 是 |
| G3 | review → ship | 所有 Critical 已修复，Optional 已记录 | 是 |
| G4 | ship → retro | commit 符合 CLAUDE.md 格式，PR 描述完整 | 是 |
| G5 | retro 结束 | 当前 session 经验已提取，标记为可追溯 | 是 |

## 三层进化模型

```
第一层: .reliable-agent/experiences.md  ← 自动追加（只添不删）
         ↓
第二层: CLAUDE.md              ← evolve 生成 proposal → 人类审批
         ↓
第三层: skills/*/SKILL.md       ← evolve 生成 proposal → 人类审批
```

## 循环

完成一个完整周期后：
1. `/session-retro` 提取经验
2. 积累多条经验后运行 `/evolve-reliable`
3. evolve 生成的建议经人类审批后应用
4. 下一轮 session 受益于改进的技能和规则
