import type { ReviewQuality, SrsState } from './types';

/**
 * Trả về ngày theo GIỜ ĐỊA PHƯƠNG dạng YYYY-MM-DD.
 * (toISOString() dùng UTC nên ở Việt Nam, 0h–7h sáng sẽ bị tính là ngày hôm trước.)
 */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Simplified SM-2 spaced repetition algorithm.
 * Returns the updated SRS state after a review.
 */
export function applyReview(
  state: SrsState | null,
  quality: ReviewQuality
): SrsState {
  let { easiness, interval, repetitions } = state ?? {
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
  };

  // "hard" = quên / nhớ sai  -> q < 3: reset chuỗi nhớ, ôn lại vào ngày mai.
  const qualityMap: Record<ReviewQuality, number> = {
    easy: 5,
    good: 4,
    hard: 2,
  };
  const q = qualityMap[quality];

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
  }

  easiness =
    easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easiness < 1.3) easiness = 1.3;

  const next = new Date();
  next.setDate(next.getDate() + interval);
  const nextReview = toLocalDateString(next);

  return {
    easiness,
    interval,
    repetitions,
    nextReview,
    lastQuality: quality,
    lastReviewed: new Date().toISOString(),
  };
}

export function isDue(nextReview: string): boolean {
  return nextReview <= toLocalDateString();
}
