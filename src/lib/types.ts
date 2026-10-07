/** Cấp theo chuẩn HSK 3.0; 'extra' = từ ngoài danh sách chuẩn (nhóm "Bổ sung"). */
export type Hsk = 1 | 2 | 3 | 'extra';

export interface VocabItem {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk: Hsk;
  level: 'HSK 1' | 'HSK 2' | 'HSK 3' | 'Bổ sung';
  /** Văn bản đưa cho giọng đọc, khi chữ Hán đứng một mình dễ bị đọc sai cách (chữ đa âm). */
  speak?: string;
}

export type ReviewQuality = 'easy' | 'good' | 'hard';

export type FlashcardFilter = 'all' | 'hard' | 'good' | 'starred' | Hsk;

export interface SrsState {
  easiness: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastQuality: ReviewQuality;
  lastReviewed: string;
}

export interface TokenSegment {
  text: string;
  pinyin: string;
  meaning: string;
  isWord: boolean;
}
