<template>
  <!-- 像素风背景 -->
  <div v-if="currentTheme === 'pixel'" class="pixel-background">
    <!-- 天空层 -->
    <div class="sky"></div>
    
    <!-- 像素云朵 -->
    <div class="clouds">
      <div class="pixel-cloud cloud-1">
        <div class="cloud-row r1"></div>
        <div class="cloud-row r2"></div>
        <div class="cloud-row r3"></div>
      </div>
      <div class="pixel-cloud cloud-2">
        <div class="cloud-row r1"></div>
        <div class="cloud-row r2"></div>
        <div class="cloud-row r3"></div>
      </div>
      <div class="pixel-cloud cloud-3">
        <div class="cloud-row r1"></div>
        <div class="cloud-row r2"></div>
        <div class="cloud-row r3"></div>
      </div>
    </div>

    <!-- 像素太阳 -->
    <div class="pixel-sun">
      <div class="sun-body"></div>
      <div class="sun-ray ray-top"></div>
      <div class="sun-ray ray-right"></div>
      <div class="sun-ray ray-bottom"></div>
      <div class="sun-ray ray-left"></div>
    </div>

    <!-- 像素星星装饰 -->
    <div class="pixel-star star-1">✦</div>
    <div class="pixel-star star-2">✦</div>
    <div class="pixel-star star-3">✦</div>

    <!-- 像素草地 -->
    <div class="pixel-hills">
      <div class="hill hill-back"></div>
      <div class="hill hill-front"></div>
    </div>
  </div>

  <!-- 现代风背景 -->
  <div v-else class="abstract-background">
    <!-- 纸张纹理层 -->
    <div class="noise-overlay"></div>

    <div class="shapes-container">
      <!-- 左上角暗橙色 Blob -->
      <svg class="shape blob-tl-orange" viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 L250,0 C270,50 200,100 130,130 C60,160 40,220 0,250 Z" fill="#DE9377" />
      </svg>
      
      <!-- 左上角浅桃色 Blob -->
      <svg class="shape blob-tl-peach" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C50,60 120,100 140,160 C160,220 100,270 50,290 C20,300 0,260 0,240 Z" fill="#F0CCB2" />
      </svg>
      
      <!-- 左下角蓝灰色 Blob -->
      <svg class="shape blob-bl-blue" viewBox="0 0 350 400" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,400 L0,150 C50,130 120,180 150,230 C190,290 280,310 320,370 C340,400 350,400 350,400 Z" fill="#7E9FB6" />
      </svg>

      <!-- 贯穿左侧的细线条 -->
      <svg class="shape line-left" viewBox="0 0 300 800" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,50 C100,80 180,150 120,280 C60,410 200,550 150,680 C130,730 80,780 0,800" fill="none" stroke="#BA9D8F" stroke-width="2" />
      </svg>

      <!-- 右上角土黄色 Blob -->
      <svg class="shape blob-tr-mustard" viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">
        <path d="M300,0 L50,0 C40,40 120,80 160,120 C200,160 220,220 280,240 C290,245 300,220 300,200 Z" fill="#D1BE85" />
      </svg>
      
      <!-- 右侧中部偏下 桃色 和 蓝灰色 叠加 -->
      <svg class="shape blob-rm-peach" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
        <path d="M150,0 C100,-10 30,50 10,120 C-10,190 60,240 120,230 C180,220 200,160 200,100 C200,50 180,10 150,0 Z" fill="#EACEB7" />
      </svg>
      
      <svg class="shape blob-rm-blue" viewBox="0 0 150 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M150,20 C100,20 40,60 30,120 C20,170 80,200 150,200 Z" fill="#7E9FB6" />
      </svg>
      
      <!-- 右下角大土黄色 Blob -->
      <svg class="shape blob-br-mustard" viewBox="0 0 400 350" xmlns="http://www.w3.org/2000/svg">
        <path d="M400,350 L400,100 C360,60 280,100 240,150 C180,220 120,260 50,270 C20,275 0,310 0,350 Z" fill="#D1BE85" />
      </svg>

      <!-- 右侧细线条 -->
      <svg class="shape line-right" viewBox="0 0 250 500" xmlns="http://www.w3.org/2000/svg">
        <path d="M250,50 C180,60 80,120 100,220 C120,320 20,380 0,450" fill="none" stroke="#BA9D8F" stroke-width="2" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/stores/useThemeStore';

const themeStore = useThemeStore();
const currentTheme = computed(() => themeStore.currentTheme);
</script>

<style scoped lang="less">
/* ============================================
   像素风背景
   ============================================ */
.pixel-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  image-rendering: pixelated;

  .sky {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      #87CEEB 0%,
      #B0E0F6 40%,
      #D4EFFC 70%,
      #E8F4FD 100%
    );
  }

  .clouds {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 60%;
  }

  .pixel-cloud {
    position: absolute;
    animation: float-cloud 30s linear infinite;

    @media (max-width: 500px) {
      transform: scale(0.8) !important;
    }

    .cloud-row {
      display: flex;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: white;
      margin-left: -16px;

      &.r1 {
        margin-left: 0;
        box-shadow: 16px 0 0 white, 32px 0 0 white;
      }

      &.r2, &.r3 {
        box-shadow: 16px 0 0 white, 32px 0 0 white, 48px 0 0 white, 64px 0 0 white;
      }
    }

    &.cloud-1 { top: 8%; left: 10%; transform: scale(1.5); }
    &.cloud-2 { top: 15%; left: 55%; transform: scale(1.2); animation-delay: -10s; }
    &.cloud-3 { top: 5%; left: 78%; transform: scale(1); animation-delay: -20s; }
  }

  .pixel-sun {
    position: absolute;
    top: 4%;
    right: 8%;

    @media (max-width: 500px) {
      top: 2%;
      right: 5%;
    }

    .sun-body {
      width: 48px;
      height: 48px;
      background: #FFD93D;
      border: 4px solid #F4A900;
      image-rendering: pixelated;

      @media (max-width: 500px) {
        width: 36px;
        height: 36px;
      }
    }

    .sun-ray {
      position: absolute;
      background: #FFD93D;
      image-rendering: pixelated;

      &.ray-top {
        width: 8px;
        height: 16px;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
      }
      &.ray-right {
        width: 16px;
        height: 8px;
        right: -20px;
        top: 50%;
        transform: translateY(-50%);
      }
      &.ray-bottom {
        width: 8px;
        height: 16px;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
      }
      &.ray-left {
        width: 16px;
        height: 8px;
        left: -20px;
        top: 50%;
        transform: translateY(-50%);
      }
    }
  }

  .pixel-star {
    position: absolute;
    color: #FFD93D;
    font-size: 20px;
    animation: twinkle 2s ease-in-out infinite;
    image-rendering: pixelated;

    &.star-1 { top: 10%; left: 20%; animation-delay: 0s; }
    &.star-2 { top: 18%; right: 30%; font-size: 14px; animation-delay: 0.7s; }
    &.star-3 { top: 6%; left: 45%; font-size: 16px; animation-delay: 1.4s; }
  }

  .pixel-hills {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 25%;

    .hill {
      position: absolute;
      bottom: 0;
      width: 100%;
      image-rendering: pixelated;

      &-back {
        height: 100%;
        background: #5a8f29;
        clip-path: polygon(
          0% 60%, 5% 50%, 10% 42%, 15% 36%, 20% 32%, 25% 30%, 30% 32%, 35% 36%, 40% 33%, 45% 28%, 
          50% 25%, 55% 28%, 60% 32%, 65% 30%, 70% 26%, 75% 28%, 80% 32%, 85% 38%, 90% 42%, 95% 50%, 
          100% 55%, 100% 100%, 0% 100%
        );
      }

      &-front {
        height: 80%;
        background: #6db33f;
        clip-path: polygon(
          0% 70%, 5% 62%, 10% 55%, 15% 50%, 20% 48%, 25% 50%, 30% 55%, 35% 52%, 40% 45%, 45% 40%, 
          50% 38%, 55% 42%, 60% 48%, 65% 52%, 70% 50%, 75% 45%, 80% 48%, 85% 55%, 90% 60%, 95% 65%, 
          100% 70%, 100% 100%, 0% 100%
        );
      }
    }
  }
}

@keyframes float-cloud {
  0% { transform: translateX(0); }
  50% { transform: translateX(30px); }
  100% { transform: translateX(0); }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* ============================================
   现代风背景
   ============================================ */
.abstract-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background-color: #F8F5EF;
  overflow: hidden;
  pointer-events: none;

  .noise-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.08;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    mix-blend-mode: multiply;
    z-index: 1;
  }

  .shapes-container {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 0;

    .shape {
      position: absolute;
    }

    /* 左侧 */
    .blob-tl-orange { top: 0; left: 0; width: 40vw; max-width: 280px; }
    .blob-tl-peach { top: 5%; left: 0; width: 25vw; max-width: 180px; }
    .blob-bl-blue { bottom: 0; left: 0; width: 45vw; max-width: 320px; }
    .line-left { top: 0; left: 2%; width: 30vw; max-width: 250px; height: 100vh; }

    /* 右侧 */
    .blob-tr-mustard { top: 0; right: 0; width: 40vw; max-width: 280px; }
    .blob-rm-peach { top: 45%; right: 0; width: 25vw; max-width: 180px; }
    .blob-rm-blue { top: 55%; right: 0; width: 18vw; max-width: 140px; }
    .blob-br-mustard { bottom: 0; right: 0; width: 50vw; max-width: 380px; }
    .line-right { top: 20%; right: 3%; width: 28vw; max-width: 220px; height: 60vh; }
  }
}
</style>
