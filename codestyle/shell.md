---
language: shell
source_url: https://google.github.io/styleguide/shellguide.html
license: CC-BY-3.0
---

# Google Shell 语言代码规范（简洁版）

> 精简自 Google Shell Style Guide，突出最常用的规则与反模式。

---

## 1. Shebang

所有可执行脚本以 `#!/bin/bash` 开头。不推荐 `#!/usr/bin/env bash`。

```bash
#!/bin/bash     # 正确
```

## 2. set 标志

脚本中必须使用：

```bash
#!/bin/bash
set -o errexit   # 等价 set -e，遇错误退出
set -o nounset   # 等价 set -u，未定义变量时报错
set -o pipefail  # 管道中任一命令失败则整体失败
```

简明写法：

```bash
#!/bin/bash
set -euo pipefail
```

## 3. 命名约定

| 类别 | 格式 | 示例 |
|------|------|------|
| 函数 | 小写+下划线, 动词开头 | `get_user_home()`, `is_valid_ip()` |
| 变量 | 小写+下划线 | `host_name`, `file_count` |
| 常量 / readonly | 大写+下划线 | `MAX_RETRY_COUNT=3`, `readonly DEFAULT_PORT=8080` |
| 局部变量 | `local` 声明 | `local name="$1"` |

函数中的变量必须用 `local`，避免污染全局命名空间。

## 4. 格式

### 4.1 缩进

使用 **2 个空格**，不要使用 Tab。

```bash
# 正确：2 空格
if [[ -f "${file}" ]]; then
  echo "found"
  source "${file}"
fi
```

### 4.2 行长度

**每行不超过 80 个字符。** 超长时用反斜杠断行：

```bash
# 正确：换行
some_command \
  --option1 value1 \
  --option2 value2

# 管道换行
command1 \
  | command2 \
  | command3 \
  > output.txt
```

### 4.3 语句格式

`; then` 和 `; do` 与 `if`/`for`/`while` 同行：

```bash
# 正确
if [[ -f "${file}" ]]; then
  echo "存在"
fi

for i in {1..10}; do
  echo "${i}"
done
```

### 4.4 case 语句

```bash
case "${expr}" in
  a)
    variable="value-a"
    ;;
  b|c)
    variable="value-b-or-c"
    ;;
  *)
    variable="default"
    ;;
esac
```

确保提供 `*)` 默认分支。

## 5. 引号规则

**所有变量扩展必须用双引号包围。** 防止单词分割和路径扩展。

```bash
# 正确
name="John Smith"
echo "你好, ${name}!"
cp "${source}" "${destination}"
current_date="$(date +%Y-%m-%d)"

# 错误
echo $name          # 被分割成两个参数
cp $source $dest    # 空格路径会断裂
```

大括号 `{}` 必须用于所有变量：

```bash
# 正确
echo "欢迎, ${name}!"
my_path="${HOME}/projects/${project_name}"

# 错误
echo "欢迎, $name!"
```

### 单引号与双引号

- **双引号**：字符串需要变量替换或命令替换时使用。
- **单引号**：字面字符串，不解析变量。
- **通配符**：通配符本身不加引号，但结果变量要加引号。

```bash
literal='${name} 是字面文本，不展开'
for file in ./src/*.c; do
  cat "${file}"
done
```

## 6. 其他核心规则

### 6.1 条件测试

使用 `[[ ... ]]` 而非 `[ ... ]`：

```bash
if [[ -f "${config_file}" ]]; then ...      # 正确
if [ -f "${config_file}" ]; then ...        # 错误
```

`[[ ... ]]` 支持模式匹配和正则，且不发生单词分割和路径扩展。

### 6.2 命令替换

使用 `$(command)` 而非反引号：

```bash
current_dir="$(pwd)"     # 正确
current_dir=`pwd`        # 错误
```

### 6.3 算术运算

使用 `(( ... ))` 或 `$(( ... ))`，不用 `expr`：

```bash
result=$(( a + b ))      # 正确
result=$(expr $a + $b)   # 错误
if (( a + b > 10 )); then echo "大"; fi
```

### 6.4 数组

使用数组而非空格分隔的字符串：

```bash
files=("a.log" "b.log" "c.log")
for file in "${files[@]}"; do
  echo "处理: ${file}"
done
```

### 6.5 管道与 while

使用进程替换避免子 Shell 问题：

```bash
# 错误：counter 在子 Shell 中修改，外部不生效
counter=0
grep "ERROR" log | while read -r line; do
  ((counter++))
done
echo "${counter}"   # 仍是 0

# 正确：使用进程替换
counter=0
while read -r line; do
  ((counter++))
done < <(grep "ERROR" log)
echo "${counter}"   # 正确
```

### 6.6 避免 eval

```bash
eval "echo ${user_input}"   # 禁止！命令注入风险
value="${!varname}"         # 用间接引用代替
```

### 6.7 检查返回值

始终检查关键命令的返回值：

```bash
if ! mkdir -p "${dir}"; then
  echo "创建目录失败" >&2
  exit 1
fi
```

### 6.8 错误输出到 STDERR

```bash
die() {
  echo "[ERROR] $*" >&2
  exit 1
}
```

### 6.9 main 函数

包含足够逻辑的脚本应定义 `main()` 并在末尾调用：

```bash
main() {
  # ... 逻辑 ...
}
main "$@"
```

### 6.10 使用 ShellCheck

所有脚本必须通过 ShellCheck 检查。

## 7. 常见反模式速查

| 反模式 | 推荐做法 |
|--------|----------|
| `` `command` `` | `$(command)` |
| `[ condition ]` | `[[ condition ]]` |
| `expr 1 + 2` | `$(( 1 + 2 ))` |
| `eval "$var"` | 避免使用 |
| `for i in $(ls)` | `for file in ./*` |
| `cat file \| cmd` | `cmd < file` |
| `cmd \| while read` | `while read < <(cmd)` |
| `which cmd` | `command -v cmd` |
| `return` (裸) | `return 0` |

---

> 参考: [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
