---
language: angularjs
source_url: https://google.github.io/styleguide/angularjs-google-style.html
license: CC-BY-3.0
---

# AngularJS 代码规范（简洁版）

> 基于 Google AngularJS Style Guide 整理的核心规则速查。

---

## 1. 依赖管理

| 规则 | 说明 |
|------|------|
| **提供/引用** | `goog.provide` / `goog.require` |
| **模块引用** | 使用 `.name` 属性代替硬编码字符串 |

```javascript
// ✅ 正确：使用 .name 属性
my.application.module = angular.module('hello', [my.submoduleA.name]);

// ❌ 错误：硬编码字符串
my.application.module = angular.module('hello', ['my.submoduleA']);
```

## 2. 控制器

### controller as 风格（推荐 Angular 1.2+）

```javascript
/**
 * @constructor
 * @ngInject
 * @export
 */
hello.mainpage.HomeCtrl = function() {
  /** @type {string} */
  this.myColor = 'blue';
};

hello.mainpage.HomeCtrl.prototype.add = function(a, b) {
  return a + b;
};
```

模板：
```html
<div ng-controller="hello.mainpage.HomeCtrl as homeCtrl">
  <span ng-class="homeCtrl.myColor">Colorful!</span>
  <span>{{homeCtrl.add(5, 6)}}</span>
</div>
```

### 规则
- ✅ 控制器方法是类 → 定义在 `prototype` 上
- ✅ 使用 `controller as` 导出控制器到作用域
- ✅ `$scope` 注入（仅 1.2 之前版本需要）

## 3. 服务

```javascript
/** @constructor @ngInject @export */
hello.UserService = function($http) {
  /** @type {!angular.$http} */
  this.$http_ = $http;
};

hello.UserService.prototype.getUser = function(userId) {
  return this.$http_.get('/api/users/' + userId);
};
```

- ✅ 构造函数定义，方法在原型上
- ✅ `$inject` 或 `@ngInject` 注解依赖

## 4. 指令

| 规则 | 要求 |
|------|------|
| 命名 | `lowerCamelCase` |
| restrict | `'E'`（元素）或 `'A'`（属性） |
| 控制器 | 使用 `controllerAs` |
| 绑定 | `bindToController` |
| DOM 操作 | 在指令中处理，不在控制器中 |

```javascript
hello.myDirective = function() {
  return {
    restrict: 'E',
    templateUrl: '/path/to/template.html',
    controller: hello.MyDirectiveCtrl,
    controllerAs: 'ctrl',
    bindToController: { name: '=', onChange: '&' },
    scope: {}
  };
};
```

## 5. 模板

| 规则 | 说明 |
|------|------|
| ✅ `ng-src` / `ng-href` | 代替 `src` / `href` |
| ✅ `ng-bind` | 代替 `{{ }}`（避免闪烁） |
| ❌ 避免复杂表达式 | 使用过滤器代替方法调用 |
| ✅ 相对路径 | 引用模板 |

```html
<img ng-src="{{imageUrl}}">
<a ng-href="{{linkUrl}}">Link</a>
<span ng-bind="userName"></span>
```

## 6. 依赖注入

```javascript
// 方式 1：$inject
MyCtrl.$inject = ['$scope', '$http'];

// 方式 2：内联数组
module.controller('MyCtrl', ['$scope', '$http', function($scope, $http) {
  // ...
}]);
```

- ✅ 保持注入顺序一致
- ✅ `@ngInject` 注解（推荐）

## 7. 测试

- ✅ Jasmine → 单元测试
- ✅ Protractor → 端到端测试

```javascript
describe('HomeCtrl', function() {
  var ctrl;
  beforeEach(module('hello'));
  beforeEach(inject(function($controller) {
    ctrl = $controller('hello.mainpage.HomeCtrl');
  }));
  it('should have default color', function() {
    expect(ctrl.myColor).toBe('blue');
  });
});
```
