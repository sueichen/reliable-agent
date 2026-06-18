---
language: java
source_url: https://google.github.io/styleguide/javaguide.html
license: CC-BY-3.0
---

# Java 语言代码规范（简洁版）

> 基于 Google Java Style Guide 的核心规则精简。

---

## 1. 命名规则速查表

| 类型 | 命名风格 | 示例 |
|------|---------|------|
| 包/模块名 | 全小写，直接连接 | `com.example.deepspace` |
| 类名 | UpperCamelCase | `UserAuthenticationService`, `HttpConnection` |
| 方法名 | lowerCamelCase | `sendMessage()`, `getUserName()` |
| 常量名 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `APPLICATION_NAME` |
| 非常量字段名 | lowerCamelCase | `userName`, `retryCount` |
| 参数名 | lowerCamelCase | `input`, `userName` |
| 局部变量名 | lowerCamelCase | `i`（循环可简短）, `userService` |
| 类型变量名 | 单大写字母 或 类名+T | `E`, `T`, `RequestT` |
| 未命名变量 | `_`（Java 21+） | `_ -> true` |

### 通用规则

- 仅使用 ASCII 字母、数字和下划线（仅常量使用下划线）
- **不使用**匈牙利命名法、`m_` 前缀、下划线开头/结尾
- 缩写视为普通单词：`XmlHttpRequest`（非 `XMLHTTPRequest`）, `getUrl`（非 `getURL`）

```java
// ✅ 正确
String userName;
int MAX_COUNT;
public class HttpConnection {}

// ❌ 错误：匈牙利命名法、特殊前缀
String strUserName;   // 类型前缀
String m_name;        // m_ 前缀
String _name;         // 下划线开头
```

---

## 2. 源文件结构

```
1. 许可证/版权信息（块注释，可选）
2. package 声明（不换行，不受 100 字符限制）
3. import 语句（不换行，不受 100 字符限制）
4. 恰好一个顶级类声明
```

各部分之间用 **恰好一个空行** 分隔。

### Import 顺序

```
空行分隔静态/非静态两组，组内按 ASCII 排序
```

```java
import static com.example.util.Uploader.UPLOAD_STATUS_SUCCESS;
import static com.example.util.Uploader.UPLOAD_STATUS_FAILED;

import com.example.model.User;
import com.example.service.UserService;
import java.io.IOException;
import java.util.Map;
import javax.sql.DataSource;
```

- **禁止**通配符导入：`import java.util.*;` 不允许
- **禁止**静态导入嵌套类
- 排序：静态导入组 → 空行 → 非静态导入组（各按 ASCII 排序）

---

## 3. 格式规则

### 3.1 缩进：2 空格

每次打开新块缩进 **2 个空格**，不使用制表符。

```java
public class Example {
  void method() {
    if (condition) {
      statement();
    }
  }
}
```

### 3.2 列限制：100 字符

超过 100 字符必须换行。例外：package 声明、import 语句、文本块内容、shell 命令行注释。

### 3.3 换行规则

- **非赋值运算符**前断行：`+ longName`（+ 在新行开头）
- **赋值运算符**后断行：`someVariable =`（= 在上一行末尾）
- 方法名与开括号附在一起
- 逗号与前一个 token 附在一起
- Lambda 箭头两侧不换行
- **续行缩进至少 +4 空格**

```java
// ✅ 非赋值运算符前断行
longName1 = longName2 * (longName3 + longName4 - longName5)
    + 4 * longname6;

// ✅ 赋值运算符后断行
someVariable =
    someMethodThatReturnsAValue();

// ✅ 方法参数换行
someMethodWithManyArguments(
    argument1, argument2, argument3,
    argument4, argument5);
```

### 3.4 大括号：K&R 风格（埃及花括号）

```
左花括号前不换行 → 左花括号后换行 → 右花括号前换行
```

```java
// ✅ K&R 风格
public void method() {
  if (condition) {
    try {
      doSomething();
    } catch (Exception e) {
      handleError(e);
    }
  } else {
    doOtherThing();
  }
}

// ❌ 左花括号换行
public void method()
{
  // ...
}

// ❌ 省略花括号（单条语句也必须加括号）
if (condition)
  doSomething();
```

空块可以用 `{}` 简洁形式，但 `if/else`、`try/catch/finally` 等多块语句不允许简洁空块。

### 3.5 空白

**垂直空白（空行）**：连续成员之间必须空行，多空行不鼓励。

**水平空白**：
- 关键字后空格：`if (`、`for (`、`catch (`
- 二元/三元运算符两侧加空格：`a + b`、`x > 0 && y < 0`
- 逗号、分号后加空格：`someMethod(a, b, c)`
- 类型和标识符之间：`String name`
- 注释前：`int x = 0;  // 注释`

### 3.6 每行一条语句

```java
// ✅
int a = 1;
int b = 2;

// ❌
int a = 1; int b = 2;
```

### 3.7 变量声明

- 每次声明一个变量（`for` 循环头除外）
- 需要时才声明（靠近首次使用处）

```java
// ✅
int a;
int b;

// ❌
int a, b;
```

### 3.8 数组

- 方括号是类型的一部分：`String[] args`（非 `String args[]`）
- C 风格声明不允许

### 3.9 枚举

```java
public enum Direction {
  NORTH,
  SOUTH,
  EAST,
  WEST,
}
```

### 3.10 switch

- switch 块缩进 +2，标签缩进 +2
- 旧式 switch fall-through **必须**注释
- 每个 switch 必须穷尽（default 或全覆盖）
- switch 表达式使用 `->` 箭头语法

```java
// 旧式：fall-through 需注释
switch (day) {
  case MONDAY:
  case FRIDAY:
    break;
  case TUESDAY:
    // fall through
  case WEDNESDAY:
    break;
  default:
    break;
}

// 新式（推荐）
int numLetters = switch (day) {
  case MONDAY, FRIDAY, SUNDAY -> 6;
  case TUESDAY                -> 7;
  default                     -> 0;
};
```

### 3.11 注解

- 类/方法注解每行一个
- 字段注解可放同一行
- 类型使用注解紧贴被注解的类型

```java
@Deprecated
@Beta
public class Example {
  @Override
  @Nullable
  public String getName() { return name; }

  @Inject @Nullable private String name;
}
```

### 3.12 修饰符顺序

```
public protected private abstract default static final sealed non-sealed
transient volatile synchronized native strictfp
```

```java
public static final String CONSTANT = "value";
```

### 3.13 数字字面量

`long` 使用大写 `L`：`123456789L`（非小写 `l`）

---

## 4. Javadoc

### 4.1 格式

```java
/** 单行 Javadoc */
public String getName() { ... }

/**
 * 多行 Javadoc。
 *
 * <p>段落以 {@code <p>} 开头。
 *
 * @param paramName 参数说明
 * @return 返回值说明
 * @throws ExceptionType 异常说明
 */
public String getDisplayName(String userId) { ... }
```

### 4.2 块标签顺序

1. `@param`（按参数声明顺序）
2. `@return`
3. `@throws`（按异常声明顺序）
4. `@deprecated`

### 4.3 何时必须写 Javadoc

**至少**每个 public 类及其 public 成员都需要 Javadoc。

**例外（可省略）**：
- 自我解释的简单成员（如 `getFoo()`）
- 重写超类的方法（行为一致时）
- 私有方法（推荐但不强制）

---

## 5. 编程实践

### @Override 始终使用

只要合法，所有覆写方法都加 `@Override`。

### 捕获的异常不忽略

空 catch 块须有注释说明理由。

```java
// ✅ 有注释
try {
  timer.cancel();
} catch (IllegalStateException e) {
  // 期望取消不一定成功
}

// ❌ 空 catch 无注释
try { risky(); } catch (Exception e) {}
```

### 静态成员用类名限定

```java
// ✅
Foo.aStaticMethod();

// ❌
Foo foo = new Foo();
foo.aStaticMethod();
```

### Finalizer 不使用

使用 `AutoCloseable` + `try-with-resources` 或 `Cleaner`（Java 9+）。

---

## 6. 快速对照表：好 vs 坏

| 规则 | ✅ 正确 | ❌ 错误 |
|------|---------|---------|
| 命名 | `XmlFormatter` | `XMLFormatter` |
| 命名 | `getUserId()` | `getUserID()` |
| 命名 | `MAX_COUNT` | `MAXCOUNT` / `max_count` |
| 包名 | `com.example.deepspace` | `com.example.deep_space` |
| 缩进 | 2 空格 | 制表符 |
| 大括号 | K&R | 换行左花括号 |
| 列限制 | ≤100 字符 | >100 字符不换行 |
| Import | 逐个导入 | `import java.util.*` |
| 数组 | `String[] args` | `String args[]` |
| long | `123L` | `123l` |
| 变量 | `int a; int b;` | `int a, b;` |
| switch fall-through | 加注释 | 无注释静默穿过 |

---

*本简洁版基于 Google Java Style Guide 核心规则整理，涵盖命名、格式、Javadoc、Import 顺序和关键编程实践。*
