import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取命令行参数
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
ℹ️  使用说明:
  node scripts/crop_images.js <输入目录> <裁切像素> [输出目录]

✨ 示例:
  # 将 public/images/flowers 目录下的图片上下左右各往里裁切 5 像素
  # 默认输出到 public/images/flowers_cropped 目录
  node scripts/crop_images.js public/images/flowers 5

  # 如果四个方向需要不同的裁切值，可以在脚本内部自行调整 \`cropConfig\` 对象。
`);
  process.exit(1);
}

const inputArg = args[0];
const cropPixelsRaw = parseInt(args[1], 10);
const outputArg = args[2] || `${inputArg}_cropped`;

if (isNaN(cropPixelsRaw) || cropPixelsRaw < 0) {
  console.error('❌ 错误：裁切像素必须是大于等于 0 的整数！');
  process.exit(1);
}

// 设定上下左右的裁切像素
// 如果某个方向需要不同像素，可直接修改这里的值
const cropConfig = {
  top: cropPixelsRaw,
  bottom: cropPixelsRaw,
  left: cropPixelsRaw,
  right: cropPixelsRaw,
};

const inputDir = path.resolve(process.cwd(), inputArg);
const outputDir = path.resolve(process.cwd(), outputArg);

if (!fs.existsSync(inputDir)) {
  console.error(`❌ 错误：找不到输入目录 ${inputDir}`);
  process.exit(1);
}

async function run() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir);
  let successCount = 0;
  let failCount = 0;

  console.log(`🚀 开始处理目录：${inputDir}`);
  console.log(`📏 裁切配置：上 ${cropConfig.top}px, 下 ${cropConfig.bottom}px, 左 ${cropConfig.left}px, 右 ${cropConfig.right}px\n`);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const validExts = ['.png', '.jpg', '.jpeg', '.webp'];

    if (validExts.includes(ext)) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);

      try {
        const metadata = await sharp(inputPath).metadata();
        const { width, height } = metadata;

        const extractRegion = {
          left: cropConfig.left,
          top: cropConfig.top,
          width: width - cropConfig.left - cropConfig.right,
          height: height - cropConfig.top - cropConfig.bottom,
        };

        // 确保裁切后的宽度和高度合法
        if (extractRegion.width > 0 && extractRegion.height > 0) {
          await sharp(inputPath).extract(extractRegion).toFile(outputPath);
          console.log(`✅ 成功裁切: ${file}`);
          successCount++;
        } else {
          console.warn(`⚠️ 图片过小，无法进行该程度的裁切: ${file} (当前尺寸 ${width}x${height})`);
          failCount++;
        }
      } catch (err) {
        console.error(`❌ 处理 ${file} 时遇到错误:`, err.message);
        failCount++;
      }
    }
  }

  console.log(`\n🎉 处理完成！`);
  console.log(`✅ 成功数量：${successCount}`);
  if (failCount > 0) console.log(`❌ 失败、跳过数量：${failCount}`);
  console.log(`📂 输出目录：${outputDir}`);
}

run();
