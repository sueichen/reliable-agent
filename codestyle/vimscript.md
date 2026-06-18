---
language: vimscript
source_url: https://google.github.io/styleguide/vimscriptguide.xml
license: CC-BY-3.0
---

# Vimscript 代码规范（简洁版）

> 基于 Google Vim script Style Guide 整理的核心规则速查。

---

## 1. 可移植性

### 字符串
- ✅ **优先使用单引号** `'pattern'`（无反斜杠转义）
- ✅ 需要转义时用双引号：`"Line1\nLine2"`

### 大小写匹配
- ✅ `=~#`（大小写敏感）/ `=~?`（大小写不敏感）
- ❌ 避免 `=~`（依赖用户 ignorecase 设置）

### 正则表达式
- ✅ 加 `\m\C` 前缀确保一致：`str =~# '\m\Cpattern'`

### ❌ 危险/脆弱命令
| 避免 | 改用 |
|------|------|
| `:s[ubstitute]`（移动光标、输出错误） | `search()` 函数 |
| `normal`（依赖用户映射） | `normal!` |

### 异常捕获
- ✅ `catch /E123:/`（匹配错误码）
- ❌ 不要匹配错误文本（因 locale 而异）

## 2. 通用指南

### 变量作用域
| 前缀 | 含义 |
|------|------|
| `g:` | 全局变量 |
| `s:` | 脚本局部变量 |
| `l:` | 函数局部变量 |
| `a:` | 函数参数 |
| `b:` | 缓冲区变量 |
| `w:` | 窗口变量 |
| `t:` | 标签页变量 |

### 类型检查
- ✅ 使用严格操作符：`is#`、`isnot#`
- ⚠️ Vimscript 中 `0 == 'foo'` → true！

```vim
" ✅ 正确
if s:var is# 'literal'
if s:var isnot# 'value'
```

## 3. 格式

| 规则 | 要求 |
|------|------|
| 缩进 | **2 空格** |
| 行长 | **80 字符** |
| 续行 | `\` + 对齐 |

```vim
call SomeFunction(arg1, arg2, \
    \ arg3, arg4)
```

## 4. 命名规范

| 分类 | 风格 | 示例 |
|------|------|------|
| **函数（脚本）** | `s:function_name` | `s:my_func()` |
| **自动加载函数** | `plugin#function` | `myplugin#func()` |
| **变量（脚本）** | `s:variable_name` | `s:my_var` |
| **全局变量** | `g:variable_name` | `g:my_var` |
| **缓冲区变量** | `b:variable_name` | `b:my_var` |

> 函数名小写开头，下划线分隔单词。

## 5. 语法

### 函数定义
```vim
function! s:my_func() abort
    " 函数体
endfunction
```
- `!` → 允许覆盖已存在函数
- `abort` → 遇到错误立即停止

### 控制流
```vim
" 条件
if condition
    " ...
elseif other_condition
    " ...
else
    " ...
endif

" 循环
for item in list
    " ...
endfor

while condition
    " ...
endwhile
```

## 6. 最佳实践

| 做法 | 代码 |
|------|------|
| 检查特性 | `if !has('python3')` |
| 检查变量 | `if !exists('g:my_plugin_enabled')` |
| 提前返回 | `:finish` |
| 抑制错误 | `:silent!` |
| 兼容性 | `vim9script` 或 `:set nocp` |
