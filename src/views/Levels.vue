<template>
  <div class="levels-container">
    <header class="levels-header">
      <button class="back-btn pixel-btn" @click="goHome">← 返回首页</button>
      <h1 v-if="category" class="category-title">
        {{ category.icon }} {{ category.name }}
      </h1>
    </header>

    <main class="levels-area" v-if="category">
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchCategories, fetchTagsByCategory } from "@/data/questions";
import { useProgressStore } from "@/stores/useProgressStore";
import { getCategoryColor } from "@/utils/categoryColor";
import type { CategoryData } from "@/types/question";

const route = useRoute();
const router = useRouter();
const progressStore = useProgressStore();
const categoryId = route.params.category as string;
const category = ref<CategoryData | null>(null);
const isLoading = ref(true);
const tags = ref<{ tag: string; count: number }[]>([]);
const isTagsExpanded = ref(false);

const displayedTags = computed(() => {
  if (isTagsExpanded.value || tags.value.length <= 12) {
    return tags.value;
  }
  return tags.value.slice(0, 12);
});

onMounted(async () => {
  const cats = await fetchCategories();
  category.value = cats.find((c) => c.id === categoryId) || null;
  if (category.value) tags.value = await fetchTagsByCategory(categoryId);
  isLoading.value = false;
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
}
</style>
