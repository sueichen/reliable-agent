---
language: xml
source_url: https://google.github.io/styleguide/xmlstyle.html
license: CC-BY-3.0
---

# XML 文档格式规范（简洁版）

> 基于 Google XML Document Format Style Guide 整理的核心规则速查。

---

## 通用规则

| 规则 | 要求 |
|------|------|
| 语法 | **格式良好（well-formed）** |
| 编码 | **UTF-8（无 BOM）** |
| 声明 | `<?xml version="1.0" encoding="UTF-8"?>` |
| 自闭合标签 | 空元素用自闭合：`<br/>` |

## 格式

| 规则 | 要求 |
|------|------|
| 缩进 | **2 空格**（不用 Tab） |
| 每行一个元素 | 除非内容很短 |
| 属性值 | **双引号** |

```xml
<parent>
  <child>
    <grandchild/>
  </child>
</parent>

<items>
  <item id="1">First</item>
  <item id="2">Second</item>
</items>
```

### 属性顺序建议
1. Schema 属性（`xsi:schemaLocation`）
2. 命名空间声明（`xmlns`）
3. `xml:` 属性
4. ID 属性
5. 其他属性

## 命名规范

| 元素 | 风格 | 示例 |
|------|------|------|
| **元素名** | `lowerCamelCase` 或 `lower_with_under` | `<customerName>` 或 `<customer_name>` |
| **属性名** | `lowerCamelCase` | `itemId="123"` |
| **一致性** | 同项目内保持一致，不混用 | — |

## 设计原则

### 元素 vs 属性
- ✅ **元素** → **数据**
- ✅ **属性** → **元数据**

```xml
<!-- ✅ 推荐 -->
<person>
  <name>John Smith</name>
  <age>30</age>
</person>

<!-- ❌ 不推荐：数据放在属性中 -->
<person name="John Smith" age="30"/>
```

### 其他设计规则
| 规则 | 说明 |
|------|------|
| 嵌套深度 | 不超过 **3-4 层** |
| 命名空间 | 尽量单一，URI 稳定可解析 |
| Schema | 提供 XSD 或 DTD 验证 |
| 注释 | `<!-- comment -->` |

## 特殊字符实体

| 字符 | 实体 | 含义 |
|------|------|------|
| `<` | `&lt;` | 小于号 |
| `>` | `&gt;` | 大于号 |
| `&` | `&amp;` | 和号 |
| `'` | `&apos;` | 单引号 |
| `"` | `&quot;` | 双引号 |

```xml
<equation>x &lt; 10 &amp;&amp; y &gt; 5</equation>
```
