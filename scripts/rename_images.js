import fs from "fs";
import path from "path";

/**
 * 脚本：将文件夹下的 part_01, part_02 等图片重命名为数组定义的名称
 * 用法: node scripts/rename_images.js <文件夹路径>
 */

// 在这里定义你的名称数组
const NAMES = [
  "css_ui",
  "framework",
  "network",
  "engineering",
  "architecture",
  "cross-platform",
  "security",
  "performance",
  "nodejs",
  "visual",
  "devops",
  "v8",
  "business",
  "ai-frontend",
  "infrastructure",
];

async function renameImages() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("错误: 请提供文件夹路径 (相对于项目根目录)");
    console.log("示例: node scripts/rename_images.js public/assets/images");
    return;
  }

  const targetDirRel = args[0];
  const targetDir = path.resolve(process.cwd(), targetDirRel);

  if (!fs.existsSync(targetDir)) {
    console.error(`错误: 目录不存在 - ${targetDir}`);
    return;
  }

  // 获取目录下所有 part_ 开头的文件，并按数字顺序排序
  const files = fs
    .readdirSync(targetDir)
    .filter((f) => {
      const fileName = f.toLowerCase();
      // 过滤 part_ 开头的文件，通常是图片 (png, jpg, jpeg, webp, svg)
      return (
        fileName.startsWith("part_") &&
        /\.(png|jpg|jpeg|webp|svg)$/.test(fileName)
      );
    })
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  if (files.length === 0) {
    console.log(
      `在目录 ${targetDirRel} 下未找到符合条件的文件 (需以 'part_' 开头且为图片格式)。`,
    );
    return;
  }

  console.log(
    `找到 ${files.length} 个文件，准备重命名为前 ${Math.min(files.length, NAMES.length)} 个定义的名称...`,
  );

  files.forEach((file, index) => {
    if (index < NAMES.length) {
      const ext = path.extname(file);
      const newName = `${NAMES[index]}${ext}`;
      const oldPath = path.join(targetDir, file);
      const newPath = path.join(targetDir, newName);

      if (fs.existsSync(newPath)) {
        console.warn(`  警告: 目标文件已存在，跳过 - ${newName}`);
      } else {
        console.log(`  重命名: ${file} -> ${newName}`);
        fs.renameSync(oldPath, newPath);
      }
    } else {
      console.log(`  跳过文件: ${file} (名称数组已耗尽)`);
    }
  });

  console.log("处理完成！");
}

renameImages().catch((err) => {
  console.error("发生错误:", err);
});
