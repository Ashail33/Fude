/**
 * Region 9 cutscenes: arriving at the Snowbound Temple, Yuki-onna before and
 * after her fight, and two of Fude's memories. The snow spirits remember
 * Kotone here: the night she heard snow falling and found a quiet that was
 * full rather than empty (しんしん), and the morning the bell-keeper taught
 * her to write her own name in kanji, 琴音, "the sound of a koto".
 */
import type { RegionScenes } from '../types'

export const SCENES: RegionScenes = {
  speakers: {
    kuu: { sprite: 'monk', name: 'Kuu', jp: 'くう', color: '#8fb8de' },
    yuki: { sprite: 'snowchild', name: 'Yuki', jp: 'ゆき', color: '#d6f1ff' },
    genta: { sprite: 'monk', name: 'Genta', jp: 'げんた', color: '#e6c98a' },
    yukionna: { sprite: 'yuki-onna', name: 'Yuki-onna', jp: 'ゆきおんな', color: '#9be7ff' },
  },
  pages: [
    { scene: 'memory-r9-a', region: 9, kind: 'core', title: 'The Hush of Snow', jp: 'しんしんと ふる ゆき' },
    { scene: 'memory-r9-b', region: 9, kind: 'bonus', title: 'A Name Written in Sound', jp: 'おとで かく なまえ' },
  ],
  scenes: [
    {
      id: 'arrive-snowtemple',
      title: 'The Snowbound Temple',
      bg: 'snowtemple',
      music: 'snowtemple',
      cast: ['you', 'fude'],
      steps: [
        { pause: 700 },
        { jp: 'しんしん… 雪が ふっている。おとが なにも ない。', kana: 'しんしん… ゆきが ふっている。おとが なにも ない。', en: 'Shin-shin… Snow is falling. There is no sound at all.' },
        { who: 'fude', emote: '!', jp: 'つめたい〜！ はなが こおりそう！', en: 'So cold! My nose is going to freeze!' },
        { enter: 'kuu', pause: 300 },
        { who: 'kuu', jp: 'ようこそ、雪の 寺へ。ぼくは くう。ここの でしです。', kana: 'ようこそ、ゆきの てらへ。ぼくは くう。ここの でしです。', en: 'Welcome to the Snowbound Temple. I’m Kuu, an apprentice here.' },
        { who: 'kuu', emote: '…', jp: 'でも… 寺の 字が ぜんぶ こおって しまったんです。お経も、ふだも、みんなの 名前も。', kana: 'でも… てらの じが ぜんぶ こおって しまったんです。おきょうも、ふだも、みんなの なまえも。', en: 'But… every character in the temple has frozen. The sutras, the signs, even everyone’s names.' },
        { who: 'kuu', jp: 'ろうしは じぶんの 名前が 読めなくて、ずっと だまっています。', kana: 'ろうしは じぶんの なまえが よめなくて、ずっと だまっています。', en: 'The abbot can’t read his own name, and hasn’t said a word since.' },
        { enter: 'yuki', pause: 300 },
        { who: 'yuki', emote: '…', jp: '…おかあさんが やったの。', en: '…My mother did it.' },
        { who: 'fude', emote: '?', jp: 'おかあさん？', en: 'Your mother?' },
        { who: 'yuki', jp: 'ゆきおんな。こおりの あなに いるの。…ほんとうは やさしいのに。', en: 'Yuki-onna, the snow woman. She’s in the ice cave. …She’s really gentle, you know.' },
        { who: 'fude', jp: 'りゅうの しずけさが、また ことばを たべて いるんだ…', en: 'The dragon’s quiet is eating words again…' },
        { who: 'fude', emote: '!', jp: 'でも、こおった 字は とかせる！ 漢字の 読みを となえれば、字は 目を さますよ。', kana: 'でも、こおった じは とかせる！ かんじの よみを となえれば、じは めを さますよ。', en: 'But frozen characters can be thawed! Chant a kanji’s reading, and it wakes up.' },
        { who: 'kuu', emote: '♪', jp: 'では、ここで 漢字を まなんで ください。六十の 字が、あなたを まっています。', kana: 'では、ここで かんじを まなんで ください。ろくじゅうの じが、あなたを まっています。', en: 'Then learn kanji here. Sixty characters are waiting for you: seasons, directions, family, years, and the kanji of reading and writing.' },
      ],
    },
    {
      id: 'pre-boss-r9',
      title: 'Yuki-onna',
      bg: 'snowtemple',
      music: 'boss',
      cast: ['you', 'fude'],
      steps: [
        { jp: '……。', en: '(Deep in the ice cave, even your breath makes no sound.)', pause: 1200 },
        { enter: 'yukionna', flash: '#d6f1ff', pause: 500 },
        { who: 'yukionna', jp: '…だれ？ 字を とかしに 来たの？', kana: '…だれ？ じを とかしに きたの？', en: '…Who are you? Have you come to thaw the writing?' },
        { who: 'yukionna', jp: '字が あると、こえが ふえる。こえが ふえると、うるさい。', kana: 'じが あると、こえが ふえる。こえが ふえると、うるさい。', en: 'Where there is writing, voices multiply. And voices are so loud.' },
        { who: 'yukionna', emote: '…', jp: '雪の ように、ぜんぶ しずかに したかった。ずっと、ずっと。', kana: 'ゆきの ように、ぜんぶ しずかに したかった。ずっと、ずっと。', en: 'I wanted everything quiet, like the snow. Forever and ever.' },
        { who: 'fude', emote: '!', jp: 'その しずけさ… りゅうの こえと おなじだ！', en: 'That quiet… it sounds just like the dragon!' },
        { who: 'yukionna', shake: true, jp: 'なら、読んで ごらん。わたしの こおった 字を。', kana: 'なら、よんで ごらん。わたしの こおった じを。', en: 'Then read, if you can. Read my frozen characters.' },
        { who: 'fude', jp: '{name}さん、読みで とかそう！ 音読みか 訓読みか、よく 見て！', kana: '{name}さん、よみで とかそう！ おんよみか くんよみか、よく みて！', en: '{name}, let’s thaw them with readings! On’yomi or kun’yomi: look carefully!' },
      ],
    },
    {
      id: 'post-boss-r9',
      title: 'The Thaw',
      bg: 'snowtemple',
      music: 'snowtemple',
      cast: ['you', 'fude', 'yukionna'],
      steps: [
        { who: 'yukionna', emote: '…', jp: '…あたたかい。字が… とけていく。', kana: '…あたたかい。じが… とけていく。', en: '…Warm. The characters… are melting.' },
        { flash: '#fff6d0', jp: '寺じゅうの 字が とけて、まどの 雪に ひかりが うつった。', kana: 'てらじゅうの じが とけて、まどの ゆきに ひかりが うつった。', en: 'All through the temple the characters thaw, and light glints off the snow on every window.' },
        { enter: 'yuki', who: 'yuki', emote: '!', jp: 'おかあさん！', en: 'Mother!' },
        { who: 'yukionna', jp: 'ゆき… ごめんね。しずけさが、さびしくて… こわく なって いたの。', en: 'Yuki… I’m sorry. The quiet felt so lonely… it frightened me.' },
        { who: 'yuki', emote: '♥', jp: 'さびしくないよ。雪は しずかでも、いっしょに いれば あったかいもん。', kana: 'さびしくないよ。ゆきは しずかでも、いっしょに いれば あったかいもん。', en: 'It isn’t lonely. Snow is quiet, but it’s warm when we’re together.' },
        { who: 'yukionna', jp: '冬の かけじくを かえします。ろうしに わたして ください。', kana: 'ふゆの かけじくを かえします。ろうしに わたして ください。', en: 'I’ll give back the winter scroll. Please take it to the abbot.' },
        { who: 'fude', emote: '♪', jp: 'つぎは 雲の都！ 雲の 上の みやこへ 行きましょう！', kana: 'つぎは くものみやこ！ くもの うえの みやこへ いきましょう！', en: 'Next is the Cloud Capital! On to the city above the clouds, through the pass to the north-east!' },
      ],
    },
    // ─── Fude's memories (the snow spirits remember Kotone) ────────────
    {
      id: 'memory-r9-a',
      title: 'Memory: The Hush of Snow',
      bg: 'snowtemple',
      memory: true,
      music: 'title',
      cast: ['kotone', 'fude'],
      steps: [
        { pause: 900 },
        { jp: '雪の よる。ことねと フデは、山の 寺に とまった。', kana: 'ゆきの よる。ことねと フデは、やまの てらに とまった。', en: 'A snowy night. Kotone and Fude stayed at the mountain temple.' },
        { who: 'kotone', jp: 'しーっ。きいて、フデ。', en: 'Shh. Listen, Fude.' },
        { who: 'fude', emote: '?', jp: '…なにも きこえないよ？', en: '…I can’t hear anything?' },
        { who: 'kotone', emote: '♪', jp: 'そう。雪が ふる おと。「しんしん」って いうの。', kana: 'そう。ゆきが ふる おと。しんしんって いうの。', en: 'Exactly. That’s the sound of snow falling. It’s called “shin-shin”.' },
        { who: 'kotone', jp: 'おとの ない おと。でも、からっぽじゃ ない。雪で いっぱいの しずけさ。', kana: 'おとの ない おと。でも、からっぽじゃ ない。ゆきで いっぱいの しずけさ。', en: 'A sound with no sound. But it isn’t empty. It’s a quiet full of snow.' },
        { enter: 'yukionna', who: 'yukionna', jp: '…わたしの 雪に、名前を くれるの？', kana: '…わたしの ゆきに、なまえを くれるの？', en: '(A pale woman steps out of the snow.) …You would give my snowfall a name?' },
        { who: 'kotone', jp: 'うん。しんしん。あなたの しずけさは、さびしくない しずけさ。', en: 'Yes. Shin-shin. Yours is a quiet that isn’t lonely.' },
        { who: 'kotone', emote: '…', jp: 'あの こにも… いつか、さびしくない しずけさの 名前を あげたいな。', kana: 'あの こにも… いつか、さびしくない しずけさの なまえを あげたいな。', en: 'Someday I want to give that lonely one a name like that too… a name for a quiet that isn’t lonely.' },
        { exit: 'yukionna', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '…', jp: '「しんしん」… いっぱいの しずけさ。ことねは ずっと、その 名前を さがしてたんだ。', kana: 'しんしん… いっぱいの しずけさ。ことねは ずっと、その なまえを さがしてたんだ。', en: '“Shin-shin”… a quiet that is full. Kotone was searching for that kind of name all along.' },
      ],
    },
    {
      id: 'memory-r9-b',
      title: 'Memory: A Name Written in Sound',
      bg: 'snowtemple',
      memory: true,
      music: 'title',
      cast: ['kotone', 'fude'],
      steps: [
        { pause: 900 },
        { jp: '雪の 寺の 朝。かねつきの げんたが、ことねに ふでを わたした。', kana: 'ゆきの てらの あさ。かねつきの げんたが、ことねに ふでを わたした。', en: 'Morning at the snow temple. The bell-keeper handed Kotone a brush. (The bell-keepers here have all been called Genta; the name is handed down with the bell.)' },
        { enter: 'genta', who: 'genta', jp: 'ことね、じぶんの 名前を 漢字で 書いた ことは あるか？', kana: 'ことね、じぶんの なまえを かんじで かいた ことは あるか？', en: 'Kotone, have you ever written your own name in kanji?' },
        { who: 'kotone', emote: '?', jp: 'ううん。ひらがなだけ。', en: 'No. Only in hiragana.' },
        { who: 'genta', jp: 'では おしえよう。「こと」は 琴。かなでる 琴の 琴じゃ。', kana: 'では おしえよう。こと は こと。かなでる ことの こと じゃ。', en: 'Then let me teach you. “Koto” is 琴, the koto, the long harp you play.' },
        { who: 'genta', jp: '「ね」は 音。おとの 音。ほら、「おんよみ」の 音じゃよ。', kana: 'ね は おと。おとの おと。ほら、おんよみの おん じゃよ。', en: 'And “ne” is 音, the kanji for sound. Look: the same 音 as in on’yomi.' },
        { flash: '#fff6d0', jp: '琴音。', kana: 'ことね。', en: '琴音. Kotone.' },
        { who: 'kotone', emote: '!', jp: '琴の 音… わたしの 名前、おとなんだ！', kana: 'ことの ね… わたしの なまえ、おとなんだ！', en: 'The sound of a koto… my name is a sound!' },
        { who: 'fude', emote: '♪', jp: 'きれいな 字！', kana: 'きれいな じ！', en: 'What beautiful characters!' },
        { who: 'kotone', jp: 'おとの 名前の わたしが、しずけさに 名前を つけるの？ …ふふ、へんなの。', kana: 'おとの なまえの わたしが、しずけさに なまえを つけるの？ …ふふ、へんなの。', en: 'A girl named after a sound, giving a name to the quiet? …Hehe, how funny.' },
        { who: 'genta', jp: '音が やむ ところで、つぎの 音が まっておる。しずけさは、音の ふるさとじゃ。', kana: 'おとが やむ ところで、つぎの おとが まっておる。しずけさは、おとの ふるさとじゃ。', en: 'Where one sound ends, the next one is waiting. Quiet is where sound comes home.' },
        { who: 'kotone', emote: '♥', jp: '…音の ふるさと。おぼえておく！', kana: '…おとの ふるさと。おぼえておく！', en: '…Where sound comes home. I’ll remember that!' },
        { exit: 'genta', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '♥', jp: '琴音… ことねの 名前は、こう 書くんだ。もう わすれない。ぜったい。', kana: 'ことね… ことねの なまえは、こう かくんだ。もう わすれない。ぜったい。', en: '琴音… so that’s how Kotone’s name is written. I won’t forget it again. Never.' },
      ],
    },
  ],
}
