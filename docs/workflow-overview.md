# 工作流概览

> **自动化模式**: `ra-auto` 可自动检测当前阶段并一次性执行从 plan 到 update-doc 的完整流程，自动处理审查反馈和验证循环。详见下方手动流程中的每个阶段。

## 完整生命周期
```
ra-spec ──────► CLAUDE.md 存在（项目宪法）
     │
     ▼
ra-plan ──────► 方案经人类批准
     │
     ▼
ra-build ─────► TDD 增量实现，每个切片测试通过
ra-debug ──────► (系统级异常) crash/死锁/内存泄漏等根因排查
     │
     ├── ra-perf ──► (性能优化) 五维遍历+TMA 诊断
     ▼
ra-verify ──────► G1: 新代码有对应测试，全部通过
     │                   G2: 100% 测试通过，0 lint，构建成功，风格规范已检查
     ▼
ra-log ────────► 遥测覆盖确认
     │
     ▼
ra-request-review ─► G3: 所有 Critical 已修复，Important 已修复或记录，Optional 已记录
     │
     ▼
ra-receive-review ─► 所有审查关注点已解决
     │
     ▼
ra-update-doc ─► 文档同步
     │
     ▼
ra-ship ───────► G4: commit 格式正确，PR 描述完整
     │
     ▼
ra-evolve ───────► G5: 经验已提取，session 可追溯
```

## 质量门禁

每个门禁由对应的技能强制实施。如果条件不满足，技能拒绝运行并引导用户回到前提技能。

| 门禁 | 从 → 到 | 条件 | 阻塞？ |
|------|---------|------|--------|
| G1 | build → verify | 新代码有对应测试，全部通过 | 是 |
| G2 | verify → review | 100% 测试通过，0 lint 错误，构建成功，风格规范已检查 | 是 |
| G3 | review → ship | 所有 Critical 已修复，Important 已修复或记录，Optional 已记录 | 是 |
| G4 | ship → evolve | commit 符合 CLAUDE.md 格式，PR 描述完整 | 是 |
| G5 | evolve 结束 | 当前 session 经验已提取，标记为可追溯 | 是 |

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
1. `ra-evolve` 回顾 session 并提取经验（Phase 1）
2. 积累多条经验后自动进入聚类分析和进化建议（Phase 2-4）
3. evolve 生成的建议经人类审批后应用
4. 下一轮 session 受益于改进的技能和规则
