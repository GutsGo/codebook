import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";
import type { SrsRecord } from "@/types/question";

// 评分到时间间隔的基础映射 (为了模拟 SM-2)
const INTERVAL_1_MIN = 1 * 60 * 1000;
const INTERVAL_10_MIN = 10 * 60 * 1000;
const INTERVAL_1_DAY = 24 * 60 * 60 * 1000;

function calculateSM2(rating: "forgot" | "hard" | "easy", record?: SrsRecord) {
  let { interval = 0, easeFactor = 2.5, repetitions = 0 } = record || {};

  if (rating === "forgot") {
    repetitions = 0;
    interval = INTERVAL_1_MIN; // 忘记：1分钟后
    easeFactor = Math.max(1.3, easeFactor - 0.2); // 熟悉度惩罚
  } else if (rating === "hard") {
    repetitions = repetitions === 0 ? 0 : repetitions;
    interval = repetitions === 0 ? INTERVAL_10_MIN : interval * 1.5; // 模糊的话给予1.5倍复习压力
    easeFactor = Math.max(1.3, easeFactor - 0.15); // 轻微惩罚
  } else if (rating === "easy") {
    repetitions += 1;
    if (repetitions === 1) {
      interval = INTERVAL_1_DAY; // 1天
    } else if (repetitions === 2) {
      interval = 3 * INTERVAL_1_DAY; // 3天
    } else {
      interval = Math.round(interval * easeFactor);
    }
    easeFactor += 0.15; // 变得更容易
  }

  return { interval, easeFactor, repetitions };
}

export const useSrsStore = defineStore("srs", () => {
  const srsBook = useLocalStorage<SrsRecord[]>("codebook_srs_v1", []);

  // 待复习题目队列：过滤出当前时间已经 >= nextReviewTime 的记录
  const dueReviews = computed(() => {
    const now = Date.now();
    return srsBook.value.filter((record) => record.nextReviewTime <= now);
  });

  /**
   * 提交题目反馈并计算下一次复习时间
   * @param categoryId
   * @param questionId
   * @param rating 用户的自评分
   */
  function submitReview(
    categoryId: string,
    questionId: string,
    rating: "forgot" | "hard" | "easy",
  ) {
    let index = srsBook.value.findIndex(
      (r) => r.categoryId === categoryId && r.questionId === questionId,
    );

    const now = Date.now();
    const existingRecord = index >= 0 ? srsBook.value[index] : undefined;

    // 使用 SM-2 计算新的复习参数
    const { interval, easeFactor, repetitions } = calculateSM2(
      rating,
      existingRecord,
    );
    const newNextReviewTime = now + interval;

    let newLevel = 0;
    if (rating === "hard") newLevel = 1;
    if (rating === "easy") newLevel = 2;

    const newRecord = {
      categoryId,
      questionId,
      level: newLevel,
      nextReviewTime: newNextReviewTime,
      interval,
      easeFactor,
      repetitions,
    };

    if (index >= 0) {
      srsBook.value[index] = newRecord;
    } else {
      srsBook.value.push(newRecord);
    }
  }

  // 根据进度随机拉取一批题目复习 ID
  function getDueReviewIds(limit: number = 20) {
    // 优先复习 level 低的（遗忘更严重的），并截取指定数量
    const sorted = [...dueReviews.value].sort((a, b) => a.level - b.level);
    return sorted.slice(0, limit);
  }

  // --- 闪卡的独立 SRS 系统 ---
  const flashcardSrsBook = useLocalStorage<SrsRecord[]>(
    "codebook_fc_srs_v1",
    [],
  );

  const dueFlashcardReviews = computed(() => {
    const now = Date.now();
    return flashcardSrsBook.value.filter(
      (record) => record.nextReviewTime <= now,
    );
  });

  function submitFlashcardReview(
    categoryId: string,
    cardId: string,
    rating: "forgot" | "hard" | "easy",
  ) {
    const index = flashcardSrsBook.value.findIndex(
      (r) => r.categoryId === categoryId && r.questionId === cardId,
    );

    const now = Date.now();
    const existingRecord =
      index >= 0 ? flashcardSrsBook.value[index] : undefined;

    const { interval, easeFactor, repetitions } = calculateSM2(
      rating,
      existingRecord,
    );
    const newNextReviewTime = now + interval;

    let newLevel = 0;
    if (rating === "hard") newLevel = 1;
    if (rating === "easy") newLevel = 2;

    const newRecord = {
      categoryId,
      questionId: cardId, // 使用 questionId 字段复习此数据结构
      level: newLevel,
      nextReviewTime: newNextReviewTime,
      interval,
      easeFactor,
      repetitions,
    };

    if (index >= 0) {
      flashcardSrsBook.value[index] = newRecord;
    } else {
      flashcardSrsBook.value.push(newRecord);
    }
  }

  function getDueFlashcardReviewIds(limit: number = 20) {
    const sorted = [...dueFlashcardReviews.value].sort(
      (a, b) => a.level - b.level,
    );
    return sorted.slice(0, limit);
  }

  return {
    srsBook,
    dueReviews,
    submitReview,
    getDueReviewIds,
    flashcardSrsBook,
    dueFlashcardReviews,
    submitFlashcardReview,
    getDueFlashcardReviewIds,
  };
});
