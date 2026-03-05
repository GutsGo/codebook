import type { Flashcard, FlashcardDeck } from "@/types/flashcard";
import { resolveDataUrl } from "@/utils/assets";

const flashcardDeckCache = new Map<string, FlashcardDeck>();

export async function fetchFlashcardDeck(
  categoryId: string,
): Promise<FlashcardDeck | null> {
  if (flashcardDeckCache.has(categoryId)) {
    return flashcardDeckCache.get(categoryId)!;
  }

  const url = resolveDataUrl(`/data/flashcards/${categoryId}.json`);
  try {
    const res = await fetch(url + "?v=" + Date.now());
    if (!res.ok) return null;
    const data: FlashcardDeck = await res.json();
    flashcardDeckCache.set(categoryId, data);
    return data;
  } catch (e) {
    console.error(`Failed to fetch flashcard deck for ${categoryId}:`, e);
    return null;
  }
}

export async function fetchFlashcardById(
  categoryId: string,
  cardId: string,
): Promise<Flashcard | null> {
  const deck = await fetchFlashcardDeck(categoryId);
  if (!deck) return null;
  return deck.cards.find((c) => c.id === cardId) || null;
}
