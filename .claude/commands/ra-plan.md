---
description: 通过对抗式 grill-me 提问分析需求，产生包含任务拆解的详细实现方案
---
Invoke the reliable-agent:ra-plan skill.

Phase 1 — 需求分析：
1. 读取 CLAUDE.md、SPEC.md（如存在）和 .reliable-agent/experiences.md（如存在）
2. 暴露所有假设，提交用户确认/纠正
3. 对需求进行对抗式提问（grill-me）：识别边界情况、失败模式、不一致性、范围蔓延
4. 将模糊需求重构为具体的、可测试的成功标准

Phase 2 — 设计方案：
1. 提出 2-3 种架构方案，含权衡和推荐理由
2. 设计解决方案：架构、组件、数据流、错误处理、测试方案
3. 拆分为可验证的任务，含验收标准和依赖关系
4. 保存方案到 .reliable-agent/plans/YYYY-MM-DD-<topic>-plan.md
5. 提交人类审查——未经批准不要进入 ra-build
