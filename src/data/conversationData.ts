export type ConversationCategory =
  | 'greeting'
  | 'intro'
  | 'polite'
  | 'help'
  | 'shopping'
  | 'food'
  | 'directions'
  | 'time'
  | 'health'
  | 'daily';

export interface ConversationEntry {
  id: number;
  chinese: string;
  pinyin: string;      // pinyin có dấu thanh, mỗi chữ Hán một âm tiết
  vietnamese: string;
  category: ConversationCategory;
  hsk: 1 | 2 | 3;      // mức độ khó của câu (gán tay)
}

/** Thứ tự chủ đề hiển thị ở tab Giao tiếp, kèm tên tiếng Việt. */
export const CONVERSATION_CATEGORIES: { key: ConversationCategory; label: string }[] = [
  { key: 'greeting', label: 'Chào hỏi' },
  { key: 'intro', label: 'Giới thiệu bản thân' },
  { key: 'polite', label: 'Cảm ơn & xin lỗi' },
  { key: 'help', label: 'Nhờ giúp đỡ & hiểu ý' },
  { key: 'shopping', label: 'Mua sắm' },
  { key: 'food', label: 'Ăn uống' },
  { key: 'directions', label: 'Hỏi đường & đi lại' },
  { key: 'time', label: 'Thời gian & ngày tháng' },
  { key: 'health', label: 'Sức khoẻ & khẩn cấp' },
  { key: 'daily', label: 'Sinh hoạt & công việc' },
];

/**
 * 100 câu giao tiếp cơ bản (10 chủ đề x 10 câu).
 * Quy ước pinyin: 一 đọc yí trước thanh 4, yì trước thanh 1/2/3; 不 đọc bú trước thanh 4;
 * các thanh nhẹ không đánh dấu (xiè xie, péng you...).
 */
const RAW: [ConversationCategory, 1 | 2 | 3, string, string, string][] = [
  // ===== Chào hỏi =====
  ['greeting', 1, '你好！', 'nǐ hǎo!', 'Xin chào!'],
  ['greeting', 1, '早上好！', 'zǎo shang hǎo!', 'Chào buổi sáng!'],
  ['greeting', 1, '晚上好！', 'wǎn shang hǎo!', 'Chào buổi tối!'],
  ['greeting', 1, '你好吗？', 'nǐ hǎo ma?', 'Bạn khoẻ không?'],
  ['greeting', 1, '我很好，谢谢。', 'wǒ hěn hǎo, xiè xie.', 'Tôi rất khoẻ, cảm ơn.'],
  ['greeting', 1, '你呢？', 'nǐ ne?', 'Còn bạn thì sao?'],
  ['greeting', 2, '好久不见！', 'hǎo jiǔ bú jiàn!', 'Lâu rồi không gặp!'],
  ['greeting', 2, '最近怎么样？', 'zuì jìn zěn me yàng?', 'Dạo này bạn thế nào?'],
  ['greeting', 1, '再见！', 'zài jiàn!', 'Tạm biệt!'],
  ['greeting', 1, '明天见！', 'míng tiān jiàn!', 'Mai gặp lại nhé!'],
  // ===== Giới thiệu bản thân =====
  ['intro', 1, '我叫小明。', 'wǒ jiào Xiǎo Míng.', 'Tôi tên là Tiểu Minh.'],
  ['intro', 1, '你叫什么名字？', 'nǐ jiào shén me míng zi?', 'Bạn tên là gì?'],
  ['intro', 1, '很高兴认识你。', 'hěn gāo xìng rèn shi nǐ.', 'Rất vui được quen biết bạn.'],
  ['intro', 1, '我是越南人。', 'wǒ shì Yuè nán rén.', 'Tôi là người Việt Nam.'],
  ['intro', 1, '你是哪国人？', 'nǐ shì nǎ guó rén?', 'Bạn là người nước nào?'],
  ['intro', 2, '你今年多大？', 'nǐ jīn nián duō dà?', 'Năm nay bạn bao nhiêu tuổi?'],
  ['intro', 2, '我今年二十五岁。', 'wǒ jīn nián èr shí wǔ suì.', 'Năm nay tôi hai mươi lăm tuổi.'],
  ['intro', 1, '我是学生。', 'wǒ shì xué sheng.', 'Tôi là học sinh (sinh viên).'],
  ['intro', 1, '我在学中文。', 'wǒ zài xué Zhōng wén.', 'Tôi đang học tiếng Trung.'],
  ['intro', 2, '我住在胡志明市。', 'wǒ zhù zài Hú zhì míng shì.', 'Tôi sống ở thành phố Hồ Chí Minh.'],
  // ===== Cảm ơn & xin lỗi =====
  ['polite', 1, '谢谢！', 'xiè xie!', 'Cảm ơn!'],
  ['polite', 2, '非常感谢。', 'fēi cháng gǎn xiè.', 'Xin chân thành cảm ơn.'],
  ['polite', 1, '不客气。', 'bú kè qi.', 'Không có gì đâu.'],
  ['polite', 1, '对不起。', 'duì bu qǐ.', 'Xin lỗi.'],
  ['polite', 1, '没关系。', 'méi guān xi.', 'Không sao đâu.'],
  ['polite', 2, '不好意思。', 'bù hǎo yì si.', 'Ngại quá (xin lỗi, làm phiền bạn).'],
  ['polite', 1, '请进。', 'qǐng jìn.', 'Mời vào.'],
  ['polite', 1, '请坐。', 'qǐng zuò.', 'Mời ngồi.'],
  ['polite', 2, '请等一下。', 'qǐng děng yí xià.', 'Xin chờ một chút.'],
  ['polite', 3, '麻烦你了。', 'má fan nǐ le.', 'Làm phiền bạn rồi.'],
  // ===== Nhờ giúp đỡ & hiểu ý =====
  ['help', 2, '我听不懂。', 'wǒ tīng bu dǒng.', 'Tôi nghe không hiểu.'],
  ['help', 2, '我不明白。', 'wǒ bù míng bai.', 'Tôi không hiểu.'],
  ['help', 2, '请再说一遍。', 'qǐng zài shuō yí biàn.', 'Xin hãy nói lại một lần nữa.'],
  ['help', 2, '请说慢一点。', 'qǐng shuō màn yì diǎn.', 'Xin hãy nói chậm một chút.'],
  ['help', 1, '你会说英语吗？', 'nǐ huì shuō Yīng yǔ ma?', 'Bạn có biết nói tiếng Anh không?'],
  ['help', 1, '我会说一点中文。', 'wǒ huì shuō yì diǎn Zhōng wén.', 'Tôi biết nói một chút tiếng Trung.'],
  ['help', 2, '这个用中文怎么说？', 'zhè ge yòng Zhōng wén zěn me shuō?', 'Cái này nói bằng tiếng Trung thế nào?'],
  ['help', 2, '请帮我一下。', 'qǐng bāng wǒ yí xià.', 'Xin hãy giúp tôi một chút.'],
  ['help', 2, '你能帮我吗？', 'nǐ néng bāng wǒ ma?', 'Bạn có thể giúp tôi không?'],
  ['help', 2, '我知道了。', 'wǒ zhī dào le.', 'Tôi biết rồi (tôi hiểu rồi).'],
  // ===== Mua sắm =====
  ['shopping', 1, '这个多少钱？', 'zhè ge duō shao qián?', 'Cái này bao nhiêu tiền?'],
  ['shopping', 2, '太贵了，便宜一点吧。', 'tài guì le, pián yi yì diǎn ba.', 'Đắt quá, rẻ một chút đi.'],
  ['shopping', 2, '有没有小一点的？', 'yǒu méi yǒu xiǎo yì diǎn de?', 'Có cái nhỏ hơn một chút không?'],
  ['shopping', 1, '我想买一件衣服。', 'wǒ xiǎng mǎi yí jiàn yī fu.', 'Tôi muốn mua một chiếc áo.'],
  ['shopping', 2, '我可以试一试吗？', 'wǒ kě yǐ shì yi shì ma?', 'Tôi thử được không?'],
  ['shopping', 3, '可以刷卡吗？', 'kě yǐ shuā kǎ ma?', 'Có quẹt thẻ được không?'],
  ['shopping', 2, '在哪儿付钱？', 'zài nǎ er fù qián?', 'Trả tiền ở đâu?'],
  ['shopping', 2, '我只是看看。', 'wǒ zhǐ shì kàn kan.', 'Tôi chỉ xem thôi.'],
  ['shopping', 1, '我要这个。', 'wǒ yào zhè ge.', 'Tôi lấy cái này.'],
  ['shopping', 3, '请给我一个袋子。', 'qǐng gěi wǒ yí ge dài zi.', 'Cho tôi một cái túi.'],
  // ===== Ăn uống =====
  ['food', 1, '我想吃米饭。', 'wǒ xiǎng chī mǐ fàn.', 'Tôi muốn ăn cơm.'],
  ['food', 2, '请给我菜单。', 'qǐng gěi wǒ cài dān.', 'Cho tôi xem thực đơn.'],
  ['food', 1, '你想吃什么？', 'nǐ xiǎng chī shén me?', 'Bạn muốn ăn gì?'],
  ['food', 1, '我要一杯茶。', 'wǒ yào yì bēi chá.', 'Tôi muốn một tách trà.'],
  ['food', 1, '我不吃辣。', 'wǒ bù chī là.', 'Tôi không ăn cay.'],
  ['food', 1, '这个菜真好吃。', 'zhè ge cài zhēn hǎo chī.', 'Món này ngon thật.'],
  ['food', 2, '服务员，买单！', 'fú wù yuán, mǎi dān!', 'Phục vụ ơi, tính tiền!'],
  ['food', 1, '我很饿。', 'wǒ hěn è.', 'Tôi rất đói.'],
  ['food', 1, '我想喝水。', 'wǒ xiǎng hē shuǐ.', 'Tôi muốn uống nước.'],
  ['food', 2, '我们点菜吧。', 'wǒ men diǎn cài ba.', 'Chúng ta gọi món nhé.'],
  // ===== Hỏi đường & đi lại =====
  ['directions', 2, '请问，火车站怎么走？', 'qǐng wèn, huǒ chē zhàn zěn me zǒu?', 'Xin hỏi, đi đến ga tàu hỏa thế nào?'],
  ['directions', 2, '洗手间在哪儿？', 'xǐ shǒu jiān zài nǎ er?', 'Nhà vệ sinh ở đâu?'],
  ['directions', 3, '一直往前走。', 'yì zhí wǎng qián zǒu.', 'Cứ đi thẳng về phía trước.'],
  ['directions', 2, '在前面左转。', 'zài qián miàn zuǒ zhuǎn.', 'Rẽ trái ở phía trước.'],
  ['directions', 2, '在路口右转。', 'zài lù kǒu yòu zhuǎn.', 'Rẽ phải ở ngã tư.'],
  ['directions', 2, '离这儿远吗？', 'lí zhè er yuǎn ma?', 'Cách đây có xa không?'],
  ['directions', 2, '走路要十分钟。', 'zǒu lù yào shí fēn zhōng.', 'Đi bộ mất mười phút.'],
  ['directions', 3, '我要打车去机场。', 'wǒ yào dǎ chē qù jī chǎng.', 'Tôi muốn đi taxi ra sân bay.'],
  ['directions', 2, '我坐地铁去上班。', 'wǒ zuò dì tiě qù shàng bān.', 'Tôi đi làm bằng tàu điện ngầm.'],
  ['directions', 2, '这儿离地铁站很近。', 'zhè er lí dì tiě zhàn hěn jìn.', 'Chỗ này rất gần ga tàu điện ngầm.'],
  // ===== Thời gian & ngày tháng =====
  ['time', 1, '现在几点？', 'xiàn zài jǐ diǎn?', 'Bây giờ là mấy giờ?'],
  ['time', 1, '现在八点半。', 'xiàn zài bā diǎn bàn.', 'Bây giờ là tám rưỡi.'],
  ['time', 1, '今天几月几号？', 'jīn tiān jǐ yuè jǐ hào?', 'Hôm nay là ngày mấy tháng mấy?'],
  ['time', 1, '今天星期几？', 'jīn tiān xīng qī jǐ?', 'Hôm nay là thứ mấy?'],
  ['time', 1, '今天星期六。', 'jīn tiān xīng qī liù.', 'Hôm nay là thứ Bảy.'],
  ['time', 2, '明天你有空吗？', 'míng tiān nǐ yǒu kòng ma?', 'Ngày mai bạn rảnh không?'],
  ['time', 2, '我们几点见面？', 'wǒ men jǐ diǎn jiàn miàn?', 'Mấy giờ chúng ta gặp nhau?'],
  ['time', 2, '我们下午三点见面。', 'wǒ men xià wǔ sān diǎn jiàn miàn.', 'Chúng ta gặp nhau lúc ba giờ chiều.'],
  ['time', 2, '火车晚上八点出发。', 'huǒ chē wǎn shang bā diǎn chū fā.', 'Tàu khởi hành lúc tám giờ tối.'],
  ['time', 2, '我每天早上六点起床。', 'wǒ měi tiān zǎo shang liù diǎn qǐ chuáng.', 'Mỗi sáng tôi dậy lúc sáu giờ.'],
  // ===== Sức khoẻ & khẩn cấp =====
  ['health', 2, '我不舒服。', 'wǒ bù shū fu.', 'Tôi thấy không khoẻ.'],
  ['health', 3, '我头疼。', 'wǒ tóu téng.', 'Tôi bị đau đầu.'],
  ['health', 3, '我发烧了。', 'wǒ fā shāo le.', 'Tôi bị sốt rồi.'],
  ['health', 1, '我想去医院。', 'wǒ xiǎng qù yī yuàn.', 'Tôi muốn đến bệnh viện.'],
  ['health', 1, '我要看医生。', 'wǒ yào kàn yī shēng.', 'Tôi muốn đi khám bác sĩ.'],
  ['health', 2, '你哪里不舒服？', 'nǐ nǎ li bù shū fu?', 'Bạn khó chịu ở đâu?'],
  ['health', 2, '请多喝水，多休息。', 'qǐng duō hē shuǐ, duō xiū xi.', 'Hãy uống nhiều nước và nghỉ ngơi nhiều.'],
  ['health', 3, '请帮我叫救护车。', 'qǐng bāng wǒ jiào jiù hù chē.', 'Xin gọi xe cứu thương giúp tôi.'],
  ['health', 3, '我的钱包丢了。', 'wǒ de qián bāo diū le.', 'Ví tiền của tôi bị mất rồi.'],
  ['health', 3, '请帮我报警。', 'qǐng bāng wǒ bào jǐng.', 'Xin hãy giúp tôi báo cảnh sát.'],
  // ===== Sinh hoạt & công việc =====
  ['daily', 1, '我在学校学习。', 'wǒ zài xué xiào xué xí.', 'Tôi học ở trường.'],
  ['daily', 2, '我每天工作八个小时。', 'wǒ měi tiān gōng zuò bā ge xiǎo shí.', 'Mỗi ngày tôi làm việc tám tiếng.'],
  ['daily', 1, '你喜欢做什么？', 'nǐ xǐ huan zuò shén me?', 'Bạn thích làm gì?'],
  ['daily', 1, '我喜欢看电影。', 'wǒ xǐ huan kàn diàn yǐng.', 'Tôi thích xem phim.'],
  ['daily', 2, '周末你想做什么？', 'zhōu mò nǐ xiǎng zuò shén me?', 'Cuối tuần bạn muốn làm gì?'],
  ['daily', 1, '今天天气很好。', 'jīn tiān tiān qì hěn hǎo.', 'Hôm nay thời tiết rất đẹp.'],
  ['daily', 1, '我家有四口人。', 'wǒ jiā yǒu sì kǒu rén.', 'Nhà tôi có bốn người.'],
  ['daily', 1, '这是我的朋友。', 'zhè shì wǒ de péng you.', 'Đây là bạn của tôi.'],
  ['daily', 2, '我们一起去吧。', 'wǒ men yì qǐ qù ba.', 'Chúng ta cùng đi nhé.'],
  ['daily', 2, '晚安！', 'wǎn ān!', 'Chúc ngủ ngon!'],
];

export const CONVERSATION_SENTENCES: ConversationEntry[] = RAW.map(
  ([category, hsk, chinese, pinyin, vietnamese], i) => ({
    id: i + 1,
    category,
    hsk,
    chinese,
    pinyin,
    vietnamese,
  })
);
