<template>
  <div class="page-container">
    <header class="page-header">
      <button class="pixel-btn" @click="goBack">← 返回首页</button>
      <h2>📖 错题本</h2>
    </header>
    <main class="main-card">
      <div v-if="loading" class="state-view">
        <div class="loader"></div>
        <p>正在加载错题本...</p>
      </div>
      <div
        v-else-if="mistakesWithDetails.length === 0"
        class="state-view empty"
      >
        <div class="big-emoji">🎉</div>
        <h3>太棒了！</h3>
        <p>你的错题本空空如也，继续保持哦！</p>
      </div>
      <div v-else class="list">
        <div
          v-for="item in mistakesWithDetails"
          :key="item.categoryId + '_' + item.questionId"
          class="list-item"
        >
          <div class="item-header">
            <span class="badge">{{ getCategoryName(item.categoryId) }}</span>
            <button
              class="pixel-btn sm green"
              @click="markAsMastered(item.categoryId, item.questionId)"
            >
              已掌握 ✓
            </button>
          </div>
          <div class="item-title">
            {{ item.question?.title || "题目加载失败" }}
          </div>
          <pre class="item-content" v-if="item.question?.content">{{
            (item.question as any).content.replace(/\\n/g, "\n")
          }}</pre>

          <div class="item-answer" v-if="item.question">
            正确答案: <span>{{ formatAnswer(item.question) }}</span>
          </div>
          <div class="item-explain" v-if="item.question?.explanation">
            {{ item.question.explanation }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProgressStore } from "@/stores/useProgressStore";
import { fetchCategories } from "@/data/questions";
import { resolveDataUrl } from "@/utils/assets";
import type { Question, CategoryData, MistakeRecord } from "@/types/question";
const router = useRouter();
const progressStore = useProgressStore();
const loading = ref(true);
const rawMistakes = ref<MistakeRecord[]>([]);
const categories = ref<CategoryData[]>([]);
interface MistakeDetail extends MistakeRecord {
  question?: Question;
}
const mistakesWithDetails = ref<MistakeDetail[]>([]);
function goBack() {
  router.push("/");
}

import { fetchQuestionsByCategory } from "@/data/questions";

function formatAnswer(q: any) {
  const ans = q.correct_answer !== undefined ? q.correct_answer : q.answer;
  if (q.type === "multiple_choice" && Array.isArray(ans)) {
    return ans.join(", ");
  }
  if (q.type === "algorithm") return ans || "要求参考模板实现";
  if (typeof ans === "boolean") return ans ? "正确" : "错误";
  return String(ans || "");
}
function getCategoryName(id: string) {
  return categories.value.find((c: any) => c.id === id)?.name || id;
}
async function loadMistakes() {
  loading.value = true;
  try {
    categories.value = await fetchCategories();
    rawMistakes.value = progressStore.mistakeBook;
    const list: MistakeDetail[] = [];
    const cg = new Map<string, string[]>();
    rawMistakes.value.forEach((m: any) => {
      if (!cg.has(m.categoryId)) cg.set(m.categoryId, []);
      cg.get(m.categoryId)!.push(String(m.questionId));
    });
    for (const [catId, qIds] of cg.entries()) {
      try {
        const allQs = await fetchQuestionsByCategory(catId);
        if (allQs.length > 0) {
          qIds.forEach((qid) => {
            const m = allQs.find((q: any) => String(q.id) === qid);
            if (m) {
              const r = rawMistakes.value.find(
                (r: any) =>
                  r.categoryId === catId && String(r.questionId) === qid,
              );
              if (r) list.push({ ...r, question: m });
            }
          });
        }
      } catch (e) {
        console.error(`Failed to load mistakes for category ${catId}:`, e);
      }
    }
    mistakesWithDetails.value = list.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Failed to load mistake book:", e);
  } finally {
    loading.value = false;
  }
}
function markAsMastered(cid: string, qid: string) {
  progressStore.removeMistake(cid, qid);
  mistakesWithDetails.value = mistakesWithDetails.value.filter(
    (m) => !(m.categoryId === cid && String(m.questionId) === qid),
  );
}
onMounted(() => loadMistakes());
</script>

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

  &.sm {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }

  &.green {
    background: var(--theme-btn-settings-bg);
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
  gap: 1rem;

  .list-item {
    background: var(--theme-card-inner);
    border: var(--theme-border-width) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    padding: 1rem;
    text-align: left;
    box-shadow: var(--theme-shadow-inner);

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px dashed var(--theme-border-color);

      .badge {
        background: var(--theme-info);
        color: white;
        padding: 2px 8px;
        font-weight: 800;
        font-size: 0.8rem;
        border: var(--theme-border-width-xs) solid var(--theme-text-muted);
        border-radius: var(--theme-radius-sm);
      }
    }

    .item-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--theme-text-secondary);
      margin-bottom: 0.6rem;
      line-height: 1.5;
    }

    .item-img {
      margin-bottom: 0.6rem;
      text-align: center;

      img {
        max-width: 100%;
        max-height: 140px;
        border: var(--theme-border-width) solid var(--theme-border-color);
        border-radius: var(--theme-radius-sm);
        box-shadow: var(--theme-shadow-inner);
      }

      .emoji-display {
        font-size: 3rem;
        display: inline-block;
        background: var(--theme-explain-bg);
        padding: 0.6rem;
        border: var(--theme-border-width) solid var(--theme-border-color);
        border-radius: var(--theme-radius-sm);
        box-shadow: var(--theme-shadow-btn);
      }
    }

    .item-answer {
      color: var(--theme-info);
      font-weight: 800;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;

      span {
        background: white;
        padding: 2px 6px;
        border: var(--theme-border-width-xs) solid var(--theme-info);
        border-radius: var(--theme-radius-sm);
        color: var(--theme-text-secondary);
      }
    }

    .item-explain {
      font-size: 0.9rem;
      color: var(--theme-text-light);
      line-height: 1.6;
      background: var(--theme-explain-bg);
      padding: 0.7rem;
      border: var(--theme-border-width-xs) solid var(--theme-border-color);
      border-radius: var(--theme-radius-sm);
    }
  }
}

.state-view {
  text-align: center;
  padding: 2rem 0;
  color: var(--theme-text-light);
  font-weight: 700;

  p {
    font-size: 1rem;
    line-height: 1.6;
  }

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
  to {
    transform: rotate(360deg);
  }
}
</style>
