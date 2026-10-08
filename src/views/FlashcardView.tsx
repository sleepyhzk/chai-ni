import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, Eye, EyeOff, RotateCcw, Check, Layers, Inbox, Star } from 'lucide-react';
import { INITIAL_VOCAB, VOCAB_BY_LEVEL } from '@/data/vocabData';
import { topicOf } from '@/data/vocabTopics';
import { TopicSelect, countByTopic } from '@/components/TopicSelect';
import type { TopicFilter } from '@/components/TopicSelect';
import { speakChinese, isSpeechSupported } from '@/lib/speech';
import { useSrsProgress } from '@/hooks/useSrsProgress';
import { useStarred } from '@/hooks/useStarred';
import { vocabKey, speechText } from '@/lib/vocabKey';
import { isDue } from '@/lib/srs';
import type { VocabItem, ReviewQuality, FlashcardFilter, SrsState } from '@/lib/types';

type ProgressMap = Record<string, SrsState>;
type SessionStats = { reviewed: number; known: number; unknown: number };
const EMPTY_STATS: SessionStats = { reviewed: 0, known: 0, unknown: 0 };

/**
 * Thứ tự ôn: thẻ đến hạn (cũ nhất trước) -> thẻ mới chưa học -> thẻ chưa đến hạn.
 */
function sortByDue(list: VocabItem[], progressMap: ProgressMap): VocabItem[] {
  const rank = (w: VocabItem) => {
    const s = progressMap[vocabKey(w)];
    if (!s) return 1;
    return isDue(s.nextReview) ? 0 : 2;
  };
  return [...list].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 1) return 0;
    return progressMap[vocabKey(a)].nextReview.localeCompare(progressMap[vocabKey(b)].nextReview);
  });
}

function listFor(filter: FlashcardFilter, progressMap: ProgressMap, starred: Set<string>): VocabItem[] {
  let list: VocabItem[];
  if (filter === 'all') list = INITIAL_VOCAB;
  else if (filter === 'hard') list = INITIAL_VOCAB.filter((w) => progressMap[vocabKey(w)]?.lastQuality === 'hard');
  else if (filter === 'good') {
    list = INITIAL_VOCAB.filter((w) => {
      const s = progressMap[vocabKey(w)];
      return s && (s.lastQuality === 'good' || s.lastQuality === 'easy');
    });
  } else if (filter === 'starred') list = INITIAL_VOCAB.filter((w) => starred.has(vocabKey(w)));
  else list = VOCAB_BY_LEVEL[filter] ?? [];
  return list;
}

function buildDeck(filter: FlashcardFilter, topic: TopicFilter, progressMap: ProgressMap, starred: Set<string>): VocabItem[] {
  let list = listFor(filter, progressMap, starred);
  if (topic !== 'all') list = list.filter((w) => topicOf(w) === topic);
  return sortByDue(list, progressMap);
}

export function FlashcardView() {
  const { progressMap, upsert } = useSrsProgress();
  const { starred, toggle: toggleStar } = useStarred();
  const [filter, setFilter] = useState<FlashcardFilter>('all');
  const [topic, setTopic] = useState<TopicFilter>('all');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(false);
  const [index, setIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>(EMPTY_STATS);
  const [finished, setFinished] = useState(false);

  // Bộ thẻ được "chụp" lúc bắt đầu phiên (đổi bộ lọc / học lại). Nếu tính lại sau
  // mỗi lần chấm điểm, thứ tự đổi giữa chừng và thẻ kế tiếp sẽ bị nhảy cóc.
  const progressRef = useRef(progressMap);
  progressRef.current = progressMap;
  const starredRef = useRef(starred);
  starredRef.current = starred;

  const [cards, setCards] = useState<VocabItem[]>(() => buildDeck('all', 'all', progressMap, starred));

  const startSession = useCallback((f: FlashcardFilter, t: TopicFilter) => {
    setCards(buildDeck(f, t, progressRef.current, starredRef.current));
    setIndex(0);
    setShowMeaning(false);
    setFinished(false);
    setSessionStats(EMPTY_STATS); // phiên mới thì thống kê tính lại từ đầu
  }, []);

  useEffect(() => {
    startSession(filter, topic);
  }, [filter, topic, startSession]);

  const currentCard: VocabItem | undefined = cards[index];

  // Chỉ còn 2 mức: "Chưa thuộc" -> hard (quên, ôn lại ngày mai), "Thuộc rồi" -> good
  const handleReview = (quality: Extract<ReviewQuality, 'hard' | 'good'>) => {
    if (!currentCard || finished) return;
    upsert(vocabKey(currentCard), quality);
    setSessionStats((prev) => ({
      reviewed: prev.reviewed + 1,
      known: prev.known + (quality === 'good' ? 1 : 0),
      unknown: prev.unknown + (quality === 'hard' ? 1 : 0),
    }));
    if (index + 1 >= cards.length) setFinished(true);
    else { setIndex((i) => i + 1); setShowMeaning(false); }
  };

  // Lật thẻ: khi hiện nghĩa thì tự phát âm
  const toggleMeaning = () => {
    if (!currentCard || finished) return;
    const next = !showMeaning;
    setShowMeaning(next);
    if (next) speakChinese(speechText(currentCard));
  };

  const toggleCurrentStar = () => {
    if (currentCard && !finished) toggleStar(vocabKey(currentCard));
  };

  // Phím tắt: Space lật thẻ, ← chưa thuộc, → thuộc rồi, ↓ đánh dấu sao.
  // Dùng ref để một listener duy nhất luôn gọi bản xử lý mới nhất.
  const actionsRef = useRef({ flip: toggleMeaning, known: () => {}, unknown: () => {}, star: toggleCurrentStar });
  actionsRef.current = {
    flip: toggleMeaning,
    known: () => handleReview('good'),
    unknown: () => handleReview('hard'),
    star: toggleCurrentStar,
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return; // đang mở hộp thoại (vd. Giọng đọc)
      const a = actionsRef.current;
      switch (e.key) {
        case ' ':
          e.preventDefault(); // không cuộn trang / không kích hoạt nút đang focus
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          if (!e.repeat) a.flip();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!e.repeat) a.unknown();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!e.repeat) a.known();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!e.repeat) a.star();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const reset = () => startSession(filter, topic);

  const isStarredCard = currentCard ? starred.has(vocabKey(currentCard)) : false;

  const dueCount = INITIAL_VOCAB.filter((w) => {
    const s = progressMap[vocabKey(w)];
    return s && isDue(s.nextReview);
  }).length;
  const hardCount = INITIAL_VOCAB.filter((w) => progressMap[vocabKey(w)]?.lastQuality === 'hard').length;
  const goodCount = INITIAL_VOCAB.filter((w) => {
    const s = progressMap[vocabKey(w)];
    return s && (s.lastQuality === 'good' || s.lastQuality === 'easy');
  }).length;

  // Số từ của từng chủ đề trong bộ lọc đang chọn (HSK 1/2/3, Đã đánh dấu...)
  const baseList = listFor(filter, progressMap, starred);
  const topicCounts = useMemo(() => countByTopic(baseList, topicOf), [baseList]);

  const filterTabs: { key: FlashcardFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: INITIAL_VOCAB.length },
    { key: 1, label: 'HSK 1', count: VOCAB_BY_LEVEL[1]?.length ?? 0 },
    { key: 2, label: 'HSK 2', count: VOCAB_BY_LEVEL[2]?.length ?? 0 },
    { key: 3, label: 'HSK 3', count: VOCAB_BY_LEVEL[3]?.length ?? 0 },
    { key: 'extra', label: 'Bổ sung', count: VOCAB_BY_LEVEL.extra?.length ?? 0 },
    { key: 'starred', label: 'Đã đánh dấu', count: starred.size },
    { key: 'hard', label: 'Cần ôn', count: hardCount },
    { key: 'good', label: 'Đã thuộc', count: goodCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Flashcard & SRS</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Học từ vựng với thuật toán lặp lại ngắt quãng. Thẻ đến hạn được xếp lên đầu, tiếp theo là thẻ mới.
        </p>
        <p className="mt-1 text-sm font-medium text-primary-600 dark:text-primary-400">
          Đến hạn ôn hôm nay: {dueCount} từ
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
            <span className={`rounded px-1.5 py-0.5 text-xs ${filter === tab.key ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <TopicSelect value={topic} onChange={setTopic} counts={topicCounts} total={baseList.length} />

      {finished ? (
        <SessionComplete stats={sessionStats} onReset={reset} />
      ) : cards.length === 0 || !currentCard ? (
        <EmptyState onShowAll={() => { setFilter('all'); setTopic('all'); }} />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div className="h-full rounded-full bg-primary-600 transition-all duration-300" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1} / {cards.length}</span>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-lg">
              <div
                className="cursor-pointer select-none rounded-3xl border border-gray-200 bg-white p-10 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                onClick={toggleMeaning}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCurrentStar(); }}
                  className={`absolute left-5 top-5 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${isStarredCard ? 'text-accent-500' : 'text-gray-400 hover:text-gray-600'}`}
                  title={isStarredCard ? 'Bỏ đánh dấu sao (↓)' : 'Đánh dấu sao (↓)'}
                  aria-pressed={isStarredCard}
                >
                  <Star className={`h-5 w-5 ${isStarredCard ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPinyin(!showPinyin); }}
                  className="absolute right-5 top-5 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                  title={showPinyin ? 'Ẩn pinyin' : 'Hiện pinyin'}
                >
                  {showPinyin ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>

                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <div className="font-hanzi text-7xl font-bold text-gray-900 dark:text-gray-100 sm:text-8xl">{currentCard.hanzi}</div>
                  {showPinyin && <div className="text-xl text-primary-600 dark:text-primary-400">{currentCard.pinyin}</div>}
                  {showMeaning ? (
                    <div className="mt-2 rounded-xl bg-gray-50 px-6 py-3 text-lg font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">{currentCard.meaning}</div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-400">Chạm vào thẻ hoặc nhấn Space để xem nghĩa</div>
                  )}
                </div>

                {isSpeechSupported() && (
                  <button
                    onClick={(e) => { e.stopPropagation(); speakChinese(speechText(currentCard)); }}
                    className="absolute bottom-5 right-5 flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-950/50 dark:text-primary-300 dark:hover:bg-primary-900/50"
                  >
                    <Volume2 className="h-4 w-4" />
                    Phát âm
                  </button>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">Phím tắt: Space lật thẻ · ← chưa thuộc · → thuộc rồi · ↓ đánh dấu sao</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ReviewButton label="Chưa thuộc" sublabel="Ôn lại vào ngày mai" hint="←" onClick={() => handleReview('hard')} color="border-error-200 bg-error-50 text-error-700 hover:bg-error-100 dark:border-error-900 dark:bg-error-950/30 dark:text-error-400 dark:hover:bg-error-950/50" />
            <ReviewButton label="Thuộc rồi" sublabel="Ôn lại sau vài ngày" hint="→" onClick={() => handleReview('good')} color="border-success-200 bg-success-50 text-success-700 hover:bg-success-100 dark:border-success-900 dark:bg-success-950/30 dark:text-success-400 dark:hover:bg-success-950/50" />
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span>Đã ôn: <strong className="text-gray-700 dark:text-gray-300">{sessionStats.reviewed}</strong></span>
            <span className="text-error-500">Chưa thuộc: {sessionStats.unknown}</span>
            <span className="text-success-500">Thuộc rồi: {sessionStats.known}</span>
          </div>
        </>
      )}
    </div>
  );
}

function ReviewButton({ label, sublabel, hint, onClick, color }: { label: string; sublabel: string; hint: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border px-4 py-4 text-center transition-all active:scale-95 ${color}`}>
      <div className="flex items-center justify-center gap-2 text-base font-bold">
        {label}
        <kbd className="rounded border border-current px-1.5 py-0.5 font-mono text-xs font-normal opacity-60">{hint}</kbd>
      </div>
      <div className="mt-0.5 text-xs opacity-70">{sublabel}</div>
    </button>
  );
}

function SessionComplete({ stats, onReset }: { stats: SessionStats; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-950/40">
        <Check className="h-8 w-8 text-success-600 dark:text-success-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Hoàn thành phiên học!</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Bạn đã ôn {stats.reviewed} thẻ — Thuộc rồi: {stats.known}, Chưa thuộc: {stats.unknown}</p>
      <button onClick={onReset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
        <RotateCcw className="h-4 w-4" />
        Học lại
      </button>
    </div>
  );
}

function EmptyState({ onShowAll }: { onShowAll: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Inbox className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chưa có thẻ</h3>
      <p className="mt-2 max-w-xs text-center text-sm text-gray-500 dark:text-gray-400">Chưa có từ nào trong mục này. Học thêm để xem từ cần ôn lại.</p>
      <button onClick={onShowAll} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
        <Layers className="h-4 w-4" />
        Xem tất cả
      </button>
    </div>
  );
}
