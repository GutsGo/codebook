import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pinyin } from 'pinyin-pro';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../public/data/questions/car_logos.json');
const logosDir = path.resolve(__dirname, '../public/images/car-logos');

// 官方/常用英文映射表
const officialMapping = {
  一汽: 'faw',
  东风: 'dongfeng',
  广汽: 'gac',
  北汽: 'baic',
  上汽: 'saic',
  上汽集团: 'saic',
  大通: 'maxus',
  传祺: 'trumpchi',
  风行: 'fengxing',
  启辰: 'venucia',
  荣威: 'roewe',
  名爵: 'mg',
  五菱: 'wuling',
  宝骏: 'baojun',
  长城: 'gwm',
  哈弗: 'haval',
  坦克: 'tank',
  魏牌: 'wey',
  欧拉: 'ora',
  吉利: 'geely',
  领克: 'lynkco',
  极氪: 'zeekr',
  几何: 'geometry',
  睿蓝: 'livan',
  比亚迪: 'byd',
  腾势: 'denza',
  仰望: 'yangwang',
  方程豹: 'fangchengbao',
  奇瑞: 'chery',
  星途: 'exeed',
  捷途: 'jetour',
  iCAR: 'icar',
  长安: 'changan',
  深蓝: 'deepal',
  阿维塔: 'avatr',
  启源: 'qiyuan',
  江淮: 'jac',
  江铃: 'jmc',
  众泰: 'zotye',
  威马: 'weltmeister',
  爱驰: 'aiways',
  赛力斯: 'seres',
  问界: 'aito',
  岚图: 'voyah',
  智己: 'im',
  极狐: 'arcfox',
  极越: 'jiyue',
  远航: 'yuanhang',
  智界: 'luxeed',
  享界: 'stelato',
  小米汽车: 'xiaomi',
  通用: 'gm',
  福特: 'ford',
  克莱斯勒: 'chrysler',
  丰田: 'toyota',
  本田: 'honda',
  日产: 'nissan',
  马自达: 'mazda',
  三菱: 'mitsubishi',
  铃木: 'suzuki',
  斯巴鲁: 'subaru',
  大众: 'volkswagen',
  宝马: 'bmw',
  奔驰: 'mercedes-benz',
  奥迪: 'audi',
  保时捷: 'porsche',
  斯柯达: 'skoda',
  现代: 'hyundai',
  起亚: 'kia',
  标致: 'peugeot',
  雪铁龙: 'citroen',
  雷诺: 'renault',
  菲亚特: 'fiat',
  法拉利: 'ferrari',
  兰博基尼: 'lamborghini',
  玛莎拉蒂: 'maserati',
  宾利: 'bentley',
  劳斯莱斯: 'rolls-royce',
  '阿斯顿·马丁': 'aston-martin',
  迈凯伦: 'mclaren',
  路特斯: 'lotus',
};

function getSlug(chineseName) {
  // 1. 先查官方映射
  if (officialMapping[chineseName]) {
    return officialMapping[chineseName];
  }

  // 2. 否则转拼音
  const p = pinyin(chineseName, {
    toneType: 'none',
    nonZh: 'consecutive',
    v: true,
  });

  return p
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function run() {
  if (!fs.existsSync(logosDir)) {
    console.error('目录不存在:', logosDir);
    return;
  }

  const files = fs.readdirSync(logosDir);
  let total = 0;
  let skipped = 0;

  console.log(`开始处理目录: ${logosDir}`);

  files.forEach((file) => {
    const ext = path.extname(file).toLowerCase();
    const nameWithoutExt = path.basename(file, ext);

    // 只处理含有中文字符的文件名
    if (/[\u4e00-\u9fa5]/.test(nameWithoutExt)) {
      const slug = getSlug(nameWithoutExt);
      const newFileName = `${slug}${ext}`;
      const oldPath = path.join(logosDir, file);
      const newPath = path.join(logosDir, newFileName);

      if (oldPath !== newPath) {
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`[成功] ${file} -> ${newFileName}`);
          total++;
        } catch (err) {
          console.error(`[失败] ${file}: ${err.message}`);
        }
      } else {
        skipped++;
      }
    } else {
      skipped++;
    }
  });

  console.log(`\n处理完毕！`);
  console.log(`成功转换: ${total} 个文件`);
  console.log(`忽略/跳过: ${skipped} 个文件`);
}

run().catch(console.error);
