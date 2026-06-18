---
description: 处理代码审查反馈——分析每个发现，修复 Critical/Important 问题，记录 Optional 项，重新验证
---
Invoke the reliable-agent:reliable-receive-review skill.

1. 解析审查报告，提取所有发现及其严重度
2. 对每个发现：
   - Critical：立即用针对性变更修复
   - Important：合并前修复，链接到审查发现
   - Suggestion：评估——如果改善代码则实现，如果不修则记录理由
   - Optional：记录在代码注释或项目 ADR 中
3. 对每个修复，遵循 TDD：写一个证明问题的测试 → 实现修复 → 验证测试通过
4. 所有修复完成后：运行 verify-reliable 确认所有检查仍通过
5. 提供修复摘要：改了啥、为什么、哪些审查发现已解决、哪些延迟处理及理由
6. 如果所有 Critical/Important 发现已解决，标记审查为已处理并通知准备 ship-reliable
