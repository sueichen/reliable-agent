---
language: python
source_url: https://google.github.io/styleguide/pyguide.html
license: CC-BY-3.0
---

# Python 语言代码规范简洁版（Google 风格速查表）

> 基于 Google Python Style Guide。缩进 2 空格，仅摘核心规则与示例。

---

## 一、命名规范速查表

### 命名约定总览

| 类型 | 公有 | 内部（_前缀） |
|------|------|----------------|
| 包 | `lower_with_under` | |
| 模块 | `lower_with_under.py` | `_lower_with_under.py` |
| 类 | `CapWords` | `_CapWords` |
| 异常 | `CapWords`（后缀 Error） | |
| 函数 | `lower_with_under()` | `_lower_with_under()` |
| 全局常量/类常量 | `CAPS_WITH_UNDER` | `_CAPS_WITH_UNDER` |
| 全局变量/类变量 | `lower_with_under` | `_lower_with_under` |
| 实例变量 | `lower_with_under` | `_lower_with_under`（受保护） |
| 方法名 | `lower_with_under()` | `_lower_with_under()` |
| 函数参数/方法参数 | `lower_with_under` | |
| 局部变量 | `lower_with_under` | |
| 类型别名 | `CapWords` | `_CapWords` |

### 命名禁忌

- 禁止单字符名（例外：计数器 `i/j/k/v`，异常 `e`，文件句柄 `f`）
- 禁止模块/包名含连字符 `-`
- 禁止首尾双下划线 `__dunder__`（Python 保留）
- 禁止不必要含类型名（如 `id_to_name_dict`）
- 禁止冒犯性词语

### 下划线惯例

| 写法 | 含义 |
|------|------|
| `_name` | 内部使用（受保护），模块/类内可用 |
| `__name` | 名称修饰（name mangling），不推荐，建议用 `_` |
| `name_` | 避免与关键字冲突 |

### 文件命名

- 后缀必须是 `.py`，禁止连字符
- 单元测试方法名：`test_<方法>_<状态>`（小写下划线）

---

## 二、格式规则

### 缩进

- **4 空格**缩进，禁止制表符
- 隐式续行（括号内）对齐左括号或 4 空格悬挂缩进

```python
# 正确：对齐左括号
foo = long_function_name(var_one, var_two,
                         var_three, var_four)

# 正确：4 空格悬挂缩进
foo = long_function_name(
    var_one, var_two, var_three,
    var_four)

# 错误：首行有元素
foo = long_function_name(var_one, var_two,
    var_three, var_four)

# 错误：2 空格悬挂缩进
foo = long_function_name(
  var_one, var_two, var_three,
  var_four)
```

- 尾部逗号：仅当 `]` `)` `}` 与最后一个元素不在同一行时使用

### 行长

- 最大 **80 字符**
- 用隐式续行（圆/方/花括号），**禁止 `\` 显式续行**
- 例外：长 import、URL、路径、pylint 禁用注释

```python
# 正确：隐式续行
foo_bar(self, width, height, color='黑', design=None, x='foo',
        emphasis=None, highlight=0)

# 正确：with 多上下文
with (
    very_long_first_expression_function() as spam,
    very_long_second_expression_function() as beans,
):
    place_order(eggs, beans, spam, beans)

# 错误：反斜杠续行
if width == 0 and height == 0 and \
    color == '红' and emphasis == '加粗':
```

### 括号

- 宁缺毋滥。`return`/`if`/`while` 不要滥用括号

```python
# 正确
if foo: bar()
return foo
return spam, beans
onesie = (foo,)    # 单元素元组

# 错误
if (x): bar()
return (foo)
```

### 空行

- 顶级定义（函数/类）之间：**2 个空行**
- 方法定义之间：**1 个空行**

### 空白

```python
# 括号内无空格
spam(ham[1], {eggs: 2})     # 正确
spam( ham[ 1 ], { eggs: 2 } )  # 错误

# 逗号/分号/冒号前无空格，后需有空格
if x == 4: print(x, y)      # 正确
if x == 4 : print(x , y)    # 错误

# 二元运算符两侧空格
x == 1                      # 正确
x==1                        # 错误

# 关键字参数 = 两侧无空格（有类型注解时例外）
def foo(a, b=0): ...        # 正确
def foo(a, b = 0): ...      # 错误
def foo(a: int = 0): ...    # 正确（有类型注解时 = 带空格）
```

### 分号

- 行尾不加分号，禁止用分号合并多语句

### Shebang

- `.py` 文件不必加 `#!`，主文件可用 `#!/usr/bin/env python3`

---

## 三、注释与文档字符串

### 文档字符串（docstring）

- 使用 **`"""`** 三重双引号
- 首行概述不超过 80 字符，以句号结尾
- 概述后空一行，后续内容缩进与首行引号对齐

```python
def fetch_smalltable_rows(
    table_handle: smalltable.Table,
    keys: Sequence[bytes | str],
    require_all_keys: bool = False,
) -> Mapping[bytes, tuple[str, ...]]:
    """从 Smalltable 获取数据行.

    参数:
        table_handle: 处于打开状态的 smalltable.Table 实例.
        keys: 要获取的行的键值.
        require_all_keys: 如果为 True，只返回所有键值都有对应数据的行.

    返回:
        一个字典，把键值映射到行数据上。

    抛出:
        IOError: 访问 smalltable 时出现错误.
    """
```

**文档字符串标准小节：**

| 小节 | 用法 |
|------|------|
| `Args:` | 参数名 + 冒号 + 描述 |
| `Returns:` | 返回值的类型和含义 |
| `Yields:` | 生成器使用，替代 Returns |
| `Raises:` | 异常名 + 冒号 + 条件 |

### 类文档

```python
class SampleClass:
    """类的概述。

    属性:
        likes_spam: 是否喜欢午餐肉。
        eggs: 下蛋数量。
    """
```

### 行内注释

- 井号与代码至少隔 **2 空格**，井号与注释至少隔 **1 空格**
- 注释说"为什么"，不说"是什么"

```python
if i & (i - 1) == 0:  # i 是 0 或 2 的整数次幂
```

### TODO 注释

```python
# TODO(crbug.com/192795): 研究 cpufreq 的优化。
# TODO(用户名): 使用 '*' 代表重复。
```

---

## 四、语言规则速览

### 导入

- 只导入包和模块：`import x` 或 `from x import y`
- **禁止相对导入**，使用完整包名
- 例外：`typing`、`collections.abc`、`typing_extensions` 可导入符号

**导入顺序（分组，每组内按字典序排序）：**

1. `from __future__ import ...`
2. Python 标准库
3. 第三方库
4. 代码仓库子包

### 异常

- 优先内置异常（如 `ValueError`）
- **禁止 `except:`**，禁止 `except Exception`（除非重抛或隔离点）
- 最小化 `try` 块范围
- 自定义异常以 `Error` 结尾（如 `FooError`）
- `assert` 用于内部正确性校验，不用来验证公开 API

```python
# 正确
if minimum < 1024:
    raise ValueError(f'最小端口号至少为 1024, 不能是 {minimum}.')

# 错误
assert minimum >= 1024, '最小端口号至少为 1024.'
```

### 可变全局状态

- 避免全局变量。用模块级常量（全大写）或内部变量（`_` 前缀）
- 全局常量命名：`MAX_VALUES = 100`

### 列表推导

- 简单场景可用：映射、for、过滤各一行
- 禁止多重 for 和多重过滤，复杂时用循环

```python
# 正确
result = [mapping_expr for value in iterable if filter_expr]

# 错误
result = [(x, y) for x in range(10) for y in range(5) if x * y > 10]
```

### 条件表达式（三元）

```python
# 正确
one_line = 'yes' if predicate(value) else 'no'

# 各部分不超一行，复杂用完整 if
```

### 默认参数

- **禁止可变对象**（如 `[]`, `{}`）作为默认值
- 用 `None` + 函数体内赋值

```python
# 正确
def foo(a, b=None):
    if b is None:
        b = []

# 错误
def foo(a, b=[]): ...
```

### True/False 求值

- 用隐式假值：`if foo:` 而非 `if foo != []:`
- `None` 判断必须用 `is None`
- 空序列用 `if not seq:`
- 整数显式比较：`if i % 10 == 0:` 而非 `if not i % 10:`

### 装饰器

- 审慎使用，仅在显著优势时用
- **避免 `staticmethod`**，用模块级函数替代
- `classmethod` 仅用于具名构造函数或修改全局状态

### 高级特性

- 避开：元类、字节码操作、动态继承、`getattr` 技巧、`__del__` 等

### 资源管理

- 使用 `with` 语句管理文件和 socket

```python
with open("hello.txt") as hello_file:
    for line in hello_file:
        print(line)
```

### 字符串

- 优先用 f-string，其次 `%`、`format`；禁止用 `+` 格式化
- 循环中拼接字符串用 `''.join(list)` 或 `io.StringIO`
- 引号一致保持文件内统一

```python
# 正确
x = f'名称: {name}; 分数: {n}'
x = '%s, %s!' % (imperative, expletive)

# 错误
x = '名称: ' + name + '; 分数: ' + str(n)
```

### 日志

- 第一个参数用字符串字面量（含 `%` 占位符），**不用 f-string**

```python
# 正确
logging.info('TensorFlow 版本: %s', tf.__version__)

# 错误
logging.info(f'TensorFlow 版本: {tf.__version__}')
```

### Main

```python
from absl import app

def main(argv):
    ...

if __name__ == '__main__':
    app.run(main)
```

### 函数长度

- 超过 40 行考虑拆分，保持小巧专一

---

## 五、类型注解要点

### 基本规则

- 公开 API 必须注解；注解 `self`/`cls` 仅在有额外类型信息时
- 无需注解 `__init__` 返回值
- 默认值参数 `=` 两侧加空格（仅在有类型注解时）

```python
# 正确
def func(a: int = 0) -> int: ...

# 错误
def func(a:int=0) -> int: ...
```

### None 处理

- 必须显式标注 `X | None`（推荐）或 `Optional[X]`
- 禁止隐式 `Optional`

```python
# 正确
def modern(a: str | None = None) -> str: ...
def legacy(a: Optional[str] = None) -> str: ...

# 错误
def bad(a: str = None) -> str: ...
```

### 换行规则

```python
def my_method(
    self,
    first_var: int,
    second_var: Foo,
    third_var: Bar | None,
) -> int:
    ...
```

### 类型别名

```python
_LossAndGradient: TypeAlias = tuple[tf.Tensor, tf.Tensor]
```

### 泛型

- 尽量填入类型参数，避免默认 `Any`

```python
# 正确
def get_names(ids: Sequence[int]) -> Mapping[int, str]: ...

# 错误（等价于 Sequence[Any]）
def get_names(ids: Sequence) -> Mapping: ...
```

### 条件导入

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import sketch

def f(x: "sketch.Sketch"): ...
```

---

## 六、Lint 规则总结

| 规则 | 要求 |
|------|------|
| 必须运行 pylint | 用 google pylintrc 配置 |
| 抑制警告 | `# pylint: disable=<符号名>`，必须加注释 |
| 禁用旧格式 | 用 `# pylint: disable` 而非 `disable-msg` |
| 未使用参数 | 用 `del` 并注释"未使用"，或用 `_` 前缀 |
| pylint 查询 | `pylint --list-msgs` 查看所有；`pylint --help-msg=<名>` 查详情 |

### pylint disable 示例

```python
def do_PUT(self):  # pylint: disable=invalid-name
    ...

def viking_cafe_order(spam: str, beans: str, eggs: str | None = None) -> str:
    del beans, eggs  # 未被维京人使用。
    return spam + spam + spam
```

---

## 七、核心错误模式速查

| 模式 | 禁止 | 替代 |
|------|------|------|
| 反斜杠续行 | `\` 换行 | 括号隐式续行 |
| 多重列表推导 | `[(x,y) for x in r for y in r2]` | 循环 |
| 可变默认参数 | `def f(a=[])` | `def f(a=None)` + 体内赋值 |
| 裸 except | `except:` | `except SpecificError:` |
| 隐式 None | `a: str = None` | `a: str \| None = None` |
| `+` 字符串格式化 | `a + ', ' + b` | f-string / `%` / `format` |
| 循环 `+=` 字符串 | `s += x` | `''.join(list)` |
| 全局变量 | 模块级可变全局量 | 模块级常量（全大写）/ `_` 内部变量 |
| 导入符号 | `from x import func` | `from x import module` / `import x` |
| `== False` | `if x == False` | `if not x` |
| `len()` 判空 | `if len(seq):` | `if not seq:` |

---

*核心原则：保持一致性（BE CONSISTENT）。观察周围代码风格，遵循局部规范。*
