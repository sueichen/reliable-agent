@./skills/using-reliable-agent/SKILL.md

# Reliable Agent 可靠工程技能

本项目已安装 reliable-agent 可靠工程技能框架（13 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **规范先于编码** — 收到功能需求时，先用 ra-spec 生成项目宪法
3. **方案先于实现** — 编码前先用 ra-plan 做需求分析与任务拆解
4. **测试先于实现** — 写代码前先写测试（TDD，ra-build 内建）
5. **验证先于完成** — 声称完成前必须运行 ra-verify
6. **审查先于发布** — 合并前必须通过 ra-request-review 多角度审查
7. **回顾驱动进化** — 每个 session 结束时运行 ra-evolve 提取经验

## 可用 Skills

Skills 位于 `skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **using-reliable-agent**: 元技能——技能发现流程图，6 条核心行为准则。SessionStart 自动注入。
- **ra-spec**: 项目初始化——生成 CLAUDE.md 项目宪法 + 代码规范导入
- **ra-plan**: 需求分析与对抗式 grill-me 提问，输出包含任务拆解的详细实现方案
- **ra-auto**: 自动化工作流执行——检测阶段并自动执行 plan→build→verify→log→review→update-doc
- **ra-build**: TDD 驱动的增量实现——红绿重构循环
- **ra-verify**: 自动化验证门禁——测试+lint+构建+类型检查
- **ra-log**: 可观测性检查与补充——日志+指标+追踪+告警
- **ra-request-review**: 多角度代码审查——5-agent 并行扇出
- **ra-receive-review**: 处理代码审查反馈——修复+重新验证
- **ra-update-doc**: 同步文档与代码变更
- **ra-ship**: 提交+PR+合并，含格式校验
- **ra-evolve**: Session 回顾+经验提取+进化建议
- **ra-perf**: 数据驱动的性能优化——五维遍历检查（CPU/内存/IO/网络/多线程），TMA 自顶向下定位瓶颈，技法匹配生成行动计划
- **ra-debug**: 结构化根因排查——crash/死锁/内存泄露/竞态等系统级问题，通过 gdb/coredumpctl/valgrind/ASan/TSan 等工具正向排查，5 Whys 穿透到第 5 层根因

## 如何使用

当任务匹配某个 skill 时，通过 Skill 工具加载对应的技能并严格遵循其流程。

## 生命周期序列

完整功能开发的标准序列：

```
 1. ra-spec            → 生成 CLAUDE.md + 项目宪法
 2. ra-plan            → 需求分析 + 设计方案
 3. ra-build           → TDD 增量实现
 4. ra-verify          → 自动化验证
 5. ra-log             → 可观测性检查
 6. ra-request-review  → 多角度代码审查
 7. ra-receive-review  → 审查反馈处理
 8. ra-update-doc      → 文档同步更新
 9. ra-ship            → 提交+PR+合并
10. ra-evolve          → Session 回顾+经验提取
```

也可使用 `ra-auto` 一键自动执行 plan→update-doc 全流程。
