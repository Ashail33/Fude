/**
 * Pure logic for Nopperabō's boss fight (see ./Boss.tsx). The faceless
 * yokai speaks casual Japanese with no words on screen:
 *  1. Faceless Voice: hear a casual line, pick what it means.
 *  2. The Right Reply: hear a line, pick the natural reply (あいづち,
 *     greetings, casual answers).
 *  3. Was It Like THIS?: it speaks faster, in the voices of the townsfolk
 *     whose faces it took, with only one replay. Pick the polite way to
 *     say what you heard, and give each face back.
 * Kept free of React so it can be tested.
 */
import { shuffle } from '../../engine/random'

export interface Heard {
  id: string
  /** Grammar point (data.ts) the line shows off. */
  grammar?: string
  /** Vocabulary the line uses (reviewed with it). */
  words?: string[]
  /** The casual line, as written, and in kana for the voice. */
  jp: string
  kana: string
  en: string
}

/** Phase 1: what did it mean? */
export interface Meaning extends Heard {
  wrong: [string, string, string]
}

/** Phase 2 and 3: pick a Japanese line (a reply, or the polite version). */
export interface Pick extends Heard {
  answer: string
  /** What the answer means. */
  answerEn: string
  wrong: [string, string, string]
}

export const MEANINGS: Meaning[] = [
  { id: 'm1', grammar: 'casual-da', words: ['basu', 'densha'], jp: 'あれ、バスじゃない。電車だ。', kana: 'あれ、バスじゃない。でんしゃだ。', en: 'That’s not a bus. It’s a train.', wrong: ['That’s a bus, not a train.', 'Is that the bus or the train?', 'The bus and the train are both late.'] },
  { id: 'm2', grammar: 'casual-question', words: ['hima'], jp: 'あした、暇？', kana: 'あした、ひま？', en: 'Are you free tomorrow?', wrong: ['I’m free tomorrow.', 'I was busy yesterday.', 'Tomorrow is a holiday.'] },
  { id: 'm3', grammar: 'n-desu', jp: 'おそかったね。どうしたの？', kana: 'おそかったね。どうしたの？', en: 'You’re late. What happened?', wrong: ['You’re early. Let’s go.', 'I was late. Sorry.', 'Where are you going?'] },
  { id: 'm4', grammar: 'yo-ne', words: ['koohii'], jp: 'この コーヒー、おいしいね。', kana: 'この コーヒー、おいしいね。', en: 'This coffee’s good, isn’t it?', wrong: ['Is this coffee any good?', 'This coffee tastes bad.', 'I’ll make you some coffee.'] },
  { id: 'm5', grammar: 'kedo-soft', words: ['chotto'], jp: 'ちょっと 聞きたいんだけど…', kana: 'ちょっと ききたいんだけど…', en: 'There’s something I wanted to ask you…', wrong: ['I couldn’t hear you.', 'Listen to me carefully.', 'I already asked you.'] },
  { id: 'm6', grammar: 'tte-quote', words: ['shimeru'], jp: 'マリさん、六時に 閉めるって。', kana: 'マリさん、ろくじに しめるって。', en: 'Mari says she closes at six.', wrong: ['Mari opens at six.', 'Mari, close up at six!', 'Mari went home at six.'] },
  { id: 'm7', grammar: 'teru-contraction', words: ['terebi'], jp: 'いま、テレビ 見てる。', kana: 'いま、テレビ みてる。', en: 'I’m watching TV right now.', wrong: ['I watched TV earlier.', 'Shall we watch TV?', 'I don’t watch TV.'] },
  { id: 'm8', grammar: 'chau', jp: 'ケーキ、ぜんぶ 食べちゃった。', kana: 'ケーキ、ぜんぶ たべちゃった。', en: 'I ate the whole cake.', wrong: ['I want to eat the cake.', 'Don’t eat all the cake!', 'I haven’t had any cake.'] },
  { id: 'm9', grammar: 'toku', words: ['akeru'], jp: 'まど、開けとくね。', kana: 'まど、あけとくね。', en: 'I’ll leave the window open.', wrong: ['Close the window, please.', 'Did you open the window?', 'The window won’t open.'] },
  { id: 'm10', grammar: 'kana-wonder', jp: 'あした、雨かな。', kana: 'あした、あめかな。', en: 'I wonder if it’ll rain tomorrow.', wrong: ['It will rain tomorrow.', 'It rained yesterday.', 'Take an umbrella tomorrow.'] },
  { id: 'm11', grammar: 'connectors', words: ['jaa'], jp: '雨だよ。…じゃあ、行かない。', kana: 'あめだよ。…じゃあ、いかない。', en: '“It’s raining.” “Well then, I won’t go.”', wrong: ['“It’s raining.” “Then let’s go!”', '“It’s sunny.” “Then I’ll go.”', '“It’s raining.” “But I’ll go anyway.”'] },
  { id: 'm12', grammar: 'particle-drop', words: ['koohii'], jp: 'コーヒー のむ？', kana: 'コーヒー のむ？', en: 'Want some coffee?', wrong: ['I drank some coffee.', 'Where’s the coffee?', 'The coffee is bitter.'] },
  { id: 'm13', grammar: 'jan', words: ['shashin', 'ii'], jp: 'この 写真、いいじゃん！', kana: 'この しゃしん、いいじゃん！', en: 'This photo’s great, isn’t it!', wrong: ['This photo isn’t very good.', 'Please take a photo.', 'Is this your photo?'] },
  { id: 'm14', grammar: 'aizuchi', words: ['hee', 'sou'], jp: 'へえ、そうなんだ。', kana: 'へえ、そうなんだ。', en: 'Oh, really? I didn’t know that.', wrong: ['No, that’s wrong.', 'Who told you that?', 'See you later.'] },
  { id: 'm15', grammar: 'teru-contraction', words: ['shuumatsu', 'nani'], jp: '週末、何 してた？', kana: 'しゅうまつ、なに してた？', en: 'What were you up to at the weekend?', wrong: ['What are you doing this weekend?', 'Was the weekend fun?', 'Where did you go last night?'] },
  { id: 'm16', grammar: 'casual-question', words: ['isogashii', 'uun', 'hima'], jp: 'いま、忙しい？ …ううん、暇。', kana: 'いま、いそがしい？ …ううん、ひま。', en: '“Busy right now?” “Nope, I’m free.”', wrong: ['“Free right now?” “Yeah, I’m busy.”', '“Busy right now?” “Yes, very.”', '“Hungry right now?” “Nope, I’m full.”'] },
]

export const REPLIES: Pick[] = [
  { id: 'r1', words: ['tadaima', 'okaeri'], jp: 'ただいま〜！', kana: 'ただいまー！', en: 'I’m hoooome!', answer: 'おかえり！', answerEn: 'Welcome home!', wrong: ['いってきます！', 'いただきます！', 'おやすみ！'] },
  { id: 'r2', grammar: 'aizuchi', words: ['hee'], jp: 'きのう、ふじさんに のぼったんだ。', kana: 'きのう、ふじさんに のぼったんだ。', en: 'I climbed Mount Fuji yesterday.', answer: 'へえ、すごい！', answerEn: 'Wow, amazing!', wrong: ['ただいま！', 'ごちそうさま。', 'おやすみ。'] },
  { id: 'r3', words: ['ohayou'], jp: 'あ、おはよう！', kana: 'あ、おはよう！', en: 'Oh, good morning!', answer: 'おはよう！', answerEn: 'Morning!', wrong: ['こんばんは！', 'おやすみ！', 'さようなら！'] },
  { id: 'r4', words: ['oyasumi'], jp: 'もう ねるね。', kana: 'もう ねるね。', en: 'I’m off to bed now.', answer: 'うん、おやすみ！', answerEn: 'OK, good night!', wrong: ['うん、おはよう！', 'うん、おかえり！', 'うん、いただきます！'] },
  { id: 'r5', grammar: 'particle-drop', words: ['un', 'uun'], jp: 'ケーキ、食べる？', kana: 'ケーキ、たべる？', en: 'Want some cake?', answer: 'うん、食べる！', answerEn: 'Yeah, I’ll have some!', wrong: ['ううん、食べる！', 'うん、食べない！', 'だれ？'] },
  { id: 'r6', grammar: 'chau', words: ['daijoubu', 'uun'], jp: 'ごめん、おそく なっちゃった！', kana: 'ごめん、おそく なっちゃった！', en: 'Sorry, I ended up being late!', answer: 'ううん、大丈夫だよ。', answerEn: 'Nah, it’s fine.', wrong: ['うん、大丈夫じゃない。', 'へえ、すごい！', 'いただきます。'] },
  { id: 'r7', grammar: 'aizuchi', jp: 'でね、その ねこが 電車に のって きたの。', kana: 'でね、その ねこが でんしゃに のって きたの。', en: 'And then the cat got on the train!', answer: 'え、ほんと？', answerEn: 'What, really?', wrong: ['おかえり。', 'ごちそうさま。', 'いってきます。'] },
  { id: 'r8', grammar: 'n-desu', words: ['naruhodo'], jp: 'だから、バスより 電車の ほうが はやいんだ。', kana: 'だから、バスより でんしゃの ほうが はやいんだ。', en: 'So, you see, the train is faster than the bus.', answer: 'なるほど！', answerEn: 'I see!', wrong: ['おはよう！', 'ごめんなさい！', 'ただいま！'] },
  { id: 'r9', grammar: 'casual-question', words: ['eiga', 'ii'], jp: 'あした、映画 見に 行かない？', kana: 'あした、えいが みに いかない？', en: 'Want to go and see a movie tomorrow?', answer: 'いいね！ 行こう！', answerEn: 'Sounds good! Let’s go!', wrong: ['いいね！ 行かない！', 'ううん、いいね！', 'いつ 行った？'] },
  { id: 'r10', grammar: 'kedo-soft', words: ['anou', 'toire'], jp: 'あのう、すみません、トイレは…？', kana: 'あのう、すみません、トイレは…？', en: 'Um, excuse me, the toilet…?', answer: 'あそこですよ。', answerEn: 'It’s over there.', wrong: ['トイレですね、いただきます。', 'おやすみなさい。', 'へえ、そうなんだ。'] },
  { id: 'r11', grammar: 'jan', words: ['shashin'], jp: 'この 写真、いいじゃん！', kana: 'この しゃしん、いいじゃん！', en: 'This photo’s great, isn’t it!', answer: 'でしょ？', answerEn: 'Right?', wrong: ['だれ？', 'おかえり！', 'ごめんなさい。'] },
  { id: 'r12', grammar: 'tte-quote', words: ['iu'], jp: 'テツさんが、えきに 来てって。', kana: 'テツさんが、えきに きてって。', en: 'Tetsu says come to the station.', answer: 'わかった、行くね。', answerEn: 'Got it, I’ll go.', wrong: ['え、テツさんが 来るの？', 'わかった、待ってるね。', 'テツさんは だれ？'] },
]

export const POLITE: Pick[] = [
  { id: 'p1', grammar: 'jan', words: ['densha'], jp: '電車、来ないじゃん。', kana: 'でんしゃ、こないじゃん。', en: 'The train isn’t coming, is it!', answer: '電車が 来ませんね。', answerEn: 'The train isn’t coming, is it.', wrong: ['電車が 来ますね。', '電車が 来ませんでした。', '電車に のりましょう。'] },
  { id: 'p2', grammar: 'chau', jp: 'もう 食べちゃった。', kana: 'もう たべちゃった。', en: 'I already ate it all.', answer: 'もう 食べて しまいました。', answerEn: 'I have already eaten it.', wrong: ['まだ 食べて いません。', 'もう 食べましょう。', '食べて ください。'] },
  { id: 'p3', grammar: 'toku', words: ['akeru'], jp: 'まど、開けとくね。', kana: 'まど、あけとくね。', en: 'I’ll leave the window open.', answer: '窓を 開けて おきますね。', answerEn: 'I will leave the window open.', wrong: ['窓を 閉めて ください。', '窓が 開いて いました。', '窓を 開けましたか。'] },
  { id: 'p4', grammar: 'teru-contraction', words: ['terebi'], jp: 'いま、テレビ 見てる。', kana: 'いま、テレビ みてる。', en: 'I’m watching TV.', answer: '今、テレビを 見て います。', answerEn: 'I am watching TV now.', wrong: ['今、テレビを 見ました。', 'テレビを 見ましょう。', 'テレビは 見ません。'] },
  { id: 'p5', grammar: 'casual-da', jp: 'あした、休みだ。', kana: 'あした、やすみだ。', en: 'Tomorrow’s my day off.', answer: '明日は 休みです。', answerEn: 'Tomorrow is my day off.', wrong: ['明日は 休みじゃないです。', 'きのうは 休みでした。', '明日 休みましょう。'] },
  { id: 'p6', grammar: 'casual-question', jp: 'どこ 行くの？', kana: 'どこ いくの？', en: 'Where are you off to?', answer: 'どこに 行くんですか。', answerEn: 'Where are you going?', wrong: ['どこに 行きましたか。', 'どこから 来ましたか。', 'ここに いますか。'] },
  { id: 'p7', grammar: 'n-desu', jp: 'おなか いたいんだ。', kana: 'おなか いたいんだ。', en: 'My stomach hurts, you see.', answer: 'おなかが いたいんです。', answerEn: 'My stomach hurts (that’s why).', wrong: ['おなかが すきました。', 'おなかは いたくないです。', 'いたいですか。'] },
  { id: 'p8', grammar: 'tte-quote', jp: 'てんちょう、来週も 来てって。', kana: 'てんちょう、らいしゅうも きてって。', en: 'The manager says come in next week too.', answer: 'てんちょうが「来週も 来て ください」と 言いました。', answerEn: 'The manager said, “Please come next week too.”', wrong: ['てんちょうが 来週 来ます。', 'てんちょうに 来週 会いました。', '来週、てんちょうの 店へ 行きました。'] },
  { id: 'p9', grammar: 'kana-wonder', jp: 'あした、晴れるかな。', kana: 'あした、はれるかな。', en: 'I wonder if it’ll be sunny tomorrow.', answer: '明日は 晴れるでしょうか。', answerEn: 'Will it be sunny tomorrow, I wonder?', wrong: ['明日は 晴れます。', '明日は 晴れませんでした。', '明日 晴れて ください。'] },
  { id: 'p10', grammar: 'particle-drop', words: ['koohii'], jp: 'コーヒー のむ？', kana: 'コーヒー のむ？', en: 'Coffee?', answer: 'コーヒーを 飲みますか。', answerEn: 'Would you like some coffee?', wrong: ['コーヒーを 飲みました。', 'コーヒーが 好きです。', 'コーヒーを ください。'] },
  { id: 'p11', grammar: 'kedo-soft', words: ['chotto'], jp: 'ちょっと 聞きたいんだけど…', kana: 'ちょっと ききたいんだけど…', en: 'I wanted to ask you something…', answer: 'ちょっと 聞きたいんですが…', answerEn: 'I would like to ask you something…', wrong: ['もう 聞きましたか。', 'ちょっと 聞いて ください。', 'もう 聞きました。'] },
  { id: 'p12', grammar: 'connectors', jp: '雨だよ。だから、行かない。', kana: 'あめだよ。だから、いかない。', en: 'It’s raining. So I’m not going.', answer: '雨です。ですから、行きません。', answerEn: 'It is raining. Therefore, I will not go.', wrong: ['雨です。でも、行きます。', '晴れです。だから、行きます。', '雨でした。行きませんでした。'] },
  { id: 'p13', grammar: 'aizuchi', words: ['un', 'sou'], jp: 'うん、そうなんだ。', kana: 'うん、そうなんだ。', en: 'Yeah, that’s right.', answer: 'はい、そうなんです。', answerEn: 'Yes, that’s right.', wrong: ['いいえ、そうじゃないです。', 'ええと、だれですか。', 'はい、おやすみなさい。'] },
  { id: 'p14', grammar: 'yo-ne', words: ['eiga', 'omoshiroi'], jp: 'この 映画、面白いね。', kana: 'この えいが、おもしろいね。', en: 'This movie’s fun, isn’t it.', answer: 'この 映画は 面白いですね。', answerEn: 'This movie is interesting, isn’t it.', wrong: ['この 映画は つまらないですね。', 'この 映画を 見ましたか。', '面白い 映画を ください。'] },
]

/** Whose stolen voice Nopperabō speaks with in phase 3 (voice keys), and the face it gives back. */
export const STOLEN: { voice: string; face: string; name: { jp: string; en: string } }[] = [
  { voice: 'stationmaster', face: '👮', name: { jp: 'テツ', en: 'Tetsu' } },
  { voice: 'grocer', face: '👩‍🌾', name: { jp: 'マリ', en: 'Mari' } },
  { voice: 'tanuki', face: '🦝', name: { jp: 'ポン', en: 'Pon' } },
]

/** Four options for a meaning question: the right English and three decoys. */
export function meaningOptions(q: Meaning): string[] {
  return shuffle([q.en, ...q.wrong])
}

/** Four options for a pick question: the right line and three decoys. */
export function pickOptions(q: Pick): string[] {
  return shuffle([q.answer, ...q.wrong])
}

/** Item ids an answer reviews: the grammar point and the words in the line. */
export function reviewItems(q: Heard): string[] {
  return [...(q.grammar ? [`g:${q.grammar}`] : []), ...(q.words ?? []).map((w) => `w:${w}`)]
}

/** How many times the line can be heard again, per phase (phase 3 is the twist: once). */
export const REPLAYS = [Infinity, Infinity, 1]

/** Speech rate per phase: the faster it talks, the more real it gets. */
export const RATES = [0.85, 0.95, 1.1]
