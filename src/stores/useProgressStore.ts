import { defineStore } from "pinia";
import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { MistakeRecord, NoteRecord } from "@/types/question";

export interface LevelProgress {
  score: number;
  accuracy: number;
  unlocked: boolean;
  answered?: number;
  correct?: number;
}

export const useProgressStore = defineStore("progress", () => {
  // 按照 categoryId_levelId 作为 key 保存各关卡的最佳成绩和解锁进度
  const unlockedLevels = useLocalStorage<Record<string, LevelProgress>>(
    "codebook_levels",
    {},
  );

  // 游戏全周期总分：从各关卡最高分汇总得出
  const totalScore = computed(() => {
    const levels = unlockedLevels.value;
    return Object.keys(levels).reduce(
      (sum, key) => sum + (levels[key]?.score || 0),
      0,
    );
  });

  // 统计数据：从各关卡最佳成绩中派生，与 totalScore 保持一致
  const totalAnswered = computed(() => {
    const levels = unlockedLevels.value;
    return Object.keys(levels).reduce(
      (sum, key) => sum + (levels[key]?.answered || 0),
      0,
    );
  });
  const totalCorrect = computed(() => {
    const levels = unlockedLevels.value;
    return Object.keys(levels).reduce(
      (sum, key) => sum + (levels[key]?.correct || 0),
      0,
    );
  });

  // 错题本：存储错误题目的记录
  const mistakeBook = useLocalStorage<MistakeRecord[]>(
    "codebook_mistakes_v2",
    [],
  );

  // 收藏夹
  const favorites = useLocalStorage<MistakeRecord[]>("codebook_favorites", []);

  // 我的笔记
  const notes = useLocalStorage<NoteRecord[]>("codebook_notes", []);

  /**
   * 更新关卡进展。满足以下任一条件即更新：
   * 1. 第一次记录（无旧数据）
   * 2. 新得分更高
   * 3. 旧记录缺少 answered/correct 字段（兼容历史数据）
   * 4. 得分相同但正确率更高
   */
  function updateLevelProgress(
    categoryId: string,
    levelId: string,
    score: number,
    accuracy: number,
    answered: number,
    correct: number,
  ) {
    const key = `${categoryId}_${levelId}`;
    const current = unlockedLevels.value[key];

    const shouldUpdate =
      !current ||
      score > current.score ||
      current.answered == null ||
      (score === current.score && accuracy > current.accuracy);

    if (shouldUpdate) {
      unlockedLevels.value[key] = {
        score,
        accuracy,
        unlocked: true,
        answered,
        correct,
      };
    }
  }

  /**
   * 解锁下一关
   */
  function unlockNextLevel(categoryId: string, nextLevelId: string) {
    const key = `${categoryId}_${nextLevelId}`;
    if (!unlockedLevels.value[key]) {
      unlockedLevels.value[key] = { score: 0, accuracy: 0, unlocked: true };
    }
  }

  /**
   * 将本次测验的错题并入持久化错题本
   */
  function addMistakes(categoryId: string, questionIds: string[]) {
    if (questionIds.length === 0) return;

    // 过滤掉已存在的相同题目，补充新的时间戳记录
    const existing = mistakeBook.value.filter(
      (m) =>
        !(m.categoryId === categoryId && questionIds.includes(m.questionId)),
    );

    const newRecords: MistakeRecord[] = questionIds.map((qId) => ({
      categoryId,
      questionId: qId,
      timestamp: Date.now(),
    }));

    mistakeBook.value = [...newRecords, ...existing];
  }

  /**
   * 移除错题（已掌握）
   */
  function removeMistake(categoryId: string, questionId: string) {
    mistakeBook.value = mistakeBook.value.filter(
      (m) => !(m.categoryId === categoryId && m.questionId === questionId),
    );
  }

  /**
   * 切换收藏状态
   */
  function toggleFavorite(categoryId: string, questionId: string) {
    const index = favorites.value.findIndex(
      (f) => f.categoryId === categoryId && f.questionId === questionId,
    );
    if (index >= 0) {
      favorites.value.splice(index, 1);
    } else {
      favorites.value.unshift({
        categoryId,
        questionId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 判断是否已收藏
   */
  function isFavorite(categoryId: string, questionId: string) {
    return favorites.value.some(
      (f) => f.categoryId === categoryId && f.questionId === questionId,
    );
  }

  /**
   * 保存或更新笔记
   */
  function saveNote(categoryId: string, questionId: string, content: string) {
    const index = notes.value.findIndex(
      (n) => n.categoryId === categoryId && n.questionId === questionId,
    );
    if (index >= 0) {
      if (content.trim() === "") {
        notes.value.splice(index, 1);
      } else {
        // Ensure notes.value[index] is not undefined before accessing properties
        if (notes.value[index]) {
          notes.value[index].content = content;
          notes.value[index].timestamp = Date.now();
        }
      }
    } else if (content.trim() !== "") {
      notes.value.push({
        categoryId,
        questionId,
        content,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 获得对应题目的笔记内容
   */
  function getNote(categoryId: string, questionId: string): string {
    const record = notes.value.find(
      (n) => n.categoryId === categoryId && n.questionId === questionId,
    );
    return record?.content || "";
  }

  return {
    unlockedLevels,
    totalScore,
    totalAnswered,
    totalCorrect,
    mistakeBook,
    favorites,
    updateLevelProgress,
    unlockNextLevel,
    addMistakes,
    removeMistake,
    toggleFavorite,
    isFavorite,
    notes,
    saveNote,
    getNote,
  };
});
