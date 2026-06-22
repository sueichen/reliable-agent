# 严重度规范化映射

> 由 `reliable-request-review` 在合并 5 个 Agent 发现时使用。
> 每个 Agent 使用特定领域的严重度命名，映射到一个统一的 3 级分类。

## 统一分类

| 统一级别 | 含义 | 合并后行动 |
|---------|------|-----------|
| **Critical** | 阻塞发布——必须立即修复 | 修复 + 证明测试，阻塞合并 |
| **Important** | 合并前应修复——质量门禁 | 合并前修复，或记录明确理由 |
| **Suggestion** | 评估后决定——可协商 | 修复、记录理由不修、或安排后续 |

## 各 Agent 映射

### code-reviewer (Critical / Important / Suggestion / Optional)

| Agent 级别 | 统一级别 |
|-----------|---------|
| Critical | **Critical** |
| Important | **Important** |
| Suggestion | **Suggestion** |
| Optional | **Suggestion** |

### security-auditor (Critical / High / Medium / Low / Info)

| Agent 级别 | 统一级别 |
|-----------|---------|
| Critical | **Critical** |
| High | **Critical** |
| Medium | **Important** |
| Low | **Suggestion** |
| Info | **Suggestion** |

### test-engineer (Critical / Important / Medium / Low)

| Agent 级别 | 统一级别 |
|-----------|---------|
| Critical | **Critical** |
| Important | **Important** |
| Medium | **Important** |
| Low | **Suggestion** |

### performance-auditor (Critical / High / Medium / Low)

| Agent 级别 | 统一级别 |
|-----------|---------|
| Critical | **Critical** |
| High | **Critical** |
| Medium | **Important** |
| Low | **Suggestion** |

### style-auditor (Important / Suggestion / Info)

| Agent 级别 | 统一级别 |
|-----------|---------|
| Important | **Critical** — 违反声明规则 = 阻塞合并 |
| Suggestion | **Important** — 风格观察但无对应声明规则 |
| Info | **Suggestion** — 跳过信息、缺失规范提示 |

## 合并规则

1. 同一发现被多个 Agent 报告时，取最严重的统一级别
2. 合并报告使用统一级别（Critical / Important / Suggestion）
3. 原始 Agent 级别保留在发现详情中以供追溯
4. 合并报告按统一级别排序：Critical → Important → Suggestion

## G3 门禁判定

| 条件 | 判定 |
|------|------|
| 存在任何未解决的 **Critical** | **REQUEST CHANGES** — 阻塞合并 |
| 所有 Critical 已修复，存在未解决的 Important | **APPROVE WITH CONDITIONS** — 合并前必须修复或记录理由 |
| 所有 Critical + Important 已解决 | **APPROVE** — Suggestion 项记录后合并 |
