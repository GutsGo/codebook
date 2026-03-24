<template>
  <div
    class="question-card"
    :class="{ shake: animState === 'wrong', pop: animState === 'right' }"
  >
    <div class="card-inner">
      <div class="card-actions">
        <button
          class="fav-btn"
          :class="{ active: isFavorite }"
          @click="toggleFav"
        >
          <span class="fav-icon">{{ isFavorite ? "⭐" : "☆" }}</span>
          <span class="fav-text">{{ isFavorite ? "已收藏" : "收藏" }}</span>
        </button>
      </div>

      <div class="question-header">
        <div
          class="tags-row"
          v-if="question.tags?.length || question.source_company"
        >
          <span
            v-if="question.source_company"
            class="q-company"
            :title="'来源: ' + question.source_company"
          >
            <img
              :src="getCompanyIcon(question.source_company)"
              class="company-icon"
              alt=""
              @error="
                (e) => ((e.target as HTMLImageElement).style.display = 'none')
              "
            />
            {{ question.source_company }}
          </span>
          <span
            v-for="tag in question.tags"
            :key="tag"
            class="q-tag"
            @click="goToTag(tag)"
            style="cursor: pointer"
            >{{ tag }}</span
          >
          <span class="q-difficulty" :class="question.difficulty">{{
            question.difficulty === "expert" ? "专家" : "资深"
          }}</span>
        </div>
        <h2 class="q-title">{{ question.title }}</h2>
        <div class="q-content">
          <div
            class="content-text markdown-body"
            v-html="processedContent"
          ></div>
        </div>
      </div>

      <div class="options">
        <!-- Hints Area -->
        <div
          v-if="question.hints && question.hints.length > 0 && !hasAnswered"
          class="hints-area"
        >
          <div class="hints-list">
            <transition-group name="hint-anim">
              <div
                v-for="(hint, index) in question.hints.slice(
                  0,
                  revealedHintsCount,
                )"
                :key="index"
                class="hint-item pixel-card-sm"
              >
                <span class="hint-icon">💡</span>
                <span
                  class="hint-text markdown-body"
                  v-html="renderMarkdown(hint)"
                ></span>
              </div>
            </transition-group>
          </div>
          <button
            v-if="revealedHintsCount < question.hints.length"
            class="pixel-btn secondary-btn reveal-hint-btn"
            @click="revealNextHint"
          >
            获取下一步提示 ({{ revealedHintsCount }}/{{
              question.hints.length
            }})
          </button>
        </div>

        <!-- Single Choice -->
        <template v-if="question.type === 'single_choice'">
          <button
            v-for="(option, index) in question.options"
            :key="index"
            class="opt-btn"
            :class="[
              `opt-color-${index % 4}`,
              {
                selected: selectedOption === option.id,
                correct: hasAnswered && option.id === question.correct_answer,
                wrong:
                  hasAnswered &&
                  selectedOption === option.id &&
                  option.id !== question.correct_answer,
              },
            ]"
            :data-letter="option.id"
            :disabled="hasAnswered"
            @click="selectSingle(option.id)"
          >
            <span class="opt-text">{{ option.text }}</span>
          </button>
        </template>

        <!-- Multiple Choice -->
        <template v-else-if="question.type === 'multiple_choice'">
          <button
            v-for="(option, index) in question.options"
            :key="index"
            class="opt-btn"
            :class="[
              `opt-color-${index % 4}`,
              {
                selected: selectedMulti.includes(option.id),
                correct:
                  hasAnswered && question.correct_answer.includes(option.id),
                wrong:
                  hasAnswered &&
                  selectedMulti.includes(option.id) &&
                  !question.correct_answer.includes(option.id),
                missed:
                  hasAnswered &&
                  !selectedMulti.includes(option.id) &&
                  question.correct_answer.includes(option.id),
              },
            ]"
            :data-letter="option.id"
            :disabled="hasAnswered"
            @click="toggleMulti(option.id)"
          >
            <span class="opt-text">{{ option.text }}</span>
          </button>
          <button
            v-if="!hasAnswered"
            class="submit-multi-btn"
            :disabled="selectedMulti.length === 0"
            @click="submitMulti"
          >
            提交答案
          </button>
        </template>

        <!-- True/False -->
        <template v-else-if="question.type === 'true_false'">
          <button
            class="opt-btn opt-color-0"
            :class="{
              selected: selectedOption === 'A',
              correct: hasAnswered && question.correct_answer === 'A',
              wrong:
                hasAnswered &&
                selectedOption === 'A' &&
                question.correct_answer !== 'A',
            }"
            data-letter="A"
            :disabled="hasAnswered"
            @click="selectSingle('A')"
          >
            <span class="opt-text">正确 (True)</span>
          </button>
          <button
            class="opt-btn opt-color-1"
            :class="{
              selected: selectedOption === 'B',
              correct: hasAnswered && question.correct_answer === 'B',
              wrong:
                hasAnswered &&
                selectedOption === 'B' &&
                question.correct_answer !== 'B',
            }"
            data-letter="B"
            :disabled="hasAnswered"
            @click="selectSingle('B')"
          >
            <span class="opt-text">错误 (False)</span>
          </button>
        </template>

        <!-- Algorithm -->
        <template v-else-if="question.type === 'algorithm'">
          <div class="algo-area">
            <template v-if="!hasAnswered">
              <div v-if="isMobile" class="mobile-algo-placeholder pixel-card">
                <p>
                  💻 移动端（小屏）不支持代码编辑功能，请在 PC
                  端作答或直接查看参考答案。
                </p>
                <button
                  class="pixel-btn primary-btn submit-multi-btn"
                  @click="revealAlgorithm"
                >
                  直接查看参考答案
                </button>
              </div>

              <div v-else class="editor-container">
                <div class="algo-meta">
                  <span class="meta-item"
                    >⏱ 预期时间复杂度:
                    <strong>{{ question.time_complexity }}</strong></span
                  >
                  <span class="meta-item"
                    >💾 预期空间复杂度:
                    <strong>{{ question.space_complexity }}</strong></span
                  >
                </div>

                <div
                  class="code-editor-wrapper"
                  :class="{ 'is-fullscreen': isFullscreen }"
                >
                  <div class="editor-header">
                    <span class="editor-title">✏️ 代码编辑器</span>
                    <button
                      class="editor-fullscreen-btn pixel-btn"
                      @click="toggleFullscreen"
                    >
                      {{ isFullscreen ? "恢复窗口 🗗" : "全屏放大 🗖" }}
                    </button>
                  </div>
                  <div class="editor-body">
                    <vue-monaco-editor
                      v-model:value="userCode"
                      :theme="editorTheme"
                      language="typescript"
                      :options="{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                      }"
                      @beforeMount="handleEditorBeforeMount"
                      @mount="handleEditorMount"
                    />
                  </div>
                </div>

                <div
                  class="test-cases-section"
                  v-if="question.test_cases?.length"
                >
                  <div class="section-title">🧪 测试用例验证</div>
                  <div class="tc-list">
                    <div
                      v-for="(tc, idx) in question.test_cases"
                      :key="idx"
                      class="tc-item"
                    >
                      <div class="tc-header">
                        <span class="tc-num">Case {{ idx + 1 }}</span>
                        <span
                          v-if="testResults[idx]"
                          class="tc-status-badge"
                          :class="
                            testResults[idx].pass ? 'badge-pass' : 'badge-fail'
                          "
                        >
                          {{
                            testResults[idx].pass
                              ? "✅ 执行通过"
                              : "❌ 执行失败"
                          }}
                        </span>
                      </div>
                      <div class="tc-body">
                        <div class="tc-row">
                          <span class="tc-label">描述：</span>
                          <span class="tc-value">{{ tc.description }}</span>
                        </div>
                        <div class="tc-row">
                          <span class="tc-label">期望输出：</span>
                          <span class="tc-value tc-code">{{
                            tc.expected_output
                          }}</span>
                        </div>
                        <div
                          v-if="testResults[idx]"
                          class="tc-row tc-result-row"
                        >
                          <span class="tc-label">运行结果反馈：</span>
                          <span
                            class="tc-value tc-console"
                            :class="
                              testResults[idx].pass
                                ? 'console-pass'
                                : 'console-fail'
                            "
                          >
                            > {{ testResults[idx].msg }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="algo-actions"
                  style="
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin-top: 1.5rem;
                  "
                >
                  <button
                    class="pixel-btn primary-btn submit-multi-btn"
                    style="margin-top: 0"
                    @click="runTestCases"
                    :disabled="testingCode"
                  >
                    {{ testingCode ? "运行中..." : "▶ 运行测试代码" }}
                  </button>
                  <button
                    class="pixel-btn secondary-btn submit-multi-btn"
                    style="margin-top: 0"
                    @click="revealAlgorithm"
                  >
                    查看参考答案并自评
                  </button>
                </div>
              </div>
            </template>

            <div v-if="hasAnswered" class="algo-self-eval">
              <p class="eval-title">答案已展开，请根据您的解答自我评估：</p>
              <div class="eval-btn-group">
                <button
                  class="eval-btn correct-btn"
                  :class="{ inactive: isCorrect === false }"
                  @click="submitAlgorithm(true)"
                >
                  ✅ 我写对了
                </button>
                <button
                  class="eval-btn wrong-btn"
                  :class="{ inactive: isCorrect === true }"
                  @click="submitAlgorithm(false)"
                >
                  ❌ 我没写对
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <transition name="feedback">
        <div v-if="hasAnswered" class="feedback">
          <div class="result-text" :class="isCorrect ? 'text-ok' : 'text-fail'">
            <span v-if="question.type !== 'algorithm'">{{
              isCorrect ? "🎉 回答正确 (+10分)" : "❌ 回答错误 (-3分)"
            }}</span>
            <span v-else>{{
              isCorrect ? "🎉 算法验证通过 (+10分)" : "❌ 继续强化 (-3分)"
            }}</span>
            <span v-if="isCorrect && quizStore.comboCount >= 3" class="combo"
              >🔥连击 +5</span
            >
          </div>

          <div
            v-if="question.type === 'algorithm' && question.reference_solution"
            class="explain-box algo-ref"
          >
            💡 <strong>参考实现：</strong>
            <div
              class="explain-text markdown-body"
              v-html="processedReference"
            ></div>
          </div>

          <div
            v-if="question.explanation && question.explanation.trim() !== ''"
            class="explain-box"
          >
            💡 <strong>解析：</strong>
            <div
              class="explain-text markdown-body"
              v-html="processedExplanation"
            ></div>
          </div>

          <div
            v-if="
              question.type === 'single_choice' &&
              question.wrong_options_analysis
            "
            class="explain-box fact-box"
          >
            <strong>⚠️ 错误选项分析：</strong>
            <ul class="analysis-list">
              <li
                v-for="(reason, optId) in question.wrong_options_analysis"
                :key="optId"
              >
                <strong>{{ optId }}:</strong> {{ reason }}
              </li>
            </ul>
          </div>

          <div
            v-if="
              question.type === 'multiple_choice' && question.exclusion_analysis
            "
            class="explain-box fact-box"
          >
            <strong>⚠️ 排除分析：</strong>
            <ul class="analysis-list">
              <li
                v-for="(reason, optId) in question.exclusion_analysis"
                :key="optId"
              >
                <strong>{{ optId }}:</strong> {{ reason }}
              </li>
            </ul>
          </div>

          <div
            v-if="
              question.type === 'true_false' && question.boundary_conditions
            "
            class="explain-box fact-box"
          >
            <strong>⚠️ 边界条件：</strong>
            <div
              class="explain-text markdown-body"
              v-html="processedBoundary"
            ></div>
          </div>

          <div v-if="question.reference_link" class="explain-box link-box">
            🔗 <strong>相关链接：</strong>
            <a
              :href="question.reference_link"
              target="_blank"
              rel="noopener noreferrer"
              class="ref-link"
            >
              {{ question.reference_link }}
            </a>
          </div>

          <div v-if="!isSrsMode">
            <button class="next-btn" @click="emitNext">下一题 ➔</button>
          </div>
          <div v-else class="srs-actions">
            <p class="srs-prompt">这道题你掌握得如何？</p>
            <div class="srs-btn-group">
              <button
                class="pixel-btn srs-btn hard"
                @click="emitSrsReview('forgot')"
              >
                忘记<br /><span>(< 1分钟)</span>
              </button>
              <button
                class="pixel-btn srs-btn warning"
                @click="emitSrsReview('hard')"
              >
                模糊<br /><span>(< 10分钟)</span>
              </button>
              <button
                class="pixel-btn srs-btn easy"
                @click="emitSrsReview('easy')"
              >
                简单<br /><span>(1天)</span>
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- 笔记区域 (Feynman Technique) -->
      <div class="notes-section">
        <button
          class="notes-toggle-btn"
          :class="{ open: isNotesOpen }"
          @click="toggleNotes"
        >
          <span class="emoji">📝</span>
          {{ isNotesOpen ? "收起专属笔记" : "添加 / 查看我的理解" }}
        </button>
        <transition name="slide-fade">
          <div v-if="isNotesOpen" class="notes-content">
            <textarea
              v-model="userNote"
              class="notes-textarea"
              placeholder="试着用大白话把这个知识点解释给一个完全不懂的人听。写下你的理解..."
              @blur="saveUserNote"
            ></textarea>
            <div class="notes-actions">
              <span class="notes-status" v-if="saveStatus">{{
                saveStatus
              }}</span>
              <button
                class="pixel-btn primary-btn notes-save-btn"
                @click="saveUserNote"
              >
                保存
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useQuizStore } from "@/stores/useQuizStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useThemeStore } from "@/stores/useThemeStore";
import type { Question } from "@/types/question";
import { VueMonacoEditor } from "@guolao/vue-monaco-editor";
import { useWindowSize } from "@vueuse/core";
import { renderMarkdown } from "@/utils/markdown";
import { resolveCategoryIconUrl } from "@/utils/assets";


const props = defineProps<{
  question: Question;
  categoryId: string;
  isSrsMode?: boolean;
}>();
const emit = defineEmits<{
  (e: "answer", isCorrect: boolean): void;
  (e: "next"): void;
  (e: "srs-review", rating: "forgot" | "hard" | "easy"): void;
}>();
const quizStore = useQuizStore();
const progressStore = useProgressStore();
const settingsStore = useSettingsStore();
const themeStore = useThemeStore();
const router = useRouter();

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const editorTheme = computed(() => {
  return themeStore.currentTheme + "-theme";
});

const hasAnswered = ref(false);
const selectedOption = ref<string | null>(null);
const selectedMulti = ref<string[]>([]);
const isCorrect = ref<boolean | null>(null);
const animState = ref<"idle" | "right" | "wrong">("idle");

// 主动回忆/提示状态
const revealedHintsCount = ref(0);

// 算法题状态
const userCode = ref("");
const testingCode = ref(false);
const testResults = ref<{ pass: boolean; msg: string }[]>([]);
const monacoInstance = shallowRef<any>(null);
const monacoEditor = shallowRef<any>(null);
const isFullscreen = ref(false);

const isNotesOpen = ref(false);
const userNote = ref("");
const saveStatus = ref("");
let saveStatusTimer: any = null;

function toggleNotes() {
  isNotesOpen.value = !isNotesOpen.value;
  if (isNotesOpen.value && userNote.value === "") {
    userNote.value = progressStore.getNote(
      props.categoryId,
      String(props.question.id),
    );
  }
}

function saveUserNote() {
  progressStore.saveNote(
    props.categoryId,
    String(props.question.id),
    userNote.value,
  );
  saveStatus.value = "已保存 ✓";
  clearTimeout(saveStatusTimer);
  saveStatusTimer = setTimeout(() => {
    saveStatus.value = "";
  }, 2000);
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

function handleEditorBeforeMount(monaco: any) {
  monaco.editor.defineTheme("modern-theme", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff",
    },
  });
  monaco.editor.defineTheme("clay-theme", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#fafaf7",
    },
  });
  monaco.editor.defineTheme("pixel-theme", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#fff8e7",
      "editor.lineHighlightBackground": "#f0e8d5",
    },
  });
}

function handleEditorMount(editor: any, monaco: any) {
  monacoEditor.value = editor;
  monacoInstance.value = monaco;
}

async function runTestCases() {
  const q = props.question as any;
  if (q.type !== "algorithm" || !q.test_cases) return;

  testingCode.value = true;
  testResults.value = [];

  try {
    let jsCode = userCode.value;

    // 使用 Monaco TS Worker 获取编译后的 JS 代码
    if (monacoInstance.value && monacoEditor.value) {
      const model = monacoEditor.value.getModel();
      const worker =
        await monacoInstance.value.languages.typescript.getTypeScriptWorker();
      const client = await worker(model.uri);
      const emitResult = await client.getEmitOutput(model.uri.toString());
      if (emitResult.outputFiles && emitResult.outputFiles[0]) {
        jsCode = emitResult.outputFiles[0].text;
      }
    }

    // 循环测试用例进行校验
    for (const tc of q.test_cases) {
      const wrappedCode = `
        return (async () => {
          ${jsCode};
          ${tc.input};
          return "无运行时抛错 (验证通过)";
        })();
      `;
      try {
        const fn = new Function(wrappedCode);
        const res = await fn();
        testResults.value.push({ pass: true, msg: res || "执行正常" });
      } catch (err: any) {
        testResults.value.push({ pass: false, msg: String(err) });
      }
    }
  } catch (err: any) {
    testResults.value.push({
      pass: false,
      msg: "编译/执行器异常：" + String(err),
    });
  } finally {
    testingCode.value = false;
  }
}

const isFavorite = computed(() =>
  progressStore.isFavorite(props.categoryId, String(props.question.id)),
);

function getCompanyIcon(company: string | undefined) {
  if (!company) return "";
  const normalized = company.toLowerCase().replace(/\s+/g, "");
  const iconMap: Record<string, string> = {
    alibaba: "alibabadotcom",
    tencent: "qq",
    opensource: "opensourcehardware",
  };
  const iconName = iconMap[normalized] || normalized;
  return resolveCategoryIconUrl(iconName);
}

// 将文本中的字面 \n \t 转为实际换行/制表符，并渲染为 Markdown
const processedContent = computed(() => renderMarkdown(props.question.content));
const processedExplanation = computed(() =>
  renderMarkdown(props.question.explanation),
);
const processedBoundary = computed(() =>
  renderMarkdown((props.question as any).boundary_conditions),
);
const processedReference = computed(() => {
  const code = (props.question as any).reference_solution;
  if (!code) return "";
  return renderMarkdown("```typescript\n" + code + "\n```");
});

function toggleFav() {
  progressStore.toggleFavorite(props.categoryId, String(props.question.id));
}

watch(
  () => props.question.id,
  () => {
    hasAnswered.value = false;
    selectedOption.value = null;
    selectedMulti.value = [];
    isCorrect.value = null;
    animState.value = "idle";
    revealedHintsCount.value = 0;

    isNotesOpen.value = false;
    userNote.value = progressStore.getNote(
      props.categoryId,
      String(props.question.id),
    );
    saveStatus.value = "";

    if (props.question.type === "algorithm") {
      userCode.value = (props.question as any).code_template || "";
      testResults.value = [];
    }
  },
  { immediate: true },
);

function finishAnswer(correct: boolean) {
  hasAnswered.value = true;
  isCorrect.value = correct;
  animState.value = correct ? "right" : "wrong";
  settingsStore.playSound(correct ? "right" : "wrong");
  setTimeout(() => {
    animState.value = "idle";
  }, 500);
  emit("answer", correct);
  setTimeout(() => {
    document
      .querySelector(".next-btn")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300);
}

function selectSingle(optionId: string) {
  if (hasAnswered.value) return;
  selectedOption.value = optionId;
  const correct = optionId === (props.question as any).correct_answer;
  finishAnswer(correct);
}

function toggleMulti(optionId: string) {
  if (hasAnswered.value) return;
  const idx = selectedMulti.value.indexOf(optionId);
  if (idx >= 0) {
    selectedMulti.value.splice(idx, 1);
  } else {
    selectedMulti.value.push(optionId);
  }
}

function submitMulti() {
  if (hasAnswered.value || selectedMulti.value.length === 0) return;
  const q = props.question as any;
  const correctArr = q.correct_answer as string[];

  const isOk =
    selectedMulti.value.length === correctArr.length &&
    selectedMulti.value.every((id) => correctArr.includes(id));

  finishAnswer(isOk);
}

function revealAlgorithm() {
  hasAnswered.value = true;
}

function submitAlgorithm(correct: boolean) {
  // 算法题在 reveal 后可以自我打分
  if (isCorrect.value !== null) return; // 已打分过了
  finishAnswer(correct);
}

function revealNextHint() {
  if (
    props.question.hints &&
    revealedHintsCount.value < props.question.hints.length
  ) {
    revealedHintsCount.value++;
  }
}

function goToTag(tag: string) {
  if (confirm(`中断当前进程并开启「${tag}」挑战？`)) {
    router.push(`/game/${props.categoryId}/tag_${encodeURIComponent(tag)}`);
  }
}

function emitNext() {
  emit("next");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function emitSrsReview(rating: "forgot" | "hard" | "easy") {
  emit("srs-review", rating);
}
</script>

<style scoped lang="less">
.question-card {
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-md);
  padding: 5px;
  box-shadow: var(--theme-shadow-card);
  position: relative;

  .card-inner {
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    padding: 2rem;
    background: var(--theme-card-inner);
    position: relative;

    @media (max-width: 600px) {
      padding: 1.2rem;
      padding-top: 2.8rem;
    }
  }
}

.question-header {
  margin-bottom: 1.5rem;
}

.hints-area {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  .hints-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .hint-item {
    background: var(--theme-fact-bg);
    border: 1px dashed var(--theme-border-color);
    padding: 0.8rem;
    border-radius: var(--theme-radius-sm);
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    color: var(--theme-text-secondary);
    font-size: 0.95rem;

    .hint-icon {
      margin-top: 2px;
    }

    .hint-text {
      flex: 1;
      :deep(p) {
        margin: 0;
      }
    }
  }

  .reveal-hint-btn {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    border-style: dashed;
    background: transparent;
    color: var(--theme-text-light);

    &:hover {
      background: var(--theme-btn-settings-bg);
      color: var(--theme-text-secondary);
    }
  }
}

.hint-anim-enter-active,
.hint-anim-leave-active {
  transition: all 0.3s ease;
}
.hint-anim-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.hint-anim-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.q-tag {
  background: var(--theme-btn-settings-bg);
  border: 1px solid var(--theme-border-color);
  color: var(--theme-text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.2s;

  &:hover {
    background: var(--theme-btn-settings-accent);
    transform: translateY(-1px);
  }
}

.q-company {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0f4f8;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
  }

  .company-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
  }
}

.q-difficulty {
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ffe0b2;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 800;

  &.expert {
    background: #ffebee;
    color: #c62828;
    border-color: #ffcdd2;
  }
}

.card-actions {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 10;

  @media (max-width: 600px) {
    top: 0.5rem;
    right: 0.5rem;
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
  }
}

.q-title {
  font-size: 1.3rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  margin-bottom: 0.8rem;
  line-height: 1.5;
}

.q-content {
  background: rgba(0, 0, 0, 0.03);
  border-left: 4px solid var(--theme-accent);
  padding: 0.8rem 1rem;
  border-radius: 0 4px 4px 0;
  margin-bottom: 1.5rem;
}

.content-text {
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--theme-text-main);
  line-height: 1.6;
  word-wrap: break-word;
  margin: 0;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-bottom: 1.5rem;
}

.opt-btn {
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 0.8rem 1rem 0.8rem 3rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 0.95rem;
  box-shadow: var(--theme-shadow-btn);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-align: left;
  position: relative;
  line-height: 1.5;

  &:not(:disabled) {
    &:hover {
      transform: var(--theme-hover-transform);
      box-shadow: var(--theme-shadow-btn-hover);
    }
    &:active {
      transform: var(--theme-active-transform);
      box-shadow: var(--theme-shadow-btn-active);
    }
  }

  &::before {
    content: attr(data-letter);
    position: absolute;
    left: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    background: var(--theme-card-bg);
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 900;
    color: var(--theme-text-secondary);
    box-shadow: var(--theme-shadow-btn);
  }

  // 颜色变体生成
  .generate-opt-color(@i) {
    &.opt-color-@{i} {
      @color: "theme-opt-@{i}";
      @hover: "theme-opt-@{i}-hover";
      @bar: "theme-opt-@{i}-bar";
      @dot: "theme-opt-@{i}-dot";

      background-color: var(~"--@{color}");
      border-left: var(--theme-opt-bar-width) solid var(~"--@{bar}");
      background-image:
        radial-gradient(var(~"--@{dot}", transparent) 20%, transparent 20%),
        radial-gradient(var(~"--@{dot}", transparent) 20%, transparent 20%);
      background-size: var(--theme-opt-bg-size);
      background-position: var(--theme-opt-bg-position);

      &:not(:disabled):hover {
        background-color: var(~"--@{hover}");
      }
    }
  }

  .generate-opt-color(0);
  .generate-opt-color(1);
  .generate-opt-color(2);
  .generate-opt-color(3);

  &.selected {
    background: var(--theme-card-bg) !important;
    border-color: var(--theme-accent);
    color: #d35400;
  }

  &.correct {
    background: var(--theme-correct-bg) !important;
    border-color: var(--theme-correct-border);
    color: #2e7d32;
    opacity: 1;
  }

  &.missed {
    background: rgba(46, 125, 50, 0.1) !important;
    border-color: #2e7d32;
    border-style: dashed;
    color: #2e7d32;
  }

  &.wrong {
    background: var(--theme-wrong-bg) !important;
    border-color: var(--theme-wrong-border);
    color: #c62828;
  }

  &:disabled {
    cursor: default;
  }
}

.submit-multi-btn {
  margin-top: 1rem;
  padding: 0.8rem;
  background: var(--theme-accent);
  color: white;
  font-size: 1.1rem;
  font-weight: 900;
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  box-shadow: var(--theme-shadow-btn);
  cursor: pointer;

  &:disabled {
    background: var(--theme-btn-disabled-bg);
    color: var(--theme-text-muted);
    cursor: not-allowed;
    box-shadow: none;
  }
}

.algo-area {
  .code-template {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-family:
      "Fira Code", source-code-pro, Menlo, Monaco, Consolas, "Courier New",
      monospace;
    font-size: 0.9rem;
    overflow-x: auto;

    h4 {
      margin: 0 0 0.5rem;
      color: #9cdcfe;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  }

  .algo-meta {
    font-size: 0.95rem;
    color: var(--theme-text-secondary);
    margin-bottom: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;

    .meta-item {
      background: var(--theme-card-inner);
      padding: 0.4rem 0.8rem;
      border: var(--theme-border-width-xs) solid var(--theme-border-color);
      border-radius: var(--theme-radius-sm);
    }
  }
}

.code-editor-wrapper {
  margin-bottom: 1.5rem;
  border: var(--theme-border-width-sm) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  overflow: hidden;
  text-align: left;
  display: flex;
  flex-direction: column;
  background: var(--theme-card-bg);
  box-shadow: var(--theme-shadow-inner);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:not(.is-fullscreen) {
    height: 400px;
  }

  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    border: none;
    border-radius: 0;
    box-sizing: border-box;

    .editor-body {
      flex: 1;
      height: 100%;
    }
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 1rem;
    background: var(--theme-scenario-tape-bg);
    border-bottom: var(--theme-border-width-xs) solid var(--theme-border-color);

    .editor-title {
      font-weight: 800;
      color: var(--theme-text-secondary);
      font-size: 0.95rem;
    }

    .editor-fullscreen-btn {
      padding: 0.3rem 0.6rem;
      font-size: 0.8rem;
    }
  }

  .editor-body {
    flex: 1;
    min-height: 0;
  }
}

.test-cases-section {
  text-align: left;
  margin-top: 1.5rem;

  .section-title {
    font-weight: 900;
    margin-bottom: 1rem;
    font-size: 1.15rem;
    color: var(--theme-text-secondary);
    border-bottom: 2px dashed var(--theme-border-color);
    padding-bottom: 0.5rem;
    display: inline-block;
  }

  .tc-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tc-item {
    background: var(--theme-card-inner);
    border: var(--theme-border-width-sm) solid var(--theme-border-color);
    border-radius: var(--theme-radius-md);
    box-shadow: var(--theme-shadow-card);
    overflow: hidden;
  }

  .tc-header {
    background: var(--theme-scenario-tape-bg);
    padding: 0.6rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: var(--theme-border-width-xs) solid var(--theme-border-color);

    .tc-num {
      font-weight: 800;
      color: var(--theme-text-main);
      font-size: 1rem;
    }

    .tc-status-badge {
      font-size: 0.8rem;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 800;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);

      &.badge-pass {
        background: var(--theme-correct-bg);
        color: #27ae60;
      }
      &.badge-fail {
        background: var(--theme-wrong-bg);
        color: #c0392b;
      }
    }
  }

  .tc-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .tc-row {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.95rem;

    .tc-label {
      color: var(--theme-text-light);
      font-weight: 800;
      font-size: 0.85rem;
    }

    .tc-value {
      color: var(--theme-text-main);
      word-break: break-all;
      font-weight: 600;
    }

    .tc-code {
      font-family:
        "Fira Code", source-code-pro, Menlo, Monaco, Consolas, "Courier New",
        monospace;
      background: rgba(0, 0, 0, 0.04);
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      font-size: 0.9rem;
      display: block;
      color: #b22222;
      border: 1px dotted rgba(0, 0, 0, 0.15);
    }

    .tc-console {
      font-family:
        "Fira Code", source-code-pro, Menlo, Monaco, Consolas, "Courier New",
        monospace;
      padding: 0.6rem;
      border-radius: 4px;
      margin-top: 0.2rem;
      font-size: 0.9rem;
      display: block;

      &.console-pass {
        background: #f0fdf4;
        color: #166534;
        border: 1px dashed #4ade80;
      }

      &.console-fail {
        background: #282c34;
        color: #ef4444;
        border: 1px solid #1e293b;
        box-shadow: inset 0px 0px 8px rgba(0, 0, 0, 0.5);
      }
    }
  }
}

.algo-self-eval {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--theme-scenario-bg);
  border: 2px dashed var(--theme-border-color);
  border-radius: 8px;
  text-align: center;

  .eval-title {
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--theme-text-secondary);
  }

  .eval-btn-group {
    display: flex;
    gap: 1rem;
    justify-content: center;

    .eval-btn {
      padding: 0.8rem 1.5rem;
      font-weight: 800;
      font-size: 1rem;
      border: var(--theme-border-width) solid var(--theme-border-color);
      border-radius: var(--theme-radius-sm);
      cursor: pointer;
      transition: all 0.2s;

      &.correct-btn {
        background: #e8f5e9;
        color: #2e7d32;
        border-color: #81c784;
        &:hover:not(.inactive) {
          background: #c8e6c9;
        }
      }

      &.wrong-btn {
        background: #ffebee;
        color: #c62828;
        border-color: #e57373;
        &:hover:not(.inactive) {
          background: #ffcdd2;
        }
      }

      &.inactive {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(1);
      }
    }
  }
}

.feedback {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 3px dashed var(--theme-border-color);

  .result-text {
    font-size: 1.3rem;
    font-weight: 800;
    margin-bottom: 0.8rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.4rem;

    &.text-ok {
      color: var(--theme-success);
    }
    &.text-fail {
      color: var(--theme-error);
    }
  }

  .combo {
    font-size: 0.9rem;
    color: var(--theme-accent);
    animation: popIn 0.3s;
    background: var(--theme-card-bg);
    padding: 2px 8px;
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
  }
}

.analysis-list {
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;

  li {
    margin-bottom: 0.4rem;
  }
}

.explain-box {
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 1rem;
  color: var(--theme-text-light);
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: left;
  line-height: 1.7;
  box-shadow: var(--theme-shadow-inner);

  .explain-text {
    margin: 0.5rem 0 0;
    font-family: inherit;
    word-wrap: break-word;
  }

  &.fact-box {
    background: var(--theme-fact-bg);
    color: var(--theme-fact-color);
  }

  &.algo-ref {
    background: #1e1e1e;
    color: #d4d4d4;
    border-color: #333;

    .explain-text {
      font-family: "Fira Code", source-code-pro, monospace;
    }
  }

  &.link-box {
    background: var(--theme-card-bg);
    border-style: dashed;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;

    .ref-link {
      color: var(--theme-accent);
      text-decoration: none;
      word-break: break-all;
      font-weight: normal;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.next-btn {
  width: 100%;
  padding: 0.9rem;
  background: var(--theme-btn-primary-bg);
  color: var(--theme-fact-color);
  font-size: 1.15rem;
  font-weight: 900;
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  box-shadow: var(--theme-shadow-btn);
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }
}

.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
.pop {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-2px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(4px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-6px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(6px, 0, 0);
  }
}

@keyframes popIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.feedback-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.feedback-enter-from {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}

.srs-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--theme-border-color);

  .srs-prompt {
    font-weight: 800;
    color: var(--theme-text-main);
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }

  .srs-btn-group {
    display: flex;
    justify-content: space-center;
    gap: 0.8rem;
    width: 100%;

    .srs-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.6rem 0.4rem;
      font-size: 1rem;
      line-height: 1.3;

      span {
        font-size: 0.75rem;
        font-weight: normal;
        margin-top: 2px;
        opacity: 0.9;
      }

      &.hard {
        background: #ffebee;
        color: #c62828;
        border-color: #ef9a9a;
      }
      &.warning {
        background: #fff3e0;
        color: #e65100;
        border-color: #ffcc80;
      }
      &.easy {
        background: #e8f5e9;
        color: #2e7d32;
        border-color: #a5d6a7;
      }
    }
  }
}

/* 笔记样式 */
.notes-section {
  margin-top: 1.5rem;
  border-top: 1px dashed var(--theme-border-color);
  padding-top: 1rem;
}

.notes-toggle-btn {
  width: 100%;
  padding: 0.8rem;
  background: transparent;
  border: 1px dashed var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  color: var(--theme-text-secondary);
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: var(--theme-btn-settings-bg);
  }

  &.open {
    background: var(--theme-btn-settings-bg);
    border-style: solid;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: none;
  }
}

.notes-content {
  background: var(--theme-btn-settings-bg);
  border: 1px solid var(--theme-border-color);
  border-top: none;
  border-radius: 0 0 var(--theme-radius-sm) var(--theme-radius-sm);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.notes-textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.8rem;
  border: 1px solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  background: var(--theme-card-bg);
  color: var(--theme-text-main);
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: var(--theme-accent);
  }
}

.notes-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;

  .notes-status {
    font-size: 0.85rem;
    color: #27ae60;
    font-weight: 800;
  }

  .notes-save-btn {
    padding: 0.4rem 1.2rem;
    font-size: 0.9rem;
  }
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
