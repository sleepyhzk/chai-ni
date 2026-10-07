#!/usr/bin/env python3
"""
Tạo file mp3 giọng đọc AI (neural) cho toàn bộ từ vựng + câu giao tiếp của web.
Web sẽ tự dùng các file này (public/audio/) thay cho giọng robot của trình duyệt.

Cách dùng (chạy một lần, cần Python 3.9+ và Internet):
    pip install edge-tts
    python scripts/generate_audio.py

Tuỳ chọn:
    --voice zh-CN-XiaoxiaoNeural   giọng nữ, ấm (mặc định)
                zh-CN-XiaoyiNeural  nữ, trẻ trung
                zh-CN-YunxiNeural   nam, tự nhiên
                zh-CN-YunjianNeural nam, trầm
    --rate=-10%                    chậm hơn 10% cho người học (mặc định); ví dụ --rate=+0% hoặc --rate=-20%
    --force                        tạo lại tất cả (kể cả file đã có)
    --dry-run                      chỉ đếm số cần tạo, không gọi mạng

Script có thể chạy lại bất cứ lúc nào: file nào đã có sẽ được bỏ qua.
Sau khi chạy xong, mở web và vào "Giọng đọc" sẽ thấy số file đang được dùng.
Lưu ý: edge-tts dùng dịch vụ đọc của Microsoft Edge (không chính thức, không cần khoá API).
"""
import argparse
import asyncio
import hashlib
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAMPLE_TEXT = "你好，很高兴认识你。"  # trùng với SAMPLE_TEXT trong src/lib/speech.ts


def collect_texts():
    vocab = (ROOT / "src/data/vocabData.ts").read_text(encoding="utf-8")
    conv = (ROOT / "src/data/conversationData.ts").read_text(encoding="utf-8")
    # Mỗi dòng từ vựng; nếu có trường speak (chữ đa âm) thì đọc theo speak để ra đúng cách đọc
    rows = re.findall(r"hanzi:\s*'([^']+)'[^}]*?hsk:\s*(?:[123]|'extra')(?:,\s*speak:\s*'([^']+)')?\s*\}", vocab)
    texts = [speak or hanzi for hanzi, speak in rows]
    texts += re.findall(r"^\s*\['[a-z]+',\s*[123],\s*'([^']+)',", conv, re.M)
    texts.append(SAMPLE_TEXT)
    seen, out = set(), []
    for t in texts:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def file_name(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12] + ".mp3"


async def synth_all(texts, out_dir, voice, rate, force):
    try:
        import edge_tts
    except ImportError:
        sys.exit("Chưa cài edge-tts. Chạy:  pip install edge-tts")

    sem = asyncio.Semaphore(6)
    done = skipped = 0
    failed = []

    async def one(text):
        nonlocal done, skipped
        path = out_dir / file_name(text)
        if path.exists() and path.stat().st_size > 0 and not force:
            skipped += 1
            return
        async with sem:
            for attempt in range(3):
                tmp = path.with_suffix(".part")
                try:
                    await edge_tts.Communicate(text, voice, rate=rate).save(str(tmp))
                    if tmp.stat().st_size == 0:
                        raise RuntimeError("file rỗng")
                    os.replace(tmp, path)
                    done += 1
                    if done % 25 == 0:
                        print(f"  đã tạo {done} file...")
                    return
                except Exception as e:  # noqa: BLE001
                    if tmp.exists():
                        tmp.unlink()
                    if attempt == 2:
                        failed.append((text, str(e)))
                    else:
                        await asyncio.sleep(1.5 * (attempt + 1))

    await asyncio.gather(*(one(t) for t in texts))
    return done, skipped, failed


def main():
    ap = argparse.ArgumentParser(description="Tạo file âm thanh giọng AI cho web học tiếng Trung")
    ap.add_argument("--voice", default="zh-CN-XiaoxiaoNeural")
    ap.add_argument("--rate", default="-10%")
    ap.add_argument("--out", default=str(ROOT / "public" / "audio"))
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    texts = collect_texts()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    existing = sum(1 for t in texts if (out_dir / file_name(t)).exists())
    print(f"Tổng {len(texts)} mục cần đọc; đã có {existing} file; giọng {args.voice}, tốc độ {args.rate}")
    if args.dry_run:
        print("Chạy thử (--dry-run): không tạo file nào. Ví dụ:", ", ".join(texts[:5]))
        return

    done, skipped, failed = asyncio.run(synth_all(texts, out_dir, args.voice, args.rate, args.force))

    files = {t: file_name(t) for t in texts if (out_dir / file_name(t)).exists()}
    manifest = {"voice": args.voice, "rate": args.rate, "files": files}
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Xong: tạo mới {done}, bỏ qua {skipped}, lỗi {len(failed)}. Manifest có {len(files)} mục.")
    if failed:
        print("Các mục lỗi (chạy lại script để thử lại):")
        for t, e in failed[:20]:
            print("  ", t, "->", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
