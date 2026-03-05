<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useProgressStore } from "@/stores/useProgressStore";
import { fetchQuestionsByCategory, fetchCategories } from "@/data/questions";
import type { Question, CategoryData } from "@/types/question";

const router = useRouter();
const progressStore = useProgressStore();

// questionsMap 用于存储已加载分类的题目，以便显示标题
const questionsMap = ref<Record<string, Question[]>>({});
const categories = ref<CategoryData[]>([]);
const loadedCategories = new Set<string>();

onMounted(async () => {
  // 加载分类列表用于显示名称
  try {
    categories.value = await fetchCategories();
  } catch (e) {
    console.error("加载分类列表失败", e);
  }

  // 只加载用户已有笔记涉及到的分类
  const neededCategories = new Set(
    progressStore.notes.map((n) => n.categoryId),
  );

  for (const categoryId of neededCategories) {
    if (!loadedCategories.has(categoryId)) {
      try {
        const qs = await fetchQuestionsByCategory(categoryId);
        questionsMap.value[categoryId] = qs;
        loadedCategories.add(categoryId);
      } catch (e) {
        console.error(`加载分类 ${categoryId} 失败`, e);
      }
    }
  }
});

const sortedNotes = computed(() => {
  return [...progressStore.notes].sort((a, b) => b.timestamp - a.timestamp);
});

function getQuestionTitle(categoryId: string, questionId: string) {
  const qList = questionsMap.value[categoryId] || [];
  const q = qList.find((item) => String(item.id) === String(questionId));
  return q ? q.title : `题目 [ID: ${questionId}]`;
}

function getCategoryName(categoryId: string) {
  return categories.value.find((c) => c.id === categoryId)?.name || categoryId;
}

function formatTime(ts: number) {
  const date = new Date(ts);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function deleteNote(note: any) {
  if (confirm("确定要删除这条笔记吗？")) {
    progressStore.saveNote(note.categoryId, note.questionId, "");
  }
}
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <button class="pixel-btn" @click="router.push('/')">← 返回首页</button>
      <h2>📝 我的笔记</h2>
    </header>

    <main class="main-card">
      <div v-if="sortedNotes.length === 0" class="state-view empty">
        <div class="big-emoji">📝</div>
        <h3>灵感荒漠</h3>
        <p>
          你还没有写过任何深度理解。在答题时点击“添加笔记”，记录你的闪变灵感吧。
        </p>
        <button class="pixel-btn primary-btn" @click="router.push('/')">
          开启修行之旅
        </button>
      </div>

      <div v-else class="list">
        <div
          v-for="note in sortedNotes"
          :key="note.categoryId + note.questionId"
          class="list-item"
        >
          <div class="item-header">
            <span class="badge">{{ getCategoryName(note.categoryId) }}</span>
            <span class="date-text">{{ formatTime(note.timestamp) }}</span>
          </div>

          <div class="item-title">
            {{ getQuestionTitle(note.categoryId, note.questionId) }}
          </div>

          <div class="item-content note-box">
            <div class="quote-mark">“</div>
            <p class="note-text">{{ note.content }}</p>
            <div class="quote-mark right">”</div>
          </div>

          <div class="item-footer">
            <button class="pixel-btn sm outline" @click="deleteNote(note)">
              🗑️ 删除笔记
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="less">
.page-container {
  padding: 1rem;
  max-width: 500px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  z-index: 1;

  @media (min-width: 600px) {
    max-width: 800px;
  }
}

.page-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;

  h2 {
    color: var(--theme-text-secondary);
    font-size: 1.5rem;
    margin: 0;
    @media (min-width: 600px) {
      font-size: 1.8rem;
    }
    span {
      font-size: 1rem;
      opacity: 0.7;
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
  transition: transform 0.15s;
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
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    margin-top: 1rem;
  }

  &.sm {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }

  &.outline {
    background: white;
    color: var(--theme-error);
    border-color: var(--theme-error);
  }
}

.main-card {
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-md);
  padding: 1.2rem;
  box-shadow: var(--theme-shadow-panel);

  @media (min-width: 600px) {
    padding: 1.8rem;
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .list-item {
    background: var(--theme-card-inner);
    border: var(--theme-border-width) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    padding: 1.5rem;
    text-align: left;
    box-shadow: var(--theme-shadow-inner);

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
      padding-bottom: 0.6rem;
      border-bottom: 2px dashed var(--theme-border-color);

      .badge {
        background: var(--theme-badge-bg);
        color: white;
        padding: 2px 8px;
        font-weight: 800;
        font-size: 0.8rem;
        border: var(--theme-border-width-xs) solid var(--theme-text-muted);
        border-radius: var(--theme-radius-sm);
      }

      .date-text {
        font-size: 0.8rem;
        color: var(--theme-text-muted);
      }
    }

    .item-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--theme-text-secondary);
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .note-box {
      position: relative;
      padding: 1rem 1.5rem;
      background: var(--theme-fact-bg);
      border-radius: var(--theme-radius-sm);
      border: 1px dashed var(--theme-border-color);
      margin-bottom: 1rem;

      .quote-mark {
        position: absolute;
        font-size: 2.5rem;
        font-family: serif;
        color: var(--theme-border-color);
        line-height: 1;
        opacity: 0.3;

        &:first-child {
          top: 0;
          left: 0.2rem;
        }

        &.right {
          bottom: -0.5rem;
          right: 0.2rem;
        }
      }

      .note-text {
        margin: 0;
        font-size: 1rem;
        line-height: 1.6;
        color: var(--theme-text-main);
        white-space: pre-wrap;
      }
    }

    .item-footer {
      display: flex;
      justify-content: flex-end;
    }
  }
}

.state-view {
  text-align: center;
  padding: 2rem 0;
  color: var(--theme-text-light);
  font-weight: 700;

  &.empty {
    h3 {
      font-size: 1.4rem;
      color: var(--theme-text-secondary);
      margin-bottom: 0.4rem;
    }
    .big-emoji {
      font-size: 3rem;
      margin-bottom: 0.6rem;
    }
  }
}
</style>
