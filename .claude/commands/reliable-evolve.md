---
description: Session 回顾与经验驱动的进化——回顾 session、提取结构化经验并追加到 experiences.md，聚类分析重复模式，生成三类进化建议（全部需人类审查后应用）：CLAUDE.md 规则变更、技能行为变更、规格修订
---
Invoke the reliable-agent:reliable-evolve skill.

Phase 1 — Session 回顾与经验提取：
1. 回顾当前 session 对话记录：
   - 遇到了什么问题？
   - 每个问题的原因是什么？（根因）
   - 每个问题如何解决的？
   - 学到了什么可以防止再次发生的经验？

2. 对每个重要的学习，提取结构化的经验记录：
   - 类别：error-pattern | optimization-discovery | review-recurrence | workflow-friction | security-finding | process-win
   - 上下文：发生时的场景
   - 症状：可观察的行为
   - 根因：根本原因
   - 解决方案：什么修复了它
   - 预防：什么能防止再次发生
   - 严重度：critical | important | notable

3. 追加新经验到 .reliable-agent/experiences.md（只追加，绝不删除已有记录）

4. 标记需要进化的经验（FLAG-EVOLVE）

5. 总结 session：完成任务、新增测试、提交数、记录的经验数

Phase 2 — 经验分析：
6. 读取 .reliable-agent/experiences.md，收集所有经验记录（如新经验 >= 3 条则继续）
7. 按领域聚类经验：错误模式、审查问题、流程摩擦、性能发现、安全发现
8. 识别重复模式（同类问题出现 >= 2 次）
9. 与 CLAUDE.md 规则和技能定义交叉引用寻找缺口

Phase 3 — 生成三类建议：

类型 A — CLAUDE.md 规则：
- 新的 "Always/Never/Ask First" 边界规则
- 代码规范、commit 格式、测试策略阈值的变更
- 安全基线或性能基线目标的变更

类型 B — 技能行为变更：
- 现有技能工作流中的新步骤
- 修改的验证检查清单
- 额外的借口反驳表条目
- 质量门禁条件的变更

类型 C — 规格修订：
- 架构模式变更
- API 合约更新
- 数据模型修订

Phase 4 — 提交人类审查：
每条建议必须包含：触发经验、确切变更、理由、应用风险。

绝不自动应用任何建议。等待每条建议的人类明确批准。
