/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { SrsState, ReviewQuality } from '@/lib/types';
import { applyReview } from '@/lib/srs';
import { migrateKeys } from '@/lib/vocabKey';
import { useAuth, SIGNED_OUT_EVENT } from '@/hooks/useAuth';
import {
  deleteAllProgress,
  fetchProgress,
  mergeProgress,
  pushProgress,
} from '@/lib/cloudSync';

const STORAGE_KEY = 'srs_progress_v2';

type ProgressMap = Record<string, SrsState>;

interface SrsProgressContextValue {
  progressMap: ProgressMap;
  upsert: (word: string, quality: ReviewQuality) => void;
  reset: () => void;
}

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return migrateKeys(JSON.parse(raw) as ProgressMap);
  } catch {
    return {};
  }
}

function saveProgress(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

const SrsProgressContext = createContext<SrsProgressContextValue | null>(null);

/**
 * Giữ một bản tiến độ duy nhất cho cả app, để Trang chủ và Flashcard
 * luôn thấy cùng một dữ liệu (trước đây mỗi nơi gọi hook là một state riêng).
 *
 * Khi đã đăng nhập: gộp với bản trên Supabase (thẻ nào ôn gần nhất thì thắng),
 * rồi đẩy từng thẻ vừa chấm lên cloud. Chưa đăng nhập hoặc mất mạng: vẫn lưu localStorage.
 */
export function SrsProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [progressMap, setProgressMap] = useState<ProgressMap>(loadProgress);

  const progressRef = useRef(progressMap);
  progressRef.current = progressMap;
  const dirtyRef = useRef(new Set<string>());
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    saveProgress(progressMap);
  }, [progressMap]);

  const flush = useCallback(async () => {
    if (!userId || dirtyRef.current.size === 0) return;
    const keys = [...dirtyRef.current];
    dirtyRef.current.clear();
    try {
      await pushProgress(userId, progressRef.current, keys);
    } catch {
      keys.forEach((k) => dirtyRef.current.add(k)); // thử lại lần sau
    }
  }, [userId]);

  // Đăng nhập (hoặc khôi phục phiên): kéo bản cloud về và gộp.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    dirtyRef.current.clear();
    (async () => {
      try {
        const cloud = await fetchProgress();
        if (cancelled) return;
        const { merged, toPush } = mergeProgress(progressRef.current, cloud);
        setProgressMap((prev) => mergeProgress(prev, cloud).merged);
        await pushProgress(userId, merged, toPush);
      } catch {
        // Mất mạng: giữ dữ liệu trên máy, lần mở web sau sẽ gộp lại.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Thử đẩy lại khi có mạng / khi chuyển tab.
  useEffect(() => {
    const retry = () => void flush();
    const onHide = () => document.visibilityState === 'hidden' && void flush();
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flush]);

  // Đăng xuất chủ động: xóa tiến độ trên máy này (dữ liệu vẫn còn trên tài khoản).
  useEffect(() => {
    const onSignedOut = () => {
      window.clearTimeout(timerRef.current);
      dirtyRef.current.clear();
      setProgressMap({});
    };
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  const upsert = useCallback(
    (word: string, quality: ReviewQuality) => {
      setProgressMap((prev) => ({
        ...prev,
        [word]: applyReview(prev[word] ?? null, quality),
      }));
      if (userId) {
        dirtyRef.current.add(word);
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => void flush(), 800);
      }
    },
    [userId, flush]
  );

  const reset = useCallback(() => {
    setProgressMap({});
    dirtyRef.current.clear();
    if (userId) void deleteAllProgress(userId).catch(() => {});
  }, [userId]);

  const value = useMemo(
    () => ({ progressMap, upsert, reset }),
    [progressMap, upsert, reset]
  );

  return (
    <SrsProgressContext.Provider value={value}>
      {children}
    </SrsProgressContext.Provider>
  );
}

export function useSrsProgress(): SrsProgressContextValue {
  const ctx = useContext(SrsProgressContext);
  if (!ctx) {
    throw new Error('useSrsProgress phải được dùng bên trong <SrsProgressProvider>');
  }
  return ctx;
}
