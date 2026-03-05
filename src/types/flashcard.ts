export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Flashcard {
  id: string;
  front_concept: string;
  hints: string[];
  back_explanation: string;
  difficulty: Difficulty;
  tags: string[];
}

export interface FlashcardDeck {
  file_metadata: {
    category_id: string;
    category_name: string;
    total_cards: number;
    target_level: "Senior" | "Expert";
  };
  cards: Flashcard[];
}
