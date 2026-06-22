---
description: 检查并补充可观测性——当前变更的结构化日志、指标、追踪和告警覆盖
---
Invoke the reliable-agent:ra-log skill.

1. 为当前功能/变更定义 on-call 问题
2. 根据可观测性检查清单审计现有遥测：
   - 结构化日志：JSON 事件、稳定命名、关联 ID、日志中无密钥
   - 指标：新端点的 RED 指标、延迟直方图、受控的标签基数
   - 追踪：OpenTelemetry spans、跨异步边界的上下文传播
   - 告警：基于症状的告警，含 runbook 链接
3. 报告缺口：缺少哪些信号、从遥测中无法诊断什么
4. 实现缺失的 instrumentation
5. 验证：在 staging 环境强制引发一个错误，确认在日志中以正确的字段出现
6. 如果模式发生变化，在 CLAUDE.md 的可观测性部分记录新的遥测模式
