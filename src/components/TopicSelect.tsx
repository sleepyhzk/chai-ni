import { TOPICS } from '@/data/vocabTopics';
import type { Topic } from '@/data/vocabTopics';

export type TopicFilter = 'all' | Topic;

/** Ô chọn chủ đề từ vựng. counts = số từ của từng chủ đề trong danh sách đang xem; chủ đề hết từ thì ẩn. */
export function TopicSelect({
  value,
  onChange,
  counts,
  total,
}: {
  value: TopicFilter;
  onChange: (t: TopicFilter) => void;
  counts: Partial<Record<Topic, number>>;
  total: number;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="font-medium">Chủ đề:</span>
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value as TopicFilter);
          e.currentTarget.blur(); // trả phím tắt (Space, ←, →) về cho flashcard
        }}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <option value="all">Tất cả chủ đề ({total})</option>
        {TOPICS.filter((t) => (counts[t.key] ?? 0) > 0 || t.key === value).map((t) => (
          <option key={t.key} value={t.key}>
            {t.label} ({counts[t.key] ?? 0})
          </option>
        ))}
      </select>
    </label>
  );
}

export function countByTopic(words: { id: number }[], topicOf: (w: { id: number }) => Topic | undefined) {
  const counts: Partial<Record<Topic, number>> = {};
  for (const w of words) {
    const t = topicOf(w);
    if (t) counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts;
}
