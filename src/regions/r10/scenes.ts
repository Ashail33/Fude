import type { RegionScenes } from '../types'

/**
 * The Cloud Capital's cutscenes. Raijin, tricked by the dragon's quiet,
 * drums so hard that every sentence in the sky shatters; Fūjin's winds blow
 * the pieces away. The memory pages: Kotone in the sky long ago, hearing the
 * hush before thunder, and a frightened thunder child, and beginning to
 * understand that the quiet needs a gentle name, not a frightening one.
 */
export const SCENES: RegionScenes = {
  speakers: {
    amane: { sprite: 'tennin', name: 'Amane', jp: 'アマネ', color: '#c9b8ff' },
    hakase: { sprite: 'scholar', name: 'The Sky-Scholar', jp: 'そらの はかせ', color: '#8fb6ff' },
    raitaro: { sprite: 'child', name: 'Raitarō', jp: 'らいたろう', color: '#ffe066' },
    raijin: { sprite: 'raijin', name: 'Raijin', jp: 'らいじん', color: '#e2432f' },
  },

  pages: [
    { scene: 'memory-r10-a', region: 10, kind: 'core', title: 'The Breath Before Thunder', jp: 'かみなりの まえの いき' },
    { scene: 'memory-r10-b', region: 10, kind: 'bonus', title: 'A Name That Says “You Can Stay”', jp: 'いても いいよの なまえ' },
  ],

  scenes: [
    {
      id: 'arrive-clouds',
      title: 'The Cloud Capital',
      bg: 'clouds',
      music: 'clouds',
      cast: ['you', 'fude'],
      steps: [
        { pause: 600 },
        { jp: 'にじの はしを わたると、雲の 上に みやこが ういて いた。', kana: 'にじの はしを わたると、くもの うえに みやこが ういて いた。', en: 'Across the rainbow bridge, a whole city floats on the clouds.' },
        { who: 'fude', emote: '!', jp: 'すごい！ 天気より 上に ある まちです！', kana: 'すごい！ てんきより うえに ある まちです！', en: 'Amazing! A town that sits above the weather!' },
        { enter: 'amane', pause: 300 },
        { who: 'amane', shake: true, jp: 'よう… こそ… 雲の… ドン！', kana: 'よう… こそ… くもの… ドン！', en: 'Wel… come… to the Cloud… BOOM!' },
        { who: 'amane', emote: '…', jp: '…ごめんなさい。たいこの 音で、ことばが われて しまうの。', kana: 'ごめんなさい。たいこの おとで、ことばが われて しまうの。', en: '…Sorry. The drums keep breaking my words apart.' },
        { who: 'amane', jp: 'わたしは てんにんの アマネ。この みやこでは、だれも ぶんを さいごまで いえないの。', en: 'I’m Amane, a celestial maiden. In this city, no one can finish a sentence anymore.' },
        { who: 'fude', emote: '?', jp: 'たいこ？ だれが たたいて いるんですか。', en: 'Drums? Who is playing them?' },
        { who: 'amane', jp: 'かみなりさま、らいじんさまよ。いつもは やさしい 音なのに、この ごろは ずっと…', kana: 'かみなりさま、らいじんさまよ。いつもは やさしい おとなのに、この ごろは ずっと…', en: 'The thunder god, Raijin. His drums are usually gentle, but lately they never stop…' },
        { shake: true, flash: '#ffe066', jp: 'ドドン！', en: 'BA-BOOM!' },
        { who: 'fude', emote: '…', jp: 'ことばが ばらばらに… これも りゅうの しわざ かもしれません。', en: 'Words smashed to pieces… this might be the dragon’s doing too.' },
        { who: 'fude', jp: 'ここでは ことばを つなぐ まほうを まなびましょう。「〜より」「〜たら」「〜と 思う」… ぶんを まるごと いえる ように！', kana: 'ここでは ことばを つなぐ まほうを まなびましょう。より、たら、と おもう… ぶんを まるごと いえる ように！', en: 'Here, let’s learn the magic that joins words together: “than”, “if”, “I think”… so we can say whole sentences again!' },
        { who: 'you', jp: 'はい！ がんばります！', en: 'Right! I’ll do my best!' },
      ],
    },
    {
      id: 'pre-boss-r10',
      title: 'Raijin of the Thunder Drums',
      bg: 'clouds',
      music: 'boss',
      cast: ['you', 'fude', 'amane'],
      steps: [
        { shake: true, jp: 'ドン！ ドドン！ ドン！', en: 'BOOM! BA-BOOM! BOOM!' },
        { enter: 'raijin', flash: '#ffe066', shake: true, pause: 500 },
        { who: 'raijin', emote: '💢', jp: 'だれだ！ わしの たいこを とめに きたのか！', en: 'Who goes there! Have you come to stop my drums?!' },
        { jp: 'その よこで、ふうじんが かぜの ふくろを ひらいた。ことばが ちぎれて とんで いく。', en: 'Beside him, Fūjin the wind god opens his bag of winds. Words are torn loose and blown away.' },
        { who: 'fude', jp: 'らいじんさま、どうして そんなに たたくんですか。', en: 'Lord Raijin, why are you drumming so hard?' },
        { who: 'raijin', emote: '…', jp: 'しずけさが… きこえるのだ。かみなりの まえの、あの しずけさが。', en: 'Because I can hear the quiet… that hush that comes before the thunder.' },
        { who: 'raijin', jp: 'くろい こえが いった。「たたけば、しずけさは きこえない」と。だから たたく！ ずっと たたく！', en: 'A dark voice told me: “If you drum, you won’t hear the quiet.” So I drum! I drum and never stop!' },
        { who: 'amane', emote: '!', jp: 'その こえ… りゅうの こえだわ！', en: 'That voice… it’s the dragon’s!' },
        { who: 'fude', jp: '{name}さん、たいこの 一つ 一つに、ただしい かたちで こたえましょう！「ない」「られる」「たら」「ば」…', kana: '{name}さん、たいこの ひとつ ひとつに、ただしい かたちで こたえましょう！ ない、られる、たら、ば…', en: '{name}, let’s answer every drumbeat in the right form! ない, られる, たら, ば…' },
        { who: 'you', jp: 'まかせて ください！', en: 'Leave it to me!' },
      ],
    },
    {
      id: 'post-boss-r10',
      title: 'The Quiet Before Thunder',
      bg: 'clouds',
      music: 'clouds',
      cast: ['you', 'fude', 'amane', 'raijin'],
      steps: [
        { who: 'raijin', emote: '…', jp: 'ドン… ………。', en: '(The last drumbeat fades… and then, silence.)' },
        { jp: 'しずけさが おりて きた。でも、こわく なかった。', en: 'The quiet settles over the city. But it isn’t frightening at all.' },
        { who: 'raijin', jp: '…きこえる。しずけさの 中で、雨が ふりはじめる 音が。', kana: 'きこえる。しずけさの なかで、あめが ふりはじめる おとが。', en: '…I can hear it. Inside the quiet, the sound of rain beginning to fall.' },
        { who: 'raijin', jp: 'かみなりは、しずけさが あるから ひびくのだな。わしは なにを こわがって いたのか。', en: 'Thunder only rings out because the quiet comes first. What was I so afraid of?' },
        { who: 'amane', emote: '♪', flash: '#f4ecd8', jp: 'きいて！ みやこの みんなが、ぶんを さいごまで 話してる！', kana: 'きいて！ みやこの みんなが、ぶんを さいごまで はなしてる！', en: 'Listen! Everyone in the city is finishing their sentences again!' },
        { who: 'raijin', jp: 'ちいさな まどうしよ、ありがとう。ひがしの 空を 見よ。', kana: 'ちいさな まどうしよ、ありがとう。ひがしの そらを みよ。', en: 'Little mage, you have my thanks. Look to the eastern sky.' },
        { who: 'raijin', jp: 'そうぞうの とうが ある。しずけさは もう、あそこで まって いる。', en: 'There stands the Tower of Creation. The quiet is already waiting for you there.' },
        { who: 'fude', emote: '!', jp: 'そうぞうの とう… さいごの のぼりです。かわる キメラと、こくうの りゅうが いる ところ。', en: 'The Tower of Creation… the last climb. Where the Shifting Chimera and the Void Dragon are waiting.' },
        { who: 'amane', jp: 'あなたたちなら、きっと できると 思う。', kana: 'あなたたちなら、きっと できると おもう。', en: 'I think you two can surely do it.' },
        { who: 'you', jp: 'いきましょう、フデ。', en: 'Let’s go, Fude.' },
        { who: 'fude', emote: '♪', jp: 'はい！ ならった ことばを、ぜんぶ もって！', en: 'Yes! And we’ll bring every word we’ve learned!' },
      ],
    },

    // ─── Memory pages ──────────────────────────────────────────────────
    {
      id: 'memory-r10-a',
      title: 'Memory: The Breath Before Thunder',
      bg: 'clouds',
      memory: true,
      music: 'title',
      cast: ['fude'],
      steps: [
        { pause: 900 },
        { jp: 'むかしむかし、雲の みやこ。あらしが ちかづいて いた。', kana: 'むかしむかし、くもの みやこ。あらしが ちかづいて いた。', en: 'Long, long ago, in the Cloud Capital. A storm was coming.' },
        { enter: 'scribe', who: 'scribe', emote: '?', jp: 'フデ、きこえる？ 風が やんだよ。とりも なかない。', kana: 'フデ、きこえる？ かぜが やんだよ。とりも なかない。', en: 'Fude, can you hear it? The wind has stopped. Even the birds are silent.' },
        { who: 'fude', jp: 'かみなりの まえの しずけさ… みんな、こわがって かくれちゃった。', en: 'The hush before thunder… everyone’s gone to hide.' },
        { enter: 'shadow', who: 'shadow', emote: '…', jp: '…………。', en: '(Something small and dusk-coloured trembles at the edge of the cloud.)' },
        { who: 'scribe', jp: 'あなたも ふるえて いるの？ じぶんが こわいの？', en: 'Are you trembling too? Are you scared of yourself?' },
        { who: 'scribe', jp: 'でもね、あなたが いるから、かみなりが ひびくんだよ。', en: 'But you know what? It’s because you’re here that the thunder can ring out.' },
        { who: 'scribe', emote: '…', jp: 'なまえを あげたい。「あらしの まえの…」 …ううん、ちがう。', en: 'I want to give you a name. “The calm before the…” …No. That’s not it.' },
        { who: 'scribe', jp: 'こわい ものの まえに ある なまえは、だめ。もっと やさしい なまえじゃ ないと。', en: 'A name that only means “before something scary” won’t do. It has to be a gentler name.' },
        { shake: true, flash: '#ffe066', exit: 'shadow', jp: 'ゴロゴロ… ドーン！', en: 'Rumble… BOOM!' },
        { exit: 'scribe', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '?', jp: 'ことねは、しずけさを こわい ものだと 思って いなかった…', kana: 'ことねは、しずけさを こわい ものだと おもって いなかった…', en: 'Kotone never thought the quiet was something to fear…' },
        { who: 'fude', jp: 'りゅうも、ほんとうは… じぶんが こわかったのかな。', en: 'Maybe the dragon, deep down, was just… afraid of itself.' },
      ],
    },
    {
      id: 'memory-r10-b',
      title: 'Memory: A Name That Says “You Can Stay”',
      bg: 'clouds',
      memory: true,
      music: 'title',
      cast: ['fude'],
      steps: [
        { pause: 800 },
        { jp: 'てんにんたちが おぼえて いた。ずっと むかしの、ある あらしの よるの こと。', en: 'The celestial maidens remembered. A stormy night, long, long ago.' },
        { enter: 'raitaro', who: 'raitaro', emote: '…', jp: 'ぼく、はじめての かみなり、ならせない… しずかに なると、こわく なるんだ。', en: 'I can’t do my first thunder… whenever it goes quiet, I get scared.' },
        { enter: 'scribe', who: 'scribe', jp: 'らいたろう。しずかな ときはね、いきを すう ときだよ。', en: 'Raitarō. When it goes quiet, that’s the time to breathe in.' },
        { who: 'scribe', emote: '♪', jp: 'すって… すって… はい、いま！', en: 'Breathe in… breathe in… now!' },
        { who: 'raitaro', shake: true, flash: '#ffe066', jp: 'ゴロゴロ… ドン！ …できた！ できたよ！', en: 'Rumble… BOOM! …I did it! I did it!' },
        { who: 'fude', emote: '♥', jp: 'しずけさが、かみなりを たすけたんだね。', en: 'The quiet helped the thunder.' },
        { who: 'scribe', jp: 'ねえ フデ、しずけさの なまえ、また 考えたの。', kana: 'ねえ フデ、しずけさの なまえ、また かんがえたの。', en: 'Hey, Fude. I’ve been thinking about a name for the quiet again.' },
        { who: 'scribe', emote: '…', jp: '「むおん」は、つめたい。「ま」は、みじかすぎる。', en: '“Muon”, soundlessness, is too cold. “Ma”, the pause, is too short.' },
        { who: 'scribe', jp: '「いても いいよ」って いえる なまえが いい。そんな なまえ、きっと ある。', en: 'I want a name that says “you can stay.” There has to be one.' },
        { exit: 'raitaro', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '!', jp: '「いても いいよ」の なまえ… ことねは、もう すぐ そこまで きて いたんだ。', en: 'A name that says “you can stay”… Kotone was so close to finding it.' },
      ],
    },
  ],
}
