---
description: 回顾当前 session——提取经验教训、遇到的错误模式和优化发现。追加到 .reliable-agent/experiences.md
---
Invoke the reliable-agent:reliable-session-retro skill.

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

4. 将每条新经验链接到相关的 CLAUDE.md 边界：
   - 这条经验是否暗示缺少某条边界规则？
   - 标记给 reliable-evolve 命令稍后处理

5. 总结 session：完成任务、新增测试、提交数、记录的经验数
