export interface SentenceEntry {
  id: number;
  chinese: string;      // The Chinese sentence
  pinyin: string;       // Full pinyin with tone marks
  vietnamese: string;   // Full Vietnamese translation of the entire sentence
  category: 'shopping' | 'time' | 'directions' | 'food' | 'greeting' | 'daily';
}

/**
 * Sentence database for the Chinese learning app.
 *
 * Pinyin follows standard tone-sandhi conventions:
 *  - 一 becomes yì before 1st/2nd/3rd tones and yí before 4th tones.
 *  - 不 becomes bú before 4th tones.
 * Vietnamese translations are natural, whole-sentence renderings.
 */
export const SENTENCE_DATABASE: SentenceEntry[] = [
  // ===== shopping (mua sắm) =====
  {
    id: 1,
    chinese: '这个多少钱？',
    pinyin: 'zhè ge duō shǎo qián?',
    vietnamese: 'Cái này bao nhiêu tiền?',
    category: 'shopping',
  },
  {
    id: 2,
    chinese: '太贵了，便宜一点吧。',
    pinyin: 'tài guì le, pián yi yì diǎn ba.',
    vietnamese: 'Quá đắt rồi, rẻ một chút đi.',
    category: 'shopping',
  },
  {
    id: 3,
    chinese: '我想买一件衣服。',
    pinyin: 'wǒ xiǎng mǎi yí jiàn yī fu.',
    vietnamese: 'Tôi muốn mua một chiếc áo.',
    category: 'shopping',
  },
  {
    id: 4,
    chinese: '请问，在哪里可以付款？',
    pinyin: 'qǐng wèn, zài nǎ lǐ kě yǐ fù kuǎn?',
    vietnamese: 'Xin hỏi, ở đâu có thể thanh toán?',
    category: 'shopping',
  },
  {
    id: 5,
    chinese: '有没有大号的？',
    pinyin: 'yǒu méi yǒu dà hào de?',
    vietnamese: 'Có cỡ lớn không?',
    category: 'shopping',
  },
  {
    id: 6,
    chinese: '这个可以打折吗？',
    pinyin: 'zhè ge kě yǐ dǎ zhé ma?',
    vietnamese: 'Cái này có được giảm giá không?',
    category: 'shopping',
  },
  {
    id: 7,
    chinese: '我要买两公斤苹果。',
    pinyin: 'wǒ yào mǎi liǎng gōng jīn píng guǒ.',
    vietnamese: 'Tôi muốn mua hai kilôgam táo.',
    category: 'shopping',
  },

  // ===== time (thời gian) =====
  {
    id: 8,
    chinese: '现在几点了？',
    pinyin: 'xiàn zài jǐ diǎn le?',
    vietnamese: 'Bây giờ là mấy giờ rồi?',
    category: 'time',
  },
  {
    id: 9,
    chinese: '我早上六点起床。',
    pinyin: 'wǒ zǎo shang liù diǎn qǐ chuáng.',
    vietnamese: 'Tôi sáu giờ sáng thức dậy.',
    category: 'time',
  },
  {
    id: 10,
    chinese: '我们下午三点见面。',
    pinyin: 'wǒ men xià wǔ sān diǎn jiàn miàn.',
    vietnamese: 'Chúng tôi ba giờ chiều gặp mặt.',
    category: 'time',
  },
  {
    id: 11,
    chinese: '银行几点开门？',
    pinyin: 'yín háng jǐ diǎn kāi mén?',
    vietnamese: 'Ngân hàng mấy giờ mở cửa?',
    category: 'time',
  },
  {
    id: 12,
    chinese: '火车晚上八点出发。',
    pinyin: 'huǒ chē wǎn shang bā diǎn chū fā.',
    vietnamese: 'Tàu hỏa tám giờ tối xuất phát.',
    category: 'time',
  },
  {
    id: 13,
    chinese: '你每天工作几个小时？',
    pinyin: 'nǐ měi tiān gōng zuò jǐ ge xiǎo shí?',
    vietnamese: 'Bạn mỗi ngày làm việc mấy tiếng?',
    category: 'time',
  },
  {
    id: 14,
    chinese: '我等了你两个小时。',
    pinyin: 'wǒ děng le nǐ liǎng ge xiǎo shí.',
    vietnamese: 'Tôi đã đợi bạn hai tiếng đồng hồ.',
    category: 'time',
  },

  // ===== directions (hỏi đường) =====
  {
    id: 15,
    chinese: '请问，火车站怎么走？',
    pinyin: 'qǐng wèn, huǒ chē zhàn zěn me zǒu?',
    vietnamese: 'Xin hỏi, ga tàu hỏa đi như thế nào?',
    category: 'directions',
  },
  {
    id: 16,
    chinese: '银行在哪儿？',
    pinyin: 'yín háng zài nǎr?',
    vietnamese: 'Ngân hàng ở đâu?',
    category: 'directions',
  },
  {
    id: 17,
    chinese: '一直往前走。',
    pinyin: 'yì zhí wǎng qián zǒu.',
    vietnamese: 'Đi thẳng về phía trước.',
    category: 'directions',
  },
  {
    id: 18,
    chinese: '在路口左转。',
    pinyin: 'zài lù kǒu zuǒ zhuǎn.',
    vietnamese: 'Rẽ trái ở ngã tư.',
    category: 'directions',
  },
  {
    id: 19,
    chinese: '离这里远吗？',
    pinyin: 'lí zhè lǐ yuǎn ma?',
    vietnamese: 'Có xa đây không?',
    category: 'directions',
  },
  {
    id: 20,
    chinese: '请问，洗手间在哪儿？',
    pinyin: 'qǐng wèn, xǐ shǒu jiān zài nǎr?',
    vietnamese: 'Xin hỏi, nhà vệ sinh ở đâu?',
    category: 'directions',
  },
  {
    id: 21,
    chinese: '你可以坐地铁去。',
    pinyin: 'nǐ kě yǐ zuò dì tiě qù.',
    vietnamese: 'Bạn có thể đi tàu điện ngầm đến đó.',
    category: 'directions',
  },

  // ===== food (ăn uống) =====
  {
    id: 22,
    chinese: '我想吃火锅。',
    pinyin: 'wǒ xiǎng chī huǒ guō.',
    vietnamese: 'Tôi muốn ăn lẩu.',
    category: 'food',
  },
  {
    id: 23,
    chinese: '这个菜很好吃。',
    pinyin: 'zhè ge cài hěn hǎo chī.',
    vietnamese: 'Món này rất ngon.',
    category: 'food',
  },
  {
    id: 24,
    chinese: '请给我一杯茶。',
    pinyin: 'qǐng gěi wǒ yì bēi chá.',
    vietnamese: 'Làm ơn cho tôi một tách trà.',
    category: 'food',
  },
  {
    id: 25,
    chinese: '你们有什么特色菜？',
    pinyin: 'nǐ men yǒu shén me tè sè cài?',
    vietnamese: 'Các bạn có món đặc sản gì?',
    category: 'food',
  },
  {
    id: 26,
    chinese: '我不要辣的。',
    pinyin: 'wǒ bú yào là de.',
    vietnamese: 'Tôi không muốn món cay.',
    category: 'food',
  },
  {
    id: 27,
    chinese: '服务员，买单！',
    pinyin: 'fú wù yuán, mǎi dān!',
    vietnamese: 'Bạn phục vụ ơi, tính tiền!',
    category: 'food',
  },
  {
    id: 28,
    chinese: '我饿了，我们去吃饭吧。',
    pinyin: 'wǒ è le, wǒ men qù chī fàn ba.',
    vietnamese: 'Tôi đói rồi, chúng ta đi ăn đi.',
    category: 'food',
  },

  // ===== greeting (chào hỏi) =====
  {
    id: 29,
    chinese: '你好，我叫小明。',
    pinyin: 'nǐ hǎo, wǒ jiào Xiǎo Míng.',
    vietnamese: 'Xin chào, tôi tên là Tiểu Minh.',
    category: 'greeting',
  },
  {
    id: 30,
    chinese: '你最近好吗？',
    pinyin: 'nǐ zuì jìn hǎo ma?',
    vietnamese: 'Dạo này bạn có khỏe không?',
    category: 'greeting',
  },
  {
    id: 31,
    chinese: '很高兴认识你。',
    pinyin: 'hěn gāo xìng rèn shi nǐ.',
    vietnamese: 'Rất vui được quen biết bạn.',
    category: 'greeting',
  },
  {
    id: 32,
    chinese: '再见，下次见！',
    pinyin: 'zài jiàn, xià cì jiàn!',
    vietnamese: 'Tạm biệt, lần sau gặp lại!',
    category: 'greeting',
  },

  // ===== daily (sinh hoạt hàng ngày) =====
  {
    id: 33,
    chinese: '我每天早上锻炼身体。',
    pinyin: 'wǒ měi tiān zǎo shang duàn liàn shēn tǐ.',
    vietnamese: 'Tôi mỗi buổi sáng đều tập thể dục.',
    category: 'daily',
  },
  {
    id: 34,
    chinese: '晚上我经常看书。',
    pinyin: 'wǎn shang wǒ jīng cháng kàn shū.',
    vietnamese: 'Buổi tối tôi thường hay đọc sách.',
    category: 'daily',
  },
  {
    id: 35,
    chinese: '我周末喜欢休息。',
    pinyin: 'wǒ zhōu mò xǐ huan xiū xi.',
    vietnamese: 'Cuối tuần tôi thích nghỉ ngơi.',
    category: 'daily',
  },
  {
    id: 36,
    chinese: '他每天坐地铁上班。',
    pinyin: 'tā měi tiān zuò dì tiě shàng bān.',
    vietnamese: 'Anh ấy mỗi ngày đều đi tàu điện ngầm để làm việc.',
    category: 'daily',
  },
];

/**
 * A varied sample of Chinese sentence strings drawn from SENTENCE_DATABASE,
 * used for the breakdown/practice feature.
 */
export const SAMPLE_SENTENCES: string[] = [
  '这个多少钱？',
  '现在几点了？',
  '请问，火车站怎么走？',
  '我想吃火锅。',
  '你好，我叫小明。',
  '我每天早上锻炼身体。',
  '太贵了，便宜一点吧。',
  '火车晚上八点出发。',
  '一直往前走。',
  '服务员，买单！',
  '很高兴认识你。',
  '他每天坐地铁上班。',
];
