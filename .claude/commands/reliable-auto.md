---
description: 自动化工作流执行——检测当前阶段并自动运行 plan→build→verify→log→review→update-doc，无需阶段间人工交互
---
Invoke the reliable-agent:reliable-auto skill.

自动化可靠工程工作流。

AI 将:
1. 检测项目当前所在阶段（通过分析 CLAUDE.md、plan 文件、git 历史、审查报告等工件）
2. 展示检测结果并请求一次性确认（后续阶段自动执行，无需逐阶段审批）
3. 按顺序自动执行 plan → build → verify → log → request-review
4. 如果审查发现 Critical/Important → 自动进入审查-修复-验证循环（最多 3 次迭代）
5. 修复后自动重新验证（reliable-verify）和重新审查（reliable-request-review）
6. 审查通过后自动执行 update-doc（自动更新文档）
7. 在 update-doc 完成后停止，生成自动决策报告
8. 提示用户手动运行 /reliable-ship 和 /reliable-evolve

审查-修复-验证循环:
- 迭代 1/3: 修复所有 Critical + Important + 合理 Suggestion
- 迭代 2/3: 修复所有 Critical + Important（范围收窄）
- 迭代 3/3: 仅修复 Critical（最小范围）
- 3 次后仍有 Critical → 停止并报告未解决问题

注意: 此命令不从 reliable-spec 开始（规范生成始终需要人工交互）。
注意: 此命令不执行 reliable-evolve（进化建议需在积累经验后单独运行）。
注意: 此命令不执行 reliable-ship（发布始终需要人类批准）。
