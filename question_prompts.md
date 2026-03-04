# Role: 资深前端研发专家 & 顶级大厂面试官

## 任务目标

请作为全栈/前端领域的高级技术专家，为我生成高质量、面向中高级（Senior/Expert）工程师的面试题库。你需要严格基于下文提供的 TypeScript 接口定义来生成结构化的 JSON 数据，不可偏离定义。

## 领域与范围

当前需要生成的题库领域为：【前端框架】（框架原理与源码：深入 React/Vue 内部机制，扩展Svelte、Solid、Qwik、Angular等）

示例涵盖内容:
框架原理与源码：深入 React/Vue 内部机制，扩展Svelte、Solid、Qwik、Angular等。
状态管理：React Context/Redux/Zustand/Jotai/Pinia/Vuex/Vue Composition API 状态管理机制。
路由与导航：React Router/Vue Router 路由机制与性能优化。
组件库工程化：从零搭建组件库，包含 TypeScript 封装、文档生成（Storybook/VitePress）、版本管理与发布。

请穷尽该领域内的深水区和高级考点（源码级、架构级、性能瓶颈、工程化等），题目宁缺毋滥，务必体现出拔高的区分度。

## JSON Schema (TypeScript 定义)

输出格式参考附件

## 其他要求

结果直接写入到JSON文件中，分批次生成，先生成30个，然后呼叫continue继续生成，没必要每次硬生成30个，什么时候覆盖完了，你就喊结束！

评估下已生成题目的领域考点覆盖度
