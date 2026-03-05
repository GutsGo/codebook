<template>
  <div class="srs-game-container">
    <header class="game-header">
      <button class="back-btn pixel-btn" @click="goBack">← 返回首页</button>
      <div class="score pill">
        复习待办:
        <span>{{
          currentTab === "questions" ? dueQuestionCount : dueFlashcardCount
        }}</span>
      </div>
    </header>

    <div class="mode-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'questions' }"
        @click="currentTab = 'questions'"
      >
        题目
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'flashcards' }"
        @click="currentTab = 'flashcards'"
      >
        闪卡
      </button>
    </div>

    <main class="game-area">
      <div v-if="isLoading" class="state-view pixel-card">
        <div class="loader"></div>
        <p>正在生成复习题库...</p>
      </div>

      <div
        v-else-if="currentTab === 'questions' && !currentQuestion"
        class="state-view pixel-card end-game"
      >
        <h2 class="end-title">🎉 太棒了！</h2>
        <p class="encouragement">
          当前没有需要复习的题目了。<br />休息一下，或者去探索新的关卡吧！
        </p>
      </div>
      <div
        v-else-if="currentTab === 'flashcards' && !currentFlashcard"
        class="state-view pixel-card end-game"
      >
        <h2 class="end-title">🎉 太棒了！</h2>
        <p class="encouragement">
          当前没有需要复习的闪卡了。<br />你可以去其他分类浏览新的闪卡。
        </p>
      </div>

      <transition name="slide-card" mode="out-in">
        <div
          v-if="currentTab === 'questions' && currentQuestion"
          :key="'q_' + currentQuestion.id"
          style="width: 100%"
        >
          <QuestionCard
            :question="currentQuestion"
            :category-id="currentQuestionCategoryId"
            :is-srs-mode="true"
            @srs-review="handleQuestionReview"
          />
        </div>
        <div
          v-else-if="currentTab === 'flashcards' && currentFlashcard"
          :key="'fc_' + currentFlashcard.id"
          style="width: 100%"
        >
          <FlashcardItem
            :flashcard="currentFlashcard"
            :category-id="currentFlashcardCategoryId"
            @srs-review="handleFlashcardReview"
          />
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useSrsStore } from "@/stores/useSrsStore";
import QuestionCard from "@/components/QuestionCard.vue";
import FlashcardItem from "@/components/FlashcardItem.vue";
import { fetchAllQuestionsMap, fetchCategories } from "@/data/questions";
import { fetchFlashcardDeck } from "@/data/flashcards";
import type { Question } from "@/types/question";
import type { Flashcard } from "@/types/flashcard";
import { useWindowSize } from "@vueuse/core";

const router = useRouter();
const srsStore = useSrsStore();

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const currentTab = ref<"questions" | "flashcards">("questions");

const isLoading = ref(true);
const questionsPool = ref<{ categoryId: string; question: Question }[]>([]);
const flashcardsPool = ref<{ categoryId: string; flashcard: Flashcard }[]>([]);

const dueQuestionCount = computed(() => srsStore.dueReviews.length);
const dueFlashcardCount = computed(() => srsStore.dueFlashcardReviews.length);

onMounted(async () => {
  try {
    isLoading.value = true;

    // 1. Load questions pool
    const allMaps = await fetchAllQuestionsMap();
    const qPool: { categoryId: string; question: Question }[] = [];
    const dueItems = srsStore.getDueReviewIds(20);
    for (const item of dueItems) {
      const qList: Question[] | undefined = allMaps[item.categoryId];
      if (qList) {
        const q = qList.find(
          (qItem: Question) => String(qItem.id) === String(item.questionId),
        );
        if (q) {
          if (isMobile.value && q.type === "algorithm") continue;
          qPool.push({ categoryId: item.categoryId, question: q });
        }
      }
    }
    questionsPool.value = qPool;

    // 2. Load flashcards pool
    const fcPool: { categoryId: string; flashcard: Flashcard }[] = [];
    const targetLimit = 20;
    const dueFcItems = srsStore.getDueFlashcardReviewIds(targetLimit);
    const fcRequests = new Map<string, string[]>();
    dueFcItems.forEach((item) => {
      if (!fcRequests.has(item.categoryId)) fcRequests.set(item.categoryId, []);
      fcRequests.get(item.categoryId)!.push(String(item.questionId));
    });

    for (const [catId, cards] of fcRequests.entries()) {
      const deck = await fetchFlashcardDeck(catId);
      if (deck) {
        cards.forEach((cardId) => {
          const fc = deck.cards.find((c) => String(c.id) === cardId);
          if (fc) fcPool.push({ categoryId: catId, flashcard: fc });
        });
      }
    }

    // 如果复习队列不足，自动从总牌组中补充未遇到的新卡片
    const neededNewFc = targetLimit - fcPool.length;
    if (neededNewFc > 0) {
      const categories = await fetchCategories();
      const srsSet = new Set(
        srsStore.flashcardSrsBook.map((r) => `${r.categoryId}_${r.questionId}`),
      );
      const candidateFc: { categoryId: string; flashcard: Flashcard }[] = [];

      // 遍历分类收集尚未学习过的新卡
      for (const cat of categories) {
        const deck = await fetchFlashcardDeck(cat.id);
        if (deck) {
          const unseenCards = deck.cards.filter(
            (c) => !srsSet.has(`${cat.id}_${c.id}`),
          );
          unseenCards.forEach((fc) => {
            candidateFc.push({ categoryId: cat.id, flashcard: fc });
          });
        }
      }

      // 稍微乱序并截取所需数量
      candidateFc.sort(() => Math.random() - 0.5);
      const newFcPool = candidateFc.slice(0, neededNewFc);
      fcPool.push(...newFcPool);
    }
    flashcardsPool.value = fcPool;
  } catch (e) {
    console.error("加载复习题库失败：", e);
  } finally {
    isLoading.value = false;
  }
});

const currentQuestionData = computed(() => {
  if (questionsPool.value.length === 0) return null;
  return questionsPool.value[0];
});

const currentQuestion = computed(
  () => currentQuestionData.value?.question || null,
);
const currentQuestionCategoryId = computed(
  () => currentQuestionData.value?.categoryId || "",
);

const currentFlashcardData = computed(() => {
  if (flashcardsPool.value.length === 0) return null;
  return flashcardsPool.value[0];
});

const currentFlashcard = computed(
  () => currentFlashcardData.value?.flashcard || null,
);
const currentFlashcardCategoryId = computed(
  () => currentFlashcardData.value?.categoryId || "",
);

function handleQuestionReview(rating: "forgot" | "hard" | "easy") {
  if (!currentQuestionData.value) return;
  const { categoryId, question } = currentQuestionData.value;
  srsStore.submitReview(categoryId, String(question.id), rating);
  questionsPool.value.shift();
}

function handleFlashcardReview(rating: "forgot" | "hard" | "easy") {
  if (!currentFlashcardData.value) return;
  const { categoryId, flashcard } = currentFlashcardData.value;
  srsStore.submitFlashcardReview(categoryId, String(flashcard.id), rating);
  flashcardsPool.value.shift();
}

function goBack() {
  if (window.history.state?.back) router.back();
  else router.push("/");
}
</script>

<style scoped lang="less">
.srs-game-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  @media (min-width: 600px) {
    max-width: 800px;
  }
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0;
  margin-bottom: 0.8rem;
}

.pill {
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 0.4rem 0.6rem;
  font-weight: 800;
  color: var(--theme-text-secondary);
  box-shadow: var(--theme-shadow-btn);
  font-size: 0.8rem;

  span {
    color: var(--theme-accent);
    font-weight: 900;
    margin-left: 0.2rem;
  }
}

.mode-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: var(--theme-card-bg);
  padding: 0.4rem;
  border-radius: var(--theme-radius-md);
  border: var(--theme-border-width) solid var(--theme-border-color);
  box-shadow: var(--theme-shadow-panel);

  .tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    border-radius: var(--theme-radius-sm);
    padding: 0.6rem;
    font-size: 1rem;
    font-weight: 800;
    color: var(--theme-text-light);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: var(--theme-text-secondary);
    }

    &.active {
      background: var(--theme-btn-settings-bg);
      color: var(--theme-text-secondary);
      box-shadow: var(--theme-shadow-btn);
    }
  }
}

.pixel-btn {
  background: var(--theme-btn-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 0.5rem 1rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 0.9rem;
  box-shadow: var(--theme-shadow-btn);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  cursor: pointer;

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }

  &.primary-btn {
    background: var(--theme-btn-primary-bg);
  }
}

.game-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1.5rem 0 2rem;
  position: relative;
  overflow: hidden;
}

.pixel-card {
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-md);
  padding: 2rem;
  text-align: center;
  box-shadow: var(--theme-shadow-card);
  width: 100%;

  p {
    font-weight: 700;
    color: var(--theme-text-secondary);
    font-size: 1rem;
  }
}

.end-game {
  margin-top: 2rem;
  .end-title {
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: #e85a7f;
  }
  .encouragement {
    color: var(--theme-text-light);
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  .actions {
    display: flex;
    justify-content: center;
  }
}

.loader {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid var(--theme-accent);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 换题时的滑入滑出动画 */
.slide-card-enter-active,
.slide-card-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: absolute;
  width: 100%;
}
.slide-card-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-card-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
