import { INITIAL_VOCAB } from '../data/vocabData';
import type { VocabItem } from './types';

/** Chữ thường, bỏ dấu câu, gọn khoảng trắng. GIỮ dấu để phân biệt "cảm" / "cầm". */
function clean(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Bỏ toàn bộ dấu (thanh điệu pinyin + dấu tiếng Việt), đ -> d, ü -> u. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Dạng chuẩn để tra bảng đồng nghĩa: bỏ dấu câu + bỏ dấu. */
export function normalizeQuery(s: string): string {
  return normalize(clean(s));
}

function splitMeaning(meaning: string): string[] {
  return meaning
    .split(/[,;，；、]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Khớp theo TỪ nguyên vẹn, không khớp giữa chừng một từ. */
function hasWord(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${needle} `);
}

/** Khớp phải nhờ bỏ dấu (vd "cảm" ~ "cầm") sẽ bị cộng thêm điểm này để xếp sau. */
const LOOSE = 10;

/**
 * Tìm từ vựng, trả về theo độ khớp (điểm càng thấp càng khớp):
 *  0 từ đồng nghĩa | 1 pinyin/nghĩa khớp hệt (kể cả dấu) | 2 nghĩa chứa nguyên từ (có dấu)
 *  4 pinyin bắt đầu từ ranh giới âm tiết
 *  LOOSE+1 / +2 / +3: khớp hệt / chứa nguyên từ / mọi từ của truy vấn, sau khi bỏ dấu
 * Nếu người dùng gõ có dấu và đã có kết quả khớp đúng dấu thì bỏ qua các kết quả "lỏng",
 * để "cảm ơn" không kéo theo "cầm" (拿).
 */
export function searchVocab(
  query: string,
  synonymHanzi: string[],
  vocab: VocabItem[] = INITIAL_VOCAB
): VocabItem[] {
  const qTone = clean(query);
  const qBase = normalize(qTone);
  if (!qBase) return [];
  const qCompact = qBase.replace(/ /g, '');
  const qTokens = qBase.split(' ');
  const hasAccent = qTone !== qBase;

  const scoreWord = (w: VocabItem): number | null => {
    if (synonymHanzi.includes(w.hanzi)) return 0;

    // Pinyin: bỏ dấu + bỏ khoảng trắng ("xiexie" khớp "xiè xie")
    const syllables = w.pinyin.split(/\s+/).map(normalize).filter(Boolean);
    const compact = syllables.join('');
    if (compact === qCompact) return 1;
    if (qCompact.length >= 2) {
      let offset = 0;
      for (const s of syllables) {
        if (compact.startsWith(qCompact, offset)) return 4;
        offset += s.length;
      }
    }

    // Nghĩa tiếng Việt: lấy điểm tốt nhất trong các nghĩa của từ
    let best: number | null = null;
    const take = (n: number) => {
      if (best === null || n < best) best = n;
    };
    for (const raw of splitMeaning(w.meaning)) {
      const p = clean(raw);
      if (!p) continue;
      const pBase = normalize(p);
      if (p === qTone) take(1);
      else if (qBase.length >= 2 && hasWord(p, qTone)) take(2);
      else if (pBase === qBase) take(LOOSE + 1);
      else if (qBase.length >= 2 && hasWord(pBase, qBase)) take(LOOSE + 2);
      else if (qTokens.length > 1 && qTokens.every((t) => t.length >= 2 && hasWord(pBase, t))) take(LOOSE + 3);
    }
    return best;
  };

  let scored: { w: VocabItem; score: number }[] = [];
  for (const w of vocab) {
    const score = scoreWord(w);
    if (score !== null) scored.push({ w, score });
  }
  if (hasAccent && scored.some((x) => x.score < LOOSE)) {
    scored = scored.filter((x) => x.score < LOOSE);
  }
  scored.sort(
    (a, b) => a.score - b.score || a.w.hanzi.length - b.w.hanzi.length || a.w.id - b.w.id
  );
  return scored.map((x) => x.w);
}
