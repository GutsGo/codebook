<template>
  <div class="srs-game-container">
    <header class="game-header">
      <button class="back-btn pixel-btn" @click="goBack">← 返回首页</button>
      <div class="score pill">
        复习待办: <span>{{ dueCount }}</span>
      </div>
    </header>

    <main class="game-area">
      <div v-if="isLoading" class="state-view pixel-card">
        <div class="loader"></div>
        <p>正在生成复习题库...</p>
      </div>

      <div v-else-if="!currentQuestion" class="state-view pixel-card end-game">
        <h2 class="end-title">🎉 太棒了！</h2>
        <p class="encouragement">
          当前没有需要紧急复习的题目了。<br />休息一下，或者去探索新的关卡吧！
        </p>
        <div class="actions">
          <button class="pixel-btn primary-btn" @click="goBack">
            返回首页
          </button>
        </div>
      </div>

      <transition name="slide-card" mode="out-in">
        <QuestionCard
          v-if="currentQuestion"
          :key="currentQuestion.id"
          :question="currentQuestion"
          :category-id="currentCategoryId"
          :is-srs-mode="true"
          @srs-review="handleSrsReview"
        />
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useSrsStore } from "@/stores/useSrsStore";
import QuestionCard from "@/components/QuestionCard.vue";
import { fetchAllQuestionsMap } from "@/data/questions";
import type { Question } from "@/types/question";
import { useWindowSize } from "@vueuse/core";

const router = useRouter();
const srsStore = useSrsStore();

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const isLoading = ref(true);
const questionsPool = ref<{ categoryId: string; question: Question }[]>([]);

const dueCount = computed(() => srsStore.dueReviews.length);

onMounted(async () => {
  try {
    // 拉取所有可用题目（全库量若不大可直接全拉）
    const allMaps = await fetchAllQuestionsMap();
    const pool: { categoryId: string; question: Question }[] = [];

    // 这里拉取需要复习的 ID 队列
    const dueItems = srsStore.getDueReviewIds(20);

    for (const item of dueItems) {
      const qList: Question[] | undefined = allMaps[item.categoryId];
      if (qList) {
        const q = qList.find(
          (qItem: Question) => String(qItem.id) === String(item.questionId),
        );
        if (q) {
          if (isMobile.value && q.type === "algorithm") continue; // 移动端跳过算法题
          pool.push({ categoryId: item.categoryId, question: q });
        }
      }
    }

    // 目前仅展示到期的题目

    questionsPool.value = pool;
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
const currentCategoryId = computed(
  () => currentQuestionData.value?.categoryId || "",
);

function handleSrsReview(rating: "forgot" | "hard" | "easy") {
  if (!currentQuestionData.value) return;
  const { categoryId, question } = currentQuestionData.value;

  // 记录到 SRS Store 中
  srsStore.submitReview(categoryId, String(question.id), rating);

  // 从队列里推出
  questionsPool.value.shift();
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
  padding: 0 0 2rem;
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
