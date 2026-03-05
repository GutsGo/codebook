import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";
import type { SrsRecord } from "@/types/question";

// 评分到时间间隔的映射 (简化的间隔算法)
const INTERVALS: Record<string, number> = {
  forgot: 1 * 60 * 1000, // 忘记：1分钟后复习
  hard: 10 * 60 * 1000, // 模糊：10分钟后复习
  easy: 24 * 60 * 60 * 1000, // 简单：1天后复习
};

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
    const interval = INTERVALS[rating] || 60 * 1000;
    const newNextReviewTime = now + interval;

    let newLevel = 0;
    if (rating === "hard") newLevel = 1;
    if (rating === "easy") newLevel = 2;

    if (index >= 0) {
      const record = srsBook.value[index];
      if (record) {
        // 创建新对象并替换，确保触发响应式更新和持久化保存
        srsBook.value[index] = {
          ...record,
          level: newLevel,
          nextReviewTime: newNextReviewTime,
        };
      }
    } else {
      srsBook.value.push({
        categoryId,
        questionId,
        level: newLevel,
        nextReviewTime: newNextReviewTime,
      });
    }
  }

  // 根据进度随机拉取一批复习题目，如果 due 的不够，可以由调用方再从主库拉新题补充
  function getDueReviewIds(limit: number = 20) {
    // 优先复习 level 低的（遗忘更严重的），并截取指定数量
    const sorted = [...dueReviews.value].sort((a, b) => a.level - b.level);
    return sorted.slice(0, limit);
  }

  return {
    srsBook,
    dueReviews,
    submitReview,
    getDueReviewIds,
  };
});
