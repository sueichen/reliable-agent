---
description: 带格式校验的提交、带完整描述的 PR、验证所有质量门禁、合并
---
Invoke the reliable-agent:reliable-ship skill.

Phase A — 发布前验证：
1. 确认 reliable-verify 已通过（所有测试绿色、0 lint 错误、构建成功）
2. 确认 reliable-request-review 已完成（无 Critical 问题未解决）
3. 验证未提交变更是有意为之（无遗留调试代码、无 console.log、无不带 Issue 引用的 TODO）
4. 验证 commit 消息格式匹配 CLAUDE.md 的项目约定
5. 验证 PR 描述完整：What、Why、How Tested、Review Summary、Screenshots（如 UI 变更）、Rollback Plan

Phase B — 提交：
1. 按逻辑原子提交组织变更（每个提交一个关注点）
2. 按 CLAUDE.md commit 格式草拟提交消息
3. 展示提交供人类批准

Phase C — 创建 PR：
1. 按模板生成完整的 PR 描述
2. 链接 spec、plan 和 review report
3. 引用相关 issues

Phase D — 合并（人类触发）：
1. 确认 PR 分支上 CI 通过
2. 验证所需审查者已批准
3. 按 CLAUDE.md 指定的策略合并
