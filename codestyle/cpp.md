---
language: cpp
source_url: https://google.github.io/styleguide/cppguide.html
license: CC-BY-3.0
---

# C++ 语言代码规范（简洁版）

> 基于 Google C++ Style Guide 的极简速查版，仅保留最核心的规则和示例。

---

## 1. 核心原则

- **规则应有价值**：每个规则的收益必须大于记忆成本
- **为读者优化**：花在阅读代码上的时间远多于编写，可读性优先
- **保持一致**：代码库内风格一致，与更广泛 C++ 社区保持一致
- **避免危险构造**：禁止令人惊讶或易出错的特性
- **注意规模**：代码库规模巨大时，命名冲突和全局污染代价极高
- **必要时让步于优化**：性能优化可适当突破上述原则

---

## 2. 头文件规则速查

- **自包含**：每个 `.h` 文件可独立编译，包含自身所需的所有头文件
  ```cpp
  #ifndef FOO_BAR_BAZ_H_
  #define FOO_BAR_BAZ_H_
  // ...
  #endif  // FOO_BAR_BAZ_H_
  ```
- **#define 保护符**：`<PROJECT>_<PATH>_<FILE>_H_` 格式，全大写+下划线
- **包含所需即所得**：直接包含用到的每个符号，不依赖传递包含
  ```cpp
  // foo.cc - 即使 foo.h 已包含 <string>，此处仍需直接包含
  #include "foo.h"
  #include <vector>
  ```
- **头文件包含顺序**：关联头文件 → C 系统头文件 → C++ 标准库 → 其他库 → 项目头文件；每组字母序、组间空行分隔
  ```cpp
  #include "foo/server/fooserver.h"
  
  #include <unistd.h>
  
  #include <string>
  #include <vector>
  
  #include "base/basictypes.h"
  #include "foo/server/bar.h"
  ```
- **前置声明**：避免使用，优先直接包含头文件
- **头文件中定义函数**：仅对 ≤10 行的短函数在声明处定义；较长函数放在 `.cc` 文件或头文件内部区域

---

## 3. 作用域规则

- **命名空间**：代码放入命名空间，snake_case 命名
  ```cpp
  namespace my_namespace {
    // ...
  }  // namespace my_namespace
  ```
- **禁止 `using namespace foo`**（using-directive），允许 using-declaration（如 `using ::foo::Bar`）
- **禁止内联命名空间**（inline namespace）
- **内部链接**：`.cc` 文件中不需要外部引用的定义放入匿名命名空间或声明为 `static`；`.h` 文件中禁止
  ```cpp
  namespace {
    // 仅本文件可见
  }  // namespace
  ```
- **局部变量**：最小作用域，声明时立即初始化
  ```cpp
  int i = f();                          // 好
  int i; i = f();                       // 不好
  
  std::vector<int> v = {1, 2};          // 好
  std::vector<int> v; v.push_back(1);   // 不好
  ```
- **静态/全局变量**：禁止非平凡析构函数；优先 `constexpr` 或 `constinit`；动态初始化不鼓励
  ```cpp
  constexpr int kNum = 10;              // 允许
  const std::string kFoo = "foo";       // 禁止（非平凡析构函数）
  ```

---

## 4. 类规则速查

- **构造函数**：禁止调用虚函数；避免复杂初始化；考虑工厂函数或 `Init()` 方法
- **隐式转换**：单参数构造函数和转换运算符必须加 `explicit`；拷贝/移动构造函数除外
  ```cpp
  explicit Foo(int x);                  // 好
  Foo(int x);                           // 不好——可能隐式转换
  ```
- **拷贝/移动**：公共 API 必须明确声明拷贝、移动或两者皆禁止
  ```cpp
  class Copyable {
   public:
    Copyable(const Copyable& other) = default;
    Copyable& operator=(const Copyable& other) = default;
  };
  class MoveOnly {
   public:
    MoveOnly(MoveOnly&& other) = default;
    MoveOnly(const MoveOnly&) = delete;
    MoveOnly& operator=(const MoveOnly&) = delete;
  };
  ```
- **结构体 vs 类**：纯数据用 `struct`（所有字段 public，无不变量），其余用 `class`
- **继承**：组合优于继承；所有继承为 `public`；虚函数覆盖必须用 `override` 或 `final`
  ```cpp
  class MyClass : public OtherClass {
    void SomeFunction() override;
  };
  ```
- **运算符重载**：审慎使用，含义必须明显；禁止重载 `&&`、`||`、`,`、一元 `&`、`operator""`
- **访问控制**：数据成员为 `private`，除非是常量
- **声明顺序**：`public:` → `protected:` → `private:`；每组内：类型→静态常量→工厂函数→构造/析构→其他函数→数据成员

---

## 5. 函数规则速查

- **输出优先用返回值**，而非输出参数
  ```cpp
  std::string Bar(const std::string& input);   // 好
  void Foo(const std::string& input, std::string* output);  // 不好
  ```
- **参数顺序**：纯输入参数在前，输出参数在后
  ```cpp
  int Foo(const std::string& input, int* output);  // 好
  void Foo(int* output, const std::string& input);  // 不好
  ```
- **短函数原则**：超过 40 行应考虑拆分
- **函数重载**：仅当调用点能清晰区分，且语义无差异时使用
- **默认参数**：允许非虚函数；**禁止虚函数默认参数**
  ```cpp
  void Process(const std::string& name, int timeout = 30);  // 允许
  virtual void Render(int dpi = 72);   // 禁止！
  ```
- **尾置返回类型**：仅当普通语法不可行时使用（如 lambda、模板返回类型推导）

---

## 6. 命名规范表（完整！）

| 类别 | 命名风格 | 示例 |
|------|---------|------|
| **文件** | 小写 + 下划线或连字线 | `my_useful_class.cc` |
| **类型**（类/结构体/别名/枚举） | PascalCase | `MyClass`, `UrlTable` |
| **概念**（Concepts） | PascalCase | `Sortable`, `EqualityComparable` |
| **变量**（函数参数/局部变量） | snake_case | `table_name`, `num_entries` |
| **类数据成员** | snake_case + 尾部 `_` | `table_name_` |
| **结构体数据成员** | snake_case | `num_entries` |
| **常量**（constexpr/const 静态存储期） | `k` + PascalCase | `kDaysInAWeek` |
| **函数** | PascalCase | `AddTableEntry()` |
| **访问器/修改器** | snake_case | `count()`, `set_count()` |
| **命名空间** | snake_case | `my_namespace` |
| **枚举值** | `k` + PascalCase | `kOk`, `kOutOfMemory` |
| **宏** | 全大写 + 下划线 + 项目前缀 | `MYPROJECT_ROUND(x)` |
| **模板参数（类型）** | PascalCase | `T`, `KeyType` |
| **模板参数（非类型）** | 变量/常量命名风格 | `kBufferSize`, `size` |

**变量命名示例：**
```cpp
std::string table_name;              // 好
std::string tableName;               // 不好

class TableInfo {
 private:
  std::string table_name_;           // 类成员尾部下划线
  static Pool<TableInfo>* pool_;
};

struct UrlTableProperties {
  std::string name;                  // 结构体成员无尾部下划线
  int num_entries;
};

const int kDaysInAWeek = 7;          // 常量命名

int count() const;                   // 访问器
void set_count(int count);           // 修改器
```

**函数命名示例：**
```cpp
AddTableEntry()                      // 好——PascalCase
DeleteUrl()
OpenFileOrDie()
```

**枚举命名示例：**
```cpp
// 好
enum class UrlTableError {
  kOk = 0,
  kOutOfMemory,
  kMalformedInput,
};

// 不好——类宏风格
enum class AlternateUrlTableError {
  OK = 0,
  OUT_OF_MEMORY = 1,
};
```

---

## 7. 格式速查

### 缩进

- **仅使用空格**，缩进 **2 个空格**，禁止 Tab
- `public:` / `protected:` / `private:` 缩进 **1 个空格**
- 命名空间内容**不缩进**
- 换行参数缩进 **4 个空格**

### 括号

- 左大括号在语句**末尾**，不单独占行
  ```cpp
  if (condition) {                     // 好
    DoSomething();
  }
  ```
- 函数左括号在函数名同一行，函数名和 `(` 之间无空格
  ```cpp
  ReturnType ClassName::FunctionName(Type par_name1, Type par_name2) {
    // ...
  }
  ```
- 括号内**无空格**；`if`/`for`/`while` 关键字后有一空格
  ```cpp
  if (condition) {}                    // 好
  if(condition) {}                     // 不好
  if ( condition ) {}                  // 不好
  ```

### 空格

- 赋值运算符、二元运算符两侧有空格：`x = 0`、`v = w * x + y / z`
- 一元运算符与操作数之间无空格：`-5`、`++x`、`!y`
- 分号前无空格，分号后有空格：`for (int i = 0; i < 5; ++i)`
- 行尾注释前两个空格：`int i = 0;  // 注释`
- 左大括号前始终有一个空格
- 指针/引用：类型与 `*`/`&` 之间不留空格，`*`/`&` 与变量名之间不留空格：`char* c`、`const std::string& str`
- 尖括号内无空格：`std::vector<std::string>`

### 行长

- 每行最多 **80 个字符**
- 可超长的例外：注释、字符串字面量、`#include`、头文件保护符、using-declaration

### 函数调用换行

```cpp
// 全部在一行
bool result = DoSomething(argument1, argument2, argument3);

// 与第一个参数对齐
bool result = DoSomething(averyverylongargument1,
                          argument2, argument3);

// 所有参数在新行，4 空格缩进
bool result = DoSomething(
    argument1, argument2, argument3);
```

### 循环和分支

```cpp
if (condition) {
  DoOneThing();
} else if (int a = f(); a != 3) {
  DoAThirdThing(a);
} else {
  DoNothing();
}

while (condition) {
  RepeatAThing();
}

for (int i = 0; i < 10; ++i) {
  RepeatAThing();
}
```

### 类格式

```cpp
class MyClass : public OtherClass {
 public:
  MyClass();
  explicit MyClass(int var);
  ~MyClass() {}

  void SomeFunction();

 private:
  int some_var_;
};
```

### 构造函数初始化列表

```cpp
MyClass::MyClass(int var)
    : some_var_(var), some_other_var_(var + 1) {   // 4 空格缩进
  DoSomething();
}
```

### 返回值

```cpp
return result;                        // 好
return (result);                      // 不好——不要多余括号
return(result);                       // 不好——return 不是函数
```

### 变量初始化

```cpp
int x = 3;
int x(3);
int x{3};                             // 防止收窄：int pi{3.14} 编译错误
std::string name{"Some Name"};
```

---

## 8. 注释规范

- **文件注释**：许可证样板开头
- **类注释**：非显而易见的类需说明用途和使用方法
  ```cpp
  // Iterates over the contents of a GargantuanTable.
  // Example:
  //    std::unique_ptr<GargantuanTableIterator> iter = table->NewIterator();
  //    for (iter->Seek("foo"); !iter->done(); iter->Next()) {
  //      process(iter->key(), iter->value());
  //    }
  class GargantuanTableIterator { ... };
  ```
- **函数注释**：几乎每个函数声明前都应注释（简单明显的可省略）；以动词短语开头；说明输入输出、参数含义
  ```cpp
  // Returns an iterator for this table, positioned at the first entry
  // lexically greater than or equal to `start_word`.
  std::unique_ptr<Iterator> GetIterator(absl::string_view start_word) const;
  ```
- **不要注释显而易见的内容**：解释"为什么"而非"是什么"
  ```cpp
  // 不好：if (std::find(...) != v.end()) { Process(element); }  // 明显！
  // 好：
  if (!IsAlreadyProcessed(element)) {
    Process(element);
  }
  ```
- **TODO 注释**：`TODO` 全大写，后跟 bug ID 或姓名
  ```cpp
  // TODO(bug 12345678): Update this list after the Foo service is turned down.
  ```

---

## 9. 关键禁令清单

| 禁止的特性 | 说明 | 替代方案 |
|-----------|------|---------|
| C 风格类型转换 | `(int)x` | `static_cast<int>(x)` 或大括号 `int{x}` |
| `using namespace foo` | 污染命名空间 | 使用 `using ::foo::Bar` |
| 内联命名空间 | inline namespace | 普通命名空间 |
| `std` 命名空间中的声明 | 未定义行为 | 禁止前置声明/特化 |
| 异常 | C++ exceptions | 错误码、`absl::StatusOr` |
| RTTI（`typeid`、`dynamic_cast`） | 生产代码中避免 | 虚函数、Visitor 模式 |
| 非标准扩展 | `__attribute__`、内联汇编、`#pragma` | 标准 C++ |
| `std::auto_ptr` | 已废弃 | `std::unique_ptr` |
| C++20 Modules | 工具链支持不足 | 传统头文件 |
| `std::filesystem` | 测试支持不足 | Abseil 文件系统库 |
| `<ratio>`、`<cfenv>`、`<fenv.h>` | 特性受限或不可靠 | — |
| 用户定义字面量 | `operator""` | 普通函数 |
| 重载 `&&`、`||`、`,`、一元 `&` | 改变短路语义/不安全 | — |
| `long double` | 不可移植 | `float` 或 `double` |
| 非平凡析构函数的全局/静态变量 | 生命周期问题 | `constexpr`、平凡类型、函数局部静态指针 |
| 虚函数默认参数 | 无法正确分派 | 函数重载 |
| `#pragma once` | 非标准 | 标准 `#define` 保护符 |
| 宏定义 C++ API | 难以维护和调试 | 内联函数、枚举、`const` 变量 |
| C++23 特性 | 当前目标为 C++20 | 等待标准演进 |
| 协程自实现 promise/awaitable | 仅使用已批准的库 | 项目负责人批准 |
| 匈牙利命名法 | `iNum` 等 | Google 命名规则 |

---

## 10. 常用代码示例

### 完整类示例

```cpp
#ifndef FOO_MYCLASS_H_
#define FOO_MYCLASS_H_

#include <memory>
#include <string>
#include <vector>

namespace my_namespace {

class MyClass : public OtherClass {
 public:
  // 类型别名
  using MyType = int;

  // 静态常量
  static constexpr int kVersion = 1;

  // 工厂函数
  static std::unique_ptr<MyClass> Create();

  // 构造函数：单参数必须 explicit
  explicit MyClass(const std::string& name);

  // 拷贝控制（默认）
  MyClass(const MyClass& other) = default;
  MyClass& operator=(const MyClass& other) = default;

  // 析构函数
  ~MyClass();

  // 成员函数
  void Process(const std::string& input);

  // 访问器/修改器（snake_case）
  int count() const { return count_; }
  void set_count(int count) { count_ = count; }

 private:
  std::string name_;
  int count_ = 0;
};

}  // namespace my_namespace

#endif  // FOO_MYCLASS_H_
```

### 命名空间与内部链接示例

```cpp
#include "foo/myclass.h"

#include <algorithm>
#include <vector>

ABSL_FLAG(bool, verbose, false, "Enable verbose logging");

namespace my_namespace {

// using-declaration（允许）
using ::other_project::HelperFunc;

namespace {
  // 匿名命名空间：内部链接，仅本文件可见
  int InternalHelper() { return 42; }
}  // namespace

void MyClass::Process(const std::string& input) {
  // 局部变量：最小作用域
  std::vector<int> results = {1, 2, 3};

  // 范围 for
  for (const auto& item : results) {
    if (item > 0) {
      InternalHelper();
    }
  }
}

}  // namespace my_namespace
```

### 格式综合示例

```cpp
class FormatExample : public BaseClass {
 public:
  FormatExample(const std::string& name, int value)
      : name_(name), value_(value) {
    UpdateInternalState();
  }

  void LongFunctionName(int very_long_parameter_name,
                         int another_long_parameter, int third_one) {
    // 第一行参数过多时换行，对齐第一个参数
    bool ok = DoSomething(very_long_parameter_name,
                          another_long_parameter, third_one);
    if (!ok) {
      LOG(ERROR) << "Operation failed";
      return;
    }

    // lambda 表达式
    auto lambda = [this, &ok](int x) -> int {
      return x * value_;
    };

    // short-circuit 条件
    if (this_one > that_one &&
        another_condition == kExpectedValue &&
        last_check) {
      Execute();
    }

    // 前缀自增
    for (int i = 0; i < 10; ++i) {
      DoWork(i);
    }
  }

  // 避免 C 风格转换
  double ToDouble(int x) {
    return static_cast<double>(x);  // 好
    // return (double)x;            // 不好
  }

  // 使用 nullptr，而非 NULL 或 0
  void UseNull() {
    int* ptr = nullptr;
  }

 private:
  std::string name_;
  int value_ = 0;
};
```

---
