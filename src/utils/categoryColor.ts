/**
 * 分类颜色工具 - 根据分类 ID 动态生成唯一颜色
 * 使用 FNV-1a 哈希 + 黄金角度，保证相似短字符串也能产生差异明显的颜色
 */

/**
 * FNV-1a 哈希 — 雪崩效应好，即使 "cats" / "dogs" / "flags" 这类短字符串
 * 也能产生完全不同的哈希值
 */
function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5; // FNV 偏移基数
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV 质数
  }
  return hash >>> 0; // 转无符号 32 位
}

/**
 * 根据分类 ID 动态生成多巴胺主题色
 * - 精选 6 组多巴胺核心色相，确保色彩鲜艳不沉闷
 * - 现代风：高饱和(80-92%)、中亮度(62-68%)，极富冲击力
 */
export function getCategoryColor(categoryId: string): string {
  const hash = fnv1aHash(categoryId);
  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'pixel';
  const isModern = theme === 'modern';
  const isClay = theme === 'clay';

  // 多巴胺核心色相池：粉(340)、蓝(205)、黄(50)、橙(15)、绿(155)、紫(275)
  const dopamineHues = [340, 205, 50, 15, 155, 275];
  const baseHue = dopamineHues[hash % dopamineHues.length] ?? 200;
  // 微调色相 (±10度) 增加分类间差异
  const h = (baseHue + ((hash >> 4) % 21) - 10 + 360) % 360;

  // 现代风：莫兰迪色调（低饱和、中低亮度），更稳重
  // 像素风：粉彩（中等饱和、高亮度），更清新
  // 黏土风：厚实的橡皮泥色彩（中高饱和、中等明度），更具立体感
  let s = 55 + ((hash >> 8) % 16);
  let l = 80 + ((hash >> 16) % 6);

  if (isModern) {
    s = 50 + ((hash >> 8) % 11);
    l = 70 + ((hash >> 16) % 11);
  } else if (isClay) {
    s = 65 + ((hash >> 8) % 15);
    l = 68 + ((hash >> 16) % 10);
  }

  return `hsl(${h.toFixed(1)}, ${s}%, ${l}%)`;
}
