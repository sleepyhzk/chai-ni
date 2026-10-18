import { useSyncExternalStore } from 'react';
import { toLocalDateString } from './srs';

const KEY = 'study_activity_v1';
export const DAILY_GOAL = 20;
type Log = Record<string, number>;

function load(): Log {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Log; } catch { return {}; }
}
let log: Log = load();
const subs = new Set<() => void>();

function compute() {
  let streak = 0;
  const d = new Date();
  if (!log[toLocalDateString(d)]) d.setDate(d.getDate() - 1);
  while (log[toLocalDateString(d)] > 0) { streak++; d.setDate(d.getDate() - 1); }
  return { today: log[toLocalDateString()] ?? 0, streak };
}
let snap = compute();

/** Ghi nhận một lượt ôn thẻ (để tính chuỗi ngày và mục tiêu hằng ngày). */
export function recordActivity() {
  const k = toLocalDateString();
  log = { ...log, [k]: (log[k] ?? 0) + 1 };
  try { localStorage.setItem(KEY, JSON.stringify(log)); } catch { /* ignore */ }
  snap = compute();
  subs.forEach((f) => f());
}

export function useActivity() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => snap);
}
