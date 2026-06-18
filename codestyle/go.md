---
language: go
source_url: https://google.github.io/styleguide/go/decisions
license: CC-BY-3.0
---

# Go 语言代码规范简洁版

## 核心三原则

### Clarity（清晰性 > 简洁性 > 性能）
- 代码的首要目标是 **可读**，让读者立刻明白做了什么和为什么这么做
- **命名即文档**，名称反映用途和语义，而非实现细节
- 注释解释 **为什么**，不解释 **做什么**（代码本身已说明做了什么）
- 避免在副作用中隐藏关键逻辑

### Simplicity（简洁性）
- **最少机制原则**：优先核心语言构造（slice/map/struct/interface）-> 标准库 -> 自定义抽象
- **避免过早抽象**：不要为"未来可能的需要"引入接口、泛型或工厂模式
- **标准库优先**：能用 net/http 不用第三方路由，能用 encoding/json 不用其他 JSON 库

### Concision（简洁表达）
- **高信噪比**：减少冗余、重复，每行都有信息量
- **通过分解提高清晰度**：复杂条件拆分为具名中间变量
- **减少 boilerplate**：善用结构体字面量、分组声明

---

## 命名规则

### MixedCaps（驼峰命名）
Go 使用驼峰式，**不使用下划线**（snake_case）。

```go
// Bad
var user_name string
const MAX_RETRY_COUNT = 3

// Good
var userName string
const MaxRetryCount = 3
```

### 命名速查表

| 分类 | 风格 | 示例 |
|------|------|------|
| 包名 | 全小写，简洁 | `bytes`, `http` |
| 导出类型/函数/字段 | `UpperCamelCase` | `UserService`, `DoSomething()` |
| 未导出类型/函数/字段 | `lowerCamelCase` | `userService` |
| 接口名 | `UpperCamelCase`（-er 后缀） | `Reader` |
| 常量 | `mixedCaps` | `maxLength` |
| 缩写 | 全大写或全小写，不混用 | `HTTPClient`, `userID` |

### 接收器命名
- 短（1-2 字母），同一类型保持一致
- `func (u *User) Name() string` 而非 `func (this *User) Name() string`

### 不要重复上下文
```go
// Bad
type UserService struct { UserName string; UserEmail string }

// Good
type User struct { Name string; Email string }
```

---

## 格式化（gofmt 强制性）

所有 Go 代码必须使用 `gofmt`（或 `go fmt`）格式化，**没有例外**。

```bash
gofmt -l -w .
```

| 规则 | 说明 |
|------|------|
| 缩进 | 使用 tab，而非空格 |
| 花括号 | 左花括号不换行 |
| 空格 | 操作符两侧加空格 |
| 行尾 | 无行尾空格 |
| import 分组 | 标准库/第三方/本地，每组空行 |
| 行长度 | 无固定限制，先考虑重构而非换行 |

---

## 错误处理

- **显式错误处理**：不使用异常，使用 `if err != nil` 显式处理
- **错误字符串小写**，不包含换行符，用 `%w` 包装以支持 `errors.Is/As`
- **哨兵错误**：`var ErrNotFound = errors.New("not found")`
- **避免 panic**：仅在真正无法恢复时使用
- **不要在非 main 包中使用 log.Fatal**（会跳过 defer）
- **defer 中处理错误**：命名返回值捕获 close 错误

```go
// Good pattern
result, err := doSomething()
if err != nil {
    return fmt.Errorf("do something: %w", err)
}
```

---

## 好/坏示例对照

| 场景 | Bad | Good |
|------|-----|------|
| 函数命名 | `func f(x int) int` | `func ComputeNthMagicNumber(n int) int` |
| 冗余抽象 | 为加法定义接口 | 直接 `func Add(a, b int) int` |
| if-else | `if x>0 { r="pos" } else { r="neg" }` | 先赋值默认值再 if 覆盖 |
| 错误忽略 | `result, _ := doSomething()` | `result, err := doSomething(); if err != nil { ... }` |
| 常量风格 | `const MAX_BUFFER_SIZE = 4096` | `const MaxBufferSize = 4096` |
| 结构体初始化 | 逐字段赋值 | 结构体字面量 `Config{Host: "localhost"}` |
| 巨型函数 | 200 行 HandleRequest | 拆分为 parse/process/write 子函数 |
| 循环变量 | goroutine 中直接使用循环变量 | `u := u` 创建副本或用参数传递 |
| 切片增长 | 不预分配 | `make([]int, 0, n)` 预分配容量 |

---

## 关键原则总结

1. **局部一致性优先于全局一致性**：同一代码库的代码应看起来像同一个人写的
2. **先写出清晰的代码**，有性能分析证据后再优化
3. **利用零值**：nil slice 可用 range/append，零值 Mutex 可直接用
4. **context 作为函数第一个参数**
5. **表格驱动测试（Table-driven Tests）** 是 Go 的标准测试模式
6. **避免循环导入**：提取公共类型或使用接口
7. **始终使用 go mod** 和 `go vet ./...`
