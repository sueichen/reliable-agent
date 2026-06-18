---
language: json
source_url: https://google.github.io/styleguide/jsoncstyleguide.xml
license: CC-BY-3.0
---

# JSON 代码规范（简洁版）

> 基于 Google JSON Style Guide 整理的核心规则速查。

---

## 通用规则

| 规则 | 说明 |
|------|------|
| 编码 | **UTF-8** |
| 语法 | 严格有效 JSON |
| 注释 | ❌ **不支持**任何形式的注释 |
| 键名唯一 | 对象中键名必须唯一 |

## 命名

| 元素 | 风格 | 示例 |
|------|------|------|
| **属性名** | `lowerCamelCase` | `firstName`、`isActive` |
| **清晰性** | 描述性名称 | 避免单字母名 |

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "isActive": true,
  "emailAddress": "john@example.com"
}
```

## 格式

| 规则 | 要求 |
|------|------|
| 缩进 | **2 空格**（不用 Tab） |
| 左大括号 `{` | 不换行 |
| 属性值对 | 每行一个 |
| 右大括号 `}` | 独占一行 |
| 尾逗号 | ❌ **禁止** |

```json
{
  "name": "John",
  "age": 30
}
```

### 数组

```json
{
  "items": [
    "item1",
    "item2"
  ]
}
```

## 值类型速查

| 类型 | 规则 | 示例 |
|------|------|------|
| **字符串** | 双引号，特殊字符转义 | `"Hello\nWorld"` |
| **数字** | 不用引号包裹，无前导 0 | `42`、`3.14`、`-10` |
| **布尔** | 小写 `true` / `false` |
| **null** | 小写 `null` |
| **日期** | ISO 8601 格式 | `"2024-01-15T09:30:00Z"` |

## 安全性

- ❌ 不包含密码、密钥等敏感信息
- ✅ 传输使用 HTTPS
- ❌ 不使用 `__proto__` 等特殊属性名
- ✅ 解析时注意防止 DoS（大型嵌套对象）

## 常见错误

```json
// ❌ 错误写法
{ 'name': 'John',        // 单引号
  "age": undefined,       // 无效值
  "trailing": true, }     // 尾逗号

// ✅ 正确写法
{ "name": "John",
  "age": null,
  "isActive": true }
```

## JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"]
}
```
