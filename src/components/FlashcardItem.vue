<template>
  <div
    class="flashcard-container"
    :class="{ 'is-flipped': isFlipped }"
    :style="{ height: containerHeight + 'px' }"
  >
    <div class="flashcard-inner">
      <!-- 正面 -->
      <div class="flashcard-face flashcard-front pixel-card" ref="frontRef">
        <div class="tape"></div>
        <div class="card-header">
          <div class="tags-row">
            <span class="q-tag" v-for="tag in flashcard.tags" :key="tag">{{
              tag
            }}</span>
            <span class="q-difficulty" :class="flashcard.difficulty">{{
              getDifficultyLabel(flashcard.difficulty)
            }}</span>
          </div>
          <div class="card-actions">
            <button
              class="fav-btn"
              :class="{ active: isFavorite }"
              @click.stop="toggleFavorite"
            >
              <span class="fav-icon">{{ isFavorite ? "⭐" : "☆" }}</span>
              <span class="fav-text">{{ isFavorite ? "已收藏" : "收藏" }}</span>
            </button>
          </div>
        </div>

        <div class="card-body">
          <h2 class="concept-title">{{ flashcard.front_concept }}</h2>

          <div
            v-if="flashcard.hints && flashcard.hints.length > 0"
            class="hints-section"
            @click.stop
          >
            <button
              class="pixel-btn sm outline"
              @click="showHints = !showHints"
              v-if="!showHints"
            >
              💡 查看提示
            </button>
            <div v-else class="hints-list">
              <ul>
                <li v-for="(hint, index) in flashcard.hints" :key="index">
                  {{ hint }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <p class="flip-hint">点击卡片翻转查看解析 ↺</p>
        </div>
        <div class="click-overlay" @click="flipCard"></div>
      </div>

      <!-- 背面 -->
      <div class="flashcard-face flashcard-back pixel-card" ref="backRef">
        <div class="tape"></div>
        <div class="card-header">
          <div class="tags-row">
            <span
              class="q-tag"
              v-for="tag in flashcard.tags"
              :key="'back_' + tag"
              >{{ tag }}</span
            >
            <span class="q-difficulty" :class="flashcard.difficulty">{{
              getDifficultyLabel(flashcard.difficulty)
            }}</span>
          </div>
          <div class="card-actions">
            <button
              class="fav-btn"
              :class="{ active: isFavorite }"
              @click.stop="toggleFavorite"
            >
              <span class="fav-icon">{{ isFavorite ? "⭐" : "☆" }}</span>
              <span class="fav-text">{{ isFavorite ? "已收藏" : "收藏" }}</span>
            </button>
          </div>
        </div>

        <div class="card-body scrollable">
          <h3 class="concept-title-small">{{ flashcard.front_concept }}</h3>
          <div
            class="explanation markdown-body"
            v-html="renderedExplanation"
          ></div>
        </div>

        <div class="card-footer interactive">
          <p class="rate-hint">本次掌握程度如何？</p>
          <div class="rating-buttons">
            <button class="pixel-btn danger-btn" @click.stop="rate('forgot')">
              忘记了
            </button>
            <button class="pixel-btn warning-btn" @click.stop="rate('hard')">
              有点难
            </button>
            <button class="pixel-btn success-btn" @click.stop="rate('easy')">
              太简单
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import type { Flashcard } from "@/types/flashcard";
import { useProgressStore } from "@/stores/useProgressStore";
import { renderMarkdown } from "@/utils/markdown";
import { useEventListener } from "@vueuse/core";

const props = defineProps<{
  flashcard: Flashcard;
  categoryId: string;
}>();

const emit = defineEmits<{
  (e: "srs-review", rating: "forgot" | "hard" | "easy"): void;
}>();

const progressStore = useProgressStore();

const isFlipped = ref(false);
const showHints = ref(false);

const frontRef = ref<HTMLElement | null>(null);
const backRef = ref<HTMLElement | null>(null);

const MIN_HEIGHT = 480;
const containerHeight = ref(MIN_HEIGHT);

function updateHeight() {
  const activeRef = isFlipped.value ? backRef.value : frontRef.value;
  if (!activeRef) return;

  // 临时移除高度约束以计算真实的DOM内容高度
  activeRef.style.minHeight = "0px";
  activeRef.style.height = "max-content";

  const naturalHeight = activeRef.offsetHeight;

  // 还原约束
  activeRef.style.minHeight = "";
  activeRef.style.height = "";

  containerHeight.value = Math.max(naturalHeight, MIN_HEIGHT);
}

// 监听翻面与提示框伸展状况
watch([isFlipped, showHints], async () => {
  await nextTick();
  updateHeight();
});

// 数据源切换时重新测量
watch(
  () => props.flashcard.id,
  async () => {
    await nextTick();
    updateHeight();
  },
);

onMounted(() => {
  // 初次加载有延迟等 DOM / 字体就绪
  setTimeout(updateHeight, 50);
});

useEventListener(window, "resize", updateHeight);

const isFavorite = computed(() => {
  return progressStore.isFlashcardFavorite(
    props.categoryId,
    String(props.flashcard.id),
  );
});

const renderedExplanation = computed(() => {
  return renderMarkdown(props.flashcard.back_explanation || "");
});

function flipCard() {
  if (!isFlipped.value) {
    isFlipped.value = true;
  } else {
    // 允许点背面其他空白区域翻回去（可选）
    isFlipped.value = false;
  }
}

function toggleFavorite() {
  progressStore.toggleFlashcardFavorite(
    props.categoryId,
    String(props.flashcard.id),
  );
}

function rate(rating: "forgot" | "hard" | "easy") {
  emit("srs-review", rating);
  // Reset state for next card if reused
  setTimeout(() => {
    isFlipped.value = false;
    showHints.value = false;
  }, 300);
}

function getDifficultyLabel(level: number | string) {
  if (level === "beginner" || String(level) === "1" || String(level) === "2")
    return "基础";
  if (level === "intermediate" || String(level) === "3") return "中阶";
  if (level === "advanced" || String(level) === "4" || String(level) === "5")
    return "高阶";
  return "基础";
}
</script>

<style scoped lang="less">
.flashcard-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  perspective: 1000px; /* 3D 翻转的景深 */
  transition: height 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}

.flashcard-container.is-flipped .flashcard-inner {
  transform: rotateY(180deg);
}

.flashcard-face {
  position: absolute;
  width: 100%;
  min-height: 100%;
  height: auto;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-md);
  box-shadow: var(--theme-shadow-card);
  /* 确保背面在不翻转时不接收事件，正面在翻转后不接收事件 */
  pointer-events: none;
}

.flashcard-container:not(.is-flipped) .flashcard-front {
  pointer-events: auto;
}

.flashcard-container.is-flipped .flashcard-back {
  pointer-events: auto;
}

.flashcard-front {
  cursor: pointer; /* 提示可点击翻转 */
  background-image:
    linear-gradient(rgba(150, 150, 150, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(150, 150, 150, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: center top;
}

/* 反面初始时需将其旋转 180 度藏在后面 */
.flashcard-back {
  transform: rotateY(180deg);
  cursor: default;
  /* 类似横向笔记本样式 */
  background-image: linear-gradient(
    rgba(150, 150, 150, 0.1) 1px,
    transparent 1px
  );
  background-size: 100% 2em;
  background-position: 0 1.5em;
}

/* 胶带/便签贴纸样式 */
.tape {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%) rotate(-2deg);
  width: 120px;
  height: 35px;
  background-color: rgba(212, 237, 218, 0.95); /* 清新的薄荷绿/浅绿贴纸色 */
  /* 使用 SVG adding noise texture */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
  border: 1px solid rgba(0, 0, 0, 0.12); /* 稍微加深边缘增强立体感 */
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 0 4px rgba(0, 0, 0, 0.03); /* 增强阴影和厚度 */
  z-index: 10;
  backdrop-filter: blur(4px);
  border-radius: 2px;
}

/* 为了在暗黑模式下胶带不过于突兀，稍微调整透明度和亮度 */
[data-theme="dark"] .tape {
  background-color: rgba(60, 80, 65, 0.95); /* 暗夜里的墨绿色 */
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 0 4px rgba(255, 255, 255, 0.05);
}

/* 内部结构样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem 1.5rem;
  position: relative;
  z-index: 2;

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .q-tag {
    background: var(--theme-btn-settings-bg);
    border: 1px solid var(--theme-border-color);
    color: var(--theme-text-secondary);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .q-difficulty {
    background: #fff3e0;
    color: #e65100;
    border: 1px solid #ffe0b2;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 800;

    &.expert,
    &.advanced {
      background: #ffebee;
      color: #c62828;
      border-color: #ffcdd2;
    }
  }

  .card-actions {
    display: flex;
    align-items: center;
  }
}

.fav-btn {
  background: var(--theme-card-bg);
  border: var(--theme-border-width-xs) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  font-size: 0.8rem;
  color: var(--theme-text-light);
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--theme-shadow-btn);
  transition: transform 0.15s;

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }
  &.active {
    background: var(--theme-fav-active-bg);
    color: #d35400;
    border-color: var(--theme-fav-active-border);
  }

  .fav-icon {
    font-size: 1rem;
    margin-top: -2px;
  }
}

.card-body {
  flex: 1;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;

  &.scrollable {
    justify-content: flex-start;
    text-align: left;
    align-items: flex-start;
    padding-top: 1.5rem;
  }

  .concept-title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--theme-text-secondary);
    margin-bottom: 2rem;
    width: 100%;
    text-align: left;
    text-indent: 2em; /* 段头缩进两个字 */
    line-height: 1.4;
  }

  .concept-title-small {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--theme-text-main);
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--theme-accent);
    display: inline-block;
    padding-bottom: 1.2rem;
  }

  .hints-section {
    width: 100%;
    margin-top: 1rem;

    .hints-list {
      background: var(--theme-btn-settings-bg);
      border-radius: var(--theme-radius-sm);
      padding: 1rem;
      text-align: left;
      font-size: 0.95rem;
      color: var(--theme-text-main);

      ul {
        margin: 0;
        padding-left: 1.2rem;

        li {
          margin-bottom: 0.5rem;
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  .explanation {
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--theme-text-main);
    width: 100%;
  }
}

.card-footer {
  padding: 1rem;
  border-top: 2px dashed var(--theme-border-color);

  .flip-hint {
    color: var(--theme-text-light);
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
    animation: flash 2s infinite;
  }

  &.interactive {
    .rate-hint {
      margin: 0 0 0.8rem 0;
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--theme-text-light);
    }

    .rating-buttons {
      display: flex;
      justify-content: center;
      gap: 0.8rem;

      .pixel-btn {
        flex: 1;
        padding: 0.6rem 0;
        font-size: 0.9rem;
      }
    }
  }
}

.click-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  /* 此遮罩用来确保点击正面非按钮区域能翻面 */
}
.card-header,
.hints-section,
.interactive {
  position: relative;
  z-index: 2;
}

@keyframes flash {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 按钮基础共用样式如果全局没定义的话补一下 */
.pixel-btn {
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  font-weight: 800;
  cursor: pointer;
  background: var(--theme-btn-bg);
  color: var(--theme-text-secondary);
  box-shadow: var(--theme-shadow-btn);
  transition:
    transform 0.1s,
    box-shadow 0.1s;

  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 var(--theme-border-color);
  }

  &.danger-btn {
    background: #ff5252;
    color: white;
  }
  &.warning-btn {
    background: #ffb142;
    color: white;
  }
  &.success-btn {
    background: #33d9b2;
    color: white;
  }
  &.outline {
    background: transparent;
  }
  &.sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>
