---
language: common-lisp
source_url: https://google.github.io/styleguide/lispguide.xml
license: CC-BY-3.0
---

# Common Lisp 代码规范（简洁版）

> 基于 Google Common Lisp Style Guide 整理的核心规则速查。

---

## 元指南

| 术语 | 含义 |
|------|------|
| 必须（MUST） | 绝对要求，否则需许可 |
| 禁止（MUST NOT） | 绝对禁止 |
| 应该（SHOULD） | 推荐 |
| 不应该（SHOULD NOT） | 不推荐 |
| 可以（MAY） | 可选 |

## 命名规范（完整表）

| 分类 | 风格 | 示例 |
|------|------|------|
| **全局变量** | `*var-name*`（星号包围） | `*default-path*`、`*max-retries*` |
| **常量** | `+const-name+`（加号包围） | `+pi+`、`+max-buffer+` |
| **函数名** | `lower-case-with-hyphens` | `format-output`、`parse-input` |
| **类型名** | `lower-case-with-hyphens` | `my-struct`、`connection-pool` |
| **关键字** | 冒号前缀 | `:keyword`、`:name` |
| **谓词** | 以 `-p` 结尾 | `listp`、`numberp`、`stringp` |
| **转换函数** | 以 `-` 开头（连字符） | `-to-list`、`-to-string` |
| **访问器** | 类型名-槽名 | `struct-name-slot-name` |

> 使用完整单词，连字符 `-` 分隔，不用缩写。

## 格式

| 规则 | 要求 |
|------|------|
| 缩进 | **2 空格** |
| 行长 | 不超过 **80 列** |
| 关闭括号 | 对齐到对应打开括号 |

```lisp
;; 缩进示例
(defun calculate-distance (x y)
  (sqrt (+ (* x x) (* y y))))
```

## 文档字符串

每个函数、变量和类应该附带文档字符串：

```lisp
(defun calculate-distance (x y)
  "Calculate the Euclidean distance between point X and point Y."
  (sqrt (+ (* x x) (* y y))))
```

## 编程实践

### 变量
- ✅ `let` / `let*` 引入局部变量
- ✅ `defparameter` → 可能更改的全局变量
- ✅ `defvar` → 仅初始化一次的全局变量
- ✅ `defconstant` → 常量
- ❌ `setq`/`setf` 对未声明变量赋值

### 迭代
- ✅ `loop`（优先于递归）
- ✅ `dolist`（遍历列表）
- ✅ `dotimes`（计数循环）

### 条件
| 场景 | 推荐 |
|------|------|
| 单分支 | `when` / `unless`（比 `if` 清晰） |
| 多分支 | `cond` |
| 匹配 | `case` / `typecase` |

### 错误处理
- ✅ `handler-case` / `handler-bind`（condition 系统）
- ❌ 不要用 `error` 输出信息

```lisp
(handler-case
    (risky-operation)
  (division-by-zero (c)
    (format t "Caught: ~a" c))
  (error (c)
    (format t "Error: ~a" c)))
```

### ❌ 禁止/避免的特性

| 特性 | 替代 |
|------|------|
| `go` / 标签跳转 | `loop` / `when` / `cond` |
| `prog` / `prog*` | `let` + `tagbody` 或 `loop` |
| 不必要的 `return-from` | 最后的表达式就是返回值 |
| `eval` | 一切形式的动态代码执行 |
| `defadvice` | `:around` / `:before` / `:after` 方法组合 |

### 编译

- ✅ 代码必须无警告编译
- ✅ 使用 `declare` 声明类型

```lisp
(defun add-integers (a b)
  (declare (fixnum a b))
  (the fixnum (+ a b)))
```

## 注释

| 类型 | 语法 |
|------|------|
| 单行注释 | `;` 或 `;;` |
| 行尾注释 | `;` |
| 段落注释 | `#\| ... \|#` |

> 注释解释"为什么"而非"是什么"。
