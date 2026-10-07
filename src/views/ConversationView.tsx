import { useState, useMemo } from 'react';
import { MessageCircle, Volume2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  CONVERSATION_SENTENCES,
  CONVERSATION_CATEGORIES,
} from '@/data/conversationData';
import type { ConversationCategory } from '@/data/conversationData';
import { speakChinese, isSpeechSupported } from '@/lib/speech';

type HskLevel = 'all' | 1 | 2 | 3;

const CATEGORY_LABELS = Object.fromEntries(
  CONVERSATION_CATEGORIES.map((c) => [c.key, c.label])
) as Record<ConversationCategory, string>;

const CATEGORY_COLORS: Record<ConversationCategory, string> = {
  greeting: 'bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400',
  intro: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  polite: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
  help: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-400',
  shopping: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  food: 'bg-accent-100 text-accent-700 dark:bg-accent-950/40 dark:text-accent-400',
  directions: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  time: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  health: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  daily: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
};

export function ConversationView() {
  const [level, setLevel] = useState<HskLevel>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      level === 'all'
        ? CONVERSATION_SENTENCES
        : CONVERSATION_SENTENCES.filter((s) => s.hsk === level),
    [level]
  );

  // Giữ đúng thứ tự chủ đề đã định nghĩa; bỏ chủ đề không còn câu nào ở mức HSK đang chọn.
  const grouped = useMemo(
    () =>
      CONVERSATION_CATEGORIES.map((c) => ({
        key: c.key,
        sentences: filtered.filter((s) => s.category === c.key),
      })).filter((g) => g.sentences.length > 0),
    [filtered]
  );

  const levelTabs: { key: HskLevel; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 1, label: 'HSK 1' },
    { key: 2, label: 'HSK 2' },
    { key: 3, label: 'HSK 3' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          <MessageCircle className="h-6 w-6 text-primary-600" />
          Giao tiếp thường dùng
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {CONVERSATION_SENTENCES.length} câu giao tiếp cơ bản theo {CONVERSATION_CATEGORIES.length} chủ đề (chào hỏi, mua sắm, ăn uống, hỏi đường, sức khoẻ...), lọc theo cấp độ HSK.
        </p>
      </div>

      {/* HSK level filter */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900 w-fit">
        {levelTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setLevel(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              level === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category groups */}
      <div className="space-y-3">
        {grouped.map(({ key: cat, sentences }) => {
          const isOpen = expandedCategory === cat || level !== 'all';
          const catKey = cat;
          return (
            <div key={cat} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={() => setExpandedCategory(isOpen && level === 'all' ? null : cat)}
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${CATEGORY_COLORS[catKey]}`}>
                    {CATEGORY_LABELS[catKey]}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{sentences.length} câu</span>
                </div>
                {level === 'all' && (
                  isOpen ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {isOpen && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sentences.map((s) => (
                    <div key={s.id} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-hanzi text-xl font-bold text-gray-900 dark:text-gray-100">{s.chinese}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            HSK {s.hsk}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">{s.pinyin}</p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{s.vietnamese}</p>
                      </div>
                      {isSpeechSupported() && (
                        <button
                          onClick={() => speakChinese(s.chinese)}
                          className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-primary-400"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
