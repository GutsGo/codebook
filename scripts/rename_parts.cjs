const fs = require('fs');
const path = require('path');

/**
 * 脚本：按 part_xxx.ext 数字顺序重命名图片
 *
 * 支持两种模式：
 * 1. 脚本内置配置 (TASKS 数组)
 * 2. 命令行传入: node scripts/rename_parts.cjs <目录路径> <名称列表字符串>
 */

const TASKS = [
  // 在这里配置多个任务
  {
    dir: '/Users/alien/Downloads/ti1',
    names:
      "Ranunculus, Sweet Alyssum, Lobelia erinus, Columbine, Larkspur, Lupin, Four o'clock flower, Cypress Vine, Phlox, Soapwort, Lychnis, Silene armeria, Carnation, Strawflower, Forget-me-not",
  },
];

function processTask(dirPath, namesStr) {
  const resolvedPath = path.resolve(dirPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`错误: 目录不存在 - ${resolvedPath}`);
    return;
  }

  // 支持多种分隔符：, ， 、
  const names = namesStr
    .split(/[,，、]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (names.length === 0) {
    console.error(`错误: 目录 ${dirPath} 未提供有效的名称列表`);
    return;
  }

  // 获取目录下所有 part_ 开头的文件
  const files = fs
    .readdirSync(resolvedPath)
    .filter((f) => f.toLowerCase().startsWith('part_'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });

  if (files.length === 0) {
    console.log(`目录 ${dirPath}: 未找到符合 part_xxx 格式的文件。\n`);
    return;
  }

  console.log(`正在处理目录: ${resolvedPath}`);
  console.log(`找到 ${files.length} 个文件，准备匹配 ${names.length} 个名称...`);

  files.forEach((file, index) => {
    if (index < names.length) {
      const ext = path.extname(file);
      // 格式化名称：小写，空格替换为下划线，移除括号等特殊字符
      const formattedName = names[index]
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[()（）]/g, '')
        .replace(/_{2,}/g, '_') // 防止出现双下划线
        .replace(/^_+|_+$/g, ''); // 移除首尾下划线

      const newName = formattedName + ext;
      const oldPath = path.join(resolvedPath, file);
      const newPath = path.join(resolvedPath, newName);

      if (fs.existsSync(newPath)) {
        console.warn(`  警告: 目标文件已存在，跳过 - ${newName}`);
      } else {
        console.log(`  重命名: ${file} -> ${newName}`);
        fs.renameSync(oldPath, newPath);
      }
    } else {
      console.log(`  跳过文件: ${file} (无对应名称)`);
    }
  });
  console.log('任务完成。\n');
}

async function main() {
  const args = process.argv.slice(2);

  // 如果命令行有参数，优先执行命令行参数
  if (args.length >= 2) {
    processTask(args[0], args[1]);
    return;
  }

  // 否则执行脚本内置的 TASKS
  if (TASKS.length === 0) {
    console.log('提示: 未提供命令行参数，且 TASKS 数组为空。');
    console.log('用法: node scripts/rename_parts.cjs <目录路径> <名称列表字符串>');
    return;
  }

  console.log(`开始执行 ${TASKS.length} 个内置任务...\n`);
  TASKS.forEach((task) => {
    processTask(task.dir, task.names);
  });
}

main().catch((err) => {
  console.error('运行出错:', err);
  process.exit(1);
});
