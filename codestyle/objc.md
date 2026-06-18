---
language: objc
source_url: https://google.github.io/styleguide/objcguide.html
license: CC-BY-3.0
---

# Objective-C 语言代码规范（简洁版）

基于 Google Objective-C Style Guide 提炼的核心要点。

---

## 一、命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| **类名 / 协议名** | 大驼峰（PascalCase），加 3+ 字母前缀 | `GTMExample`, `GTMExampleDelegate` |
| **方法名** | 小驼峰（camelCase），小写开头，像句子一样流畅 | `- (void)addTarget:action:`, `- (Sandwich *)sandwich` |
| **函数名** | 大驼峰，非静态函数加前缀 | `GTMGetDefaultTimeZone()`, `static BOOL DeleteFile()` |
| **局部变量** | 小驼峰，小写开头 | `myLocalVariable`, `numberOfErrors` |
| **实例变量** | 小驼峰 + 前导下划线 | `_usernameTextField`, `_bar` |
| **全局变量** | 小驼峰 + `g` 前缀 | `gGlobalCounter`, `gAppLaunchDate` |
| **常量** | 混合大小写，全局常量加前缀；文件内静态常量可用小写 `k` 前缀 | `GTLServiceErrorDomain`, `static const int kFileCount = 12` |
| **宏** | 全大写下划线（SHOUTY_SNAKE_CASE） | `GTM_EXPERIMENTAL_BUILD`, `GTM_ASSERT_GT(X, Y)` |
| **文件名** | 反映类名，`.h` / `.m` / `.mm`；类别文件 `ClassName+CategoryName.h` | `GTMNSString+Utils.h` |

### 黄金规则

- 避免非标准缩写，名称应自文档化。
- 缩略词全大写（`URL`, `ID`, `TIFF`），即使位于名称开头（`URLWithString:`）。
- 返回 BOOL 的 getter 以 `is` 开头，属性声明用 `getter=isXxx`。
- 不要使用 `get` 前缀（`getDelegate` 错误，应为 `delegate`）。

---

## 二、格式与空格

### 2.1 缩进与行宽

- **缩进：2 空格**，不使用 Tab。
- **最大行宽：100 列**。

### 2.2 方法声明与定义

```objectivec
// 短方法在一行
- (void)doSomethingWithString:(NSString *)theString {
  ...
}
```

多参数时每个参数一行，冒号对齐，续行缩进至少 4 空格：

```objectivec
- (void)doSomethingWithFoo:(GTMFoo *)theFoo
                      rect:(NSRect)theRect
                  interval:(float)theInterval {
  ...
}

- (void)shortKeyword:(GTMFoo *)theFoo
            longerKeyword:(NSRect)theRect
    someEvenLongerKeyword:(float)theInterval
                    error:(NSError **)theError {
  ...
}
```

### 2.3 方法调用

与声明风格一致，要么一行，要么每个参数一行且冒号对齐：

```objectivec
[myObject doFooWith:arg1 name:arg2 error:arg3];

[myObject doFooWith:arg1
               name:arg2
              error:arg3];
```

### 2.4 条件与循环

```objectivec
// 运算符周围留空格
if (hasSillyName) LaughOutLoud();

for (int i = 0; i < 5; ++i) { ... }

while (test) {};
```

- 有 `else` 时必须两边都加花括号。
- fall-through 需要注释 `// Falls through.`

### 2.5 表达式

```objectivec
x = 0;
v = w * x + y / z;
v = -y * (x + z);
```

二元运算符两侧空格，一元运算符无空格，括号内无空格。

### 2.6 函数长度

超过约 **40 行** 应考虑拆分。

### 2.7 垂直空白

函数间空 1-2 行，函数体内避免多余空行。

---

## 三、属性（Properties）

### 3.1 声明规范

```objectivec
@property(nonatomic, copy) NSString *name;
@property(nonatomic, strong) Bar *bar;
@property(nonatomic, weak) id<Delegate> delegate;
@property(nonatomic, assign) int counter;
@property(nonatomic, readonly) NSDate *creationDate;

// BOOL 属性用 is 前缀
@property(nonatomic, getter=isGlorious) BOOL glorious;
```

### 3.2 属性关键字速查

| 关键字 | 用途 |
|--------|------|
| `nonatomic` | 非原子性（iOS 开发默认，性能更好） |
| `copy` | 拷贝语义，用于 `NSString`, `NSArray`, `NSSet`, `NSDictionary` 等有可变子类的类型 |
| `strong` | 强引用（ARC 默认） |
| `weak` | 弱引用，避免循环引用（delegate、parent 等） |
| `assign` | 原始类型（int, float, BOOL, CGFloat） |
| `readonly` | 只读 |
| `readwrite` | 读写（默认） |

### 3.3 点语法

- 点语法**仅用于属性**，不用于方法。
- BOOL 属性点语法不加 `is` 前缀：`object.glorious`（而非 `object.isGlorious`）。
- 枚举器、返回值非属性的方法不要用点语法。

```objectivec
// GOOD
BOOL isGood = object.glorious;
BOOL isGood = [object isGlorious];
id delegate = object.delegate;

// AVOID
BOOL isGood = object.isGlorious;
NSEnumerator *enumerator = frogs.reverseObjectEnumerator;
```

---

## 四、内存管理

### 4.1 ARC

- 默认使用 ARC。
- 在 `init` / `dealloc` 中**直接访问 ivar**（`_bar = ...`），不要使用属性访问器（`self.bar = ...`）。
- 弱引用用 `__weak` 或 `weak` 属性。
- 对象指针自动初始化为 `nil`，无需手动赋值 `0` 或 `nil`。

### 4.2 拷贝（Copy）

对于有可变子类的类型（`NSString`, `NSArray`, `NSSet`, `NSDictionary`），属性使用 `copy` 关键字：

```objectivec
@property(nonatomic, copy) NSString *name;
@property(nonatomic, copy) NSSet<FilterThing *> *filters;

// 自定义 setter 也需 copy
- (void)setFilters:(NSSet<FilterThing *> *)filters {
  _filters = [filters copy];
}
```

初始化方法中也应显式 copy：

```objectivec
- (instancetype)initWithName:(NSString *)name {
  self = [super init];
  if (self) {
    _name = [name copy];
  }
  return self;
}
```

### 4.3 避免循环引用

- delegate / target / block 指针不应强持有产生引用循环的对象。
- delegate 用 `weak` 属性。
- block 中使用 `__weak typeof(self) weakSelf = self;`（如在异步回调中）。

### 4.4 初始化方法

- 标识指定初始化器：`NS_DESIGNATED_INITIALIZER`。
- 覆写父类的指定初始化器。
- 不要在 `init` 中给 ivar 赋 `0` / `nil`（已默认）。
- 避免在 `init` / `dealloc` 中调用实例方法。

### 4.5 Singleton / 工厂方法

```objectivec
// 不使用 +new，使用 +alloc / -init
+ (instancetype)fooWithBar:(Bar *)bar {
  return [[self alloc] initWithBar:bar];
}
```

---

## 五、好 / 坏示例速览

### 5.1 命名

```objectivec
// GOOD
int numberOfErrors = 0;
int completedConnectionsCount = 0;
tickets = [[NSMutableArray alloc] init];
port = [network port];
NSDate *gAppLaunchDate;

// AVOID
int w;
int nerr;
int nCompConns;
tix = [[NSMutableArray alloc] init];
p = [network port];
```

### 5.2 方法名

```objectivec
// GOOD
- (void)addTarget:(id)target action:(SEL)action;
- (CGPoint)convertPoint:(CGPoint)point fromView:(UIView *)view;
- (Sandwich *)sandwich;

// AVOID
- (CGFloat)calculateHeight;   // 返回属性，无需 calculate
- (id)getDelegate;            // 不要 get 前缀
```

### 5.3 属性与点语法

```objectivec
// GOOD
BOOL isGood = object.glorious;
BOOL isGood = [object isGlorious];

// AVOID
BOOL isGood = object.isGlorious;
NSEnumerator *enumerator = frogs.reverseObjectEnumerator;
```

### 5.4 初始化

```objectivec
// GOOD - 直接访问 ivar，只设置非零值
- (instancetype)init {
  self = [super init];
  if (self) {
    _bar = 23;
  }
  return self;
}

// AVOID - 使用属性，可能被子类覆盖
- (instancetype)init {
  self = [super init];
  if (self) {
    self.bar = 23;       // AVOID
    [self sharedMethod]; // AVOID
  }
  return self;
}
```

### 5.5 nil 检查

```objectivec
// GOOD - 向 nil 发消息是安全的
[dataSource moveItemAtIndex:1 toIndex:0];

// AVOID - 不必要的 nil 检查
if (dataSource) {
  [dataSource moveItemAtIndex:1 toIndex:0];
}
```

---

## 六、其他重要规则

| 规则 | 说明 |
|------|------|
| **头文件声明顺序** | 属性 → 类方法 → 初始化方法 → 实例方法 |
| **包含文件顺序** | 关联头文件 → OS 头文件 → 语言库头文件 → 其他依赖（每组内字母序） |
| **使用伞状头文件** | `#import <Foundation/Foundation.h>` 而非单个文件 |
| **容器类型注解** | 使用轻量级泛型：`NSArray<Location *> *` |
| **无 unsigned int** | 避免使用无符号整数，除非匹配系统接口（如 `NSUInteger`） |
| **避免宏** | 优先用 `const`、枚举、函数替代宏 |
| **可空性注解** | 对公共 API 使用 `nonnull` / `nullable` |
| **避免抛异常** | 不要 `@throw`，使用 NSError 传递错误 |
| **NOLINT 标记** | 不符合样式的代码行末加 `// NOLINT` |
| **实例变量花括号** | 无实例变量时省略空花括号 `{}` |
