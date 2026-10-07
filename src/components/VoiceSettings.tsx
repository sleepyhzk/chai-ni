import { useEffect, useState } from 'react';
import { Volume2, X } from 'lucide-react';
import {
  listChineseVoices,
  onVoicesChanged,
  getSpeechSettings,
  setSpeechSettings,
  speakSample,
  audioFileCount,
  loadAudioManifest,
  RATE_MIN,
  RATE_MAX,
} from '@/lib/speech';
import type { VoiceQuality } from '@/lib/speech';

const QUALITY_LABEL: Record<VoiceQuality, string> = {
  natural: 'Tự nhiên (AI)',
  high: 'Chất lượng cao',
  basic: 'Cơ bản',
};

interface VoiceSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function VoiceSettings({ open, onClose }: VoiceSettingsProps) {
  const [voices, setVoices] = useState(() => listChineseVoices());
  const [settings, setSettings] = useState(getSpeechSettings);
  const [audioCount, setAudioCount] = useState(audioFileCount());

  useEffect(() => {
    const refresh = () => setVoices(listChineseVoices());
    refresh();
    const off = onVoicesChanged(refresh);
    void loadAudioManifest().then(() => setAudioCount(audioFileCount()));
    return off;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const best = voices[0];
  const selectedURI = settings.voiceURI ?? '';
  const activeVoice =
    voices.find((v) => v.voice.voiceURI === settings.voiceURI) ?? best;

  const update = (patch: Partial<typeof settings>) => setSettings(setSpeechSettings(patch));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Giọng đọc"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            <Volume2 className="h-5 w-5 text-primary-600" />
            Giọng đọc
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {audioCount > 0 && (
          <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            Đang dùng {audioCount} file âm thanh thu sẵn (giọng AI) cho từ vựng và câu giao tiếp.
            Những chữ chưa có file sẽ dùng giọng của trình duyệt bên dưới.
          </p>
        )}

        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Giọng của trình duyệt
        </label>
        {voices.length === 0 ? (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            Thiết bị chưa có giọng tiếng Trung phổ thông. Hãy thử mở web bằng Microsoft Edge hoặc
            Chrome, hoặc cài thêm giọng tiếng Trung trong cài đặt hệ thống.
          </p>
        ) : (
          <select
            value={selectedURI}
            onChange={(e) => update({ voiceURI: e.target.value || null })}
            className="mb-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">
              Tự động{best ? ` — ${best.voice.name}` : ''}
            </option>
            {voices.map((r) => (
              <option key={r.voice.voiceURI} value={r.voice.voiceURI}>
                {r.voice.name} · {QUALITY_LABEL[r.quality]}
              </option>
            ))}
          </select>
        )}
        {activeVoice && activeVoice.quality !== 'natural' && (
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Mẹo: trên Microsoft Edge có giọng “Natural” (như Xiaoxiao, Yunxi) nghe giống người thật
            hơn nhiều so với giọng mặc định của Chrome. Trên iPhone/Mac, bạn có thể tải giọng chất
            lượng cao trong phần cài đặt Trợ năng (Nội dung được đọc).
          </p>
        )}

        <label className="mb-1 mt-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
          <span>Tốc độ đọc</span>
          <span className="tabular-nums text-gray-500 dark:text-gray-400">
            {settings.rate.toFixed(2)}x
          </span>
        </label>
        <input
          type="range"
          min={RATE_MIN}
          max={RATE_MAX}
          step={0.05}
          value={settings.rate}
          onChange={(e) => update({ rate: Number(e.target.value) })}
          className="mb-5 w-full accent-primary-600"
        />

        <button
          onClick={speakSample}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Volume2 className="h-4 w-4" />
          Nghe thử: 你好，很高兴认识你。
        </button>
      </div>
    </div>
  );
}
