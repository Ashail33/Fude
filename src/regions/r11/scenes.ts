import type { RegionScenes } from '../types'

/**
 * The Chattering Station Town's cutscenes. The dragon's hunger is eating
 * the town's small talk: Nopperabō, the faceless yokai, has wiped the
 * townsfolk's faces, and with their faces went their greetings, their
 * "yeah"s and "really?"s. People can only grunt nouns, and no train can
 * leave, because nobody can call out いってらっしゃい.
 *
 * The memory pages: Kotone at a post town long ago, learning that a
 * greeting is the little word that stands between strangers and friends,
 * and saying good morning to the quiet itself, every single day.
 */
export const SCENES: RegionScenes = {
  speakers: {
    tetsu: { sprite: 'stationmaster', name: 'Tetsu', jp: 'テツ', color: '#5b8bd9' },
    mari: { sprite: 'grocer', name: 'Mari', jp: 'マリ', color: '#f28a2e' },
    pon: { sprite: 'tanuki', name: 'Pon', jp: 'ポン', color: '#c78a4f' },
    nopperabo: { sprite: 'nopperabo', name: 'Nopperabō', jp: 'のっぺらぼう', color: '#d9cbab' },
  },

  pages: [
    { scene: 'memory-r11-a', region: 11, kind: 'core', title: 'The Word Between Strangers', jp: 'しらない ひとへの ひとこと' },
    { scene: 'memory-r11-b', region: 11, kind: 'bonus', title: 'Good Morning, Quiet', jp: 'おはよう、しずけさ' },
  ],

  scenes: [
    {
      id: 'arrive-ekimae',
      title: 'The Chattering Station Town',
      bg: 'ekimae',
      music: 'ekimae',
      cast: ['you', 'fude'],
      steps: [
        { pause: 600 },
        { jp: '雲の かいだんを おりると、えきの ある 町に ついた。', kana: 'くもの かいだんを おりると、えきの ある まちに ついた。', en: 'At the foot of the cloud stair lies a town built round a railway station.' },
        { jp: '人は いっぱい いる。でも… しずかすぎる。', kana: 'ひとは いっぱい いる。でも… しずかすぎる。', en: 'There are people everywhere. And yet… it’s far too quiet.' },
        { who: 'fude', emote: '?', jp: 'あれ？ だれも あいさつを して いません…', en: 'Huh? Nobody is greeting anybody…' },
        { enter: 'pon', pause: 300 },
        { who: 'pon', emote: '!', jp: 'ぽん！ おはよう！ …わあ、かえして くれた 人、ひさしぶり！', kana: 'ぽん！ おはよう！ …わあ、かえして くれた ひと、ひさしぶり！', en: 'Pon! Good morning! …Wow, someone who answers! It’s been ages!' },
        { who: 'you', jp: 'おはよう！', en: 'Good morning!' },
        { who: 'pon', emote: '♪', jp: 'ぼく、ポン！ この 町の たぬき。ねえねえ、聞いて！ たいへんなんだ！', kana: 'ぼく、ポン！ この まちの たぬき。ねえねえ、きいて！ たいへんなんだ！', en: 'I’m Pon! This town’s tanuki. Hey, listen! Something awful’s happened!' },
        { who: 'pon', jp: 'のっぺらぼうって おばけが、みんなの 顔を けしちゃったの。顔と いっしょに、ちいさな ことばも きえちゃった。', kana: 'のっぺらぼうって おばけが、みんなの かおを けしちゃったの。かおと いっしょに、ちいさな ことばも きえちゃった。', en: 'A ghost called Nopperabō wiped everyone’s faces off. And the little words went with their faces.' },
        { who: 'pon', jp: '「おはよう」も「うん」も「へえ」も ない。みんな、もの の なまえしか 言えないんだ。', kana: 'おはようも、うんも、へえも ない。みんな、もの の なまえしか いえないんだ。', en: 'No “good morning”, no “yeah”, no “really?”. Everyone can only say the names of things.' },
        { who: 'pon', emote: '…', jp: 'だから 電車も 出られない。「いってらっしゃい」って 言える 人が いないから。', kana: 'だから でんしゃも でられない。いってらっしゃいって いえる ひとが いないから。', en: 'So the trains can’t leave, either. There’s nobody who can call out “off you go”.' },
        { who: 'fude', jp: 'りゅうの はらぺこが、こんどは まいにちの おしゃべりを たべて いる…', en: 'The dragon’s hunger is eating the town’s everyday chatter now…' },
        { who: 'fude', jp: '{name}さん、ここでは 耳で 聞く まほうを まなびましょう。ともだちの はなしかた、「〜んだ」「〜って」「〜てる」… 聞いて わかる ように！', kana: '{name}さん、ここでは みみで きく まほうを まなびましょう。ともだちの はなしかた、んだ、って、てる… きいて わかる ように！', en: '{name}, here let’s learn the magic of listening: how friends really talk, 〜んだ, 〜って, 〜てる… so we can follow it by ear!' },
        { who: 'you', jp: 'うん、がんばる！', en: 'Yeah, I’ll do my best!' },
        { who: 'pon', emote: '♥', jp: 'やった！ じゃあ まず、えきの テツさんに 会って！', kana: 'やった！ じゃあ まず、えきの テツさんに あって！', en: 'Yay! Well then, first go and meet Tetsu at the station!' },
      ],
    },
    {
      id: 'pre-boss-r11',
      title: 'Nopperabō of the Last Platform',
      bg: 'ekimae',
      music: 'boss',
      cast: ['you', 'fude', 'tetsu'],
      steps: [
        { jp: 'ホームの いちばん はしに、だれかが 立って いた。', kana: 'ホームの いちばん はしに、だれかが たって いた。', en: 'At the very end of the platform, someone is standing.' },
        { who: 'you', jp: 'あのう… すみません。', en: 'Um… excuse me.' },
        { enter: 'nopperabo', pause: 500 },
        { who: 'nopperabo', emote: '…', jp: '…………。', en: '(It turns round. Where its face should be, there is nothing. Smooth as an egg.)' },
        { who: 'fude', shake: true, emote: '!', jp: 'か、顔が… ない！', kana: 'か、かおが… ない！', en: 'I-its face… it’s gone!' },
        { who: 'nopperabo', jp: 'あいさつ？ いらない。顔も いらない。だれも、わたしに あいさつ なんか しなかった。', kana: 'あいさつ？ いらない。かおも いらない。だれも、わたしに あいさつ なんか しなかった。', en: 'Greetings? Not needed. Faces? Not needed. Nobody ever greeted me.' },
        { who: 'nopperabo', jp: 'みんな、わたしを 見ると さけんで にげた。だから、みんなの 顔も けして あげた。おそろいだよ。', kana: 'みんな、わたしを みると さけんで にげた。だから、みんなの かおも けして あげた。おそろいだよ。', en: 'Everyone who saw me screamed and ran. So I wiped their faces too. Now we match.' },
        { who: 'tetsu', emote: '💢', jp: '…電車。…出られない。…', kana: '…でんしゃ。…でられない。…', en: '…Train. …Can’t leave. …' },
        { who: 'nopperabo', jp: 'くろい こえが いった。「ちいさな ことばを けせば、だれも きずつかない」って。', kana: 'くろい こえが いった。ちいさな ことばを けせば、だれも きずつかないって。', en: 'A dark voice told me: “Wipe away the little words, and nobody gets hurt.”' },
        { who: 'fude', jp: 'りゅうの こえ… また！', kana: 'りゅうの こえ… また！', en: 'The dragon’s voice… again!' },
        { who: 'fude', jp: '{name}さん、あいては 顔が ないから、字も 見えないかも。耳で 聞いて、ちゃんと へんじを しましょう！', kana: '{name}さん、あいては かおが ないから、じも みえないかも。みみで きいて、ちゃんと へんじを しましょう！', en: '{name}, it has no face, so we may not see its words written. Listen with your ears and answer properly!' },
        { who: 'you', jp: 'うん。聞いてるよ、のっぺらぼう。', kana: 'うん。きいてるよ、のっぺらぼう。', en: 'Yeah. I’m listening, Nopperabō.' },
      ],
    },
    {
      id: 'post-boss-r11',
      title: 'Off You Go',
      bg: 'ekimae',
      music: 'ekimae',
      cast: ['you', 'fude', 'pon', 'nopperabo'],
      steps: [
        { who: 'nopperabo', emote: '…', jp: '…どうして。どうして、にげないの。', en: '…Why. Why don’t you run away?' },
        { who: 'you', jp: 'だって、ずっと 話して たじゃん。', kana: 'だって、ずっと はなして たじゃん。', en: 'Well, we’ve been talking this whole time, haven’t we.' },
        { who: 'pon', jp: 'そう そう！ おしゃべりの あいては、もう ともだちだよ！', en: 'Exactly! Anyone you chat with is already a friend!' },
        { who: 'you', jp: '…こんにちは、のっぺらぼう。', en: '…Hello, Nopperabō.' },
        { flash: '#f4ecd8', jp: 'つるんとした 顔に、ふわっと えがおが うかんだ。目も 口も ないのに、たしかに わらって いた。', kana: 'つるんとした かおに、ふわっと えがおが うかんだ。めも くちも ないのに、たしかに わらって いた。', en: 'A smile drifts up onto the smooth face. It has no eyes and no mouth, and yet it is very clearly smiling.' },
        { who: 'nopperabo', jp: '…こんにちは。はじめて、言われた。はじめて、言った。', kana: '…こんにちは。はじめて、いわれた。はじめて、いった。', en: '…Hello. The first time anyone said it to me. The first time I said it.' },
        { exit: 'nopperabo', jp: 'のっぺらぼうが 手を ふると、町じゅうの 顔が もどって きた。', kana: 'のっぺらぼうが てを ふると、まちじゅうの かおが もどって きた。', en: 'Nopperabō waves a hand, and all over town the faces come back.' },
        { enter: 'tetsu', who: 'tetsu', emote: '!', jp: '…あ。あ、あ。…声が 出る！ よし… 一ばんせん、はっしゃ！ いってらっしゃい！', kana: '…あ。あ、あ。…こえが でる！ よし… いちばんせん、はっしゃ！ いってらっしゃい！', en: '…Ah. Ah, ah. …My voice works! Right then… platform one, departing! Off you go!' },
        { shake: true, jp: 'ピリリリリ… ガタン、ゴトン。とまって いた 電車が、ゆっくり うごきだした。', kana: 'ピリリリリ… ガタン、ゴトン。とまって いた でんしゃが、ゆっくり うごきだした。', en: 'Brrrring… clackety-clack. The train that stood still all day begins, slowly, to roll.' },
        { who: 'pon', emote: '♪', jp: '聞こえる？ 「おはよう」「おかえり」「へえ、ほんと？」… 町が おしゃべりを してる！', kana: 'きこえる？ おはよう、おかえり、へえ、ほんと？… まちが おしゃべりを してる！', en: 'Hear that? “Morning!” “Welcome back!” “Ooh, really?” …The town is chattering again!' },
        { who: 'tetsu', jp: 'ありがとな。つぎの 電車は、ひがしの こころの たにまで 行く。きもちの ことばが ねむって いる たにだ。', kana: 'ありがとな。つぎの でんしゃは、ひがしの こころの たにまで いく。きもちの ことばが ねむって いる たにだ。', en: 'Thanks, really. The next train runs east, all the way to the Valley of Hearts: a valley where the words for feelings lie sleeping.' },
        { who: 'fude', emote: '!', jp: 'こころの たに… あいさつの つぎは、きもち。そうぞうの とうは、その さきです。', kana: 'こころの たに… あいさつの つぎは、きもち。そうぞうの とうは、その さきです。', en: 'The Valley of Hearts… after greetings, feelings. The Tower of Creation lies beyond it.' },
        { who: 'tetsu', jp: 'じゃあ、きを つけてな。…いってらっしゃい！', kana: 'じゃあ、きを つけてな。…いってらっしゃい！', en: 'Well then, take care. …Off you go!' },
        { who: 'you', jp: 'いってきます！', en: 'See you later!' },
      ],
    },

    // ─── Memory pages ──────────────────────────────────────────────────
    {
      id: 'memory-r11-a',
      title: 'Memory: The Word Between Strangers',
      bg: 'ekimae',
      memory: true,
      music: 'title',
      cast: ['fude'],
      steps: [
        { pause: 900 },
        { jp: 'むかしむかし、ここには まだ えきも 電車も なかった。たびびとが とまる、ちいさな しゅくばが あった。', kana: 'むかしむかし、ここには まだ えきも でんしゃも なかった。たびびとが とまる、ちいさな しゅくばが あった。', en: 'Long, long ago, there was no station here and no trains. Only a little post town where travellers stopped for the night.' },
        { enter: 'scribe', who: 'scribe', jp: 'ねえ フデ、見て。みんな、すれちがう とき、なにも 言わないね。', kana: 'ねえ フデ、みて。みんな、すれちがう とき、なにも いわないね。', en: 'Hey Fude, look. When people pass each other, nobody says a thing.' },
        { who: 'fude', jp: 'しらない 人どうし だから かな。', kana: 'しらない ひとどうし だから かな。', en: 'Maybe because they’re strangers.' },
        { enter: 'shadow', who: 'shadow', emote: '…', jp: '…………。', en: '(Between two travellers who pass without a word, something small and dusk-coloured lingers in the gap.)' },
        { who: 'scribe', emote: '!', jp: 'あ… あの ふたりの あいだに、なにか いる。', en: 'Oh… there’s something in between those two.' },
        { who: 'scribe', jp: 'しらない 人と ともだちの あいだ。そこに ある ことばに、まだ なまえが ないんだ。', kana: 'しらない ひとと ともだちの あいだ。そこに ある ことばに、まだ なまえが ないんだ。', en: 'Between a stranger and a friend. The word that belongs there doesn’t have a name yet.' },
        { who: 'scribe', jp: '「おはよう」「こんにちは」「おやすみ」… ちいさくて、いみも あまり ない ことば。でも、それが ないと、ずっと しらない 人の まま。', kana: 'おはよう、こんにちは、おやすみ… ちいさくて、いみも あまり ない ことば。でも、それが ないと、ずっと しらない ひとの まま。', en: '“Good morning.” “Hello.” “Good night.” Tiny words that hardly mean anything. But without them, strangers stay strangers forever.' },
        { who: 'scribe', emote: '♪', jp: 'きめた。この ことばたちを「あいさつ」って よぼう。', en: 'I’ve decided. Let’s call these words “aisatsu”: greetings.' },
        { who: 'scribe', jp: '…それから。おはよう、ちいさな かげさん。', en: '…And also. Good morning, little shadow.' },
        { who: 'shadow', emote: '?', jp: '………？', en: '(The shadow freezes. No one has ever greeted it before.)' },
        { exit: 'scribe', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '…', jp: 'ことねは、しずけさにも あいさつを したんだ…', en: 'Kotone even said good morning to the quiet…' },
        { who: 'fude', jp: 'あいさつは、「あなたが そこに いるの、知ってるよ」って いう ことば なんですね。', kana: 'あいさつは、あなたが そこに いるの、しってるよって いう ことば なんですね。', en: 'A greeting is a word that says, “I know you’re there.”' },
      ],
    },
    {
      id: 'memory-r11-b',
      title: 'Memory: Good Morning, Quiet',
      bg: 'ekimae',
      memory: true,
      music: 'title',
      cast: ['fude'],
      steps: [
        { pause: 800 },
        { jp: '町の ようかいたちが おぼえて いた。ふでを もった 女の子が、まいあさ しゅくばの はしで 言って いた ことばを。', kana: 'まちの ようかいたちが おぼえて いた。ふでを もった おんなのこが、まいあさ しゅくばの はしで いって いた ことばを。', en: 'The town’s spirits remembered. Every morning, at the edge of the post town, a girl with a brush said the same words.' },
        { enter: 'scribe', who: 'scribe', emote: '♪', jp: 'おはよう、しずけさ。きょうも いい 天気だね。', kana: 'おはよう、しずけさ。きょうも いい てんきだね。', en: 'Good morning, quiet. Lovely weather again today, isn’t it.' },
        { enter: 'shadow', who: 'shadow', jp: '…………。', en: '(The quiet says nothing. But it has come a little closer than yesterday.)' },
        { who: 'fude', jp: 'ことね、まいにち 言ってるけど… へんじ、ないよ？', kana: 'ことね、まいにち いってるけど… へんじ、ないよ？', en: 'Kotone, you say it every day, but… it never answers?' },
        { who: 'scribe', jp: 'うん。でも いいの。あいさつは、へんじが なくても とどくから。', kana: 'うん。でも いいの。あいさつは、へんじが なくても とどくから。', en: 'Mm. That’s okay. A greeting gets there even without an answer.' },
        { who: 'scribe', jp: 'あのね、フデ。この子の なまえも、あいさつ みたいな なまえが いいな。', kana: 'あのね、フデ。このこの なまえも、あいさつ みたいな なまえが いいな。', en: 'You know, Fude, I think this one’s name should be like a greeting too.' },
        { who: 'scribe', jp: 'まいにち よべる なまえ。よぶ たびに、「ここに いて いいよ」って つたわる なまえ。', kana: 'まいにち よべる なまえ。よぶ たびに、ここに いて いいよって つたわる なまえ。', en: 'A name you can call every day. A name that says “you can stay here” every time you call it.' },
        { who: 'shadow', emote: '♥', jp: '……お……は……', en: '(For just a moment, the quiet trembles, as if it is trying to say something back.)' },
        { exit: 'shadow', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '!', jp: 'しずけさは、へんじを しようと して いたんだ…', en: 'The quiet was trying to answer her…' },
        { who: 'fude', jp: 'ことね。あなたの さがして いた なまえ、もう すぐ 見つかるよ。', kana: 'ことね。あなたの さがして いた なまえ、もう すぐ みつかるよ。', en: 'Kotone. The name you were looking for: we’re almost there.' },
      ],
    },
  ],
}
