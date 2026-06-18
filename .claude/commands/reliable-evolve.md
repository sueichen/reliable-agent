---
description: 分析 .reliable-agent/experiences.md 中记录的经验——生成三类进化建议（全部需人类审查后应用）：CLAUDE.md 规则变更、技能行为变更、规格修订
---
Invoke the reliable-agent:reliable-evolve skill.

Phase 1 — 经验分析：
1. 读取 .reliable-agent/experiences.md，收集所有经验记录
2. 按领域聚类经验：错误模式、审查问题、流程摩擦、性能发现、安全发现
3. 识别重复模式（同类问题出现 >= 2 次）
4. 与 CLAUDE.md 规则和技能定义交叉引用寻找缺口

Phase 2 — 生成三类建议：

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

Phase 3 — 提交人类审查：
每条建议必须包含：触发经验、确切变更、理由、应用风险。

绝不自动应用任何建议。等待每条建议的人类明确批准。
