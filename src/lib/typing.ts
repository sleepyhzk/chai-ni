/** Chuẩn hoá để so pinyin: bỏ thanh điệu, khoảng trắng, dấu câu, ü -> u, chữ thường. */
export function stripTones(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .trim()
    .toLowerCase()
    .replace(/[?.,!;:！？。，；：'’]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Câu trả lời pinyin có đúng không (bỏ qua thanh điệu và khoảng trắng).
 * Từ có 儿 ở cuối: bàn phím pinyin thường gõ "zher", sách ghi "zhè er" -> chấp nhận cả hai.
 */
export function isPinyinAnswerCorrect(input: string, word: { hanzi: string; pinyin: string }): boolean {
  const expected = stripTones(word.pinyin);
  const accepted =
    word.hanzi.length > 1 && word.hanzi.endsWith('儿') && expected.endsWith('er')
      ? [expected, expected.slice(0, -2) + 'r']
      : [expected];
  // Bàn phím pinyin gõ ü bằng 'v' (nv, lv): quy về 'u' như đáp án đã bỏ dấu.
  return accepted.includes(stripTones(input).replace(/v/g, 'u'));
}
