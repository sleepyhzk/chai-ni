import { useState, useRef, useEffect } from 'react';
import { Search, Flame, CheckCircle2, Clock } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { AuthModal } from '@/components/AuthModal';
import type { ViewKey } from '@/components/Sidebar';
import { HomeView } from '@/views/HomeView';
import { FlashcardView } from '@/views/FlashcardView';
import { WritingView } from '@/views/WritingView';
import { DictionaryView } from '@/views/DictionaryView';
import { LessonsView } from '@/views/LessonsView';
import { TypingView } from '@/views/TypingView';
import { ConversationView } from '@/views/ConversationView';
import { useTheme } from '@/hooks/useTheme';
import { useSrsProgress } from '@/hooks/useSrsProgress';
import { useActivity, DAILY_GOAL } from '@/lib/activity';
import { isDue } from '@/lib/srs';

export default function App() {
  const { theme, toggle } = useTheme();
  const { progressMap } = useSrsProgress();
  const { today, streak } = useActivity();
  const [view, setView] = useState<ViewKey>('home');
  const [search, setSearch] = useState({ q: '', n: 0 });
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const dueCount = Object.values(progressMap).filter((s) => isDue(s.nextReview)).length;

  // Ctrl/⌘ + K: nhảy tới ô tìm kiếm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearch((s) => ({ q: query.trim(), n: s.n + 1 }));
    setView('dictionary');
    setQuery('');
    searchRef.current?.blur();
  };

  const chip = 'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold';

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-300 opacity-25 blur-[120px] dark:bg-rose-600" />
        <div className="absolute -right-32 top-1/3 h-[32rem] w-[32rem] rounded-full bg-indigo-300 opacity-20 blur-[140px] dark:bg-indigo-600" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-300 opacity-20 blur-[130px] dark:bg-teal-600" />
      </div>

      <Sidebar current={view} onNavigate={setView} theme={theme} onToggleTheme={toggle} />

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between gap-4 border-b border-gray-200 bg-gray-50/80 px-8 backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/80 lg:flex">
          <form onSubmit={submitSearch} className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tra chữ Hán, pinyin, tiếng Việt (vd: 学习, xuexi)..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-12 text-xs text-gray-800 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-200 dark:focus:bg-gray-900"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-700">Ctrl K</kbd>
          </form>
          <div className="flex items-center gap-3">
            <div className={`${chip} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400`} title="Số ngày học liên tiếp">
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
              {streak} ngày liên tục
            </div>
            <div className={`${chip} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400`} title="Số thẻ đã ôn hôm nay">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {Math.min(today, 999)}/{DAILY_GOAL} thẻ hôm nay
            </div>
            <button
              onClick={() => setView('flashcards')}
              className={`${chip} border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400`}
              title="Thẻ đến hạn ôn"
            >
              <Clock className="h-4 w-4" />
              {dueCount} thẻ đến hạn
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {view === 'home' && <HomeView onNavigate={setView} />}
          {view === 'flashcards' && <FlashcardView />}
          {view === 'lessons' && <LessonsView />}
          {view === 'conversation' && <ConversationView />}
          {view === 'typing' && <TypingView />}
          {view === 'writing' && <WritingView />}
          {view === 'dictionary' && <DictionaryView key={search.n} initialQuery={search.q} />}
        </main>
      </div>
      <AuthModal />
    </div>
  );
}
