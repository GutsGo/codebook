// ==================== 基础工具类型 ====================

export type QuestionTypeEnum =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "algorithm";
export type DifficultyLevel = "senior" | "expert";
export type SourceCompany =
  | "Alibaba"
  | "ByteDance"
  | "Tencent"
  | "Meituan"
  | "Google"
  | "Meta"
  | "OpenSource"
  | string;

export interface Option {
  id: string;
  text: string;
}

// ==================== 题目基础结构 ====================

export interface QuestionBase {
  id: string;
  type: QuestionTypeEnum;
  difficulty: DifficultyLevel;
  tags: string[];
  source_company: SourceCompany;
  score: number;
  title: string;
  content: string;
  explanation: string;
  knowledge_point?: string;
  common_mistake?: string;
  hints?: string[];
  reference_link?: string;
}

export interface SingleChoiceQuestion extends QuestionBase {
  type: "single_choice";
  options: Option[];
  correct_answer: string;
  wrong_options_analysis?: Record<string, string>;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: Option[];
  correct_answer: string[];
  exclusion_analysis?: Record<string, string>;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: "true_false";
  options?: Option[];
  correct_answer: string;
  boundary_conditions: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
  description: string;
}

export interface AlgorithmQuestion extends QuestionBase {
  type: "algorithm";
  code_template: string;
  test_cases: TestCase[];
  time_complexity: string;
  space_complexity: string;
  constraints?: string[];
  reference_solution?: string;
  correct_answer: string;
}

export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | AlgorithmQuestion;

// ==================== 文件根结构 ====================

export interface FileMetadata {
  version: string;
  category: string;
  generated_at: string;
  total_questions: number;
  target_level: string;
  continuation: boolean;
  next_batch_id?: string;
  id_range?: string;
}

export interface QuestionBank {
  file_metadata: FileMetadata;
  questions: Question[];
}

// ==================== 其他应用层结构 ====================

export interface Level {
  id: string;
  name: string;
  questionIds: string[];
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  description?: string;
  hex?: string;
  levels: Level[];
}


export interface MistakeRecord {
  categoryId: string;
  questionId: string;
  timestamp: number;
}

export interface GalleryItem {
  id: string;
  name: string;
  image?: string;
  description: string;
  fact?: string;
}

export interface SrsRecord {
  categoryId: string;
  questionId: string;
  level: number; // 0: 没见过/忘记, 1: 模糊, 2: 简单
  nextReviewTime: number; // 毫秒级时间戳
  interval?: number; // 存储上次的间隔（毫秒），用于推导下一次
  easeFactor?: number; // 掌握容易度因子，SM-2默认2.5
  repetitions?: number; // 连续正确的次数
}

export interface NoteRecord {
  categoryId: string;
  questionId: string;
  content: string;
  timestamp: number;
}
