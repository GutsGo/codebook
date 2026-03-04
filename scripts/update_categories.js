import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categoriesPath = path.join(__dirname, '../public/data/categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// 1. 反直觉生物学
const biologyCategory = {
  id: 'counterintuitive_biology',
  name: '反直觉生物学',
  icon: '🐙',
  levels: [],
  groupId: 'nature',
  description: '探索生物界那些颠覆认知的奇妙事实',
};

for (let i = 1; i <= 10; i++) {
  const levelQuestions = [];
  for (let j = 1; j <= 10; j++) {
    levelQuestions.push(`bio_q${(i - 1) * 10 + j}`);
  }
  biologyCategory.levels.push({
    id: `level_${i}`,
    name: `第 ${i} 关`,
    questionIds: levelQuestions,
  });
}

// 2. 人体奇妙物语
const humanBodyCategory = {
  id: 'human_body',
  name: '人体奇妙物语',
  icon: '🧠',
  levels: [],
  groupId: 'science',
  description: '深度了解你最熟悉的“陌生人”——你的身体',
};

for (let i = 1; i <= 17; i++) {
  const levelQuestions = [];
  for (let j = 1; j <= 10; j++) {
    levelQuestions.push(`body_q${(i - 1) * 10 + j}`);
  }
  humanBodyCategory.levels.push({
    id: `level_${i}`,
    name: `第 ${i} 关`,
    questionIds: levelQuestions,
  });
}

// 3. 时间与历史的折叠
const timeHistoryCategory = {
  id: 'time_history',
  name: '时间与历史的折叠',
  icon: '⏳',
  levels: [],
  groupId: 'mind_blowing',
  description: '当时空的标尺被拉长，历史将呈现惊人的重叠',
};

// 目前有 2 关 (20道题)
timeHistoryCategory.levels.push({
  id: 'level_1',
  name: '时空穿越 (一)',
  questionIds: ['tih_q1', 'tih_q2', 'tih_q3', 'tih_q4', 'tih_q5', 'tih_q6', 'tih_q7', 'tih_q8', 'tih_q9', 'tih_q10'],
});
timeHistoryCategory.levels.push({
  id: 'level_2',
  name: '时空穿越 (二)',
  questionIds: [
    'tih_q11',
    'tih_q12',
    'tih_q13',
    'tih_q14',
    'tih_q15',
    'tih_q16',
    'tih_q17',
    'tih_q18',
    'tih_q19',
    'tih_q20',
  ],
});

// 检查是否已经存在，避免重复添加，如果存在则更新
const existingIndex = categories.findIndex((c) => c.id === biologyCategory.id);
if (existingIndex > -1) categories[existingIndex] = biologyCategory;
else categories.push(biologyCategory);

const existingIndexBody = categories.findIndex((c) => c.id === humanBodyCategory.id);
if (existingIndexBody > -1) categories[existingIndexBody] = humanBodyCategory;
else categories.push(humanBodyCategory);

const existingIndexTime = categories.findIndex((c) => c.id === timeHistoryCategory.id);
if (existingIndexTime > -1) categories[existingIndexTime] = timeHistoryCategory;
else categories.push(timeHistoryCategory);

fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), 'utf8');
console.log('Categories updated successfully.');
