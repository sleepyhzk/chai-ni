import { useState, useMemo } from 'react';
import { GraduationCap, Check, X, RotateCcw, ChevronRight, Volume2, Star, BookOpen, ChevronDown, ChevronRight as ChevronR } from 'lucide-react';
import { INITIAL_VOCAB, VOCAB_BY_LEVEL } from '@/data/vocabData';
import { speakChinese, isSpeechSupported } from '@/lib/speech';
import { vocabKey, speechText } from '@/lib/vocabKey';
import { useStarred } from '@/hooks/useStarred';
import { topicOf } from '@/data/vocabTopics';
import { TopicSelect, countByTopic } from '@/components/TopicSelect';
import type { TopicFilter } from '@/components/TopicSelect';
import { normalize } from '@/lib/vocabSearch';
import { shuffle } from '@/lib/shuffle';
import type { VocabItem, Hsk } from '@/lib/types';

type Tab = 'vocab' | 'quiz';
type HskTab = 'all' | Hsk;

export function LessonsView() {
  const [tab, setTab] = useState<Tab>('vocab');
  const [hskTab, setHskTab] = useState<HskTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLevel, setExpandedLevel] = useState<Hsk | null>(1);
  const starredHook = useStarred();

  const baseVocab = hskTab === 'all' ? INITIAL_VOCAB : VOCAB_BY_LEVEL[hskTab] ?? [];

  const filteredVocab = useMemo(() => {
    if (!searchQuery.trim()) return baseVocab;
    const raw = searchQuery.trim();
    const qn = normalize(raw);
    const qc = qn.replace(/ /g, '');
    return baseVocab.filter(
      (w) =>
        w.hanzi.includes(raw) ||
        normalize(w.pinyin).replace(/ /g, '').includes(qc) ||
        normalize(w.meaning).includes(qn)
    );
  }, [baseVocab, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bài học & Bài tập</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Từ vựng phân theo cấp độ HSK và bài tập trắc nghiệm kiểm tra khả năng ghi nhớ.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setTab('vocab')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'vocab' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Danh sách từ
          </button>
          <button
            onClick={() => setTab('quiz')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'quiz' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <Star className="h-4 w-4" />
            Bài tập
          </button>
        </div>

        {tab === 'vocab' && (
          <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
            {([
              { key: 'all' as const, label: 'Tất cả' },
              { key: 1 as const, label: 'HSK 1' },
              { key: 2 as const, label: 'HSK 2' },
              { key: 3 as const, label: 'HSK 3' },
              { key: 'extra' as const, label: 'Bổ sung' },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => { setHskTab(t.key); setExpandedLevel(null); }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  hskTab === t.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'vocab' ? (
        hskTab === 'all' ? (
          <HskAccordionVocab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expandedLevel={expandedLevel}
            setExpandedLevel={setExpandedLevel}
            starredHook={starredHook}
          />
        ) : (
          <>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chữ Hán, pinyin hoặc nghĩa..."
              className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <p className="text-sm text-gray-400">{filteredVocab.length} từ</p>
            <VocabList words={filteredVocab} starredHook={starredHook} />
          </>
        )
      ) : (
        <QuizView />
      )}
    </div>
  );
}

function HskAccordionVocab({
  searchQuery,
  setSearchQuery,
  expandedLevel,
  setExpandedLevel,
  starredHook,
}: {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  expandedLevel: Hsk | null;
  setExpandedLevel: (n: Hsk | null) => void;
  starredHook: ReturnType<typeof useStarred>;
}) {
  const levels: { hsk: Hsk; label: string }[] = [
    { hsk: 1, label: 'HSK 1' },
    { hsk: 2, label: 'HSK 2' },
    { hsk: 3, label: 'HSK 3' },
    { hsk: 'extra', label: 'Bổ sung' },
  ];

  const [topic, setTopic] = useState<TopicFilter>('all');
  const q = normalize(searchQuery);
  const qc = q.replace(/ /g, '');
  const matchesSearch = (w: VocabItem) =>
    !q || w.hanzi.includes(searchQuery.trim()) || normalize(w.pinyin).replace(/ /g, '').includes(qc) || normalize(w.meaning).includes(q);
  const topicCounts = useMemo(() => countByTopic(INITIAL_VOCAB.filter(matchesSearch), topicOf), [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps
  const totalMatching = useMemo(() => INITIAL_VOCAB.filter(matchesSearch).length, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <TopicSelect value={topic} onChange={setTopic} counts={topicCounts} total={totalMatching} />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Tìm theo chữ Hán, pinyin hoặc nghĩa..."
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />

      <div className="space-y-3">
        {levels.map(({ hsk, label }) => {
          const words = (VOCAB_BY_LEVEL[hsk] ?? []).filter(
            (w) => matchesSearch(w) && (topic === 'all' || topicOf(w) === topic)
          );
          const isOpen = expandedLevel === hsk || !!searchQuery.trim() || topic !== 'all';
          return (
            <div key={hsk} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={() => setExpandedLevel(isOpen && !searchQuery.trim() && topic === 'all' ? null : hsk)}
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-3 py-1 text-sm font-bold ${
                    hsk === 1 ? 'bg-success-100 text-success-700 dark:bg-success-950/40 dark:text-success-400' :
                    hsk === 2 ? 'bg-accent-100 text-accent-700 dark:bg-accent-950/40 dark:text-accent-400' :
                    hsk === 3 ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{words.length} từ</span>
                </div>
                {isOpen ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronR className="h-5 w-5 text-gray-400" />}
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                  <VocabList words={words} starredHook={starredHook} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VocabList({ words, starredHook }: { words: VocabItem[]; starredHook: ReturnType<typeof useStarred> }) {
  const { isStarred, toggle } = starredHook;
  if (words.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">Không tìm thấy từ nào.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {words.map((w) => (
        <div
          key={w.id}
          className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 py-3 dark:bg-gray-800/50">
            <span className="font-hanzi text-3xl font-bold text-gray-900 dark:text-gray-100">{w.hanzi}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{w.pinyin}</div>
            <div className="truncate text-sm text-gray-600 dark:text-gray-400">{w.meaning}</div>
          </div>
          <button
            onClick={() => toggle(vocabKey(w))}
            className={`flex-shrink-0 rounded-lg p-2 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isStarred(vocabKey(w)) ? 'text-accent-500' : 'text-gray-300 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100'
            }`}
            title={isStarred(vocabKey(w)) ? 'Bỏ đánh dấu' : 'Đánh dấu cần học'}
          >
            <Star className={`h-5 w-5 ${isStarred(vocabKey(w)) ? 'fill-current' : ''}`} />
          </button>
          {isSpeechSupported() && (
            <button
              onClick={() => speakChinese(speechText(w))}
              className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-opacity hover:bg-gray-100 hover:text-primary-600 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-gray-800 dark:hover:text-primary-400"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

type QuizMode = 'hanzi-to-pinyin' | 'hanzi-to-meaning';
type QuizHsk = 'all' | Hsk;

function QuizView() {
  const [mode, setMode] = useState<QuizMode>('hanzi-to-pinyin');
  const [quizHsk, setQuizHsk] = useState<QuizHsk>('all');
  const wordPool = quizHsk === 'all' ? INITIAL_VOCAB : VOCAB_BY_LEVEL[quizHsk] ?? [];
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateQuestions(wordPool, 'hanzi-to-pinyin'));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === questions[current].correctIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) setFinished(true);
    else { setCurrent((c) => c + 1); setSelected(null); setAnswered(false); }
  };

  const restart = () => {
    setQuestions(generateQuestions(wordPool, mode));
    setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false);
  };

  const switchMode = (m: QuizMode) => {
    setMode(m);
    setQuestions(generateQuestions(wordPool, m));
    setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false);
  };

  const switchHsk = (h: QuizHsk) => {
    setQuizHsk(h);
    const pool = h === 'all' ? INITIAL_VOCAB : VOCAB_BY_LEVEL[h] ?? [];
    setQuestions(generateQuestions(pool, mode));
    setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
        <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${pct >= 70 ? 'bg-success-100 dark:bg-success-950/40' : 'bg-accent-100 dark:bg-accent-950/40'}`}>
          <GraduationCap className={`h-10 w-10 ${pct >= 70 ? 'text-success-600 dark:text-success-400' : 'text-accent-600 dark:text-accent-400'}`} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{score} / {questions.length}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {pct >= 70 ? 'Xuất sắc! Bạn nắm từ vựng rất tốt.' : 'Cần luyện tập thêm — thử lại nhé!'}
        </p>
        <button onClick={restart} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
          <RotateCcw className="h-4 w-4" />
          Làm lại
        </button>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          <button onClick={() => switchMode('hanzi-to-pinyin')} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === 'hanzi-to-pinyin' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>Chọn Pinyin</button>
          <button onClick={() => switchMode('hanzi-to-meaning')} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === 'hanzi-to-meaning' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>Chọn Nghĩa</button>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          {([
            { key: 'all' as const, label: 'Tất cả' },
            { key: 1 as const, label: 'HSK 1' },
            { key: 2 as const, label: 'HSK 2' },
            { key: 3 as const, label: 'HSK 3' },
            { key: 'extra' as const, label: 'Bổ sung' },
          ]).map((t) => (
            <button key={t.key} onClick={() => switchHsk(t.key)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${quizHsk === t.key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div className="h-full rounded-full bg-primary-600 transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Câu {current + 1} / {questions.length}</span>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {mode === 'hanzi-to-pinyin' ? 'Pinyin của chữ này là gì?' : 'Nghĩa của chữ này là gì?'}
          </p>
          <div className="font-hanzi text-7xl font-bold text-gray-900 dark:text-gray-100 sm:text-8xl">{q.word.hanzi}</div>
          {isSpeechSupported() && (
            <button onClick={() => speakChinese(speechText(q.word))} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
              <Volume2 className="h-4 w-4" />
              Phát âm
            </button>
          )}
          <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correctIndex;
              const isSelected = i === selected;
              let className = 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/30';
              if (answered) {
                if (isCorrect) className = 'border-success-400 bg-success-50 text-success-700 dark:border-success-700 dark:bg-success-950/40 dark:text-success-400';
                else if (isSelected) className = 'border-error-400 bg-error-50 text-error-700 dark:border-error-700 dark:bg-error-950/40 dark:text-error-400';
                else className = 'border-gray-200 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-900';
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={answered} className={`flex items-center justify-between rounded-xl border px-5 py-4 text-base font-medium transition-all ${className}`}>
                  <span>{opt}</span>
                  {answered && isCorrect && <Check className="h-5 w-5" />}
                  {answered && isSelected && !isCorrect && <X className="h-5 w-5" />}
                </button>
              );
            })}
          </div>
          {answered && (
            <button onClick={next} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
              {current + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Điểm: <strong className="text-gray-700 dark:text-gray-300">{score}</strong> / {questions.length}
      </div>
    </div>
  );
}

interface QuizQuestion {
  word: VocabItem;
  options: string[];
  correctIndex: number;
}

function generateQuestions(words: VocabItem[], mode: QuizMode): QuizQuestion[] {
  if (words.length < 4) return [];
  const text = (w: VocabItem) => (mode === 'hanzi-to-pinyin' ? w.pinyin : w.meaning);
  const picked = shuffle(words).slice(0, Math.min(10, words.length));
  return picked.map((word) => {
    // Chọn đáp án nhiễu có nội dung khác đáp án đúng và khác nhau, để không bị 2 nút giống hệt.
    const seen = new Set([text(word)]);
    const others: VocabItem[] = [];
    for (const w of shuffle(words)) {
      if (w.hanzi === word.hanzi || seen.has(text(w))) continue;
      seen.add(text(w));
      others.push(w);
      if (others.length === 3) break;
    }
    const allOptions = shuffle([word, ...others]);
    return { word, options: allOptions.map(text), correctIndex: allOptions.findIndex((w) => w === word) };
  });
}
