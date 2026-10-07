import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Lightbulb, Volume2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { INITIAL_VOCAB } from '@/data/vocabData';
import { speakChinese, isSpeechSupported } from '@/lib/speech';
import { isHanziStarred } from '@/lib/vocabKey';
import { useStarred } from '@/hooks/useStarred';

export function WritingView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [charIndex, setCharIndex] = useState(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [starredOnly, setStarredOnly] = useState(false);
  const { starred } = useStarred();

  const allSingleChars = Array.from(new Set(INITIAL_VOCAB.map((w) => w.hanzi).filter((h) => h.length === 1)));
  const charList = starredOnly
    ? allSingleChars.filter((h) => isHanziStarred(starred, h))
    : allSingleChars;
  const selectedChar = charList[charIndex] ?? charList[0] ?? '你';

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
  }, []);

  useEffect(() => {
    setupCanvas();
    const handler = () => setupCanvas();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [setupCanvas]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (isDrawing) setStrokeCount((s) => s + 1);
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeCount(0);
  };

  const prevChar = () => {
    setCharIndex((i) => (i - 1 + charList.length) % charList.length);
    clearCanvas();
  };

  const nextChar = () => {
    setCharIndex((i) => (i + 1) % charList.length);
    clearCanvas();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Luyện viết Hán tự</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Chọn một chữ để xem mẫu, rồi dùng chuột hoặc cảm ứng để tập viết trên canvas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            {showGuide && selectedChar && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="select-none font-hanzi text-[280px] font-bold leading-none text-gray-100 dark:text-gray-800/50">
                  {selectedChar}
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full w-px bg-gray-100 dark:bg-gray-800/70" />
              <div className="absolute top-1/2 left-0 w-full h-px bg-gray-100 dark:bg-gray-800/70" />
              <div className="absolute left-1/3 top-0 h-full w-px bg-gray-50 dark:bg-gray-800/40" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-gray-50 dark:bg-gray-800/40" />
              <div className="absolute top-1/3 left-0 w-full h-px bg-gray-50 dark:bg-gray-800/40" />
              <div className="absolute top-2/3 left-0 w-full h-px bg-gray-50 dark:bg-gray-800/40" />
            </div>
            <canvas
              ref={canvasRef}
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="relative h-[400px] w-full touch-none sm:h-[480px]"
            />
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-600 backdrop-blur-sm dark:bg-gray-900/90 dark:text-gray-400">
              Nét đã viết: {strokeCount}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearCanvas}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Eraser className="h-4 w-4" />
              Xóa
            </button>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors ${
                showGuide
                  ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              {showGuide ? 'Ẩn mẫu' : 'Hiện mẫu'}
            </button>
            {isSpeechSupported() && (
              <button
                onClick={() => speakChinese(selectedChar)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Volume2 className="h-4 w-4" />
                Phát âm
              </button>
            )}
            <button
              onClick={() => { setStarredOnly(!starredOnly); setCharIndex(0); clearCanvas(); }}
              className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors ${
                starredOnly
                  ? 'border-accent-300 bg-accent-50 text-accent-700 dark:border-accent-800 dark:bg-accent-950/40 dark:text-accent-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Star className={`h-4 w-4 ${starredOnly ? 'fill-current' : ''}`} />
              {starredOnly ? 'Tất cả chữ' : 'Chữ đã đánh dấu'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chữ đang luyện</h3>
              <div className="flex gap-1">
                <button onClick={prevChar} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={nextChar} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-gray-50 py-8 dark:bg-gray-800/50">
              <span className="font-hanzi text-7xl font-bold text-gray-900 dark:text-gray-100">{selectedChar}</span>
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Chữ {charIndex + 1} / {charList.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Chọn chữ khác</h3>
            <div className="grid grid-cols-6 gap-1.5 scrollbar-thin" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {charList.map((ch, i) => (
                <button
                  key={`${ch}-${i}`}
                  onClick={() => {
                    setCharIndex(i);
                    clearCanvas();
                  }}
                  className={`flex h-11 items-center justify-center rounded-lg font-hanzi text-2xl font-bold transition-all ${
                    charIndex === i
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
