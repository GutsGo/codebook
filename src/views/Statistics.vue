<template>
  <div class="page-container">
    <header class="page-header">
      <button class="pixel-btn" @click="goBack">← 返回首页</button>
      <h2>🎯 统计中心</h2>
    </header>
    <main class="stats-content">
      <div class="stat-card total-card">
        <div class="bg-icon">🏆</div>
        <h3>生涯总得分</h3>
        <div class="score-big">{{ progressStore.totalScore }}</div>
      </div>

      <div class="stat-card accuracy-card">
        <h3>答题正确率</h3>
        <div class="circle-wrap">
          <svg viewBox="0 0 100 100">
            <circle class="bg-circle" cx="50" cy="50" r="40" />
            <circle class="fill-circle" cx="50" cy="50" r="40" :style="{ strokeDasharray: `${accuracy * 2.51} 251` }" />
          </svg>
          <div class="circle-label"><span>{{ accuracy }}%</span></div>
        </div>
        <div class="stat-row">
          <div class="stat-item"><span class="label">答对</span><span class="val ok">{{ progressStore.totalCorrect }}</span></div>
          <div class="stat-item"><span class="label">答错</span><span class="val fail">{{ progressStore.totalAnswered - progressStore.totalCorrect }}</span></div>
        </div>
      </div>

      <div class="stat-card eval-card">
        <h3>你的阶段评价</h3>
        <div class="eval-inner">
          <div class="eval-title">{{ getEvaluation().title }}</div>
          <p class="eval-desc">{{ getEvaluation().desc }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/useProgressStore'
const router = useRouter(); const progressStore = useProgressStore()
function goBack() { router.push('/') }
const accuracy = computed(() => { const t = progressStore.totalAnswered; return t === 0 ? 0 : Math.round((progressStore.totalCorrect / t) * 100) })
function getEvaluation() { const t = progressStore.totalAnswered; const a = accuracy.value; if (t === 0) return { title: '启航者 ⛵', desc: '你还没有答过题呢，快去挑战吧！' }; if (t < 50) return { title: '好奇宝宝 👶', desc: '才刚开始探索，前方还有很多有趣的知识！' }; if (a >= 90) return { title: '百科宗师 👑', desc: '你的常识储备惊人！简直行走的百科全书！' }; if (a >= 70) return { title: '百事通 🤓', desc: '很厉害嘛，大部分问题都难不倒你！' }; return { title: '探索家 🔭', desc: '答错不要紧，这是积累知识的最佳途径！' } }
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
}

.stats-content {
  display: grid;
  gap: 1rem;

  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
}

.stat-card {
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-md);
  padding: 1.5rem;
  box-shadow: var(--theme-shadow-panel);
  position: relative;
  overflow: hidden;
  text-align: center;

  h3 {
    margin-top: 0;
    color: var(--theme-text-secondary);
    font-size: 1.15rem;
    margin-bottom: 1rem;
  }

  &.total-card {
    background: var(--theme-stat-total-bg);
    .bg-icon {
      position: absolute;
      font-size: 5rem;
      right: -10px;
      bottom: -10px;
      opacity: 0.15;
      pointer-events: none;
    }

    .score-big {
      font-size: 3.5rem;
      font-weight: 900;
      color: var(--theme-highlight);
      text-shadow: 2px 2px 0 rgba(0,0,0,0.08);

      @media (min-width: 600px) {
        font-size: 4rem;
      }
    }
  }

  &.accuracy-card {
    background: var(--theme-stat-accuracy-bg);
    @media (min-width: 600px) {
      grid-row: span 2;
    }

    .circle-wrap {
      position: relative;
      width: 130px;
      height: 130px;
      margin: 0 auto 1rem;

      svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
      }

      circle {
        fill: none;
        stroke-width: 12;

        &.bg-circle {
          stroke: var(--theme-circle-bg-stroke);
        }

        &.fill-circle {
          stroke: var(--theme-circle-fill-stroke);
          stroke-linecap: square;
          transition: stroke-dasharray 1s ease-out;
        }
      }

      .circle-label {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        span {
          font-size: 1.6rem;
          color: var(--theme-text-secondary);
          font-weight: 900;
        }
      }
    }

    .stat-row {
      display: flex;
      justify-content: space-around;
      border-top: 3px dashed var(--theme-border-color);
      padding-top: 1rem;

      .stat-item {
        display: flex;
        flex-direction: column;

        .label {
          color: var(--theme-text-light);
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 0.3rem;
        }

        .val {
          font-size: 1.5rem;
          font-weight: 900;

          &.ok { color: var(--theme-success); }
          &.fail { color: var(--theme-error); }
        }
      }
    }
  }

  &.eval-card {
    background: var(--theme-stat-eval-bg);

    .eval-inner {
      background: var(--theme-card-inner);
      border: var(--theme-border-width) solid var(--theme-border-color);
      border-radius: var(--theme-radius-sm);
      padding: 1.2rem;
      box-shadow: var(--theme-shadow-inner);
    }

    .eval-title {
      font-size: 1.6rem;
      color: var(--theme-info);
      font-weight: 900;
      margin-bottom: 0.5rem;
    }

    .eval-desc {
      color: var(--theme-text-secondary);
      font-size: 1rem;
      line-height: 1.6;
      font-weight: 700;
      margin: 0;
    }
  }
}
</style>
