# 可观测性模式

> 用于 `/ra-log` 的遥测审计和补充。参考 OpenTelemetry、RED 指标和结构化日志最佳实践。

## On-Call 问题驱动

每条遥测信号应回答一个 on-call 工程师的问题：

1. "这个功能正常工作吗？"
2. "如果坏了，哪里坏了？"
3. "有多少用户受影响？"
4. "最近的变更是否引入了退化？"

## 结构化日志

### 规则
- [ ] JSON 格式，稳定的字段名
- [ ] 每条日志行有关联 ID（correlation ID）
- [ ] 日志级别正确使用：ERROR（需要立即关注）、WARN（潜在问题）、INFO（关键业务事件）、DEBUG（诊断）
- [ ] 日志不包含密钥、令牌、PII、完整请求体

### 事件命名
使用稳定的 `event.name` 字段：
```json
{"event.name": "order.created", "order_id": "abc123", "amount": 99.95}
{"event.name": "payment.failed", "order_id": "abc123", "reason": "insufficient_funds"}
```

### 禁止模式
- 字符串插值：`log.info("User " + id + " did X")` → 不可搜索、不可聚合
- 无上下文的单行日志
- 完整堆栈追踪对用户可见

## RED 指标

每个端点和外部依赖应暴露：

| 指标 | 类型 | 查询示例 |
|------|------|---------|
| **Rate** | Counter | `rate(requests_total[5m])` |
| **Errors** | Counter | `rate(errors_total[5m]) by type` |
| **Duration** | Histogram | `histogram_quantile(0.95, rate(duration_ms_bucket[5m]))` |

### 延迟
- **使用 Histogram，而非平均值** —— 平均值隐藏尾部延迟
- P50/P95/P99 应可查询
- 分桶边界覆盖预期范围

### 标签
- 标签名稳定（不包含动态值）
- 标签基数有限（无 user_id, raw URL, error message）
- 不超过 ~20 个唯一值 per 标签

## 追踪（Tracing）

- [ ] 每个有意义的操作有 OpenTelemetry span
- [ ] Span 跨越异步边界传播上下文
- [ ] Span 属性包含操作标识符和关键参数（无 PII）
- [ ] 错误 span 记录异常

## 告警（Alerting）

- [ ] **基于症状**（symptom-based），非基于原因（cause-based）
  - ✅ "P95 延迟 > 1s 持续 5 分钟"
  - ❌ "数据库可能慢了"
- [ ] 每个告警链接到 runbook
- [ ] 页面级（page）vs 通知级（ticket）严重度区分
- [ ] 无在值班时间外自动触发的非紧急告警

## 验证

添加遥测后的验证步骤：
1. 在 staging/测试环境触发错误
2. 确认结构化日志中出现正确的字段和关联 ID
3. 确认新指标系列出现在指标仪表板中
4. 确认追踪 span 在分布式追踪系统中连接
5. 确认告警按预期触发
