import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Keyboard, Check, X, ArrowRight, RotateCcw, Volume2, Trophy } from 'lucide-react';
import { INITIAL_VOCAB } from '@/data/vocabData';
import { topicOf } from '@/data/vocabTopics';
import { TopicSelect, countByTopic } from '@/components/TopicSelect';
import type { TopicFilter } from '@/components/TopicSelect';
import { speakChinese, isSpeechSupported } from '@/lib/speech';
import { vocabKey, speechText } from '@/lib/vocabKey';
import { isPinyinAnswerCorrect } from '@/lib/typing';
import { useStarred } from '@/hooks/useStarred';
import { shuffle as shuffleArray } from '@/lib/shuffle';
import type { VocabItem, Hsk } from '@/lib/types';

type HskFilter = 'all' | Hsk | 'starred';
type AnswerState = 'idle' | 'correct' | 'wrong';


export function TypingView() {
  const [hskFilter, setHskFilter] = useState<HskFilter>('all');
  const [topic, setTopic] = useState<TopicFilter>('all');
  const [input, setInput] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [queue, setQueue] = useState<VocabItem[]>(() => shuffleArray(INITIAL_VOCAB));
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);
  const { starred } = useStarred();

  const matchesLevel = useCallback(
    (w: VocabItem) => {
      if (hskFilter === 'all') return true;
      if (hskFilter === 'starred') return starred.has(vocabKey(w));
      return w.hsk === hskFilter;
    },
    [hskFilter, starred]
  );

  const pool = useMemo(
    () => queue.filter((w) => matchesLevel(w) && (topic === 'all' || topicOf(w) === topic)),
    [queue, matchesLevel, topic]
  );

  // Số từ của từng chủ đề trong bộ lọc cấp độ đang chọn
  const levelWords = useMemo(() => INITIAL_VOCAB.filter(matchesLevel), [matchesLevel]);
  const topicCounts = useMemo(() => countByTopic(levelWords, topicOf), [levelWords]);

  const current = pool.length > 0 ? pool[index % pool.length] : undefined;

  const next = useCallback(() => {
    window.clearTimeout(timerRef.current); // tránh nhảy cóc 2 từ khi bấm tay trước lúc tự chuyển
    setInput('');
    setAnswerState('idle');
    setShowAnswer(false);
    setIndex((i) => i + 1);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const check = useCallback(() => {
    if (!input.trim() || answerState !== 'idle' || !current) return;
    const isCorrect = isPinyinAnswerCorrect(input, current);
    setAnswerState(isCorrect ? 'correct' : 'wrong');
    setShowAnswer(true);
    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
      timerRef.current = window.setTimeout(next, 1200);
    } else {
      setStreak(0);
    }
    setCompleted((c) => c + 1);
  }, [input, answerState, current, next]);

  const skip = useCallback(() => {
    setStreak(0);
    next();
  }, [next]);

  const restart = useCallback(() => {
    setInput('');
    setAnswerState('idle');
    setShowAnswer(false);
    setIndex(0);
    setScore(0);
    setStreak(0);
    setCompleted(0);
    setQueue(shuffleArray(INITIAL_VOCAB));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const switchLevel = useCallback(
    (level: HskFilter) => {
      setHskFilter(level);
      restart();
    },
    [restart]
  );

  const switchTopic = useCallback(
    (t: TopicFilter) => {
      setTopic(t);
      restart();
    },
    [restart]
  );

  const retry = useCallback(() => {
    setInput('');
    setAnswerState('idle');
    setShowAnswer(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (answerState === 'idle') check();
      else next();
    }
  };

  const filterBar = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900 w-fit">
        {([
          { key: 'all' as const, label: 'Tất cả' },
          { key: 1 as const, label: 'HSK 1' },
          { key: 2 as const, label: 'HSK 2' },
          { key: 3 as const, label: 'HSK 3' },
          { key: 'extra' as const, label: 'Bổ sung' },
          { key: 'starred' as const, label: 'Đã đánh dấu' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchLevel(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              hskFilter === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <TopicSelect value={topic} onChange={switchTopic} counts={topicCounts} total={levelWords.length} />
    </div>
  );

  if (!current) {
    return (
      <div className="space-y-6">
        {filterBar}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <Keyboard className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500 dark:text-gray-400">Không có từ nào trong bộ lọc này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          <Keyboard className="h-6 w-6 text-primary-600" />
          Luyện gõ Pinyin
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gõ pinyin đúng cho từ hiển thị. Có thể gõ có dấu thanh điệu hoặc không dấu, vd: "ni hao" hoặc "nǐ hǎo".
        </p>
      </div>

      {filterBar}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-400">Điểm</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{score}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-400">Chuỗi đúng</p>
          <p className="flex items-center justify-center gap-1 text-2xl font-bold text-accent-600 dark:text-accent-400">
            {streak} {streak >= 3 && <Trophy className="h-5 w-5" />}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-400">Kỷ lục</p>
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">{bestStreak}</p>
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-6">
          <div className="font-hanzi text-7xl font-bold text-gray-900 dark:text-gray-100 sm:text-8xl">
            {current.hanzi}
          </div>
          <p className="text-lg text-gray-500 dark:text-gray-400">{current.meaning}</p>

          {isSpeechSupported() && (
            <button
              onClick={() => speakChinese(speechText(current))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
            >
              <Volume2 className="h-4 w-4" />
              Phát âm
            </button>
          )}

          <div className="w-full max-w-md">
            <div className={`relative rounded-xl border-2 transition-colors ${
              answerState === 'correct'
                ? 'border-success-400 bg-success-50 dark:border-success-600 dark:bg-success-950/30'
                : answerState === 'wrong'
                ? 'border-error-400 bg-error-50 dark:border-error-600 dark:bg-error-950/30'
                : 'border-gray-200 bg-gray-50 focus-within:border-primary-400 dark:border-gray-700 dark:bg-gray-800'
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                readOnly={answerState !== 'idle'}
                placeholder="Gõ pinyin tại đây..."
                autoFocus
                className="w-full rounded-xl bg-transparent px-5 py-4 text-lg text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
              />
              {answerState === 'correct' && <Check className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-success-600" />}
              {answerState === 'wrong' && <X className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-error-600" />}
            </div>

            {showAnswer && answerState === 'wrong' && (
              <div className="mt-3 rounded-xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Đáp án đúng:</p>
                <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">{current.pinyin}</p>
              </div>
            )}

            {answerState === 'idle' ? (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={check}
                  disabled={!input.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Kiểm tra
                </button>
                <button
                  onClick={skip}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Bỏ qua
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={next}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900"
                >
                  {answerState === 'correct' ? 'Từ tiếp theo' : 'Từ tiếp theo'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                {answerState === 'wrong' && (
                  <button
                    onClick={retry}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Gõ lại
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Đã làm: {completed} — Nhấn Enter để kiểm tra/tiếp tục
          </p>
        </div>
      </div>
    </div>
  );
}
