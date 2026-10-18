import { useState, useMemo, useEffect } from 'react';
import { Search, Volume2, Sparkles, X, Languages, BookOpen, Star, BookMarked } from 'lucide-react';
import { tokenizeSentence, findSentenceTranslation } from '@/lib/dictionary';
import { CONVERSATION_SENTENCES, CONVERSATION_CATEGORIES } from '@/data/conversationData';
import { INITIAL_VOCAB } from '@/data/vocabData';
import { speakChinese, isSpeechSupported } from '@/lib/speech';
import { normalizeQuery, searchVocab } from '@/lib/vocabSearch';
import { vocabKey, speechText } from '@/lib/vocabKey';
import { useStarred } from '@/hooks/useStarred';
import type { ConversationCategory } from '@/data/conversationData';
import type { VocabItem } from '@/lib/types';

const CATEGORIES: { key: ConversationCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  ...CONVERSATION_CATEGORIES,
];

const isHanzi = (s: string) => /[\u4e00-\u9fff]/.test(s);

type SearchMode = 'auto' | 'hanzi' | 'latin';

function detectMode(input: string): SearchMode {
  if (isHanzi(input)) return 'hanzi';
  return 'latin';
}

/** Synonym map: Vietnamese keywords → hanzi to expand search */
const SYNONYM_MAP: Record<string, string[]> = {
  'xin chao': ['你好'],
  'chao': ['你好', '再见'],
  'cam on': ['谢谢'],
  'cam on ban': ['谢谢'],
  'hen gap lai': ['再见'],
  'tam biet': ['再见'],
  'xin loi': ['对不起'],
  'khong co gi': ['不客气'],
  'khong co chi': ['不客气'],
  'khong sao': ['没关系'],
  'bai hoc': ['课'],
  'hoc': ['学习', '学'],
  'hoc sinh': ['学生'],
  'sinh vien': ['学生'],
  'giao vien': ['老师'],
  'thay giao': ['老师'],
  'co giao': ['老师'],
  'phim': ['电影'],
  'xem phim': ['电影'],
  'an uong': ['吃', '菜'],
  'thuc an': ['菜'],
  'com': ['米饭'],
  'an com': ['吃', '米饭'],
  'nuoc': ['水'],
  'tra': ['茶'],
  'ca phe': ['咖啡'],
  'tien': ['钱'],
  'mua': ['买', '下雨'],
  'ban hang': ['卖'],
  'cua hang': ['商店'],
  'nha hang': ['饭店'],
  'khach san': ['宾馆', '饭店'],
  'may tinh': ['电脑'],
  'ti vi': ['电视'],
  'dien thoai': ['手机', '打电话'],
  'goi dien': ['打电话'],
  'oto': ['出租车'],
  'taxi': ['出租车'],
  'xe buyt': ['公共汽车'],
  'may bay': ['飞机'],
  'tau hoa': ['火车'],
  'ga tau': ['火车站'],
  'san bay': ['机场'],
  'benh vien': ['医院'],
  'bac si': ['医生'],
  'thuoc': ['药'],
  'sach': ['书'],
  'doc sach': ['读', '书'],
  'viet': ['写'],
  'nghe': ['听'],
  'noi': ['说话'],
  'noi chuyen': ['说话'],
  'xem': ['看'],
  'nhin thay': ['看见'],
  'biet': ['知道', '认识'],
  'quen': ['认识'],
  'hieu': ['懂'],
  'muon': ['想', '要'],
  'thich': ['喜欢'],
  'vui': ['高兴'],
  'cao hung': ['高兴'],
  'buon': ['难过'],
  'met': ['累'],
  'om': ['生病'],
  'ngu': ['睡觉'],
  'day': ['起床'],
  'nghi ngoi': ['休息'],
  'lam viec': ['工作'],
  'cong viec': ['工作'],
  'di lam': ['上班'],
  'choi': ['玩'],
  'hat': ['唱歌'],
  'nhay': ['跳舞'],
  'boi': ['游泳'],
  'da bong': ['踢足球'],
  'bong ro': ['打篮球'],
  'chay bo': ['跑步'],
  'the duc': ['运动'],
  'du lich': ['旅游'],
  'sieu thi': ['商店'],
  'thoi tiet': ['天气'],
  'mua roi': ['下雨'],
  'tuyet': ['雪'],
  'nong': ['热'],
  'lanh': ['冷'],
  'to': ['大'],
  'nho': ['小'],
  'cao': ['高'],
  'nhanh': ['快'],
  'nhieu': ['多'],
  'it': ['少'],
  'tot': ['好'],
  'dep': ['好看'],
  'xau': ['难看'],
  'nam': ['年'],
  'thang': ['月'],
  'ngay': ['日'],
  'hom nay': ['今天'],
  'ngay mai': ['明天'],
  'hom qua': ['昨天'],
  'sang': ['上午', '早上'],
  'chieu': ['下午'],
  'toi': ['晚上'],
  'gio': ['点', '小时'],
  'phut': ['分钟'],
  'tuan': ['星期'],
  'sinh nhat': ['生日'],
  'tuoi': ['岁'],
  'ten': ['名字'],
  'ho': ['姓'],
  'nguoi': ['人'],
  'ban be': ['朋友'],
  'ban minh': ['你们'],
  'dan ong': ['男人'],
  'dan ba': ['女人'],
  'con trai': ['儿子'],
  'con gai': ['女儿'],
  'tre con': ['孩子'],
  'bo': ['爸爸'],
  'me': ['妈妈'],
  'anh trai': ['哥哥'],
  'chi gai': ['姐姐'],
  'em trai': ['弟弟'],
  'em gai': ['妹妹'],
  'chong': ['丈夫'],
  'vo': ['妻子'],
  'nha': ['家'],
  'phong': ['房间'],
  'cua': ['门'],
  'cai ban': ['桌子'],
  'ghe': ['椅子'],
  'coc': ['杯子'],
  'ao': ['衣服'],
  'qua tao': ['苹果'],
  'trai cay': ['水果'],
  'ca': ['鱼'],
  'thit': ['肉'],
  'trung': ['鸡蛋'],
  'sua': ['牛奶'],
  'mat': ['眼睛'],
  'co the': ['身体'],
  'mau': ['颜色'],
  'do': ['红'],
  'trang': ['白'],
  'den': ['黑'],
  'xanh': ['绿'],
  'moi': ['每'],
  'cung': ['一起'],
  'tai sao': ['为什么'],
  'vi sao': ['为什么'],
  'boi vi': ['因为'],
  'vi vay': ['所以'],
  'mac du': ['虽然'],
  'nhung': ['但是'],
  'hoi': ['会'],
  'co kha nang': ['可以', '能'],
  'thu nhat': ['第一'],
};

function expandQuery(qNorm: string): string[] {
  return SYNONYM_MAP[qNorm] ?? [];
}

export function DictionaryView({ initialQuery = '' }: { initialQuery?: string }) {
  const [input, setInput] = useState(initialQuery);
  const [analyzed, setAnalyzed] = useState(!!initialQuery.trim());
  const [category, setCategory] = useState<ConversationCategory | 'all'>('all');
  const [selectedWord, setSelectedWord] = useState<VocabItem | null>(null);
  const starredHook = useStarred();

  const mode = useMemo(() => (input.trim() ? detectMode(input.trim()) : 'auto'), [input]);

  const wordResults = useMemo(() => {
    const q = input.trim();
    if (!q || !analyzed) return [];
    if (mode === 'hanzi') {
      return INITIAL_VOCAB.filter((w) => w.hanzi.includes(q)).sort(
        (a, b) => Number(b.hanzi === q) - Number(a.hanzi === q) || a.hanzi.length - b.hanzi.length
      );
    }
    return searchVocab(q, expandQuery(normalizeQuery(q)));
  }, [input, analyzed, mode]);

  const isSentenceInput = mode === 'hanzi' && analyzed && input.trim().length > 1;

  const segments = useMemo(
    () => (isSentenceInput ? tokenizeSentence(input) : []),
    [input, isSentenceInput]
  );

  const fullTranslation = useMemo(
    () => (isSentenceInput ? findSentenceTranslation(input) : null),
    [input, isSentenceInput]
  );

  const filteredSentences = useMemo(
    () => (category === 'all' ? CONVERSATION_SENTENCES : CONVERSATION_SENTENCES.filter((s) => s.category === category)),
    [category]
  );

  const handleAnalyze = () => { if (input.trim()) setAnalyzed(true); };
  const handleClear = () => { setInput(''); setAnalyzed(false); };
  const handleSample = (s: string) => { setInput(s); setAnalyzed(true); speakChinese(s); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const modeLabels: Record<SearchMode, string> = {
    auto: '',
    hanzi: 'Chữ Hán → Pinyin + Nghĩa',
    latin: 'Pinyin / Tiếng Việt → Chữ Hán + Nghĩa',
  };

  const placeholders: Record<SearchMode, string> = {
    auto: 'Nhập chữ Hán, pinyin hoặc tiếng Việt...',
    hanzi: 'Nhập chữ Hán, vd: 喜欢',
    latin: 'Nhập pinyin hoặc tiếng Việt, vd: xihuan, thích, cảm ơn...',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tra cứu từ điển</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tra chữ Hán ra pinyin + nghĩa, tra pinyin ra chữ Hán + nghĩa, tra tiếng Việt ra chữ Hán. Bấm vào thẻ kết quả để xem chi tiết.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setAnalyzed(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder={placeholders[mode]}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-10 text-lg text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-800"
            />
            {input && (
              <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!input.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Tra cứu
          </button>
        </div>

        {input.trim() && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="rounded-lg bg-primary-50 px-2.5 py-1 font-medium text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
              {modeLabels[mode]}
            </span>
          </div>
        )}
      </div>

      {/* Word lookup results */}
      {analyzed && wordResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Kết quả tra cứu ({wordResults.length} từ)
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wordResults.map((w) => (
              <WordResultCard key={w.id} word={w} onClick={() => setSelectedWord(w)} />
            ))}
          </div>
        </div>
      )}

      {analyzed && wordResults.length === 0 && !isSentenceInput && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">
            Không tìm thấy từ nào khớp với "{input}". Thử từ khóa khác nhé.
          </p>
        </div>
      )}

      {/* Sentence analysis */}
      {isSentenceInput && segments.length > 0 && (
        <div className="space-y-4">
          {fullTranslation && (
            <div className="rounded-2xl border-2 border-primary-300 bg-primary-50 p-6 dark:border-primary-800 dark:bg-primary-950/30">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-400">
                <Languages className="h-4 w-4" />
                Nghĩa tiếng Việt trọn câu
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{fullTranslation}</p>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Câu đã nhập — chạm từng từ để xem chi tiết</h3>
              {isSpeechSupported() && (
                <button
                  onClick={() => speakChinese(input.trim())}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-950/50 dark:text-primary-300 dark:hover:bg-primary-900/50"
                >
                  <Volume2 className="h-4 w-4" />
                  Nghe cả câu
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {segments.map((seg, i) => (
                <WordToken key={i} segment={seg} />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <h3 className="border-b border-gray-100 px-5 py-4 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-300">
              Phân tích từng từ
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {segments.map((seg, i) => {
                const matchWord = INITIAL_VOCAB.find((w) => w.hanzi === seg.text);
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex w-20 flex-shrink-0 items-center justify-center">
                      <span className={`font-hanzi text-2xl font-bold ${seg.isWord ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                        {seg.text}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{seg.pinyin}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{seg.meaning}</div>
                    </div>
                    {matchWord && (
                      <button
                        onClick={() => setSelectedWord(matchWord)}
                        className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/30 dark:hover:text-primary-400"
                        title="Xem chi tiết"
                      >
                        <BookMarked className="h-4 w-4" />
                      </button>
                    )}
                    {isSpeechSupported() && (
                      <button
                        onClick={() => speakChinese(seg.text)}
                        className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-primary-400"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sentence database browser */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Kho câu mẫu</h3>
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                category === cat.key
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredSentences.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSample(s.chinese)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSample(s.chinese); } }}
              className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-primary-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-700"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-hanzi text-xl font-bold text-gray-900 dark:text-gray-100">{s.chinese}</span>
                {isSpeechSupported() && (
                  <button
                    onClick={(e) => { e.stopPropagation(); speakChinese(s.chinese); }}
                    className="-m-1 flex-shrink-0 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/30"
                    title="Nghe cả câu"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">{s.pinyin}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.vietnamese}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Word detail modal */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          starredHook={starredHook}
        />
      )}
    </div>
  );
}

function WordResultCard({ word, onClick }: { word: VocabItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-primary-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-700"
    >
      <div className="flex w-20 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 py-4 transition-colors group-hover:bg-primary-100 dark:bg-primary-950/30 dark:group-hover:bg-primary-950/50">
        <span className="font-hanzi text-3xl font-bold text-gray-900 dark:text-gray-100">{word.hanzi}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <BookOpen className="h-3 w-3" />
          <span>{word.level}</span>
        </div>
        <div className="text-lg font-bold text-primary-600 dark:text-primary-400">{word.pinyin}</div>
        <div className="truncate text-sm text-gray-600 dark:text-gray-400">{word.meaning}</div>
      </div>
      {isSpeechSupported() && (
        <span
          onClick={(e) => { e.stopPropagation(); speakChinese(speechText(word)); }}
          className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-opacity hover:bg-gray-100 hover:text-primary-600 group-hover:opacity-100 dark:hover:bg-gray-800 dark:hover:text-primary-400"
        >
          <Volume2 className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}

function WordDetailModal({
  word,
  onClose,
  starredHook,
}: {
  word: VocabItem;
  onClose: () => void;
  starredHook: ReturnType<typeof useStarred>;
}) {
  const { isStarred, toggle } = starredHook;
  const starred = isStarred(vocabKey(word));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const exampleSentences = CONVERSATION_SENTENCES.filter((s) => s.chinese.includes(word.hanzi)).slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1 text-xs font-medium text-white/70">
            <span className="rounded-lg bg-white/15 px-2 py-0.5">{word.level}</span>
          </div>

          <div className="mt-4 flex items-end gap-4">
            <span className="font-hanzi text-7xl font-bold leading-none drop-shadow-sm">{word.hanzi}</span>
            <div className="pb-1">
              <div className="text-xl font-semibold text-white/90">{word.pinyin}</div>
            </div>
          </div>

          {isSpeechSupported() && (
            <button
              onClick={() => speakChinese(speechText(word))}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
            >
              <Volume2 className="h-4 w-4" />
              Phát âm
            </button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[50vh] overflow-y-auto p-6">
          {/* Meaning */}
          <div className="mb-6">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Nghĩa tiếng Việt</h4>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{word.meaning}</p>
          </div>

          {/* Star toggle */}
          <button
            onClick={() => toggle(vocabKey(word))}
            className={`mb-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              starred
                ? 'border-accent-300 bg-accent-50 text-accent-700 dark:border-accent-800 dark:bg-accent-950/40 dark:text-accent-400'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <Star className={`h-4 w-4 ${starred ? 'fill-current' : ''}`} />
            {starred ? 'Đã đánh dấu cần học' : 'Đánh dấu cần học'}
          </button>

          {/* Example sentences */}
          {exampleSentences.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Câu ví dụ mẫu</h4>
              <div className="space-y-3">
                {exampleSentences.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-hanzi text-xl font-bold text-gray-900 dark:text-gray-100">{s.chinese}</span>
                      {isSpeechSupported() && (
                        <button
                          onClick={() => speakChinese(s.chinese)}
                          className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-primary-600 dark:hover:bg-gray-700"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-primary-600 dark:text-primary-400">{s.pinyin}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.vietnamese}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exampleSentences.length === 0 && (
            <p className="text-sm text-gray-400">Chưa có câu ví dụ mẫu cho từ này.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WordToken({ segment }: { segment: ReturnType<typeof tokenizeSentence>[0] }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="group relative cursor-pointer rounded-lg px-2 py-1 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/30"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setShow(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setShow(false)}
      onClick={(e) => { if ((e.nativeEvent as PointerEvent).pointerType !== 'mouse') setShow((s) => !s); }}
    >
      <span className={`font-hanzi text-2xl ${segment.isWord ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
        {segment.text}
      </span>
      {show && (
        <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="font-medium text-primary-600 dark:text-primary-400">{segment.pinyin}</div>
          <div className="text-gray-600 dark:text-gray-400">{segment.meaning}</div>
        </div>
      )}
    </div>
  );
}
