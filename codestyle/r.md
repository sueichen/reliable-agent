---
language: r
source_url: https://google.github.io/styleguide/Rguide.html
license: CC-BY-3.0
---

# R 语言代码规范简洁版

> 基于 Google R Style Guide 提炼，团队应统一遵循。

---

## 1. 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| **函数名** | `BigCamelCase`（大驼峰） | `CalculateMean()`, `FitModel()` |
| **变量名** | `snake_case`（小写+下划线） | `avg_price`, `total_count` |
| **私有函数** | `.` 点前缀 | `.validate_inputs()`, `.format_output()` |
| **文件名** | 简短有意义，`.R` 后缀 | `utils.R`, `predict-models.R` |
| **常量** | 全大写加下划线 | `MAX_ITER <- 1000`, `DEFAULT_ALPHA <- 0.05` |

```r
# 正确的命名
CalculateMean <- function(x) { ... }
avg_price <- 5
.validate_inputs <- function(x) { ... }

# 错误的命名
calculateMean <- function(x) { ... }   # 不使用小驼峰
calc_avg_price <- function(x) { ... }  # 函数不用 snake_case
avgPrice <- 5                           # 变量不用驼峰
avg.price <- 5                          # 不用点分隔
```

---

## 2. 格式规则

- **缩进**: 两个空格，禁止 Tab
- **行宽**: 不超过 80 字符
- **编码**: UTF-8，无 BOM
- **花括号**: K&R 风格，`else` 与 `}` 同行
- **赋值**: 用 `<-`，不用 `=`（`=` 仅用于函数参数传参）
- **注释**: `#` 后跟一个空格

```r
# 缩进与花括号
if (condition) {
  do_something()
} else {
  do_something_else()
}

# 赋值
x <- 5           # 正确
x = 5            # 错误
```

### 空格规则

- 二元运算符前后加空格: `x <- a + b`
- 逗号后加空格，逗号前不加: `mean(x, na.rm = TRUE)`
- 括号内不加空格: 正确 `mean(x)`, 错误 `mean( x )`
- 左花括号前加空格: `function(x) {`

### 长行换行

```r
LongFunctionName <- function(a_variable_with_a_long_name,
                             another_variable) {
  result <- a_variable_with_a_long_name +
    another_variable +
    1
  return(result)
}
```

---

## 3. 函数定义

- **显式 `return()`**: 必须使用，禁止依赖最后一个表达式隐式返回
- **参数默认值**: 用 `=`（函数定义内唯一用 `=` 的地方）
- **错误处理**: 使用 `stopifnot()` 或 `stop()`
- **一行只做一件事**: 分步写，不要多层嵌套

```r
# 正确
ComputeMean <- function(x, na_rm = TRUE) {
  stopifnot(is.numeric(x))
  result <- mean(x, na.rm = na_rm)
  return(result)
}

# 错误：隐式返回
ComputeMean <- function(x, na_rm = TRUE) {
  mean(x, na.rm = na_rm)
}

# 错误：多层嵌套
x <- FitModel(ValidateInput(ParseInput(raw_data)))
```

---

## 4. 管道与链式调用

- **使用 `|>`**（R >= 4.1）或 `%>%`
- 管道符放在**行末**
- 禁止右向赋值 `->`
- 复杂逻辑提取为具名函数，不在管道内嵌入复杂匿名函数

```r
# 正确
result <- iris |>
  subset(Sepal.Length > 5) |>
  nrow()

# 正确：管道放行末
data |>
  filter(!is.na(value)) |>
  group_by(category) |>
  summarise(mean_val = mean(value, na.rm = TRUE))

# 错误：右向赋值
iris |> nrow() -> result

# 不推荐：管道放行首
data
  |> filter(!is.na(value))
```

---

## 5. 命名空间限定

- 外部包函数优先用 `::`（如 `dplyr::filter()`）
- 以下可省略 `::`:
  - 基础 R 包：`base`、`stats`、`utils`、`graphics`、`grDevices`、`methods`、`datasets`
  - 中缀运算符：`%>%`、`%in%` 等
  - 已通过 `@importFrom` 导入的函数（包内代码）

```r
# 正确
dplyr::filter(data, column > 0)
stats::median(x, na.rm = TRUE)

# 默认包可省略
mean(x, na.rm = TRUE)
lm(y ~ x, data = df)
```

---

## 6. 禁止与警示

| 行为 | 原因 | 替代方案 |
|------|------|----------|
| **`attach()`** | 搜索路径污染，名称冲突 | `df$col` 或 `with(df, ...)` |
| **`library()` 在函数内** | 副作用，破坏封装 | 放在脚本顶部或用 `::` |
| **`T` / `F`** | 是变量可被覆盖 | 用 `TRUE` / `FALSE` |
| **`<<-` 超级赋值** | 副作用难追踪 | 用闭包或返回值 |
| **`setwd()`** | 不可移植 | 用 `here::here()` |
| **`rm(list = ls())`** | 删除所有对象 | 重启 R 会话 |

---

## 7. 包级文档

- 包入口文件包含 `"_PACKAGE"` 标记
- 所有导出函数用 Roxygen 文档：`@param`, `@return`, `@export`, `@examples`
- 推荐 `usethis::use_package_doc()` 自动生成骨架

---

## 8. 检查工具

```r
lintr::lint_package()     # 风格检查
styler::style_pkg()       # 自动格式化
goodpractice::gp()        # 综合检查
```

---

> 参考 [Google R Style Guide](https://google.github.io/styleguide/Rguide.html) 整理
