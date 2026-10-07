import { supabase } from './supabase';
import type { SrsState } from './types';

export type ProgressMap = Record<string, SrsState>;
export type StarEntry = { on: boolean; at: string };
export type StarMeta = Record<string, StarEntry>;

const EPOCH = '1970-01-01T00:00:00.000Z';
export const LEGACY_STAR_TIME = EPOCH;

const time = (iso: string | undefined) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** Gộp tiến độ: với mỗi thẻ lấy bản được ôn gần nhất. toPush = thẻ chỉ có ở máy hoặc mới hơn trên cloud. */
export function mergeProgress(local: ProgressMap, cloud: ProgressMap) {
  const merged: ProgressMap = { ...cloud };
  const toPush: string[] = [];
  for (const [key, l] of Object.entries(local)) {
    const c = cloud[key];
    if (!c || time(l.lastReviewed) > time(c.lastReviewed)) {
      merged[key] = l;
      toPush.push(key);
    }
  }
  return { merged, toPush };
}

/** Gộp dấu sao theo thời điểm thay đổi gần nhất của từng thẻ. */
export function mergeStars(local: StarMeta, cloud: StarMeta) {
  const merged: StarMeta = { ...cloud };
  const toPush: string[] = [];
  for (const [key, l] of Object.entries(local)) {
    const c = cloud[key];
    if (!c || time(l.at) > time(c.at)) {
      merged[key] = l;
      // Dấu sao cũ chưa có thời gian mà cloud không có: chỉ đẩy lên nếu thật sự đang bật.
      if (!c && !l.on) continue;
      toPush.push(key);
    }
  }
  return { merged, toPush };
}

const PAGE = 1000;

export async function fetchProgress(): Promise<ProgressMap> {
  if (!supabase) return {};
  const out: ProgressMap = {};
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('card_key,state')
      .order('card_key')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data ?? []) out[r.card_key as string] = r.state as SrsState;
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function pushProgress(userId: string, map: ProgressMap, keys: string[]) {
  if (!supabase || keys.length === 0) return;
  const rows = keys
    .filter((k) => map[k])
    .map((k) => ({
      user_id: userId,
      card_key: k,
      state: map[k],
      reviewed_at: map[k].lastReviewed,
    }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from('user_progress')
      .upsert(rows.slice(i, i + 500), { onConflict: 'user_id,card_key' });
    if (error) throw error;
  }
}

export async function deleteAllProgress(userId: string) {
  if (!supabase) return;
  const { error } = await supabase.from('user_progress').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function fetchStars(): Promise<StarMeta> {
  if (!supabase) return {};
  const out: StarMeta = {};
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('user_starred')
      .select('card_key,starred,updated_at')
      .order('card_key')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data ?? []) {
      out[r.card_key as string] = { on: r.starred as boolean, at: r.updated_at as string };
    }
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function pushStars(userId: string, meta: StarMeta, keys: string[]) {
  if (!supabase || keys.length === 0) return;
  const rows = keys
    .filter((k) => meta[k])
    .map((k) => ({
      user_id: userId,
      card_key: k,
      starred: meta[k].on,
      updated_at: meta[k].at === EPOCH ? new Date().toISOString() : meta[k].at,
    }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from('user_starred')
      .upsert(rows.slice(i, i + 500), { onConflict: 'user_id,card_key' });
    if (error) throw error;
  }
}
