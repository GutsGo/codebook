import type {
  CategoryData,
  Question,
  QuestionBank,
  Level,
} from "@/types/question";
import { resolveDataUrl } from "@/utils/assets";

// 缓存数据
let allQuestionsCache: Question[] | null = null;
let categoriesCache: CategoryData[] | null = null;
const categoryQuestionsCache = new Map<string, Question[]>();

// 特殊数据源映射
const specialCategorySources: Record<string, string> = {
  engineering: "/data/questions/engineering.json",
};

// 每关的题目数
const QUESTIONS_PER_LEVEL = 10;

/**
 * 根据题目数据动态生成关卡
 */
function generateLevels(questions: Question[]): Level[] {
  const levels: Level[] = [];
  for (let i = 0; i < questions.length; i += QUESTIONS_PER_LEVEL) {
    const chunk = questions.slice(i, i + QUESTIONS_PER_LEVEL);
    const levelIndex = Math.floor(i / QUESTIONS_PER_LEVEL) + 1;
    levels.push({
      id: `level_${levelIndex}`,
      name: `基础关卡 ${levelIndex}`,
      questionIds: chunk.map((q) => String(q.id)),
    });
  }
  return levels;
}

async function loadAllQuestionBanks(): Promise<{
  categories: CategoryData[];
  questions: Question[];
}> {
  if (categoriesCache && allQuestionsCache) {
    return { categories: categoriesCache, questions: allQuestionsCache };
  }

  const allQuestions: Question[] = [];
  const categories: CategoryData[] = [];

  try {
    // 1. 加载主分类配置文件
    const catRes = await fetch(resolveDataUrl("/data/categories.json"));
    if (catRes.ok) {
      const cats = await catRes.json();
      // 将 JSON 数据转为 CategoryData，levels 暂时设为空数组
      const catsWithLevels: CategoryData[] = cats.map(
        (c: Omit<CategoryData, "levels">) => ({
          ...c,
          levels: [] as Level[],
        }),
      );
      categories.push(...catsWithLevels);
    }

    // 2. 加载特殊的"前端工程化"题目
    const engSource = specialCategorySources["engineering"];
    if (engSource) {
      const engRes = await fetch(
        resolveDataUrl(engSource) + "?v=" + Date.now(),
      );
      if (engRes.ok) {
        const bank: QuestionBank = await engRes.json();
        allQuestions.push(...bank.questions);
        categoryQuestionsCache.set("engineering", bank.questions);
      }
    }

    // 3. 根据已加载的题目为每个分类动态生成 levels
    for (const cat of categories) {
      const qs = categoryQuestionsCache.get(cat.id);
      if (qs && qs.length > 0) {
        cat.levels = generateLevels(qs);
      }
    }
  } catch (err) {
    console.error(`Error loading question banks:`, err);
  }

  categoriesCache = categories;
  allQuestionsCache = allQuestions;

  return { categories, questions: allQuestions };
}

export async function fetchCategories(): Promise<CategoryData[]> {
  const { categories } = await loadAllQuestionBanks();
  return categories;
}

/**
 * 获取分类对应的数据源 URL
 */
function getCategoryDataUrl(categoryId: string): string {
  if (specialCategorySources[categoryId]) {
    return specialCategorySources[categoryId];
  }
  return `/data/questions/${categoryId}.json`;
}

/**
 * 获取某个分类下的所有题目
 */
export async function fetchQuestionsByCategory(
  categoryId: string,
): Promise<Question[]> {
  // 先触发全局加载以确保动态分类（如 engineering）已就绪
  await loadAllQuestionBanks();

  if (categoryQuestionsCache.has(categoryId)) {
    return categoryQuestionsCache.get(categoryId)!;
  }

  const url = resolveDataUrl(getCategoryDataUrl(categoryId));
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const qs = Array.isArray(data) ? data : data.questions || [];
    categoryQuestionsCache.set(categoryId, qs);

    // 动态生成 levels 并更新缓存中的分类数据
    if (categoriesCache) {
      const cat = categoriesCache.find((c) => c.id === categoryId);
      if (cat && cat.levels.length === 0) {
        cat.levels = generateLevels(qs);
      }
    }

    return qs;
  } catch (e) {
    console.error(`Failed to fetch questions for ${categoryId}:`, e);
    return [];
  }
}

export async function fetchQuestionsByLevel(
  categoryId: string,
  levelId: string,
): Promise<Question[]> {
  const { categories } = await loadAllQuestionBanks();

  if (levelId.startsWith("tag_")) {
    const allQs = await fetchQuestionsByCategory(categoryId);
    const tag = decodeURIComponent(levelId.slice(4));
    return allQs.filter((q) => q.tags?.includes(tag));
  }

  const category = categories.find((c) => c.id === categoryId);
  if (!category) return [];

  const level = category.levels.find((l) => l.id === levelId);
  if (!level) return [];

  const allQs = await fetchQuestionsByCategory(categoryId);
  const questionMap = new Map(allQs.map((q) => [String(q.id), q]));

  return level.questionIds
    .map((id: string) => questionMap.get(id))
    .filter((q: any): q is Question => q !== undefined);
}

export async function fetchTagsByCategory(
  categoryId: string,
): Promise<{ tag: string; count: number }[]> {
  const { categories } = await loadAllQuestionBanks();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return [];

  const questions = await fetchQuestionsByCategory(categoryId);
  const tagCount = new Map<string, number>();
  const questionIds = new Set(category.levels.flatMap((l) => l.questionIds));

  questions.forEach((q) => {
    if (questionIds.has(String(q.id)) && q.tags) {
      q.tags.forEach((t: string) => {
        tagCount.set(t, (tagCount.get(t) || 0) + 1);
      });
    }
  });

  return Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchQuestionsByTag(tag: string): Promise<Question[]> {
  const { categories } = await loadAllQuestionBanks();
  let results: Question[] = [];
  for (const cat of categories) {
    const qs = await fetchQuestionsByCategory(cat.id);
    results = results.concat(qs.filter((q) => q.tags?.includes(tag)));
  }
  return results;
}

export async function fetchQuestionById(
  id: string,
  categoryId?: string,
): Promise<Question | undefined> {
  if (categoryId) {
    const qs = await fetchQuestionsByCategory(categoryId);
    return qs.find((q) => String(q.id) === String(id));
  }

  const { categories } = await loadAllQuestionBanks();
  for (const cat of categories) {
    const qs = await fetchQuestionsByCategory(cat.id);
    const found = qs.find((q) => String(q.id) === String(id));
    if (found) return found;
  }
  return undefined;
}
