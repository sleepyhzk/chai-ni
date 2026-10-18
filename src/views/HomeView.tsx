import { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Keyboard, Volume2, BookOpen, CheckCircle2, Clock, Flame, Target, Check, MessageCircle, RotateCw, PenTool } from 'lucide-react';
import { INITIAL_VOCAB, VOCAB_BY_LEVEL } from '@/data/vocabData';
import { CONVERSATION_SENTENCES } from '@/data/conversationData';
import { sortByDue } from '@/views/FlashcardView';
import { useSrsProgress } from '@/hooks/useSrsProgress';
import { useAuth } from '@/hooks/useAuth';
import { useActivity, DAILY_GOAL } from '@/lib/activity';
import { vocabKey, speechText } from '@/lib/vocabKey';
import { isDue } from '@/lib/srs';
import { isPinyinAnswerCorrect } from '@/lib/typing';
import { speakChinese, isSpeechSupported } from '@/lib/speech';
import { shuffle } from '@/lib/shuffle';
import type { ViewKey } from '@/components/Sidebar';
import type { Hsk } from '@/lib/types';

const card = 'rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none';
const muted = 'text-gray-500 dark:text-gray-400';
const VALID_KEYS = new Set(INITIAL_VOCAB.map(vocabKey));

const LEVELS: { hsk: Hsk; label: string; bar: string }[] = [
  { hsk: 1, label: 'HSK 1', bar: 'from-emerald-500 to-teal-600' },
  { hsk: 2, label: 'HSK 2', bar: 'from-amber-500 to-orange-600' },
  { hsk: 3, label: 'HSK 3', bar: 'from-rose-500 to-red-600' },
  { hsk: 'extra', label: 'Bổ sung', bar: 'from-indigo-500 to-violet-600' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
}

export function HomeView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const { progressMap, upsert } = useSrsProgress();
  const { user } = useAuth();
  const { streak, today } = useActivity();
  const name = user?.email?.split('@')[0] ?? 'bạn';

  const learned = Object.keys(progressMap).filter((k) => VALID_KEYS.has(k)).length;
  const due = Object.values(progressMap).filter((s) => isDue(s.nextReview)).length;
  const hard = Object.values(progressMap).filter((s) => s.lastQuality === 'hard').length;

  const stats = [
    { title: 'Tổng từ vựng', value: INITIAL_VOCAB.length, sub: 'HSK 1-3 và từ bổ sung', icon: BookOpen, tone: 'text-blue-400 from-blue-500/20 to-indigo-500/20' },
    { title: 'Đã học', value: learned, sub: hard ? `${hard} từ đang cần ôn lại` : 'Từ đã có tiến độ', icon: CheckCircle2, tone: 'text-emerald-400 from-emerald-500/20 to-teal-500/20' },
    { title: 'Đến hạn ôn', value: due, sub: 'Theo lịch lặp lại ngắt quãng', icon: Clock, tone: 'text-amber-400 from-amber-500/20 to-orange-500/20' },
    { title: 'Chuỗi ngày học', value: streak, sub: `Hôm nay: ${today}/${DAILY_GOAL} thẻ`, icon: Flame, tone: 'text-rose-400 from-rose-500/20 to-pink-500/20' },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-8 text-white shadow-2xl shadow-rose-600/20">
        <span aria-hidden="true" className="pointer-events-none absolute -right-4 -top-10 select-none font-hanzi text-[16rem] font-black leading-none opacity-10">道</span>
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            Học mỗi ngày 15 phút
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting()}, {name}!</h1>
          <div className="max-w-xl rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-medium text-rose-200">
              Câu của ngày
              {isSpeechSupported() && (
                <button onClick={() => speakChinese('千里之行，始于足下')} className="hover:text-white" aria-label="Nghe câu">
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-1 font-hanzi text-xl font-bold tracking-wide">千里之行，始于足下</p>
            <p className="mt-0.5 text-xs text-white/80">Qiān lǐ zhī xíng, shǐ yú zú xià</p>
            <p className="mt-1 text-xs text-amber-200">Hành trình vạn dặm bắt đầu từ một bước chân.</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button onClick={() => onNavigate('flashcards')} className="group flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 shadow-lg shadow-black/10 transition-colors hover:bg-rose-50">
              Ôn flashcard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => onNavigate('typing')} className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-4 py-2.5 text-sm font-medium backdrop-blur-md hover:bg-black/35">
              <Keyboard className="h-4 w-4 text-amber-300" />
              Luyện gõ pinyin
            </button>
            <button onClick={() => onNavigate('writing')} className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-4 py-2.5 text-sm font-medium backdrop-blur-md hover:bg-black/35">
              <PenTool className="h-4 w-4 text-amber-300" />
              Luyện viết
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.title} className={`${card} !p-5`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${muted}`}>{s.title}</span>
              <div className={`rounded-xl bg-gradient-to-br p-2 ${s.tone}`}><s.icon className="h-4 w-4" /></div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight tabular-nums">{s.value}</p>
            <p className={`mt-1 text-xs ${muted}`}>{s.sub}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <QuickCard progressMap={progressMap} upsert={upsert} onOpen={() => onNavigate('flashcards')} />
        <QuickPinyin onOpen={() => onNavigate('typing')} />

        <div className={`${card} lg:col-span-5`}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"><Target className="h-4 w-4" /></div>
            <div>
              <h2 className="text-base font-bold">Tiến độ theo cấp độ</h2>
              <p className={`text-xs ${muted}`}>Số từ đã học trên tổng từng cấp</p>
            </div>
          </div>
          <div className="space-y-3">
            {LEVELS.map(({ hsk, label, bar }) => {
              const words = VOCAB_BY_LEVEL[hsk] ?? [];
              const n = words.filter((w) => progressMap[vocabKey(w)]).length;
              const pct = words.length ? Math.round((n / words.length) * 100) : 0;
              return (
                <div key={label} className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2">
                      <span className={`rounded-md bg-gradient-to-r px-2 py-0.5 text-[11px] font-black text-white ${bar}`}>{label}</span>
                      <span className="text-gray-600 dark:text-gray-300">{n} / {words.length} từ</span>
                    </span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PhraseCards onOpen={() => onNavigate('conversation')} />
      </div>
    </div>
  );
}

function QuickCard({ progressMap, upsert, onOpen }: { progressMap: ReturnType<typeof useSrsProgress>['progressMap']; upsert: ReturnType<typeof useSrsProgress>['upsert']; onOpen: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const w = useMemo(() => sortByDue(INITIAL_VOCAB, progressMap)[0], [progressMap]);
  const rate = (q: 'hard' | 'good') => { upsert(vocabKey(w), q); setFlipped(false); };
  return (
    <div className={`${card} flex flex-col lg:col-span-7`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500"><BookOpen className="h-4 w-4" /></div>
          <div>
            <h2 className="text-base font-bold">Ôn nhanh một thẻ</h2>
            <p className={`text-xs ${muted}`}>Chạm vào thẻ để xem pinyin và nghĩa</p>
          </div>
        </div>
        <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500">{w.level}</span>
      </div>
      <button
        onClick={() => { const n = !flipped; setFlipped(n); if (n) speakChinese(speechText(w)); }}
        className="flex h-56 w-full select-none flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50 p-6 text-center transition-colors hover:border-rose-400 dark:border-gray-700/80 dark:from-gray-800/60 dark:to-gray-800/30 dark:hover:border-rose-500/50"
      >
        <span className="font-hanzi text-6xl font-black">{w.hanzi}</span>
        {flipped ? (
          <>
            <span className="mt-3 text-2xl font-bold text-rose-500">{w.pinyin}</span>
            <span className="mt-1 text-lg font-semibold">{w.meaning}</span>
          </>
        ) : (
          <span className={`mt-3 flex items-center gap-1.5 text-xs ${muted}`}><RotateCw className="h-3.5 w-3.5" /> Bấm để lật thẻ</span>
        )}
      </button>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button onClick={onOpen} className={`text-xs font-semibold text-rose-500 hover:text-rose-400`}>Mở đầy đủ trong Flashcard</button>
        <div className="flex gap-2">
          <button onClick={() => rate('hard')} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-500 hover:text-white">Chưa thuộc</button>
          <button onClick={() => rate('good')} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-white">Thuộc rồi</button>
        </div>
      </div>
    </div>
  );
}

function QuickPinyin({ onOpen }: { onOpen: () => void }) {
  const pick = () => INITIAL_VOCAB[Math.floor(Math.random() * INITIAL_VOCAB.length)];
  const [w, setW] = useState(pick);
  const [input, setInput] = useState('');
  const [state, setState] = useState<'idle' | 'ok' | 'bad'>('idle');
  const [score, setScore] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isPinyinAnswerCorrect(input, w)) {
      setState('ok'); setScore((s) => s + 1);
      timer.current = window.setTimeout(() => { setW(pick()); setInput(''); setState('idle'); }, 900);
    } else setState('bad');
  };
  const skip = () => { window.clearTimeout(timer.current); setW(pick()); setInput(''); setState('idle'); };

  return (
    <div className={`${card} flex flex-col justify-between lg:col-span-5`}>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"><Keyboard className="h-4 w-4" /></div>
            <div>
              <h2 className="text-base font-bold">Gõ pinyin nhanh</h2>
              <p className={`text-xs ${muted}`}>Có dấu hay không dấu đều được</p>
            </div>
          </div>
          <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400">{score} đúng</span>
        </div>
        <div className="my-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700/60 dark:bg-gray-800/40">
          <p className="font-hanzi text-4xl font-black">{w.hanzi}</p>
          <p className={`mt-1 text-xs font-medium ${muted}`}>{w.meaning}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={input}
            readOnly={state === 'ok'}
            onChange={(e) => { setInput(e.target.value); if (state === 'bad') setState('idle'); }}
            placeholder="Gõ pinyin..."
            aria-label="Pinyin"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
              state === 'ok' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
              : state === 'bad' ? 'border-rose-500 bg-rose-500/10 text-rose-500'
              : 'border-gray-300 bg-white focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900'}`}
          />
          {state === 'ok' && <p className="flex items-center gap-1 text-xs font-bold text-emerald-500"><Check className="h-4 w-4" /> Chính xác!</p>}
          {state === 'bad' && <p className="text-xs font-bold text-rose-500">Chưa đúng. Đáp án: {w.pinyin}</p>}
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500">Kiểm tra</button>
            <button type="button" onClick={skip} className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">Đổi từ</button>
          </div>
        </form>
      </div>
      <button onClick={onOpen} className="mt-4 self-start text-xs font-semibold text-indigo-400 hover:text-indigo-300">Chơi đầy đủ trong Luyện gõ</button>
    </div>
  );
}

function PhraseCards({ onOpen }: { onOpen: () => void }) {
  const picks = useMemo(() => shuffle(CONVERSATION_SENTENCES.filter((s) => s.hsk === 1)).slice(0, 3), []);
  return (
    <div className={`${card} lg:col-span-7`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400"><MessageCircle className="h-4 w-4" /></div>
          <div>
            <h2 className="text-base font-bold">Mẫu câu giao tiếp</h2>
            <p className={`text-xs ${muted}`}>{CONVERSATION_SENTENCES.length} câu theo chủ đề trong mục Giao tiếp</p>
          </div>
        </div>
        <button onClick={onOpen} className="text-xs font-semibold text-teal-500 hover:text-teal-400">Xem tất cả</button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {picks.map((s) => (
          <div key={s.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="flex items-start justify-between gap-2">
              <p className="font-hanzi text-lg font-black">{s.chinese}</p>
              {isSpeechSupported() && (
                <button onClick={() => speakChinese(s.chinese)} aria-label="Nghe câu" className="rounded-lg bg-teal-500/10 p-1.5 text-teal-500 transition-colors hover:bg-teal-500 hover:text-white">
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-0.5 text-xs text-teal-600 dark:text-teal-400">{s.pinyin}</p>
            <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">{s.vietnamese}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
