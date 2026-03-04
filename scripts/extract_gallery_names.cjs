const fs = require('fs');
const path = require('path');

// 读取命令行参数
const args = process.argv.slice(2);
const helpText = `
Usage:
  node scripts/extract_gallery_names.cjs <file-path>

Description:
  从 public/data/gallery 下的 JSON 文件中提取所有 name，
  如果有 image 字段，同时提取图片文件名作为英文名。
  将提取结果按 15 条为一组进行分组，并打印到终端。
`;

if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log(helpText);
  process.exit(0);
}

const filePathArg = args[0];
const filePath = path.resolve(process.cwd(), filePathArg);

if (!fs.existsSync(filePath)) {
  console.error(`❌ 文件不存在: ${filePath}`);
  process.exit(1);
}

try {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  if (!Array.isArray(data)) {
    console.error(`❌ 文件内容需要是一个 JSON 数组`);
    process.exit(1);
  }

  const allNames = [];
  const allNamesEn = [];
  let hasImage = false;

  data.forEach((item) => {
    if (item.name) {
      allNames.push(item.name);
    }
    if (item.image) {
      hasImage = true;
      // 提取纯文件名，不要扩展名和路径
      const nameEn = path.basename(item.image, path.extname(item.image));
      allNamesEn.push(nameEn);
    }
  });

  // 分组函数
  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  const chunkedNames = chunkArray(allNames, 15);
  console.log(
    'names:',
    JSON.stringify(
      chunkedNames.reduce((pre, cur, index) => ({ ...pre, [index]: cur }), {}),
      null,
      2
    )
  );

  if (hasImage) {
    const chunkedNamesEn = chunkArray(allNamesEn, 15);
    console.log(
      'names_en:',
      JSON.stringify(
        chunkedNamesEn.reduce((pre, cur, index) => ({ ...pre, [index]: cur }), {}),
        null,
        2
      )
    );
  }
} catch (e) {
  console.error(`❌ 处理文件出错: ${e.message}`);
}
