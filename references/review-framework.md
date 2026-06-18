# 代码审查框架

> 用于 `/request-review-reliable` 的六轴审查和 5-agent 并行扇出。

## 六轴审查

### 1. 正确性
代码是否按规范执行？边界情况是否处理？测试是否验证了正确的行为？

### 2. 可读性
另一个工程师能否无需解释就理解此代码？命名是否描述清晰且一致？控制流是否直接？

### 3. 架构
变更是否遵循现有模式或引入有理由的新模式？模块边界是否维持？抽象级别是否合适？

### 4. 安全性
输入是否在边界处验证？密钥是否在代码/日志/版本控制之外？认证/授权是否到位？

### 5. 性能
是否有 N+1 查询？无限循环或无限数据获取？同步操作应该是异步的吗？

### 6. 代码风格
代码是否遵守项目声明的规范（`.reliable-agent/codestyle/`）？命名、格式、导入、注释是否符合声明规则？

## 严重度标签

| 标签 | 含义 | 行动 |
|------|------|------|
| **Critical** | 安全漏洞、数据丢失、功能损坏——阻塞合并 | 立即修复 |
| **Important** | 缺少测试、错误抽象、糟糕的错误处理——应该修复 | 合并前修复 |
| **Important** | 违反声明的代码风格规则——阻塞合并 | 合并前修复 |
| **Suggestion** | 风格观察（无声明规则时）、可选优化——可改进 | 评估后修复或记录理由不修 |
| **Optional** | 未来考虑——记录即可 | 记录在代码注释或 ADR 中 |

## 审查规则

1. **先审查测试** —— 测试揭示意图
2. **每个 Critical/Important 发现必须有具体的修复建议和 file:line 引用**
3. **有 Critical 问题的代码不批准**
4. **认可做得好的地方** —— 具体的赞扬
5. **如有不确定，坦言而非猜测**

## 输出格式

```markdown
## Review Summary
**Verdict:** APPROVE | REQUEST CHANGES
**Overview:** [1-2 句话总结]

### Critical Issues (阻塞合并)
- [file:line] [描述 + 推荐修复]

### Important Issues (应该修复)
- [file:line] [描述 + 推荐修复]

### Suggestions (考虑改进)
- [file:line] [描述]

### What's Done Well
- [具体的好做法]

### Verification Story
- Tests reviewed: [yes/no, 观察]
- Build verified: [yes/no]
- Security checked: [yes/no, 观察]
- Performance checked: [yes/no, 观察]
```

## 5-Persona 并行审查模式

审查运行 5 个子智能体并行扇出，合并去重：

| Persona | 职责 | 产出 |
|---------|------|------|
| **code-reviewer** | 正确性、可读性、架构 | 发现 + 修复建议 |
| **security-auditor** | 安全漏洞、OWASP、供应链 | CVEs + 安全发现 |
| **test-engineer** | 测试覆盖、反模式、质量 | 覆盖缺口 + 缺失测试 |
| **performance-auditor** | N+1、复杂度、资源使用 | 性能发现 + 优化建议 |
| **style-auditor** | 代码风格合规性、命名/格式审计 | 风格违规 + 规范缺口 |
