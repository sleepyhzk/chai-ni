import { useState, useMemo } from 'react';
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
import { INITIAL_VOCAB } from '@/data/vocabData';

export default function App() {
  const { theme, toggle } = useTheme();
  const { progressMap } = useSrsProgress();
  const [view, setView] = useState<ViewKey>('home');

  const learnedCount = useMemo(() => Object.keys(progressMap).length, [progressMap]);
  const hardCount = useMemo(
    () => Object.values(progressMap).filter((s) => s.lastQuality === 'hard').length,
    [progressMap]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar current={view} onNavigate={setView} theme={theme} onToggleTheme={toggle} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {view === 'home' && (
            <HomeView onNavigate={setView} totalWords={INITIAL_VOCAB.length} learnedCount={learnedCount} hardCount={hardCount} />
          )}
          {view === 'flashcards' && <FlashcardView />}
          {view === 'lessons' && <LessonsView />}
          {view === 'conversation' && <ConversationView />}
          {view === 'typing' && <TypingView />}
          {view === 'writing' && <WritingView />}
          {view === 'dictionary' && <DictionaryView />}
        </div>
      </main>
      <AuthModal />
    </div>
  );
}
