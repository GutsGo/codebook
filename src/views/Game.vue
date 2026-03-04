<template>
  <div class="game-container">
    <header class="game-header">
      <button class="back-btn pixel-btn" @click="goBack">← 返回</button>
      <div class="progress pill" v-if="questions.length > 0">
        进度: <span>{{ currentIndex + 1 }}/{{ questions.length }}</span>
      </div>
      <div class="score pill">
        得分: <span>{{ quizStore.currentScore }}</span>
      </div>
    </header>

    <main class="game-area">
      <div v-if="isLoading" class="state-view pixel-card">
        <div class="loader"></div>
        <p>正在加载题目...</p>
      </div>

      <div
        v-else-if="questions.length === 0"
        class="state-view pixel-card error"
      >
        <h2>非常抱歉</h2>
        <p>暂未找到类别「{{ category }}」的题目！</p>
        <button class="pixel-btn primary-btn" @click="goBack">返回关卡</button>
      </div>

      <div v-else-if="isGameOver" class="state-view pixel-card end-game">
        <h2 class="end-title">🎉 游戏结束！</h2>
        <div class="final-score">
          最终得分<span>{{ quizStore.currentScore }}</span>
        </div>
        <p class="stats pill">
          总用时: {{ formatTime(timeSpent) }} | 正确率:
          {{ quizStore.getCurrentAccuracy() }}%
        </p>
        <p class="encouragement">{{ getEncouragementText() }}</p>
        <div class="actions">
          <button class="pixel-btn secondary-btn" @click="goBack">
            返回关卡
          </button>
          <button
            v-if="hasNextLevel"
            class="pixel-btn primary-btn"
            @click="goToNextLevel"
          >
            下一关卡
          </button>
          <button
            v-if="quizStore.currentMistakes.length > 0"
            class="pixel-btn secondary-btn"
            @click="showMistakeList = !showMistakeList"
          >
            {{
              showMistakeList
                ? "隐藏错题"
                : `错题解析 (${quizStore.currentMistakes.length})`
            }}
          </button>
        </div>

        <div v-if="showMistakeList" class="mistakes-panel">
          <h3>错题回顾</h3>
          <div
            v-for="qId in quizStore.currentMistakes"
            :key="qId"
            class="mistake-item"
          >
            <div class="m-title">{{ getQuestionPrompt(qId) }}</div>
            <div class="m-answer">
              正确答案: <span>{{ getQuestionAnswer(qId) }}</span>
            </div>
            <div class="m-explain">{{ getQuestionExplanation(qId) }}</div>
          </div>
        </div>
      </div>

      <QuestionCard
        v-else-if="currentQuestion"
        :question="currentQuestion"
        :category-id="category"
        @answer="handleAnswer"
        @next="nextQuestion"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useQuizStore } from "@/stores/useQuizStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import QuestionCard from "@/components/QuestionCard.vue";
import { fetchCategories, fetchQuestionsByLevel } from "@/data/questions";
import type { Question } from "@/types/question";

const props = defineProps<{ category: string; level: string }>();
const router = useRouter();
const quizStore = useQuizStore();
const progressStore = useProgressStore();
const settingsStore = useSettingsStore();

const isLoading = ref(true);
const questions = ref<Question[]>([]);
const isGameOver = ref(false);
const showMistakeList = ref(false);
const hasNextLevel = ref(false);
const nextLevelId = ref("");
const timeSpent = ref(0);
let timerRef: number;

const currentIndex = computed(() => quizStore.currentQuestionIndex);
const currentQuestion = computed(() => questions.value[currentIndex.value]);

onMounted(async () => {
  quizStore.resetQuiz();
  try {
    const q = await fetchQuestionsByLevel(props.category, props.level);
    questions.value = [...q].sort(() => Math.random() - 0.5);
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
    timerRef = window.setInterval(() => {
      if (!isGameOver.value && questions.value.length > 0) timeSpent.value++;
    }, 1000);
  }
});
onUnmounted(() => clearInterval(timerRef));

function handleAnswer(isCorrect: boolean) {
  if (!currentQuestion.value) return;
  const qId = String(currentQuestion.value.id);
  quizStore.submitAnswer(isCorrect, qId);
  if (!isCorrect) progressStore.addMistakes(props.category, [qId]);
}
function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) quizStore.nextQuestion();
  else {
    isGameOver.value = true;
    clearInterval(timerRef);
    handleGameOver();
  }
}

async function handleGameOver() {
  settingsStore.playSound("win");
  progressStore.updateLevelProgress(
    props.category,
    props.level,
    quizStore.currentScore,
    quizStore.getCurrentAccuracy(),
    quizStore.getAnsweredCount(),
    quizStore.getCurrentCorrectCount(),
  );
  progressStore.addMistakes(props.category, quizStore.currentMistakes);
  try {
    const cats = await fetchCategories();
    const cat = cats.find((c) => c.id === props.category);
    if (cat?.levels) {
      const idx = cat.levels.findIndex((l) => l.id === props.level);
      const nl = cat.levels[idx + 1];
      if (idx !== -1 && nl) {
        progressStore.unlockNextLevel(props.category, nl.id);
        hasNextLevel.value = true;
        nextLevelId.value = nl.id;
      }
    }
  } catch (e) {
    console.error(e);
  }
}
function goToNextLevel() {
  router.replace(`/game/${props.category}/${nextLevelId.value}`);
}
function goBack() {
  if (window.history.state?.back) router.back();
  else router.replace(`/levels/${props.category}`);
}
function getEncouragementText() {
  const a = quizStore.getCurrentAccuracy();
  if (a === 100) return "太棒了！全部答对！";
  if (a >= 70) return "表现不错，继续努力！";
  return "失败是成功之母，复习一下吧！";
}
function formatTime(s: number) {
  return `${Math.floor(s / 60)}分${s % 60}秒`;
}
function getQuestionById(qId: string) {
  return questions.value.find((q) => String(q.id) === String(qId));
}
function getQuestionPrompt(qId: string) {
  return getQuestionById(qId)?.title || "未知题目";
}
function getQuestionAnswer(qId: string) {
  const q = getQuestionById(qId) as any;
  if (!q) return "";
  if (q.type === "single_choice" || q.type === "true_false")
    return q.correct_answer;
  if (q.type === "multiple_choice") return q.correct_answer.join(", ");
  if (q.type === "algorithm") return "算法验证";
  return "";
}
function getQuestionExplanation(qId: string) {
  return getQuestionById(qId)?.explanation || "暂无解析";
}
</script>

<style scoped lang="less">
.game-container {
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
  gap: 0.3rem;
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
  line-height: 1.2;
  white-space: nowrap;
  flex-shrink: 0;

  @media (min-width: 600px) {
    font-size: 0.95rem;
    padding: 0.5rem 1rem;
  }

  span {
    color: var(--theme-accent);
    font-weight: 900;
    font-size: 0.9rem;
    margin-left: 0.2rem;

    @media (min-width: 600px) {
      font-size: 1.1rem;
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

  &.primary-btn,
  &.secondary-btn {
    font-size: 1rem;
    padding: 0.7rem 1.5rem;
  }

  &.primary-btn {
    background: var(--theme-btn-primary-bg);
  }

  &.secondary-btn {
    background: var(--theme-btn-secondary-bg);
  }
}

.game-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0 0 2rem;
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
  .end-title {
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: #e85a7f;
    @media (min-width: 600px) {
      font-size: 2.2rem;
    }
  }

  .final-score {
    font-size: 1.2rem;
    color: var(--theme-text-secondary);
    font-weight: 800;
    margin-bottom: 0.8rem;
    display: flex;
    flex-direction: column;
    align-items: center;

    span {
      font-size: 3rem;
      color: var(--theme-highlight);
      margin-top: 0.4rem;
      @media (min-width: 600px) {
        font-size: 3.5rem;
      }
    }
  }

  .stats {
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
    display: inline-block;
  }

  .encouragement {
    color: var(--theme-text-light);
    font-weight: 700;
    margin-bottom: 1.5rem;
    font-size: 1rem;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 0.7rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
}

.mistakes-panel {
  text-align: left;
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-md);
  padding: 1.2rem;
  margin-top: 1.5rem;
  box-shadow: var(--theme-shadow-panel);

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #e85a7f;
    font-size: 1.2rem;
    text-align: center;
    border-bottom: 3px dashed var(--theme-border-color);
    padding-bottom: 0.7rem;
  }

  .mistake-item {
    margin-bottom: 1rem;
    background: var(--theme-card-inner);
    border: var(--theme-border-width) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    padding: 0.8rem;
    box-shadow: var(--theme-shadow-inner);

    .m-title {
      font-weight: 800;
      color: var(--theme-text-secondary);
      margin-bottom: 0.4rem;
      font-size: 1rem;
    }

    .m-answer {
      color: var(--theme-info);
      font-weight: 800;
      margin-bottom: 0.4rem;
      font-size: 0.9rem;

      span {
        background: var(--theme-card-bg);
        padding: 2px 6px;
        border: var(--theme-border-width-xs) solid var(--theme-info);
        border-radius: var(--theme-radius-sm);
        color: var(--theme-text-secondary);
      }
    }

    .m-explain {
      font-size: 0.9rem;
      color: var(--theme-text-light);
      line-height: 1.6;
      background: var(--theme-explain-bg);
      padding: 0.6rem;
      border: var(--theme-border-width-xs) solid var(--theme-border-color);
      border-radius: var(--theme-radius-sm);
    }
  }
}

.loader {
  border: 4px solid rgba(94, 76, 65, 0.1);
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
</style>
