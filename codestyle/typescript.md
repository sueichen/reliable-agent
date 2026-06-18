---
language: typescript
source_url: https://google.github.io/styleguide/tsguide.html
license: CC-BY-3.0
---

# TypeScript 语言代码规范 (简洁版)

> 基于 Google TypeScript Style Guide 提炼

---

## 1. 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 类、接口、类型别名、枚举、装饰器 | `UpperCamelCase` | `class UserService`, `interface UserConfig`, `type JsonValue`, `enum Color` |
| 变量、函数、方法、参数、属性 | `lowerCamelCase` | `const userName`, `function getUser()`, `private readonly maxCount` |
| 模块级不可变常量 | `CONSTANT_CASE` | `const MAX_RETRY_COUNT = 3` |
| 文件名 | `kebab-case` 或 `snake_case` | `user-service.ts`, `auth_utils.ts` |

标识符仅使用 ASCII 字母、数字和下划线，不用 `$`。

```typescript
// 正确
class UserAuthenticator {}
interface HttpResponse {}
const userName = 'Alice';
function fetchUserData(userId: string): Promise<User> { }
const MAX_FILE_SIZE = 1048576;

// 错误
class userAuthenticator {}        // 用小驼峰命名类
const UserName = 'Alice';         // 用大驼峰命名变量
function Fetch_User_Data() {}     // 函数命名格式错误
```

---

## 2. 格式化规则

- **缩进**：2 个空格，续行 +4 空格。不用 Tab。
- **分号**：每条语句末尾必须加分号。
- **引号**：优先使用单引号 `'`，插值用模板字符串。
- **大括号**：K&R 风格（左大括号不换行）。
- **行长**：不超过 100 字符。
- **空行**：类成员之间一个空行分隔。
- **每行一条语句**。

```typescript
// 正确
const greeting = 'Hello';
if (condition) {
  doSomething();
}

// 错误
const greeting = "Hello"    // 双引号 + 缺分号
if (condition)              // 左大括号换行
{
  doSomething();
}
```

---

## 3. 导入 (Imports)

### 3.1 导入方式

优先使用**命名导入** (`import { Foo } from '...'`)。

```typescript
// 推荐
import { formatDate, parseJson } from './tools';

// 不推荐：命名空间导入（除非模块本身是 API 命名空间）
import * as tools from './tools';
```

### 3.2 导入路径

- 同项目使用**相对路径**，无文件扩展名
- 路径大小写必须与实际文件一致
- 避免过深 `../../../`

```typescript
// 正确
import { User } from '../models/user';
import { formatDate } from './utils/date';

// 错误
import { User } from '@app/models/user';    // 别名路径（除非团队统一约定）
import { Foo } from './foo.ts';             // 带扩展名
import { Foo } from './foo';                // 文件名实际为 Foo.ts 时大小写不匹配
```

### 3.3 导入分组和排序

```
1. Node.js 内置模块     (fs, path)
2. 第三方依赖            (express, lodash)
3. 项目内部模块          (相对路径)

组间空行分隔，组内按字母序排列。
```

### 3.4 重命名导入

仅在避免命名冲突或与本地命名习惯保持一致时使用。

```typescript
// 可接受
import { get as getRequest } from './api/request';
import { get as getConfig } from './config/reader';

// 不推荐：仅为缩短名称
import { UserAuthenticationManager as Auth } from './auth';
```

---

## 4. 导出 (Exports)

### 4.1 禁止默认导出 (No Default Exports)

**强制使用命名导出**，禁止 `export default`。

```typescript
// 正确
export class UserService {}
export function formatName(first: string, last: string): string { }
export const API_VERSION = '1.0';

// 错误
export default class UserService {}
```

### 4.2 导出最小化

只导出公开 API，隐藏实现细节。

```typescript
// 正确
export class UserService {
  login(username: string, password: string): boolean {
    return this.validateCredentials(username, password);
  }
  private validateCredentials(username: string, password: string): boolean {
    // 内部实现不导出
  }
}

// 错误：导出内部细节
export function validateCredentials(username: string, password: string): boolean { }
```

### 4.3 禁止可变导出

导出的值必须用 `const`，禁止 `export let` / `export var`。可变状态通过函数或类封装。

```typescript
// 正确
export const MAX_RETRY_COUNT = 3;

// 错误
export let currentUser: User | null = null;
```

### 4.4 禁止容器类

不要用仅包含静态方法的类做命名空间。用独立函数替代。

```typescript
// 错误
export class StringUtils {
  static capitalize(str: string): string { }
  static truncate(str: string, maxLen: number): string { }
}

// 正确
export function capitalize(str: string): string { }
export function truncate(str: string, maxLen: number): string { }
```

---

## 5. 类型系统

### 5.1 `import type` / `export type`

仅导入/导出类型时必须使用 `import type` / `export type`。

```typescript
import type { User, UserConfig } from './models';
export type { InternalOptions };
```

### 5.2 尽量避免 `any`，用 `unknown` 替代

```typescript
// 错误
function parseData(data: any): any { }

// 正确
function parseData(data: string): unknown { }
```

### 5.3 类型断言

使用 `as` 语法，不用尖括号。

```typescript
// 正确
const value = someFunction() as MyType;

// 错误
const value = <MyType>someFunction();
```

### 5.4 `as const` 断言语

用 `as const` 创建深度不可变字面量类型。

```typescript
const COLORS = ['red', 'green', 'blue'] as const;   // readonly ["red", "green", "blue"]
const CONFIG = { timeout: 5000, retry: true } as const;
```

### 5.5 接口 vs 类型别名

- 接口 (interface)：定义对象形状
- 类型别名 (type)：联合类型、交叉类型、工具类型

```typescript
interface User { id: string; name: string; }
type JsonPrimitive = string | number | boolean | null;
type Status = 'active' | 'inactive';
```

### 5.6 数组声明

```typescript
const list: number[] = [1, 2, 3];       // 推荐
const readonlyList: readonly number[] = [1, 2, 3];  // 只读
const pair: [string, number] = ['age', 30];         // 元组
```

### 5.7 使用 `Record` 代替索引签名

```typescript
// 推荐
const cache: Record<string, number> = {};

// 不推荐
interface Cache { [key: string]: number | undefined; }
```

---

## 6. null / undefined

- **优先使用 `undefined`** 而非 `null`
- 启用 `strictNullChecks`
- 使用 `??`（空值合并）处理 null/undefined
- 使用 `?.`（可选链）避免深层空检查
- 尽量避免非空断言 `!`

```typescript
// 空值合并
const displayName = user.name ?? 'Anonymous';

// 可选链
const city = user?.address?.city;

// == null 同时检查 null 和 undefined
if (input == null) { return 'default'; }

// 不推荐：非空断言
const el = document.getElementById('root')!;

// 推荐：安全处理
const el = document.getElementById('root');
if (!el) throw new Error('Root element not found');
```

---

## 7. 其他最佳实践

- **变量声明**：`const` 优先，需要重赋值用 `let`，永不用 `var`。
- **readonly**：不可变属性和数组用 `readonly` 标记。
- **可见性**：公共 API 显式标记 `public`/`private`。
- **公共 API 类型注解**：必须显式书写返回值和参数类型。
- **注释**：公共 API 用 `/** ... */` JSDoc，内部实现用 `//`。

---

## 8. 总结检查清单

| 规则 | 要求 |
|------|------|
| 编码 | UTF-8 无 BOM |
| 换行 | LF |
| 缩进 | 2 空格，续行 +4 空格 |
| 分号 | 必须 |
| 引号 | 单引号优先 |
| 行长 | 不超过 100 字符 |
| 导入路径 | 相对路径、无扩展名 |
| 默认导出 | **禁用** |
| 命名导出 | **优先使用** |
| 可变导出 | 禁止（使用 const） |
| 容器类 | 禁止 |
| 空值 | 优先 undefined，少用 null |
| 类型断言 | 使用 `as` 语法 |
| 非空断言 | 避免使用 |
| `any` | 避免，使用 `unknown` |
| `import type` | 仅导入类型时使用 |
| `var` | 禁用，使用 `const`/`let` |
| 类命名 | `UpperCamelCase` |
| 函数/变量命名 | `lowerCamelCase` |
| 常量命名 | `CONSTANT_CASE` |
| 文件命名 | kebab-case 或 snake_case |
