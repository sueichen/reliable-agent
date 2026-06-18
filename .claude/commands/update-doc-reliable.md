---
description: 同步文档与代码变更——更新 README、ADR、API 文档、changelog 和内联文档
---
Invoke the reliable-agent:reliable-update-doc skill.

1. 扫描最近代码变更（从上次文档更新以来）
2. 对每个变更区域，检查对应文档：
   - README：新的安装需求？新命令？架构变更？
   - API 文档：新端点？变更的参数？废弃的功能？
   - ADR：需要记录的新架构决策？
   - Changelog：用户需要注意的变更？
   - 内联文档：JSDoc/TSDoc 注释是否更新？
3. 识别缺口：代码已变更，文档过时
4. 增量更新文档，一次一个文档
5. 保存前展示变更供人类审查
6. 文档变更与代码变更分开提交
