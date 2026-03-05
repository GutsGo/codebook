<template>
  <div class="page-container" :class="[themeClass]">
    <header class="page-header">
      <button class="pixel-btn" @click="$router.push('/')">← 返回首页</button>
      <h2>☁️ 云备份与恢复</h2>
    </header>

    <main class="main-card">
      <div class="config-section">
        <div class="section-header">
          <h3>Cloudflare R2 配置</h3>
        </div>

        <div class="config-form">
          <div class="form-group">
            <label>Endpoint</label>
            <input
              v-model="config.endpoint"
              type="text"
              placeholder="https://<account_id>.r2.cloudflarestorage.com"
            />
          </div>

          <div class="form-group">
            <label>Access Key ID</label>
            <input
              v-model="config.accessKeyId"
              type="text"
              placeholder="Your Access Key ID"
            />
          </div>

          <div class="form-group">
            <label>Secret Access Key</label>
            <input
              v-model="config.secretAccessKey"
              type="password"
              placeholder="Your Secret Access Key"
            />
          </div>

          <div class="form-group">
            <label>Bucket Name</label>
            <input
              v-model="config.bucketName"
              type="text"
              placeholder="Your Bucket Name"
            />
          </div>

          <div class="config-tip">
            <strong>💡 注意：</strong>
            <p>上述配置信息将安全地保存在本地，仅用于数据同步。</p>
          </div>
        </div>
      </div>

      <div class="actions-group">
        <button
          class="pixel-btn primary-btn"
          @click="handleBackup"
          :disabled="isLoading"
        >
          <span class="emoji" v-if="!isLoading">📤</span>
          <span class="emoji spinning" v-else>⏳</span>
          {{
            isLoading && actionType === "backup"
              ? "正在备份..."
              : "备份数据到云端"
          }}
        </button>

        <button class="pixel-btn" @click="handleRestore" :disabled="isLoading">
          <span class="emoji" v-if="!isLoading">📥</span>
          <span class="emoji spinning" v-else>⏳</span>
          {{
            isLoading && actionType === "restore"
              ? "正在恢复..."
              : "从云端恢复数据"
          }}
        </button>
      </div>

      <div v-if="message" class="toast-message" :class="messageType">
        {{ message }}
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useThemeStore } from "@/stores/useThemeStore";
import { useLocalStorage } from "@vueuse/core";
import type { R2Config } from "@/utils/cloudSync";
import {
  exportLocalData,
  importLocalData,
  uploadToR2,
  downloadFromR2,
} from "@/utils/cloudSync";

const themeStore = useThemeStore();
const themeClass = computed(() => `theme-${themeStore.currentTheme}`);

const configStore = useLocalStorage<R2Config>("codebook_r2_config", {
  endpoint: "",
  accessKeyId: "",
  secretAccessKey: "",
  bucketName: "",
});

const config = configStore;

const isLoading = ref(false);
const actionType = ref<"backup" | "restore" | null>(null);
const message = ref("");
const messageType = ref<"success" | "error" | "">("");

const showMessage = (msg: string, type: "success" | "error") => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = "";
    messageType.value = "";
  }, 3000);
};

const validateConfig = () => {
  if (
    !config.value.endpoint ||
    !config.value.accessKeyId ||
    !config.value.secretAccessKey ||
    !config.value.bucketName
  ) {
    showMessage("请先填写完整的 Cloudflare R2 配置！", "error");
    return false;
  }
  return true;
};

const handleBackup = async () => {
  if (!validateConfig()) return;

  isLoading.value = true;
  actionType.value = "backup";
  try {
    const data = exportLocalData();
    await uploadToR2(config.value, data);
    showMessage(" 🎉 数据已成功备份到云端！", "success");
  } catch (error: any) {
    console.error("Backup failed:", error);
    showMessage(`备份失败: ${error.message || "未知错误"}`, "error");
  } finally {
    isLoading.value = false;
    actionType.value = null;
  }
};

const handleRestore = async () => {
  if (!validateConfig()) return;

  const confirmRestore = confirm(
    "从云端恢复将覆盖当前的本地数据并且需要刷新页面。您确定要执行吗？",
  );
  if (!confirmRestore) return;

  isLoading.value = true;
  actionType.value = "restore";
  try {
    const data = await downloadFromR2(config.value);
    importLocalData(data);
    showMessage(" 🎉 数据已成功恢复！正在刷新页面...", "success");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error: any) {
    console.error("Restore failed:", error);
    showMessage(`恢复失败: ${error.message || "未知错误"}`, "error");
  } finally {
    isLoading.value = false;
    actionType.value = null;
  }
};
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
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &:hover:not(:disabled) {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }

  &:active:not(:disabled) {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }

  &.primary-btn {
    background: var(--theme-btn-primary-bg);
    color: var(--theme-text-secondary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--theme-btn-disabled-bg, #e0e0e0);
    box-shadow: none;
    transform: none;
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

.config-section {
  text-align: left;
  margin-bottom: 2rem;
}

.section-header h3 {
  margin: 0 0 1.2rem 0;
  color: var(--theme-text-secondary);
  font-size: 1.2rem;
  border-bottom: 2px dashed var(--theme-border-color);
  padding-bottom: 0.5rem;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--theme-text-secondary);
  }

  input {
    padding: 0.8rem;
    border: var(--theme-border-width-sm) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    background: var(--theme-card-inner);
    color: var(--theme-text-primary);
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: var(--theme-accent);
      box-shadow: var(--theme-shadow-inner);
    }
  }
}

.config-tip {
  font-size: 0.9rem;
  color: var(--theme-text-light);
  line-height: 1.6;
  background: var(--theme-explain-bg);
  padding: 0.7rem;
  border: var(--theme-border-width-xs) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  margin-top: 0.5rem;

  strong {
    color: var(--theme-accent);
  }

  p {
    margin: 0.3rem 0 0;
  }
}

.actions-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 2px dashed var(--theme-border-color);

  @media (min-width: 600px) {
    flex-direction: row;
  }

  button {
    flex: 1;
    justify-content: center;
    padding: 0.8rem;
    font-size: 1.1rem;
  }
}

.toast-message {
  padding: 1rem;
  border-radius: var(--theme-radius-sm);
  font-weight: 800;
  text-align: center;
  margin-top: 1.5rem;
  animation: slideUp 0.3s ease-out;

  &.success {
    background: rgba(139, 195, 74, 0.1);
    color: #4caf50;
    border: 1px solid #4caf50;
  }

  &.error {
    background: rgba(244, 67, 54, 0.1);
    color: var(--theme-error);
    border: 1px solid var(--theme-error);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}
</style>
