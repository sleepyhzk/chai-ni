/**
 * Đọc tiếng Trung. Thứ tự ưu tiên:
 *  1) File âm thanh thu sẵn (public/audio/manifest.json, tạo bằng scripts/generate_audio.py)
 *  2) Giọng tốt nhất của trình duyệt/thiết bị (ưu tiên giọng Natural/Neural/Premium),
 *     người dùng có thể chọn giọng và tốc độ trong mục "Giọng đọc".
 */

// ---------------------------------------------------------------- cài đặt

export interface SpeechSettings {
  /** voiceURI của giọng đã chọn; null = tự động chọn giọng tốt nhất */
  voiceURI: string | null;
  rate: number;
}

const SETTINGS_KEY = 'tts_settings_v1';
export const DEFAULT_RATE = 0.85;
export const RATE_MIN = 0.5;
export const RATE_MAX = 1.2;
export const SAMPLE_TEXT = '你好，很高兴认识你。';

const clampRate = (r: number) => Math.min(RATE_MAX, Math.max(RATE_MIN, r));

function loadSettings(): SpeechSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SpeechSettings>;
      return {
        voiceURI: typeof p.voiceURI === 'string' ? p.voiceURI : null,
        rate: typeof p.rate === 'number' ? clampRate(p.rate) : DEFAULT_RATE,
      };
    }
  } catch {
    // ignore
  }
  return { voiceURI: null, rate: DEFAULT_RATE };
}

let settings: SpeechSettings = loadSettings();

export function getSpeechSettings(): SpeechSettings {
  return settings;
}

export function setSpeechSettings(patch: Partial<SpeechSettings>): SpeechSettings {
  settings = {
    ...settings,
    ...patch,
    rate: clampRate(patch.rate ?? settings.rate),
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
  return settings;
}

// ---------------------------------------------------------------- chọn giọng

export interface VoiceLike {
  name: string;
  lang: string;
  voiceURI: string;
}
export type VoiceQuality = 'natural' | 'high' | 'basic';
export interface RankedVoice<T extends VoiceLike = VoiceLike> {
  voice: T;
  score: number;
  quality: VoiceQuality;
}

function scoreVoice(v: VoiceLike): { score: number; quality: VoiceQuality } | null {
  const lang = v.lang.replace('_', '-').toLowerCase();
  const name = v.name.toLowerCase();
  if (!(lang.startsWith('zh') || lang.startsWith('cmn'))) return null;
  // Loại giọng Quảng Đông (không phải tiếng phổ thông)
  if (lang.includes('hk') || lang.includes('yue') || /cantonese|粤|粵|广东|廣東|sinji|sin-ji|hiu|wanlung/.test(name)) {
    return null;
  }

  let score = lang === 'zh-cn' || lang === 'cmn-cn' ? 30 : lang === 'zh-tw' || lang === 'cmn-tw' ? 15 : 10;
  let quality: VoiceQuality = 'basic';

  if (/natural|neural/.test(name)) {
    score += 100;
    quality = 'natural';
  } else if (/premium/.test(name)) {
    score += 70;
    quality = 'high';
  } else if (/enhanced/.test(name)) {
    score += 50;
    quality = 'high';
  } else if (/google/.test(name)) {
    score += 45;
    quality = 'high';
  } else if (/microsoft/.test(name)) {
    score += 25;
  } else if (/tingting|ting-ting|meijia|mei-jia|lili|yushu|yu-shu/.test(name)) {
    score += 15;
  }
  if (/online/.test(name)) score += 10;
  if (/compact/.test(name)) score -= 10;
  return { score, quality };
}

/** Lọc giọng tiếng phổ thông và xếp từ tự nhiên nhất xuống kém nhất. */
export function rankChineseVoices<T extends VoiceLike>(voices: T[]): RankedVoice<T>[] {
  const ranked: RankedVoice<T>[] = [];
  for (const voice of voices) {
    const s = scoreVoice(voice);
    if (s) ranked.push({ voice, ...s });
  }
  return ranked.sort((a, b) => b.score - a.score || a.voice.name.localeCompare(b.voice.name));
}

const hasSynth = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function listChineseVoices(): RankedVoice<SpeechSynthesisVoice>[] {
  if (!hasSynth()) return [];
  return rankChineseVoices(window.speechSynthesis.getVoices());
}

function pickVoice(): SpeechSynthesisVoice | null {
  const ranked = listChineseVoices();
  if (settings.voiceURI) {
    const chosen = ranked.find((r) => r.voice.voiceURI === settings.voiceURI);
    if (chosen) return chosen.voice;
  }
  return ranked[0]?.voice ?? null;
}

const voiceListeners = new Set<() => void>();
export function onVoicesChanged(cb: () => void): () => void {
  voiceListeners.add(cb);
  return () => voiceListeners.delete(cb);
}
if (hasSynth()) {
  // Chrome nạp danh sách giọng bất đồng bộ
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    voiceListeners.forEach((cb) => cb());
  });
}

// ---------------------------------------------------------------- file âm thanh thu sẵn

type Manifest = Record<string, string>;
let manifest: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;

const audioUrl = (file: string) => `${import.meta.env.BASE_URL}audio/${file}`;

export function loadAudioManifest(): Promise<Manifest> {
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
    .then((res) => (res.ok ? res.json() : {}))
    .then((data: unknown) => {
      const raw =
        data && typeof data === 'object' && 'files' in data
          ? (data as { files: unknown }).files
          : data;
      const files: Manifest = {};
      if (raw && typeof raw === 'object') {
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          if (typeof v === 'string') files[k] = v;
        }
      }
      manifest = files;
      return files;
    })
    .catch(() => {
      manifest = {};
      return {} as Manifest;
    });
  return manifestPromise;
}

export function audioFileCount(): number {
  return manifest ? Object.keys(manifest).length : 0;
}

if (typeof window !== 'undefined') {
  void loadAudioManifest(); // tải sớm để lần bấm loa đầu tiên đã dùng được file thu sẵn
}

// ---------------------------------------------------------------- phát âm

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (currentAudio) {
    const a = currentAudio;
    currentAudio = null; // đặt null trước để lỗi do pause() không kích hoạt dự phòng
    a.pause();
  }
  if (hasSynth()) window.speechSynthesis.cancel();
}

function speakWithBrowser(text: string): void {
  if (!hasSynth()) return;
  const synth = window.speechSynthesis;
  const voice = pickVoice();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang || 'zh-CN';
  if (voice) utterance.voice = voice;
  utterance.rate = settings.rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Chrome đôi khi im lặng nếu speak() ngay sau cancel()
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(() => synth.speak(utterance), 60);
  } else {
    synth.resume();
    synth.speak(utterance);
  }
}

function playFile(text: string, file: string): void {
  const audio = new Audio(audioUrl(file));
  // File được thu ở tốc độ mặc định; thanh tốc độ chỉnh theo tỉ lệ so với mặc định
  audio.playbackRate = Math.min(2, Math.max(0.5, settings.rate / DEFAULT_RATE));
  currentAudio = audio;

  const fallback = () => {
    if (currentAudio === audio) {
      currentAudio = null;
      speakWithBrowser(text);
    }
  };
  audio.addEventListener('error', fallback, { once: true });
  audio.play().catch(fallback);
}

/** Đọc to một chữ/từ/câu tiếng Trung. */
export function speakChinese(text: string): void {
  if (typeof window === 'undefined') return;
  stopSpeaking();
  const file = manifest?.[text];
  if (file) {
    playFile(text, file);
  } else {
    speakWithBrowser(text);
  }
}

export function speakSample(): void {
  speakChinese(SAMPLE_TEXT);
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window);
}
