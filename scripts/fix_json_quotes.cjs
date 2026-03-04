const fs = require('fs');
const path = require('path');

// 读取命令行参数
const args = process.argv.slice(2);
const helpText = `
Usage:
  node scripts/fix_json_quotes.js <file-path> [--replace-single]

Options:
  --replace-single    是否将内层所有的单引号 '' 替换为转义的双引号 \\"\\"
`;

if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log(helpText);
  process.exit(0);
}

const filePathArg = args[0];
const replaceSingleQuotes = args.includes('--rs');

const filePath = path.resolve(process.cwd(), filePathArg);

if (!fs.existsSync(filePath)) {
  console.error(`❌ 文件不存在: ${filePath}`);
  process.exit(1);
}

// 逐行处理 JSON 文件
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split(/\r?\n/);

const newLines = lines.map((line) => {
  // 匹配类似: "key": "value", 或 "key": "value"
  let m = line.match(/^(\s*"[^"]+"\s*:\s*")(.*)(")(,?)\s*$/);

  if (!m) {
    // 匹配类似数组元素: "value", 或 "value"
    m = line.match(/^(\s*")(.*)(")(,?)\s*$/);
  }

  if (m) {
    const prefix = m[1];
    let inner = m[2];
    const suffix = m[3] + m[4];

    // 1. 先把原来已经转义的 \" 还原成 "，防止出现多次重复转义 (\\" -> ")
    inner = inner.replace(/\\"/g, '"');

    // 2. 如果开启了单引号替换，将所有的单引号 ' 替换为 "
    if (replaceSingleQuotes) {
      inner = inner.replace(/'/g, '"');
    }

    // 3. 将内容中所有的双引号 " 统一转义为 \"
    inner = inner.replace(/"/g, '\\"');

    return prefix + inner + suffix;
  }

  return line;
});

const newContent = newLines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf-8');

// 校验修复后的 JSON 是否合法
try {
  JSON.parse(newContent);
  console.log(`✅ 成功修复 JSON 格式: ${filePath}`);
} catch (e) {
  console.error(`⚠️ 已经执行了替换，但 JSON 仍然不合法，请手动检查: ${filePath}`);
  console.error(e.message);
}
