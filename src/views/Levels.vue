<template>
  <div class="levels-container">
    <header class="levels-header">
      <button class="back-btn pixel-btn" @click="goHome">← 返回首页</button>
      <h1 v-if="category" class="category-title">
        {{ category.icon }} {{ category.name }}
      </h1>
    </header>

    <div class="mode-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentMode === 'levels' }"
        @click="currentMode = 'levels'"
      >
        🏆 闯关
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentMode === 'flashcards' }"
        @click="currentMode = 'flashcards'"
      >
        🗂️ 闪卡
      </button>
    </div>

    <main class="levels-area">
      <div v-if="isLoading" class="state-view pixel-card">
        <div class="loader"></div>
        <p>正在拉取数据...</p>
      </div>

      <template v-else-if="currentMode === 'levels' && category">
        <div v-if="tags.length > 0" class="tags-section">
          <div class="tags-header">
            <h3 class="section-title">🏷️ 专项挑战 (Tags)</h3>
            <button
              class="toggle-btn"
              v-if="tags.length > 12"
              @click="isTagsExpanded = !isTagsExpanded"
            >
              {{ isTagsExpanded ? "收起" : "展开全部" }}
            </button>
          </div>
          <div class="tags-cloud">
            <button
              v-for="t in displayedTags"
              :key="t.tag"
              class="tag-btn"
              @click="playTagLevel(t.tag)"
            >
              {{ t.tag }} <span class="tag-count">{{ t.count }}题</span>
            </button>
          </div>
        </div>

        <h3 class="section-title">🌟 顺序闯关</h3>
        <div class="levels-grid">
          <div
            v-for="(lvl, index) in category.levels"
            :key="lvl.id"
            class="level-card"
            :class="{ locked: !isUnlocked(index) }"
            :style="{
              borderColor: isUnlocked(index)
                ? getCategoryColor(categoryId)
                : undefined,
            }"
            @click="playLevel(lvl.id, index)"
          >
            <div class="level-info">
              <h3>{{ lvl.name || `第 ${index + 1} 关` }}</h3>
              <p>{{ lvl.questionIds.length }} 题</p>
            </div>
            <div class="level-status">
              <template v-if="isUnlocked(index)">
                <div v-if="getScore(lvl.id) > 0" class="score-badge">
                  最高分: {{ getScore(lvl.id) }}
                </div>
                <div v-else class="play-hint">点击开始</div>
              </template>
              <template v-else><div class="lock-icon">🔒 待解锁</div></template>
            </div>
          </div>
        </div>
      </template>

      <!-- 闪卡模式 -->
      <template v-else-if="currentMode === 'flashcards'">
        <div v-if="isFlashcardLoading" class="state-view pixel-card">
          <div class="loader"></div>
          <p>正在加载闪卡...</p>
        </div>
        <div v-else-if="!flashcardDeck" class="state-view pixel-card">
          <h3>🚧 建设中</h3>
          <p>该分类下暂未提供高级记忆闪卡，敬请期待！</p>
        </div>
        <div v-else class="flashcard-panel pixel-card">
          <div class="fc-header">
            <h3>{{ flashcardDeck.file_metadata.category_name }} - 记忆闪卡</h3>
            <span class="fc-badge">{{
              flashcardDeck.file_metadata.target_level || "Expert"
            }}</span>
          </div>
          <p class="fc-desc">
            基于主动回忆与间隔重复（SRS）的高效学习模式，直击底层原理与实战经验。当前拥有
            <strong>{{ flashcardDeck.file_metadata.total_cards }}</strong>
            张卡片供您探索。
          </p>
          <button
            class="pixel-btn primary-btn fc-start"
            @click="startFlashcardReview"
          >
            🕹️ 开始学习
          </button>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWindowSize } from "@vueuse/core";
import { fetchCategories, fetchTagsByCategory } from "@/data/questions";
import { fetchFlashcardDeck } from "@/data/flashcards";
import { useProgressStore } from "@/stores/useProgressStore";
import { getCategoryColor } from "@/utils/categoryColor";
import type { CategoryData } from "@/types/question";
import type { FlashcardDeck } from "@/types/flashcard";

const route = useRoute();
const router = useRouter();
const { width } = useWindowSize();
const progressStore = useProgressStore();
const categoryId = route.params.category as string;
const category = ref<CategoryData | null>(null);
const isLoading = ref(true);
const tags = ref<{ tag: string; count: number }[]>([]);
const isTagsExpanded = ref(false);

const currentMode = ref<"levels" | "flashcards">("levels");
const flashcardDeck = ref<FlashcardDeck | null>(null);
const isFlashcardLoading = ref(false);

const displayedTags = computed(() => {
  if (isTagsExpanded.value) return tags.value;
  // 移动端收起时显示更少
  const limit = width.value < 600 ? 6 : 12;
  return tags.value.slice(0, limit);
});

onMounted(async () => {
  const cats = await fetchCategories();
  category.value = cats.find((c) => c.id === categoryId) || null;
  if (category.value) tags.value = await fetchTagsByCategory(categoryId);
  // default active logic for flashcards could trigger here, but loaded on demand below is better
  isLoading.value = false;
});

watch(currentMode, async (newMode) => {
  if (newMode === "flashcards" && !flashcardDeck.value) {
    isFlashcardLoading.value = true;
    try {
      flashcardDeck.value = await fetchFlashcardDeck(categoryId);
    } catch (e) {
      console.error(e);
    } finally {
      isFlashcardLoading.value = false;
    }
  }
});

function goHome() {
  if (window.history.state?.back) router.back();
  else router.replace("/");
}
function getLevelKey(levelId: string) {
  return `${categoryId}_${levelId}`;
}
function isUnlocked(index: number) {
  if (index === 0) return true;
  const lid = category.value?.levels?.[index]?.id;
  if (!lid) return false;
  return !!progressStore.unlockedLevels[getLevelKey(lid)]?.unlocked;
}
function getScore(levelId: string) {
  return progressStore.unlockedLevels[getLevelKey(levelId)]?.score || 0;
}
function playLevel(levelId: string, index: number) {
  if (isUnlocked(index)) router.push(`/game/${categoryId}/${levelId}`);
}
function playTagLevel(tag: string) {
  router.push(`/game/${categoryId}/tag_${encodeURIComponent(tag)}`);
}
function startFlashcardReview() {
  router.push(`/flashcard/${categoryId}`);
}
</script>

<style scoped lang="less">
.levels-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.5rem 1rem;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  @media (min-width: 600px) {
    max-width: 900px;
  }
}

.levels-header {
  display: flex;
  align-items: center;
  padding: 0.8rem 0;
  margin-bottom: 0.8rem;
  gap: 0.6rem;
  overflow: hidden;

  .category-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--theme-text-secondary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;

    @media (min-width: 600px) {
      font-size: 1.8rem;
    }
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

.flashcard-panel {
  text-align: center;
  padding: 3rem 1.5rem;

  .fc-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    margin-bottom: 1.2rem;
    flex-wrap: wrap;

    h3 {
      font-size: 1.4rem;
      margin: 0;
      color: var(--theme-text-secondary);
    }

    .fc-badge {
      background: var(--theme-accent);
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: var(--theme-radius-sm);
      font-size: 0.8rem;
      font-weight: 800;
    }
  }

  .fc-desc {
    color: var(--theme-text-main);
    line-height: 1.6;
    margin-bottom: 2rem;
    font-size: 1rem;

    strong {
      color: var(--theme-accent);
      font-size: 1.2rem;
    }
  }

  .fc-start {
    font-size: 1.1rem;
    padding: 0.8rem 2.5rem;
  }
}

.pixel-btn {
  background: var(--theme-btn-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 0.5rem 1rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 0.95rem;
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
}

.levels-area {
  flex: 1;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}

.level-card {
  background: var(--theme-card-inner);
  border: var(--theme-level-card-border);
  border-radius: var(--theme-radius-sm);
  padding: 0.8rem 0.4rem;
  text-align: center;
  box-shadow: var(--theme-shadow-btn);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 85px;

  @media (min-width: 600px) {
    padding: 1.2rem 0.8rem;
    min-height: 110px;
  }

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }

  &.locked {
    border-color: #b8c2cc;
    background: var(--theme-btn-disabled-bg);
    cursor: not-allowed;
    opacity: 0.75;
    pointer-events: none;
  }

  .level-info {
    h3 {
      margin: 0 0 0.2rem;
      color: var(--theme-text-secondary);
      font-weight: 800;
      font-size: 0.9rem;
      @media (min-width: 600px) {
        font-size: 1.1rem;
      }
    }
    p {
      margin: 0;
      color: var(--theme-text-light);
      font-size: 0.8rem;
      font-weight: 700;
      @media (min-width: 600px) {
        font-size: 0.9rem;
      }
    }
  }

  .level-status {
    margin-top: 0.4rem;
  }

  .score-badge {
    background: var(--theme-card-bg);
    color: #e85a7f;
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    padding: 2px 6px;
    font-size: 0.75rem;
    font-weight: 800;
    display: inline-block;
    @media (min-width: 600px) {
      font-size: 0.85rem;
      padding: 3px 8px;
    }
  }

  .play-hint {
    color: var(--theme-accent);
    font-weight: 800;
    font-size: 0.85rem;
    @media (min-width: 600px) {
      font-size: 1rem;
    }
  }

  .lock-icon {
    font-size: 0.8rem;
    color: var(--theme-text-light);
    font-weight: 700;
  }
}

.msg {
  text-align: center;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 1.1rem;
  margin-top: 3rem;
}

.section-title {
  font-size: 1.15rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  margin: 1rem 0 0.8rem;
}

.tags-section {
  margin-bottom: 2rem;
  background: var(--theme-card-inner);
  border: var(--theme-border-width-xs) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 1rem;
  box-shadow: var(--theme-shadow-inner);
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;

  .section-title {
    margin: 0;
  }
}

.toggle-btn {
  background: transparent;
  border: var(--theme-border-width-xs) solid var(--theme-border-color);
  color: var(--theme-text-light);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--theme-btn-settings-bg);
    color: var(--theme-text-secondary);
  }
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;

  @media (max-width: 600px) {
    gap: 0.4rem;
  }
}

.tag-btn {
  background: var(--theme-btn-settings-bg);
  border: 1px solid var(--theme-border-color);
  color: var(--theme-text-secondary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    background: var(--theme-btn-settings-accent);
  }

  .tag-count {
    background: var(--theme-accent);
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    margin-left: 4px;
  }

  @media (max-width: 600px) {
    padding: 4px 8px;
    font-size: 0.75rem;
    border-radius: 4px;

    .tag-count {
      padding: 1px 4px;
      margin-left: 2px;
    }
  }
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

.state-view {
  margin-top: 2rem;
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
