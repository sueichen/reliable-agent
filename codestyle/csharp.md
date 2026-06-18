---
language: csharp
source_url: https://google.github.io/styleguide/csharp-style.html
license: CC-BY-3.0
---

# Google C# 语言代码规范（简洁版）

> 基于 Google C# Style Guide 提炼的核心规则，省略详细解释，保留要点、表格和正反例。

---

## 一、命名规则

### PascalCase 命名

| 类别 | 示例 |
|---|---|
| 类 | `public class DataModel` |
| 方法 | `public void ExecuteCommand()` |
| 枚举及枚举值 | `public enum FileMode { Open, Save }` |
| 公开字段 | `public static readonly TimeSpan InfiniteTimeout` |
| 公开属性 | `public string Name { get; set; }` |
| 命名空间 | `namespace System.Security` |
| 事件 | `public event EventHandler Exited` |
| 常量 | `public const int DefaultBufferSize = 4096` |
| 文件名与目录名 | `MyFile.cs` |
| 委托类型 | `public delegate void Callback()` |

### camelCase 命名

| 类别 | 示例 |
|---|---|
| 局部变量 | `int itemCount` |
| 方法参数 | `void Process(int iterations)` |

### \_camelCase 命名（下划线前缀）

| 类别 | 示例 |
|---|---|
| 私有字段 | `private string _name` |
| 保护字段 | `protected int _counter` |
| 内部字段 | `internal string _connectionString` |
| 私有属性 | `private string _internalData { get; set; }` |

### 接口

`I` 前缀 + PascalCase：`public interface IRepository { }`

### 缩写

缩写视为一个单词，仅首字母大写：

```csharp
// 正确
public void LoadRpcConfig()
public string HtmlText

// 错误
public void LoadRPCConfig()
public string HTMLText
```

### 修饰符不影响命名

```csharp
private static readonly int _maxThreadCount = 10;
```

---

## 二、文件组织

### 文件命名
- PascalCase，尽量与主类名一致。
- 尽量一个文件一个核心类。

### 修饰符顺序
```
public → protected → internal → private → new → abstract → virtual → override
→ sealed → static → readonly → extern → unsafe → volatile → async
```

```csharp
public static readonly int MaxItems = 100;
public virtual void Execute() { }
protected internal abstract void Render();
```

### using 声明
- 文件顶部、命名空间之前。
- 字母序排列，`System` 命名空间始终最前。

```csharp
using System;
using System.Collections.Generic;
using MyCompany.Core;
```

### 类成员排序

1. 嵌套类、枚举、委托、事件
2. 静态字段、常量、readonly 字段
3. 普通字段和属性
4. 构造函数和析构函数
5. 方法

每组内按可见性排序：`public → internal → protected internal → protected → private`

---

## 三、格式化规则

| 规则 | 说明 |
|---|---|
| 每行 | 最多一条语句、一个赋值 |
| 缩进 | 2 空格，不使用 Tab |
| 列宽 | 100 字符 |
| 编码 | UTF-8 |

### 花括号（K&R 风格，始终使用）

```csharp
// 正确
if (condition)
{
    DoSomething();
}
else
{
    DoOtherThing();
}

// 错误 —— 缺少花括号
if (condition) return;
```

### 空格

```csharp
// 正确
if (x > 0)
{
    for (int i = 0; i < count; i++) { }
    var result = a + b * c;
    i++;
}

// 错误
if(x>0)
{
    for( int i=0; i<count; i++ ) { }
    var result=a+b*c;
}
```

- `if/for/while/catch` 后跟一个空格。
- `(` 后无空格，`)` 前无空格。
- 逗号后一个空格。
- 二元运算符前后各一个空格。
- 一元操作符与操作数间无空格。

### 换行续行

- 续行缩进 4 空格。
- 参数对齐第一个参数；空间不足时用 4 空格。

```csharp
var result = SomeMethod(argument1,
                        argument2);
var result = SomeMethodWithVeryLongName(
    argument1, argument2);
```

---

## 四、const vs readonly

- 编译期可确定的值用 `const`。
- 运行时确定的值用 `static readonly`。
- 禁止魔数，使用命名常量。

```csharp
// 正确
public const int BufferSize = 4096;
public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);
private const int MaxRetryCount = 3;

// 错误 —— 魔数
if (retryCount > 3) { }
```

---

## 五、集合类型选择

### 输入参数

| 场景 | 推荐类型 |
|---|---|
| 仅需遍历 | `IEnumerable<T>` |
| 需索引访问、不应修改 | `IReadOnlyList<T>` |
| 仅需计数 | `IReadOnlyCollection<T>` |
| 需修改集合 | `ICollection<T>` / `IList<T>` |

### 返回值
- **转移所有权**（调用方可修改）：返回 `IList<T>` 或具体类型。
- **不转移所有权**（内部缓存）：返回 `IEnumerable<T>` 或 `IReadOnlyList<T>`。

---

## 六、生成器 vs 容器

```csharp
// 生成器（惰性求值）
public IEnumerable<int> GetItems()
{
    for (int i = 0; i < 100; i++) yield return i;
}

// 容器（即时填充）
public List<int> GetItems()
{
    var items = new List<int>(100);
    for (int i = 0; i < 100; i++) items.Add(i);
    return items;
}
```

- 生成器用于需要惰性处理的场景。
- 如果最终要 `.ToList()`，直接填充容器更高效。
- 多次遍历时容器性能远优于生成器。
- 生成器代码通常不如容器易读。

---

## 七、属性风格

```csharp
// 表达式主体只读属性
public string FullName => $"{_firstName} {_lastName}";

// 自动实现属性
public string Model { get; set; }
public string Name { get; set; } = "Default";

// 完整属性（自定义逻辑时）
private string _name;
public string Name
{
    get => _name;
    set { if (string.IsNullOrEmpty(value)) throw ...; _name = value; }
}
```

---

## 八、表达式主体语法

- **简单只读属性**：优先使用 `=>`。
- **方法定义**：不要使用表达式主体。

```csharp
// 推荐
public int Length => _items.Length;

// 不推荐
public int GetValue() => _value;
```

---

## 九、类 vs 结构体

- **绝大多数情况用 class**。
- 仅在以下条件**都满足**时考虑 struct：
  - 值类型语义
  - 实例很小（通常 16 字节以内）
  - 通常是短命的或嵌入在其他对象中
- 典型 struct：`Vector3`、`Point`、`Color`、`Bounds`

```csharp
public struct Vector3
{
    public float X { get; }
    public float Y { get; }
    public float Z { get; }
    public Vector3(float x, float y, float z) { X = x; Y = y; Z = z; }
}
```

---

## 十、Lambda 与命名方法

- 简单、单一位置使用的逻辑可用 Lambda。
- 非平凡或多处复用的逻辑，提取为命名方法。

```csharp
// 可以 —— 简单 Lambda
var activeItems = items.Where(x => x.IsActive).ToList();

// 不推荐 —— 非平凡的 Lambda
var processed = items.Select(item =>
{
    var temp = Transform(item);
    return FormatResult(temp);
}).ToList();

// 推荐 —— 提取为命名方法
var processed = items.Select(ProcessItem).ToList();
private string ProcessItem(Item item) { ... }
```

---

## 十一、LINQ 使用规范

- 优先使用方法扩展语法（Lambda），而非 SQL 风格的查询关键字。
- 优先短链 LINQ + 命令式代码的组合。
- 避免 `Container.ForEach(...)` 用于多语句代码块，改用 `foreach`。

```csharp
// 推荐 —— 方法语法
var result = items.Where(x => x.IsActive).OrderBy(x => x.Name).ToList();
var names = customers.Select(c => c.Name).ToList();

// 避免 —— SQL 风格
var result = from item in items where item.IsActive select item;

// 避免 —— 过度链式调用
var result = items.Where(...).SelectMany(...).Where(...).GroupBy(...).ToList();

// 避免 —— ForEach 多语句
items.ForEach(item => { Process(item); Log(item); });

// 推荐 —— 用 foreach
foreach (var item in items) { Process(item); Log(item); }
```

---

## 十二、数组 vs List

- 公开变量、属性、返回类型优先用 `List<T>`。
- 大小固定且构造时已知可用数组。
- 多维数组优先用数组。

```csharp
public List<string> GetUserNames() { ... }
private readonly int[] _monthDays = { 31, 28, 31, ... };
```

---

## 十三、字符串格式化

- 优先字符串内插 `$""`。
- 大量拼接时用 `StringBuilder`。

```csharp
// 推荐
var msg = $"User {name} logged in at {DateTime.Now}";

// 避免
var msg = "User " + name + " logged in at " + DateTime.Now;

// 大量拼接
var sb = new StringBuilder();
foreach (var item in items) sb.AppendLine($"Item: {item}");
```

---

## 十四、var 关键字

```csharp
// 鼓励 —— 类型显而易见
var apple = new Apple();
var customers = new List<Customer>();
var activeUsers = users.Where(u => u.IsActive).ToList();

// 不鼓励 —— 类型信息不明确
var success = true;              // 应写 bool
var count = 10;                  // 应写 int
var listOfItems = GetList();     // 返回类型不明确
```

---

## 十五、其他规则速查

| 规则 | 规范 |
|---|---|
| 类 vs 结构体 | 优先用 class |
| 委托调用 | `OnDataLoaded?.Invoke(this, EventArgs.Empty)` |
| 空集合返回 | 返回 `Enumerable.Empty<T>()` 而非 null |
| using 别名 | 不推荐，通常应提取为命名类 |
| 元组 | 内部临时使用可接受；公开 API 用命名类 |
| ref/out | 尽量用返回值；元组可替代多个 out |
| 对象初始化器 | 仅用于纯数据类；有显式构造函数时避免 |
| 命名空间层级 | 一般不超过 2 层 |
| 扩展方法 | 仅在原始类不可修改且功能通用时使用 |
| 遍历时移除元素 | 用 `RemoveAll()`，或构建新容器 |
| 字段初始化器 | 鼓励使用，减少构造函数重复代码 |
| 特性格式化 | 每个特性单独一行，与成员分行 |
| 参数命名 | 使用命名常量、枚举、命名参数提高可读性 |
| 文件夹结构 | 扁平为主；PascalCase；不强制匹配命名空间 |
| 返回值集合 | 优先返回空集合而非 null |

---

## 十六、完整示例类精简版

```csharp
namespace MyCompany.Storage
{
    public class StorageRecord
    {
        // 嵌套类型
        public enum RecordStatus { Pending, Active, Archived }

        // 常量与静态只读字段
        public const int MaxNameLength = 255;
        private const int DefaultBufferSize = 4096;
        public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);

        // 私有字段
        private string _name;
        private RecordStatus _status;
        private readonly List<string> _tags = new List<string>();

        // 属性
        public string Name
        {
            get => _name;
            set
            {
                if (string.IsNullOrWhiteSpace(value))
                    throw new ArgumentException("Name cannot be empty.", nameof(value));
                _name = value;
            }
        }
        public RecordStatus Status { get => _status; set => _status = value; }
        public DateTime CreatedAt { get; }
        public bool IsArchived => _status == RecordStatus.Archived;
        public IReadOnlyList<string> Tags => _tags.AsReadOnly();
        public string Category { get; set; } = "General";

        // 事件
        public event EventHandler OnStatusChanged;

        // 构造函数
        public StorageRecord(string name)
        {
            Name = name;
            _status = RecordStatus.Pending;
            CreatedAt = DateTime.UtcNow;
        }

        // 方法
        public void AddTag(string tag) { _tags.Add(tag); }
        public bool TryArchive()
        {
            if (_status == RecordStatus.Archived) return false;
            _status = RecordStatus.Archived;
            OnStatusChanged?.Invoke(this, EventArgs.Empty);
            return true;
        }
        public string GetSummary() => $"[{_status}] {_name} (Created: {CreatedAt:yyyy-MM-dd})";
    }
}
```

---

> 原文：https://google.github.io/styleguide/csharp-style.html
