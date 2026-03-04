import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useQuizStore = defineStore('quiz', () => {
  const currentScore = ref(0);
  const currentQuestionIndex = ref(0);
  const comboCount = ref(0); // 连续答对的次数

  // 存放本局发生错误的题目 ID
  const currentMistakes = ref<string[]>([]);
  const isAnswered = ref(false);

  function resetQuiz() {
    currentScore.value = 0;
    currentQuestionIndex.value = 0;
    comboCount.value = 0;
    currentMistakes.value = [];
    isAnswered.value = false;
  }

  /**
   * 提交答案并触发 MVP 计分规则
   */
  function submitAnswer(isCorrect: boolean, questionId: string) {
    if (isAnswered.value) return;
    isAnswered.value = true;

    if (isCorrect) {
      comboCount.value++;
      let points = 10;
      // 如果触发了高连击，每3题奖励 5 分
      if (comboCount.value >= 3) {
        points += 5;
      }
      currentScore.value += points;
    } else {
      comboCount.value = 0;
      // 错误扣 3 分，分数不为负数
      currentScore.value = Math.max(0, currentScore.value - 3);
      currentMistakes.value.push(questionId);
    }
  }

  function nextQuestion() {
    currentQuestionIndex.value++;
    isAnswered.value = false;
  }

  function getCurrentAccuracy() {
    if (currentQuestionIndex.value === 0 && !isAnswered.value) return 0;
    const totalAnswered = isAnswered.value ? currentQuestionIndex.value + 1 : currentQuestionIndex.value;
    const totalMistakes = currentMistakes.value.length;
    return Math.max(0, Math.round(((totalAnswered - totalMistakes) / totalAnswered) * 100));
  }

  function getCurrentCorrectCount() {
    const totalAnswered = isAnswered.value ? currentQuestionIndex.value + 1 : currentQuestionIndex.value;
    const totalMistakes = currentMistakes.value.length;
    return Math.max(0, totalAnswered - totalMistakes);
  }

  function getAnsweredCount() {
    return isAnswered.value ? currentQuestionIndex.value + 1 : currentQuestionIndex.value;
  }

  return {
    currentScore,
    currentQuestionIndex,
    comboCount,
    currentMistakes,
    isAnswered,
    resetQuiz,
    submitAnswer,
    nextQuestion,
    getCurrentAccuracy,
    getCurrentCorrectCount,
    getAnsweredCount,
  };
});
