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
import { migrateKeys, migrateKeySet } from '@/lib/vocabKey';
import { useAuth, SIGNED_OUT_EVENT } from '@/hooks/useAuth';
import {
  fetchStars,
  LEGACY_STAR_TIME,
  mergeStars,
  pushStars,
} from '@/lib/cloudSync';
import type { StarMeta } from '@/lib/cloudSync';

/** Danh sách khóa đang có sao (định dạng cũ, vẫn ghi để tương thích). */
const STORAGE_KEY = 'starred_words_v1';
/** Thời điểm bật/tắt sao của từng khóa, dùng để đồng bộ giữa các thiết bị. */
const META_KEY = 'starred_meta_v1';

function loadMeta(): StarMeta {
  try {
    const rawMeta = localStorage.getItem(META_KEY);
    const meta: StarMeta = rawMeta ? migrateKeys(JSON.parse(rawMeta) as StarMeta) : {};
    const rawList = localStorage.getItem(STORAGE_KEY);
    if (rawList) {
      for (const k of migrateKeySet(new Set(JSON.parse(rawList) as string[]))) {
        if (!(k in meta)) meta[k] = { on: true, at: LEGACY_STAR_TIME };
      }
    }
    return meta;
  } catch {
    return {};
  }
}

function saveMeta(meta: StarMeta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    const on = Object.keys(meta).filter((k) => meta[k].on);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(on));
  } catch {
    // ignore
  }
}

interface StarredContextValue {
  starred: Set<string>;
  toggle: (hanzi: string) => void;
  isStarred: (hanzi: string) => boolean;
}

const StarredContext = createContext<StarredContextValue | null>(null);

/** Một bản dấu sao dùng chung cho mọi view (để bản kéo từ cloud về hiện ngay ở mọi nơi). */
export function StarredProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [meta, setMeta] = useState<StarMeta>(loadMeta);

  const metaRef = useRef(meta);
  metaRef.current = meta;
  const dirtyRef = useRef(new Set<string>());
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    saveMeta(meta);
  }, [meta]);

  const flush = useCallback(async () => {
    if (!userId || dirtyRef.current.size === 0) return;
    const keys = [...dirtyRef.current];
    dirtyRef.current.clear();
    try {
      await pushStars(userId, metaRef.current, keys);
    } catch {
      keys.forEach((k) => dirtyRef.current.add(k));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    dirtyRef.current.clear();
    (async () => {
      try {
        const cloud = migrateKeys(await fetchStars());
        if (cancelled) return;
        const { merged, toPush } = mergeStars(metaRef.current, cloud);
        setMeta((prev) => mergeStars(prev, cloud).merged);
        await pushStars(userId, merged, toPush);
      } catch {
        // Mất mạng: giữ dữ liệu trên máy.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  useEffect(() => {
    const onSignedOut = () => {
      window.clearTimeout(timerRef.current);
      dirtyRef.current.clear();
      setMeta({});
    };
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  const starred = useMemo(
    () => new Set(Object.keys(meta).filter((k) => meta[k].on)),
    [meta]
  );

  const toggle = useCallback(
    (hanzi: string) => {
      setMeta((prev) => ({
        ...prev,
        [hanzi]: { on: !prev[hanzi]?.on, at: new Date().toISOString() },
      }));
      if (userId) {
        dirtyRef.current.add(hanzi);
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => void flush(), 800);
      }
    },
    [userId, flush]
  );

  const isStarred = useCallback((hanzi: string) => starred.has(hanzi), [starred]);

  const value = useMemo(() => ({ starred, toggle, isStarred }), [starred, toggle, isStarred]);

  return <StarredContext.Provider value={value}>{children}</StarredContext.Provider>;
}

export function useStarred(): StarredContextValue {
  const ctx = useContext(StarredContext);
  if (!ctx) throw new Error('useStarred phải được dùng bên trong <StarredProvider>');
  return ctx;
}
