import { INITIAL_VOCAB } from '../data/vocabData';
import type { VocabItem } from './types';

/**
 * Khóa dùng để lưu tiến độ học và dấu sao.
 * - Chữ Hán chỉ có một dòng trong danh sách: dùng chính chữ Hán (giữ nguyên dữ liệu đã lưu).
 * - Chữ đa âm (nhiều dòng cùng chữ Hán, vd 还 hái / huán): thêm "#id" để mỗi cách đọc có tiến độ riêng.
 * id của từ không bao giờ đổi nên khóa vẫn đúng khi sửa pinyin hay nghĩa.
 */
const countByHanzi = new Map<string, number>();
const keysByHanzi = new Map<string, string[]>();
const legacyTarget = new Map<string, string>(); // chữ Hán trần (dữ liệu cũ) -> khóa của dòng đầu tiên

/**
 * Từ đã đổi chữ Hán theo chuẩn HSK 3.0 (thêm 儿): khóa tiến độ / dấu sao cũ -> khóa mới.
 * Thêm dòng vào đây mỗi khi đổi chữ Hán của một từ để người dùng không mất dữ liệu đã lưu.
 */
const RENAMED: Record<string, string> = {
  一点: '一点儿',
  男孩: '男孩儿',
  女孩: '女孩儿',
  小孩: '小孩儿',
  面条: '面条儿',
  聊天: '聊天儿',
  有点: '有点儿',
};
const renameKey = (k: string) => RENAMED[k] ?? k;

for (const w of INITIAL_VOCAB) countByHanzi.set(w.hanzi, (countByHanzi.get(w.hanzi) ?? 0) + 1);

export function vocabKey(w: Pick<VocabItem, 'id' | 'hanzi'>): string {
  return (countByHanzi.get(w.hanzi) ?? 0) > 1 ? `${w.hanzi}#${w.id}` : w.hanzi;
}

for (const w of [...INITIAL_VOCAB].sort((a, b) => a.id - b.id)) {
  const k = vocabKey(w);
  keysByHanzi.set(w.hanzi, [...(keysByHanzi.get(w.hanzi) ?? []), k]);
  if (k !== w.hanzi && !legacyTarget.has(w.hanzi)) legacyTarget.set(w.hanzi, k);
}

/** Văn bản đưa cho giọng đọc: một số chữ đa âm cần thêm ngữ cảnh để đọc đúng cách đọc cần học. */
export function speechText(w: { hanzi: string; speak?: string }): string {
  return w.speak ?? w.hanzi;
}

/** Chữ Hán này (ở bất kỳ cách đọc nào) đã được đánh dấu sao chưa? */
export function isHanziStarred(starred: Set<string>, hanzi: string): boolean {
  return (keysByHanzi.get(hanzi) ?? [hanzi]).some((k) => starred.has(k));
}

/**
 * Chuyển dữ liệu cũ (khóa là chữ Hán trần) sang khóa mới.
 * Dữ liệu cũ của chữ đa âm trước đây dùng chung cho mọi cách đọc nên được gán cho dòng đầu tiên.
 */
export function migrateKeys<T>(rawMap: Record<string, T>): Record<string, T> {
  const map: Record<string, T> = {};
  for (const [k, v] of Object.entries(rawMap)) {
    const nk = renameKey(k);
    if (!(nk in map) || nk === k) map[nk] = v; // khóa mới đã có thì ưu tiên dữ liệu của khóa mới
  }
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(map)) if (!legacyTarget.has(k)) out[k] = v;
  for (const [k, v] of Object.entries(map)) {
    const target = legacyTarget.get(k);
    if (target && !(target in out)) out[target] = v;
  }
  return out;
}

export function migrateKeySet(set: Set<string>): Set<string> {
  return new Set([...set].map((k) => legacyTarget.get(renameKey(k)) ?? renameKey(k)));
}
