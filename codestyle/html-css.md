---
language: html-css
source_url: https://google.github.io/styleguide/htmlcssguide.html
license: CC-BY-3.0
---

# Google HTML/CSS 代码规范（简洁版）

## 通用规则

### 缩进
每次缩进 **2 个空格**，不使用 Tab。

```html
<ul>
  <li>Fantastic</li>
  <li>Great</li>
</ul>
```

```css
.example {
  color: blue;
}
```

### 大小写
全部使用**小写**：HTML 元素名、属性、属性值、CSS 选择器、属性、属性值。

```html
<!-- 不推荐 -->
<A HREF="/">Home</A>

<!-- 推荐 -->
<img src="google.png" alt="Google">
```

```css
/* 不推荐 */
color: #E5E5E5;

/* 推荐 */
color: #e5e5e5;
```

### 其他
- **协议**：嵌入资源始终使用 HTTPS。
- **行尾空白**：删除行尾多余空格。
- **编码**：用 UTF-8（无 BOM），HTML 中写 `<meta charset="utf-8">`。
- **注释**：解释代码的目的和原因，而非表面。
- **待办**：用 `TODO` 标记，如 `<!-- TODO: 移除可选标签 -->`。

---

## HTML 规则

| 规则 | 说明 | 推荐 | 不推荐 |
|---|---|---|---|
| **文档类型** | 始终使用 `<!doctype html>` | `<!doctype html>` | 省略 doctype |
| **合法性** | 使用有效 HTML | `<article>内容</article>` | `<article>内容` |
| **语义** | 按用途使用元素 | `<a href="...">链接</a>` | `<div onclick="...">链接</div>` |
| **多媒体后备** | 图片加 `alt`，装饰图用 `alt=""` | `<img src="x.png" alt="说明">` | `<img src="x.png">` |
| **关注点分离** | 结构/样式/行为分离 | 外部 CSS + JS | 行内 style / `<u>` / `<center>` |
| **实体引用** | UTF-8 下无需 `&mdash;` 等 | 直接写字符 | `&rdquo;` |
| **可选标签** | 可省略以节省字节 | `<p>内容` | 全量闭合 |
| **type 属性** | 引用 CSS/JS 时不加 type | `<link rel="stylesheet" href="a.css">` | `type="text/css"` |

---

## CSS 规则

### 类命名
使用功能或内容含义的通用名称，避免表现型命名。

```css
/* 不推荐 */
.btn-green { ... }

/* 推荐 */
.btn-primary { ... }
```

### 选择器
高效简洁，避免过度嵌套。

```css
/* 不推荐 */
div.content ul li a { ... }

/* 推荐 */
.content a { ... }
```

### 简写属性
能用简写就用简写。

```css
/* 不推荐 */
padding-top: 0;
padding-right: 2em;
padding-bottom: 0;
padding-left: 2em;

/* 推荐 */
padding: 0 2em;
```

### 0 和单位
值为 `0` 时省略单位。

```css
/* 不推荐 */  margin: 0px;
/* 推荐 */    margin: 0;
```

### 前导 0
-1 到 1 之间的值省略前导 0。

```css
/* 不推荐 */  font-size: 0.8em;
/* 推荐 */    font-size: .8em;
```

### 十六进制
能用 3 位就用 3 位，小写。

```css
/* 不推荐 */  color: #eebbcc;
/* 推荐 */    color: #ebc;
```

### 声明顺序
按组依次排列：
1. **定位** → 2. **盒模型** → 3. **排版** → 4. **视觉** → 5. **动画/其他**

```css
.example {
  /* 定位 */
  position: absolute;
  top: 0;
  /* 盒模型 */
  display: block;
  margin: 10px;
  padding: 10px;
  /* 排版 */
  font-size: 1em;
  color: #333;
  /* 视觉 */
  background: #fff;
  /* 其他 */
  animation: none;
}
```

### 格式细节
- **分号**：每条声明以分号结尾。
- **分组选择器**：每个选择器独占一行。
  ```css
  h1,
  h2,
  h3 {
    font-weight: bold;
  }
  ```
- **声明块**：选择器和 `{` 之间一个空格，`}` 独占一行。
- **规则间空行**：规则之间加空行分隔。
- **引号**：CSS 属性值使用双引号，如 `input[type="submit"]`。
