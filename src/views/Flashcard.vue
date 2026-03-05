<template>
  <div class="flashcard-page-container">
    <header class="page-header">
      <button class="pixel-btn" @click="goBack">← 返回</button>
      <div class="progress pill" v-if="deck && deck.cards.length > 0">
        {{ currentIndex + 1 }} / {{ deck.cards.length }}
      </div>
    </header>

    <main class="flashcard-area">
      <div v-if="isLoading" class="state-view pixel-card">
        <div class="loader"></div>
        <p>正在拉取闪卡包...</p>
      </div>

      <div
        v-else-if="!deck || deck.cards.length === 0"
        class="state-view pixel-card"
      >
        <h2 class="end-title">📭 暂无数据</h2>
        <p>当前分类下尚未配置闪卡数据。</p>
        <button class="pixel-btn primary-btn" @click="goBack">返回分类</button>
      </div>

      <div v-else-if="isFinished" class="state-view pixel-card end-game">
        <h2 class="end-title">🎉 学习完成！</h2>
        <p class="encouragement">
          你已经浏览完本组所有卡片。<br />记得善用“收藏”和主页的“间隔重复”功能强化记忆哦！
        </p>
        <div
          class="actions"
          style="
            margin-top: 2rem;
            gap: 1rem;
            display: flex;
            justify-content: center;
          "
        >
          <button class="pixel-btn primary-btn" @click="restart">
            再来一遍
          </button>
          <button class="pixel-btn" @click="goBack">返回分类</button>
        </div>
      </div>

      <transition name="slide-card" mode="out-in" v-else>
        <div
          :key="currentCard?.id"
          style="width: 100%; display: flex; justify-content: center"
        >
          <FlashcardItem
            v-if="currentCard"
            :flashcard="currentCard"
            :category-id="categoryId"
            @srs-review="handleReview"
          />
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchFlashcardDeck } from "@/data/flashcards";
import { useSrsStore } from "@/stores/useSrsStore";
import FlashcardItem from "@/components/FlashcardItem.vue";
import type { FlashcardDeck } from "@/types/flashcard";

const route = useRoute();
const router = useRouter();
const srsStore = useSrsStore();

const categoryId = route.params.category as string;
const deck = ref<FlashcardDeck | null>(null);
const isLoading = ref(true);

const currentIndex = ref(0);
const isFinished = computed(() => {
  return deck.value ? currentIndex.value >= deck.value.cards.length : false;
});

const currentCard = computed(() => {
  if (deck.value && !isFinished.value) {
    return deck.value.cards[currentIndex.value];
  }
  return null;
});

onMounted(async () => {
  isLoading.value = true;
  try {
    deck.value = await fetchFlashcardDeck(categoryId);
  } catch (error) {
    console.error("Failed to load flashcard deck:", error);
  } finally {
    isLoading.value = false;
  }
});

function handleReview(rating: "forgot" | "hard" | "easy") {
  if (currentCard.value) {
    srsStore.submitFlashcardReview(
      categoryId,
      String(currentCard.value.id),
      rating,
    );
  }
  nextCard();
}

function nextCard() {
  currentIndex.value++;
}

function restart() {
  currentIndex.value = 0;
}

function goBack() {
  if (window.history.state?.back) router.back();
  else router.push(`/levels/${categoryId}`);
}
</script>

<style scoped lang="less">
.flashcard-page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0;
  margin-bottom: 2rem;

  .progress.pill {
    background: var(--theme-card-bg);
    border: var(--theme-border-width) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    padding: 0.4rem 0.8rem;
    font-weight: 800;
    color: var(--theme-text-secondary);
    box-shadow: var(--theme-shadow-btn);
    font-size: 0.9rem;
  }
}

.flashcard-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1.5rem 0 2rem; /* 增加顶部内边距，容纳向外溢出的胶带 */
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
}

.end-game {
  margin-top: 2rem;
  max-width: 500px;

  .end-title {
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--theme-accent);
  }
  .encouragement {
    color: var(--theme-text-main);
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.6;
    font-size: 1.1rem;
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

/* Slide Transition */
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
