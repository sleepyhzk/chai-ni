import { INITIAL_VOCAB } from '@/data/vocabData';
import { CONVERSATION_SENTENCES } from '@/data/conversationData';
import type { TokenSegment } from './types';

const charFallback: Record<string, { pinyin: string; meaning: string }> = {
  '的': { pinyin: 'de', meaning: 'của (trợ từ)' },
  '了': { pinyin: 'le', meaning: '(trợ từ hoàn thành)' },
  '要': { pinyin: 'yào', meaning: 'muốn, sẽ' },
  '会': { pinyin: 'huì', meaning: 'sẽ, biết' },
  '去': { pinyin: 'qù', meaning: 'đi' },
  '玩': { pinyin: 'wán', meaning: 'chơi' },
  '书': { pinyin: 'shū', meaning: 'sách' },
  '本': { pinyin: 'běn', meaning: 'cuốn, quyển' },
  '天': { pinyin: 'tiān', meaning: 'ngày, trời' },
  '气': { pinyin: 'qì', meaning: 'khí hậu' },
  '饭': { pinyin: 'fàn', meaning: 'cơm' },
  '哪': { pinyin: 'nǎ', meaning: 'nào' },
  '国': { pinyin: 'guó', meaning: 'quốc gia' },
  '请': { pinyin: 'qǐng', meaning: 'xin mời' },
  '问': { pinyin: 'wèn', meaning: 'hỏi' },
  '洗': { pinyin: 'xǐ', meaning: 'rửa' },
  '手': { pinyin: 'shǒu', meaning: 'tay' },
  '间': { pinyin: 'jiān', meaning: 'phòng, khoảng' },
  '儿': { pinyin: 'er', meaning: '(hậu tố)' },
  '哪儿': { pinyin: 'nǎ er', meaning: 'ở đâu' },
  '洗手间': { pinyin: 'xǐ shǒu jiān', meaning: 'nhà vệ sinh' },
  '有意思': { pinyin: 'yǒu yì si', meaning: 'thú vị' },
  '文': { pinyin: 'wén', meaning: 'văn' },
  '中': { pinyin: 'zhōng', meaning: 'giữa, Trung Quốc' },
  '语': { pinyin: 'yǔ', meaning: 'ngôn ngữ' },
  '中文': { pinyin: 'zhōng wén', meaning: 'tiếng Trung' },
  '号': { pinyin: 'hào', meaning: 'cỡ, số' },
  '大号': { pinyin: 'dà hào', meaning: 'cỡ lớn' },
  '打折': { pinyin: 'dǎ zhé', meaning: 'giảm giá' },
  '公斤': { pinyin: 'gōng jīn', meaning: 'kilôgam' },
  '苹果': { pinyin: 'píng guǒ', meaning: 'quả táo' },
  '特色': { pinyin: 'tè sè', meaning: 'đặc sắc' },
  '特色菜': { pinyin: 'tè sè cài', meaning: 'món đặc sản' },
  '辣': { pinyin: 'là', meaning: 'cay' },
  '买单': { pinyin: 'mǎi dān', meaning: 'tính tiền' },
  '饿': { pinyin: 'è', meaning: 'đói' },
  '见面': { pinyin: 'jiàn miàn', meaning: 'gặp mặt' },
  '锻炼': { pinyin: 'duàn liàn', meaning: 'tập thể dục' },
  '身体': { pinyin: 'shēn tǐ', meaning: 'cơ thể' },
  '经常': { pinyin: 'jīng cháng', meaning: 'thường xuyên' },
  '看书': { pinyin: 'kàn shū', meaning: 'đọc sách' },
  '周末': { pinyin: 'zhōu mò', meaning: 'cuối tuần' },
  '休息': { pinyin: 'xiū xi', meaning: 'nghỉ ngơi' },
  '上班': { pinyin: 'shàng bān', meaning: 'đi làm' },
  '地铁': { pinyin: 'dì tiě', meaning: 'tàu điện ngầm' },
  '坐': { pinyin: 'zuò', meaning: 'ngồi, đi (xe)' },
  '起床': { pinyin: 'qǐ chuáng', meaning: 'thức dậy' },
  '早上': { pinyin: 'zǎo shang', meaning: 'buổi sáng' },
  '下午': { pinyin: 'xià wǔ', meaning: 'buổi chiều' },
  '晚上': { pinyin: 'wǎn shang', meaning: 'buổi tối' },
  '出发': { pinyin: 'chū fā', meaning: 'xuất phát' },
  '火车': { pinyin: 'huǒ chē', meaning: 'tàu hỏa' },
  '开门': { pinyin: 'kāi mén', meaning: 'mở cửa' },
  '银行': { pinyin: 'yín háng', meaning: 'ngân hàng' },
  '小时': { pinyin: 'xiǎo shí', meaning: 'giờ' },
  '等': { pinyin: 'děng', meaning: 'đợi' },
  '一直': { pinyin: 'yì zhí', meaning: 'luôn, thẳng' },
  '往前': { pinyin: 'wǎng qián', meaning: 'về phía trước' },
  '走': { pinyin: 'zǒu', meaning: 'đi bộ' },
  '路口': { pinyin: 'lù kǒu', meaning: 'ngã tư' },
  '左转': { pinyin: 'zuǒ zhuǎn', meaning: 'rẽ trái' },
  '离': { pinyin: 'lí', meaning: 'cách' },
  '远': { pinyin: 'yuǎn', meaning: 'xa' },
  '最近': { pinyin: 'zuì jìn', meaning: 'dạo gần đây' },
  '小明': { pinyin: 'Xiǎo Míng', meaning: 'Tiểu Minh (tên)' },
  '高兴': { pinyin: 'gāo xìng', meaning: 'vui' },
  '认识': { pinyin: 'rèn shi', meaning: 'quen biết' },
  '下次': { pinyin: 'xià cì', meaning: 'lần sau' },
  '太': { pinyin: 'tài', meaning: 'quá' },
  '贵': { pinyin: 'guì', meaning: 'đắt' },
  '便宜': { pinyin: 'pián yi', meaning: 'rẻ' },
  '一点': { pinyin: 'yì diǎn', meaning: 'một chút' },
  // Dạng không có 儿 của các từ chuẩn HSK 3.0 (câu mẫu vẫn viết kiểu này)
  '有点': { pinyin: 'yǒu diǎn', meaning: 'hơi, một chút' },
  '男孩': { pinyin: 'nán hái', meaning: 'bé trai' },
  '女孩': { pinyin: 'nǚ hái', meaning: 'bé gái' },
  '小孩': { pinyin: 'xiǎo hái', meaning: 'trẻ con' },
  '面条': { pinyin: 'miàn tiáo', meaning: 'mì sợi' },
  '聊天': { pinyin: 'liáo tiān', meaning: 'trò chuyện' },
  '买': { pinyin: 'mǎi', meaning: 'mua' },
  '件': { pinyin: 'jiàn', meaning: 'chiếc (lượng từ)' },
  '衣服': { pinyin: 'yī fu', meaning: 'quần áo' },
  '付款': { pinyin: 'fù kuǎn', meaning: 'thanh toán' },
  '可以': { pinyin: 'kě yǐ', meaning: 'có thể' },
  '有': { pinyin: 'yǒu', meaning: 'có' },
  '没有': { pinyin: 'méi yǒu', meaning: 'không có' },
  '大': { pinyin: 'dà', meaning: 'to, lớn' },
  '两': { pinyin: 'liǎng', meaning: 'hai' },
  '几': { pinyin: 'jǐ', meaning: 'mấy' },
  '点': { pinyin: 'diǎn', meaning: 'giờ' },
  '现在': { pinyin: 'xiàn zài', meaning: 'bây giờ' },
  '六': { pinyin: 'liù', meaning: 'sáu' },
  '三': { pinyin: 'sān', meaning: 'ba' },
  '八': { pinyin: 'bā', meaning: 'tám' },
  '每天': { pinyin: 'měi tiān', meaning: 'mỗi ngày' },
  '工作': { pinyin: 'gōng zuò', meaning: 'làm việc' },
  '个': { pinyin: 'gè', meaning: 'cái (lượng từ)' },
  '我': { pinyin: 'wǒ', meaning: 'tôi' },
  '你': { pinyin: 'nǐ', meaning: 'bạn' },
  '们': { pinyin: 'men', meaning: '(số nhiều)' },
  '想': { pinyin: 'xiǎng', meaning: 'muốn' },
  '吃': { pinyin: 'chī', meaning: 'ăn' },
  '火锅': { pinyin: 'huǒ guō', meaning: 'lẩu' },
  '菜': { pinyin: 'cài', meaning: 'món ăn' },
  '好': { pinyin: 'hǎo', meaning: 'tốt, rất' },
  '给': { pinyin: 'gěi', meaning: 'cho' },
  '杯': { pinyin: 'bēi', meaning: 'tách (lượng từ)' },
  '茶': { pinyin: 'chá', meaning: 'trà' },
  '什么': { pinyin: 'shén me', meaning: 'gì' },
  '服务员': { pinyin: 'fú wù yuán', meaning: 'nhân viên phục vụ' },
  '吧': { pinyin: 'ba', meaning: '(điếu từ)' },
  '叫': { pinyin: 'jiào', meaning: 'tên là' },
  '怎么': { pinyin: 'zěn me', meaning: 'như thế nào' },
  '火车站': { pinyin: 'huǒ chē zhàn', meaning: 'ga tàu hỏa' },
  '在': { pinyin: 'zài', meaning: 'ở' },
  '吗': { pinyin: 'ma', meaning: '(điếu từ hỏi)' },
  '这': { pinyin: 'zhè', meaning: 'cái này' },
  '多少': { pinyin: 'duō shao', meaning: 'bao nhiêu' },
  '钱': { pinyin: 'qián', meaning: 'tiền' },
  '喜欢': { pinyin: 'xǐ huan', meaning: 'thích' },
  '学习': { pinyin: 'xué xí', meaning: 'học' },
};

/**
 * Bảng tra cho bộ tách từ: từ vựng HSK + bảng bổ sung ở trên, khớp từ DÀI NHẤT trước.
 * Khi trùng chữ Hán, từ vựng HSK được ưu tiên (đứng trước, sort ổn định).
 */
const tokenEntries: { hanzi: string; pinyin: string; meaning: string }[] = [...INITIAL_VOCAB];
{
  const seen = new Set(INITIAL_VOCAB.map((w) => w.hanzi));
  for (const [hanzi, v] of Object.entries(charFallback)) {
    if (!seen.has(hanzi)) tokenEntries.push({ hanzi, ...v });
  }
  tokenEntries.sort((a, b) => b.hanzi.length - a.hanzi.length);
}

export function tokenizeSentence(input: string): TokenSegment[] {
  const segments: TokenSegment[] = [];
  let i = 0;
  const text = input.trim();

  while (i < text.length) {
    const char = text[i];

    if (/\s/.test(char) || /[，。！？、；：""''（）《》【】,.!?;:()？]/.test(char)) {
      i++;
      continue;
    }

    const matched = tokenEntries.find((e) => text.startsWith(e.hanzi, i));

    if (matched) {
      segments.push({
        text: matched.hanzi,
        pinyin: matched.pinyin,
        meaning: matched.meaning,
        isWord: true,
      });
      i += matched.hanzi.length;
      continue;
    }

    segments.push({
      text: char,
      pinyin: '?',
      meaning: '(chưa có dữ liệu)',
      isWord: false,
    });
    i++;
  }

  return segments;
}

/** Tries to find a full-sentence Vietnamese translation from the sentence database */
export function findSentenceTranslation(chinese: string): string | null {
  const stripPunct = (s: string) => s.replace(/[，。！？、；：""''（）《》【】,.!?;:()？\s]/g, '');
  const normalized = stripPunct(chinese.trim());
  const entry = CONVERSATION_SENTENCES.find((s) => stripPunct(s.chinese) === normalized);
  return entry?.vietnamese ?? null;
}
