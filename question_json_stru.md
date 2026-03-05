/\*\*

- 前端资深面试题库 JSON Schema (TypeScript 定义版)
-
- 使用说明：
- 1. 将此类型定义提供给 AI，告知"请严格按照以下 TypeScript 类型生成 JSON"
- 2. AI 生成的 JSON 可通过 ts-json-validator 或 zod 校验
- 3. 所有字符串字段需符合 EscapedString 规范（换行符用 \\n，制表符用 \\t）
     \*/

// ==================== 基础工具类型 ====================

/\*\*

- 转义字符串类型约束
- 要求：JSON 字符串中不能包含原始换行符，必须使用 \\n \\t \\"
- 注意：这是 TypeScript 类型提示，实际生成的是普通 string，
- 但在 prompt 中需强调 "所有字符串中的换行必须使用 \\n 转义"
  \*/
  type EscapedString = string & { \_\_brand: 'EscapedString' };

/\*_ 题目 ID 格式：类别前缀-等级-三位数字 _/
type QuestionId =
| `js-senior-${number}`
| `framework-senior-${number}`
| `engineer-senior-${number}`
| `browser-senior-${number}`
| `perf-senior-${number}`
| `node-senior-${number}`
| `arch-senior-${number}`
| `sec-senior-${number}`
| `code-senior-${number}`;

/\*_ 题型枚举 _/
type QuestionTypeEnum = 'single_choice' | 'multiple_choice' | 'true_false' | 'algorithm';

/\*_ 难度等级 _/
type DifficultyLevel = 'senior' | 'expert';

/\*_ 公司/来源标签 _/
type SourceCompany = 'Alibaba' | 'ByteDance' | 'Tencent' | 'Meituan' | 'Google' | 'Meta' | 'OpenSource';

// ==================== 选项结构 ====================

/** 单个选项 \*/
interface Option {
/** 选项标识：单/多选为 A/B/C/D，判断题为 A(正确)/B(错误) _/
id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
/\*\* 选项文本，支持代码片段（已转义） _/
text: EscapedString;
}

/\*_ 单选题选项约束：必须且只能有4个 _/
type SingleChoiceOptions = [Option, Option, Option, Option];

/\*_ 多选题选项约束：4-6个选项 _/
type MultipleChoiceOptions = [Option, Option, Option, Option] |
[Option, Option, Option, Option, Option] |
[Option, Option, Option, Option, Option, Option];

/\*_ 判断题选项约束：固定为 正确/错误 两个选项 _/
type TrueFalseOptions = [
{ id: 'A'; text: '正确' | 'True' },
{ id: 'B'; text: '错误' | 'False' }
];

// ==================== 题目基础结构 ====================

/\*\*

- 所有题目共有的基础字段
  _/
  interface QuestionBase {
  /\*\* 唯一标识符，格式：类别前缀-senior-三位数字，如 js-senior-001 _/
  id: QuestionId;

/\*_ 题型分类 _/
type: QuestionTypeEnum;

/\*_ 面试难度 _/
difficulty: DifficultyLevel;

/\*_ 技术标签，用于分类和检索，如 ['V8', 'GC', '内存优化'] _/
tags: string[];

/\*_ 题目出处，标识面试公司或开源项目 _/
source_company: SourceCompany | string;

/\*_ 题目分值，通常 5-15 分 _/
score: number;

/\*_ 题目短标题，20字以内，用于快速识别考点 _/
title: string;

/\*\*

- 题目详细描述
- 可以包含代码示例（使用 \\n 换行转义）
- 可以包含多段描述（使用 \\n\\n 分段）
  \*/
  content: EscapedString;

/\*\*

- 详细解析
- 约束：不少于200字符
- 必须包含：原理分析、错误选项剖析、源码级细节、工程实践建议
- 格式：纯文本，段落间用 \\n\\n 分隔
  \*/
  explanation: EscapedString;

/\*_ 关联知识点标签，用于知识图谱，如 'V8_Hidden_Class' _/
knowledge_point?: string;

/\*_ 常见错误选择及原因简述，用于面试官快速把握考点 _/
common_mistake?: EscapedString;

/\*_ 引导回忆的阶段性提示，逐步展示给用户看 _/
hints?: EscapedString[];

/\*_ 权威参考链接，如官方文档 RFC/W3C/V8 源码链接 _/
reference_link?: string;
}

// ==================== 具体题型定义 ====================

/\*\*

- 单选题
- 特征：4个选项，correct_answer 为单个字母
  \*/
  interface SingleChoiceQuestion extends QuestionBase {
  type: 'single_choice';

/\*_ 固定4个选项 _/
options: SingleChoiceOptions;

/\*_ 正确答案的选项 ID，如 'A' _/
correct_answer: 'A' | 'B' | 'C' | 'D';

/\*_ 干扰项设计说明：为什么其他选项具有迷惑性 _/
wrong_options_analysis?: Record<'B' | 'C' | 'D', EscapedString>;
}

/\*\*

- 多选题
- 特征：4-6个选项，correct_answer 为选项ID数组（2-4个元素）
  \*/
  interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple_choice';

/\*_ 4-6个选项 _/
options: MultipleChoiceOptions;

/\*_ 正确答案数组，包含2-4个选项ID，如 ['A', 'C', 'D'] _/
correct_answer: ['A', 'B'] | ['A', 'C'] | ['A', 'D'] | ['B', 'C'] |
['A', 'B', 'C'] | ['A', 'B', 'D'] | ['A', 'C', 'D'] | ['B', 'C', 'D'] |
['A', 'B', 'C', 'D'];

/\*\*

- 全选分析
- 必须说明每个错误选项为什么不选（考察常见误解）
  \*/
  exclusion_analysis?: Record<string, EscapedString>;
  }

/\*\*

- 判断题
- 特征：只有正确/错误两个固定选项，考察边界条件和概念辨析
  \*/
  interface TrueFalseQuestion extends QuestionBase {
  type: 'true_false';

/\*_ 固定选项格式 _/
options?: TrueFalseOptions;

/\*_ 正确答案，A=正确/True，B=错误/False _/
correct_answer: 'A' | 'B';

/\*_ 必须明确说明边界条件和例外情况 _/
boundary_conditions: EscapedString;
}

/\*\*

- 测试用例结构（算法题专用）
  _/
  interface TestCase {
  /\*\* 输入描述，序列化为字符串表示 _/
  input: EscapedString;

/\*_ 预期输出 _/
expected_output: EscapedString;

/\*_ 该用例考察的具体边界点说明 _/
description: string;
}

/\*\*

- 算法题
- 特征：要求手写代码，包含模板、测试用例、复杂度分析
- 考察工程实现能力而非纯算法思维能力
  \*/
  interface AlgorithmQuestion extends QuestionBase {
  type: 'algorithm';

/\*\*

- 代码初始模板
- 包含函数签名、类定义、必要注释
- 使用 \\n 表示换行，保持单行字符串格式
- 使用 TypeScript 语法（包含类型注解）
  \*/
  code_template: EscapedString;

/\*\*

- 测试用例数组，至少3组
- 需包含：正常情况、边界情况（如空输入/极大值）、异常情况
  \*/
  test_cases: [TestCase, TestCase, TestCase, ...TestCase[]];

/\*_ 时间复杂度，如 'O(n)', 'O(n log n)', 'O(n²)' _/
time_complexity: string;

/\*_ 空间复杂度，如 'O(1)', 'O(n)', 'O(log n)' _/
space_complexity: string;

/\*_ 额外约束条件，如 ['不能使用全局变量', '禁用递归', '需处理异步边界'] _/
constraints?: string[];

/\*\*

- 可选：参考实现代码
- 用于面试官校验，候选人不需要看到
  \*/
  reference_solution?: EscapedString;

/\*_ 正确答案描述，可以是 "见代码实现" 或具体返回值 _/
correct_answer: EscapedString;
}

/\*_ 题目联合类型 _/
type Question =
| SingleChoiceQuestion
| MultipleChoiceQuestion
| TrueFalseQuestion
| AlgorithmQuestion;

// ==================== 文件根结构 ====================

/\*\*

- 文件元数据
  _/
  interface FileMetadata {
  /\*\* 版本号 _/
  version: string;

/\*_ 题目类别，如 'JavaScript/TypeScript', 'React/Vue', 'Engineering' _/
category: string;

/\*_ 生成时间 ISO8601 _/
generated_at: string;

/\*_ 当前文件中的实际题目数量 _/
total_questions: number;

/\*_ 目标面试等级 _/
target_level: 'Senior' | 'Expert';

/\*\*

- 是否有更多内容待生成
- 若为 true，表示这是分批生成的第一批，还有续集
  \*/
  continuation: boolean;

/\*\*

- 下一批起始 ID 编号（当 continuation 为 true 时必填）
- 如 '011', '026'
  \*/
  next_batch_id?: string;

/\*_ 已生成的题号范围，如 '001-050' _/
id_range?: string;
}

/\*\*

- 完整题库文件根结构
  \*/
  interface QuestionBank {
  file_metadata: FileMetadata;

/\*_ 题目数组，ID 必须连续递增 _/
questions: Question[];
}

// ==================== 生成策略与约束 ====================

/\*\*

- 生成时强制遵循的约束（需写入 Prompt）
  \*/
  interface GenerationConstraints {
  /\*\*
  - 字符串转义规则
  - 所有字符串字段必须满足：
  - 1. 原始换行符 \n 必须替换为 \\n
  - 2. 原始制表符 \t 必须替换为 \\t
  - 3. 双引号 " 必须替换为 \\"
  - 4. 反斜杠 \ 必须替换为 \\
       \*/
       string_escaping: 'mandatory_escape_newline_tab_quote';

/\*_ 单选题固定4个选项，多选题4-6个选项 _/
option_count: {
single_choice: 'exactly 4';
multiple_choice: '4 to 6';
true_false: 'exactly 2 (True/False)';
};

/\*_ explanation 长度约束 _/
explanation_min_length: 200; // 字符

/\*_ 必须包含的 explanation 要素 _/
explanation_must_include: [
'原理机制说明（深入到源码/规范）',
'正确选型分析（为什么正确）',
'错误选型剖析（为什么错误，常见误解）',
'工程实践建议（性能影响、踩坑点）'
];

/\*_ ID 连续性要求 _/
id_continuity: '必须连续编号，分批生成时使用 next_batch_id 保证连续';

/\*_ 题型比例建议（最大化生成时可调整） _/
suggested_distribution: {
single_choice: '40%';
multiple_choice: '30%';
true_false: '15%';
algorithm: '15%';
};
}

/\*\*

- 使用此 Prompt 模板要求 AI 生成：
-
- "请严格按照以下 TypeScript 接口定义生成面试题 JSON，要求：
- 1. 实现 QuestionBank 接口，确保 file_metadata 和 questions 字段完整
- 2. 所有字符串中的换行符必须使用 \\n 转义，禁止使用真实换行符
- 3. 单选题必须恰好4个选项（A/B/C/D），多选题4-6个选项
- 4. 每道题 explanation 不少于200字符，必须包含原理、正误分析、工程实践
- 5. 算法题必须包含 code_template（函数签名）、test_cases（≥3组）、复杂度分析
- 6. 最大化生成数量，穷尽该领域所有高级考点，直到无法不重复地继续
- 7. 若内容过多无法一次返回，设置 continuation: true 并记录 next_batch_id"
     \*/
