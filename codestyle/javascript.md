---
language: javascript
source_url: https://google.github.io/styleguide/jsguide.html
license: CC-BY-3.0
---

# Google JavaScript 代码规范简洁版

> 根据 Google JavaScript Style Guide 提炼。新项目推荐使用 TypeScript。

---

## 一、源文件基础

| 规则 | 要求 |
|------|------|
| 编码 | UTF-8 |
| 空白字符 | 仅 ASCII 空格 (0x20)，禁止全角空格 |
| 文件命名 | 全小写 + 下划线/短横线，如 `user_service.js`、`math-utils.js` |
| 文件扩展名 | `.js` |

**错误：** `MathUtils.js`、`mathUtils.js`、`math.utils.js`

---

## 二、源文件结构

顺序（每节之间空一行）：
1. 许可/版权信息（可选）
2. `@fileoverview` JSDoc（可选）
3. `import`/`export` 语句
4. 代码主体

---

## 三、模块系统（重点）

### 3.1 只使用命名导入，禁止默认导入

```javascript
// GOOD
import {createId} from './identifier.js';
import {Component, Renderer} from './component.js';

// BAD
import createId from './identifier.js';        // 默认导入
import * as identifier from './identifier.js'; // 命名空间导入
```

### 3.2 只使用命名导出，禁止默认导出

```javascript
// GOOD
export class User { /* ... */ }
export const MAX_RETRY_COUNT = 3;
export function formatDate(date) { /* ... */ }

// BAD
export default class User { /* ... */ }  // 默认导出
```

### 3.3 导入路径必须含 `.js` 扩展名

```javascript
// GOOD
import {User} from './models/user.js';

// BAD
import {User} from './models/user';
```

### 3.4 禁止循环依赖

需要打破循环依赖时：提取公共代码到第三个模块、使用依赖注入、或重新设计职责划分。

---

## 四、格式化规则

### 缩进与列宽

- 缩进 **2 个空格**，禁止 Tab
- 续行缩进 **4 个空格**
- 每行最多 **80 个字符**

### 大括号（K&R 风格）

所有控制结构必须使用大括号，左大括号不换行：

```javascript
// GOOD
if (condition) {
  doSomething();
}

// BAD
if (condition) doSomething();
if (condition)
  doSomething();
```

### 分号

**必须使用分号**，禁止依赖 ASI（自动分号插入）。

### 变量声明

- 使用 `const` / `let`，**禁止使用 `var`**
- 优先用 `const`，需要重新赋值时才用 `let`

### 字符串

- 优先使用 **单引号** 或 **模板字符串**
- 双引号仅用于避免转义（如字符串内含单引号）

```javascript
const name = 'Alice';
const greeting = `Hello, ${name}!`;
const msg = "It's a beautiful day!";
```

### 尾逗号

多行数组/对象字面量最后一个元素后保留逗号：

```javascript
const list = ['apple', 'banana', 'cherry',];
const config = {host: 'localhost', port: 8080, debug: true,};
```

---

## 五、命名规范

| 类别 | 风格 | 示例 |
|------|------|------|
| 变量 | `lowerCamelCase` | `userName`, `maxCount` |
| 函数/方法 | `lowerCamelCase` | `getUserName`, `formatDate` |
| 参数 | `lowerCamelCase` | `element`, `index` |
| 类 | `UpperCamelCase` | `UserService`, `HttpRequest` |
| 枚举类型 | `UpperCamelCase` | `Color`, `HttpStatus` |
| 常量 | `CONSTANT_CASE` | `MAX_SIZE`, `API_BASE_URL` |
| 私有属性/方法（约定） | 尾部下划线 | `this.count_`, `compute_()` |
| 文件/目录名 | `lower_case` | `user_service.js` |

```javascript
// 常量
const MAX_RETRY_COUNT = 3;

// 变量 / 函数
const userName = 'Alice';
function getFullName(firstName, lastName) { /* ... */ }

// 类
class UserAccount { /* ... */ }

// 私有约定（非强制）
class Counter {
  constructor() { this.count_ = 0; }
  increment_() { this.count_++; }       // "私有"方法
}
```

标识符只允许 ASCII 字母、数字、`_` 和 `$`，不能以数字开头。`$` 前缀保留给自动生成代码。

---

## 六、JSDoc

### 格式

```javascript
/**
 * 计算两个数字的和。
 * @param {number} a 第一个加数
 * @param {number} b 第二个加数
 * @return {number} 两个数字的和
 */
function add(a, b) { return a + b; }
```

### 常用类型注解

| 写法 | 含义 |
|------|------|
| `{string}` | 字符串 |
| `{number}` | 数字 |
| `{boolean}` | 布尔值 |
| `{*}` | 任意类型 |
| `{Array<string>}` | 字符串数组 |
| `{Object<string, number>}` | 对象映射 |
| `{number\|string}` | 联合类型 |
| `{?string}` | 可为 null |
| `{function(string): number}` | 函数类型 |
| `{Promise<number>}` | Promise |

### 常用标签

```javascript
/**
 * @fileoverview 文件概述
 * @license Apache-2.0
 * @constructor 构造函数
 * @param {string} name 参数说明
 * @return {string} 返回值说明
 * @throws {Error} 异常说明
 * @template T  泛型
 * @typedef {{host: string, port: number}} ConfigOptions  类型定义
 * @private @const  私有常量属性
 */
```

### 公开 API 必须编写完整的 JSDoc 类型注解。

---

## 七、语言特性速览

| 特性 | 推荐用法 |
|------|---------|
| 箭头函数 | 回调中优先使用，如 `items.map(x => x * 2)` |
| 模板字符串 | 替代字符串拼接，如 `` `Hello, ${name}!` `` |
| 解构赋值 | `const {name, age} = user;` |
| 默认参数 | `function createUser(name, age = 18) { }` |
| 剩余/扩展 | `function sum(...numbers) { }`; `const c = [...a, ...b]` |
| 类 | 使用 ES6 `class`，不用 `prototype` |
| for...of | 优先于传统 for 和 forEach |

---

## 八、好 / 坏示例对比

### ES Module 完整好示例

```javascript
/**
 * @fileoverview 用户数据访问对象。
 * @license Apache-2.0
 */

import {createId} from './identifier.js';
import {validateEmail} from '../utils/validation.js';

export class User {
  constructor(name, email) {
    /** @private @const {string} */
    this.id_ = createId();
    /** @private {string} */
    this.name_ = name;
  }

  /** @return {string} */
  getId() { return this.id_; }

  /** @return {string} */
  getName() { return this.name_; }
}
```

### 常见错误

```javascript
export default class Config { }          // BAD: 默认导出
import {Config} from './config';         // BAD: 缺 .js
var name = 'Alice';                      // BAD: 使用 var
if (cond) console.log('true');           // BAD: 省略大括号
const greeting = "Hello";               // BAD: 非必要双引号
```

### 对应正确写法

```javascript
export class Config { }
import {Config} from './config.js';
const name = 'Alice';
if (cond) { console.log('true'); }
const greeting = 'Hello';
```

---

## 附录：速查表

| 规则 | 要求 |
|------|-------|
| 编码 | UTF-8 |
| 缩进 | 2 空格 |
| 列限制 | 80 字符 |
| 大括号 | K&R 风格，禁止省略 |
| 分号 | 必须使用 |
| 变量声明 | `const` / `let`，禁止 `var` |
| 字符串 | 单引号或模板字符串 |
| 文件命名 | `lower_case.js` |
| 模块导入 | 命名导入，禁止默认导入 |
| 路径扩展名 | 必须含 `.js` |
| 模块导出 | 命名导出，禁止默认导出 |
| 循环依赖 | 禁止 |
| 类名 | `UpperCamelCase` |
| 变量/函数名 | `lowerCamelCase` |
| 常量名 | `CONSTANT_CASE` |
| JSDoc | 公开 API 必须写完整类型注解 |
