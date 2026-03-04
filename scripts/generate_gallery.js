import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionsDir = path.join(__dirname, '../public/data/questions');
const galleryDir = path.join(__dirname, '../public/data/gallery');

// 确保 gallery 目录存在
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

// 加载城市到省份的映射
const provinceMapPath = path.join(__dirname, 'city_province.json');
let cityProvinceMap = {};
if (fs.existsSync(provinceMapPath)) {
  cityProvinceMap = JSON.parse(fs.readFileSync(provinceMapPath, 'utf8'));
}

// 遍历所有的分类题目 JSON 文件
const files = fs.readdirSync(questionsDir);

files.forEach((file) => {
  if (file.endsWith('.json') && file !== 'questions.bak.json') {
    const qPath = path.join(questionsDir, file);
    const data = JSON.parse(fs.readFileSync(qPath, 'utf8'));

    const galleryItems = [];
    const seenAnswers = new Set();
    let index = 1;

    data.forEach((q) => {
      let name = q.answer;
      let finalName = '';
      let finalImage = q.image;

      let cleanDescription = q.explanation || '暂无详细介绍';
      cleanDescription = cleanDescription
        .replace(/回答正确！/g, '')
        .replace(/正确答案是：?.*?。/g, '')
        .replace(/^是的。/, '')
        .replace(/^不是。/, '')
        .trim();

      if (file === 'flags.json') {
        if (q.type === 'single_image_to_text') {
          finalName = q.answer;
          finalImage = q.image;
        } else if (q.type === 'single_text_to_image') {
          finalName = q.prompt.replace('选出代表', '').replace('的国旗图片？', '');
          finalImage = q.answer;
        } else if (q.type === 'true_false_image') {
          if (q.answer === true) {
            finalName = q.prompt.replace('这是', '').replace('的国旗吗？', '');
            finalImage = q.image;
          } else {
            return;
          }
        }

        if (!finalName) return;

        if (!seenAnswers.has(finalName)) {
          seenAnswers.add(finalName);
          const item = {
            id: `gal_flags_${index++}`,
            name: `${finalImage} ${finalName}`,
            description: cleanDescription,
          };
          galleryItems.push(item);
        }
        return; // 处理完 flags.json 直接返回
      }

      if (typeof name !== 'string') return;

      let normalizedName = name.split('（')[0].trim(); // 处理如 "异国短毛猫（加菲猫）"

      if (!seenAnswers.has(name)) {
        seenAnswers.add(name);

        const item = {
          id: `gal_${file.replace('.json', '')}_${index++}`,
          name: name,
          description: cleanDescription,
        };

        let finalItemName = item.name;
        if (file === 'chinese_cities.json' && cityProvinceMap[normalizedName]) {
          const province = cityProvinceMap[normalizedName];
          if (province !== '直辖市' && province !== '特别行政区') {
            finalItemName = `${item.name} · ${province}`;
          } else {
            finalItemName = `${item.name} · ${normalizedName}`;
          }
        }

        if (q.image) {
          if (!q.image.includes('/')) {
            item.name = `${q.image} ${finalItemName}`;
          } else {
            item.name = finalItemName;
            item.image = q.image;
          }
        } else {
          item.name = finalItemName;
        }

        galleryItems.push(item);
      }
    });

    const outPath = path.join(galleryDir, file);
    fs.writeFileSync(outPath, JSON.stringify(galleryItems, null, 2), 'utf8');
    console.log(`Generated gallery for ${file}, total items: ${galleryItems.length}`);
  }
});

console.log('Gallery generation complete.');
