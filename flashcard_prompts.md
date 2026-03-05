# Role: 资深前端研发专家 & 认知学习法专家

## 任务目标

请作为全栈/前端领域的高级技术专家，结合“间隔重复（Spaced Repetition）”与“主动回忆（Active Recall）”的认知心理学理念，为我生成高质量、面向中高级（Senior/Expert）工程师的【技术闪卡（Flashcards）】题库。你需要严格基于下文提供的 TypeScript 接口定义来生成结构化的 JSON 数据，不可偏离定义。

## 领域与范围

【前端框架】（框架原理与源码：深入 React/Vue 内部机制，扩展Svelte、Solid、Qwik、Angular等）
框架原理与源码：深入 React/Vue 内部机制，扩展Svelte、Solid、Qwik、Angular等。
状态管理：React Context/Redux/Zustand/Jotai/Pinia/Vuex/Vue Composition API 状态管理机制。
路由与导航：React Router/Vue Router 路由机制与性能优化。
组件库工程化：从零搭建组件库，包含 TypeScript 封装、文档生成（Storybook/VitePress）、版本管理与发布。
React Fiber 架构调度循环、Vue Reactivity 代理捕获细节、Virtual DOM diff 优化策略、Hooks 闭包陷阱原理、状态管理架构（Redux/Pinia/Zustand）推演、SSR/同构应用的水合（Hydration）不匹配问题。

## JSON Schema (TypeScript 定义)

请严格按照以下 TypeScript 类型生成 JSON。所有字符串字段中的换行符需用 `\n` 转义，制表符用 `\t` 转义。

```typescript
/** 转义字符串类型约束，提示 AI JSON 中必须使用 \n 换行 */
type EscapedString = string & { __brand: "EscapedString" };

/** 难度评估 */
type Difficulty = "beginner" | "intermediate" | "advanced";

/** 闪卡基础结构 */
interface Flashcard {
  /** 唯一标识符，格式：[类别ID]-flashcard-[三位数字] (如: network-flashcard-001) */
  id: string;

  /**
   * 闪卡正面：考察的核心概念、情境问题或代码片段输出猜测。
   * 要求：一针见血，直击痛点，字数尽量精简，不要长篇大论。
   */
  front_concept: EscapedString;

  /**
   * 主动回忆提示：2-3个关键字或启发性短句。
   * 要求：用于引导用户主动回忆，绝不能直接透露答案。
   */
  hints: string[];

  /**
   * 闪卡背面：核心解答、原理揭秘或关键代码。
   * 要求：条理清晰，直奔原理。包含【原理机制】、【对比/优劣分析】或【最佳实践】。
   */
  back_explanation: EscapedString;

  /** 难度评级 */
  difficulty: Difficulty;

  /** 技术标签集合，如 ['V8', 'Memory Leak'] */
  tags: string[];
}

/** 完整闪卡集合文件根结构 */
interface FlashcardDeck {
  file_metadata: {
    /** 对应 categories.json 的 id */
    category_id: string;
    /** 类别中文名称 */
    category_name: string;
    /** 当前文件闪卡总数 */
    total_cards: number;
    /** 目标人群 */
    target_level: "Senior" | "Expert";
  };
  cards: Flashcard[];
}
```

## 生成约束与工作流

1. **单次产出**：将结果直接写入JSON（用```json包裹），每次按批次生成 30 张，直至我喊停该领域。
2. **正面要求 (Front)**：避免“什么是XXX”这种死记硬背的考法，尽量采用“XXX 机制在 YYY 场景下会导致什么失效？”、“这行代码在 Node 和 Browser 中的输出差异是什么？”等实战化提问。
3. **背面要求 (Back)**：采用总分结构。首句直接抛出结论，随后罗列核心点，最后附带一个防坑指南（坑点/最佳实践）。

---

## 各类别专属生成提示词

_使用说明：在给 AI 喂入题库生成语料时，请将上方的基础约束结合下方对应类别的提示词一起发出。_

### 1. 🎨 CSS与UI (css_ui)

**当前需要生成的闪卡领域为：【CSS与UI】**
**涵盖内容**：现代 CSS 布局（Flexbox/Grid 隐式计算原理）、层叠上下文形成条件、BFC 高级应用与陷阱、重绘重排触发边界、CSS Houdini、响应式安全区与移动端1px渲染。
**专属要求**：侧重于渲染层面的诡异表现、CSS 规范底层计算逻辑及现代替代 Hack 的最佳实践。

### 2. ⚛️ 前端框架 (framework)

**当前需要生成的闪卡领域为：【前端框架】**
**涵盖内容**：React Fiber 架构调度循环、Vue Reactivity 代理捕获细节、Virtual DOM diff 优化策略、Hooks 闭包陷阱原理、状态管理架构（Redux/Pinia/Zustand）推演、SSR/同构应用的水合（Hydration）不匹配问题。
**专属要求**：深入源码实现细节，闪卡正面多用代码片段询问输出结果，或考察极端场景下的 Re-render 表现。

### 3. 🌐 浏览器与网络 (network)

**当前需要生成的闪卡领域为：【浏览器与网络】**
**涵盖内容**：Chrome 多进程架构与渲染管线（Main/Compositor 线程流转）、HTTP/2 多路复用与队头阻塞、HTTP/3 QUIC 机制、TLS 1.3 0-RTT 风险、V8 与 Blink 的互操作开销、Service Worker 缓存穿透策略。
**专属要求**：强调协议底层原理和浏览器内核运作机制，题目要能体现性能优化的根因。

### 4. 💻 前端工程化 (engineering)

**当前需要生成的闪卡领域为：【前端工程化】**
**涵盖内容**：Webpack Chunk 图构建原理、Vite 依赖预构建与 HMR 热更新机制、AST 语法树在 Babel/ESLint 中的操作手法、微前端（Qiankun/Module Federation）沙箱隔离与路由劫持。
**专属要求**：考察构建工具的底层机制、模块打包时的 Tree Shaking 失败原因及自研 Loader/Plugin 的边界问题。

### 5. 🏗️ 前端架构 (architecture)

**当前需要生成的闪卡领域为：【前端架构】**
**涵盖内容**：领域驱动设计（DDD）在复杂前端的落地、BFF（Backend For Frontend）演进与 GraphQL 对比、Monorepo 项目治理机制、企业级组件库设计规范与按需加载体系建设。
**专属要求**：侧重于宏观把控、多技术方案的 Trade-off 对比、分层架构中数据模型的流转边界。

### 6. 📱 跨平台 (cross-platform)

**当前需要生成的闪卡领域为：【跨平台技术】**
**涵盖内容**：React Native JSI 通信机制与 Fabric 渲染新架构、Flutter Widget/Element/RenderObject 三棵树原理、小程序双线程模型及 setData 通信瓶颈、WebView 性能提升方案。
**专属要求**：紧扣 JS 与原生（Native/C++）互相调用时的序列化开销、UI 线程与后台逻辑线程的数据同步策略。

### 7. 🛡️ 安全 (security)

**当前需要生成的闪卡领域为：【前端安全】**
**涵盖内容**：CSP 严格策略配置与 Bypass 手法、SameSite 机制与 CSRF 高级防御、DOM Clobbering 原理、原型链污染（Prototype Pollution）、Web Crypto API 与前端敏感数据传输加密方案。
**专属要求**：给出特定攻击场景或缺陷代码，要求指出漏洞并给出最严谨的防范手段。

### 8. ⚡ 性能优化 (performance)

**当前需要生成的闪卡领域为：【性能优化】**
**涵盖内容**：Core Web Vitals 指标定位（LCP/CLS/INP 计算规则）、Long Task 主线程阻塞拆解、大图/视频多路复用优化、Web Worker 海量计算卸载、离屏 Canvas 渲染。
**专属要求**：考察不仅要知道“怎么做”，更要知道“为什么有效”，涉及浏览器性能监控的 Trace API 获取原理。

### 9. 🍊 Nodejs (nodejs)

**当前需要生成的闪卡领域为：【Node.js】**
**涵盖内容**：Node EventLoop 阶段细分与浏览器差异（Timers vs Check）、V8 内存分配控制与内存泄漏快照分析、多进程架构模式（Cluster/Child_process）、Stream 流水线与背压控制、BFF 层高并发网关设计。
**专属要求**：偏向服务端视角的高吞吐量/低延迟能力、以及与底层操作系统（libuv）的交互原理。

### 10. 🧊 图形与可视化 (visual)

**当前需要生成的闪卡领域为：【图形与可视化】**
**涵盖内容**：Canvas 2D 渲染管线与局部重绘优化、WebGL 渲染流水线与基础着色器（GLSL）机制、Three.js 场景图与材质性能优化、SVG 复杂动画与海量点位渲染策略（十万级）。
**专属要求**：聚焦 GPU 渲染与主线程的分工，图形学基础概念在 Web 端的应用。

### 11. 🚀 DevOps (devops)

**当前需要生成的闪卡领域为：【DevOps在前端领域的应用】**
**涵盖内容**：Docker 镜像分层构建优化、Nginx/边缘节点（CDN Edge Compute）回源策略、Kubernetes 前端部署灰度测试体系、Jenkins/GitHub Actions 流水线性能调优、前端监控体系选型。
**专属要求**：考察 CI/CD 流水线的编排最佳实践及前端代码从提交到上线的整套工程化提效。

### 12. 🧩 引擎开发 (v8)

**当前需要生成的闪卡领域为：【引擎底层技术(V8)】**
**涵盖内容**：V8 编译流水线（Ignition 解析与 TurboFan 优化）、Inline Cache (IC) 对象的隐藏类（Hidden Class）迁移路径、垃圾回收（Scavenge 与 Mark-Sweep）底层机制、Wasm 内存模型。
**专属要求**：非常底层的机制，必须给出 JS 代码片段并解释其在 V8 眼中的长什么样、为何会导致降级执行。

### 13. 🏗️ 业务架构与最佳实践 (business)

**当前需要生成的闪卡领域为：【业务架构与最佳实践】**
**涵盖内容**：大文件分片并行上传及断点续传设计、协同编辑（CRDT/OT算法演进）、千万级网格虚拟滚动与可交互性设计、高并发秒杀前端防刷去重兜底方案。
**专属要求**：面向实际业务，给出一个极其苛刻的边界条件场景，考察极致的客户端容灾和交互降级方案。

### 14. 🤖 AI赋能前端与大模型应用开发 (ai-frontend)

**当前需要生成的闪卡领域为：【AI大模型应用开发】**
**涵盖内容**：LLM 接口的流式输出实现（SSE vs Fetch Reader）、端侧推理（WebNN/ONNX Runtime Web）、LangChain.js Agent 架构体系设计、智能体（Copilot）上下文缓存管理、前端工程化结合 AI 流程。
**专属要求**：探索前沿能力，考察大模型交互体验提升手段及浏览器原生 AI API 的使用场景。

### 15. 🏗️ 基建与研发效能 (infrastructure)

**当前需要生成的闪卡领域为：【基建与研发效能】**
**涵盖内容**：企业级定制 CLI 开发原理、AST 代码自动化重构工具部署、组件库自动化发布（Lerna/Changesets）、前端自动化测试体系演进（E2E、单元测试 mocking）。
**专属要求**：解决团队开发痛点的方法论和工具设计，如何通过脚本化、工具化收敛研发规范的落地。

### 16. ✍️ 算法 (algorithm)

**当前需要生成的闪卡领域为：【前端算法与数据结构】**
**涵盖内容**：前端常考数据结构（如 AST 转译与树形结构还原）、经典 LRU 缓存的 JS 映射实现、防抖节流的异步时序复杂变种、动态规划在计算瀑布流等场景的转换。
**专属要求**：必须与前端实际业务强相关！不要枯燥的 LeetCode 原题，全部包装成“路由匹配算法”、“DOM 节点对比算法”、“撤销重做栈机制”。
