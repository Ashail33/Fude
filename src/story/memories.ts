/**
 * Fude's lost memories: the story under the story. Each page is a short
 * cutscene from long ago, told in sepia. Together they answer the questions
 * the journey keeps raising: who carried Fude before, why the Void Dragon
 * swallows words, and why the player can see them glowing.
 *
 * The truth, in order: a girl named Kotone found a broken brush and named
 * it Fude. With it she wrote a name for everything in the land, and the
 * hundred spirits (the yokai) became her friends. Only one thing she never
 * named: the quiet between words, because a named silence is no longer
 * silent. Left nameless for ages, the quiet grew lonely and hungry and took
 * the shape of a dragon. Out of ink, Kotone sealed it by writing with her
 * own name, which is why nobody, not even Fude, can remember her. Her last
 * line was left blank for whoever would see the words glowing next.
 *
 * Lines are written in kana with simple kanji (with `kana` readings), so
 * they read well at every immersion level.
 */
import type { Scene } from './scenes'

export const MEMORY_SCENES: Scene[] = [
  {
    id: 'memory-1',
    title: 'Memory I: A Name in the Rain',
    bg: 'night-hill',
    memory: true,
    music: 'title',
    cast: ['fude'],
    steps: [
      { pause: 900 },
      { jp: '…あめの おとが する。とおい むかしの よる。', en: 'The sound of rain. A night, long, long ago.' },
      { enter: 'scribe', who: 'scribe', emote: '?', jp: 'あれ？ こんな ところに ふでが おちてる。', en: 'Huh? Someone dropped a brush out here.' },
      { who: 'scribe', jp: 'けが してるね。…なまえは ある？', en: 'You’re all cracked. …Do you have a name?' },
      { who: 'fude', emote: '…', jp: '……。', en: '(The little brush can’t answer.)' },
      { who: 'scribe', emote: '♪', jp: 'じゃあ「フデ」！ なまえが あれば、もう まいごに ならないよ。', en: 'Then you’re “Fude”! Things with a name can never get lost again.' },
      { flash: '#fff6d0', jp: 'ちいさな ふでが、はじめて ひかった。', en: 'For the first time, the little brush began to glow.' },
      { exit: 'scribe', bg: 'void', jp: '……', en: '…The memory fades.' },
      { who: 'fude', emote: '!', jp: 'いまの… わたし？ あの こは だれ？', en: 'That was… me? Then who was that girl?' },
      { who: 'fude', jp: 'かおは みえたのに、なまえが おもいだせない…', en: 'I saw her face… but I can’t remember her name. Why can’t I remember?' },
    ],
  },
  {
    id: 'memory-2',
    title: 'Memory II: The Hundred Friends',
    bg: 'village',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { jp: 'あの こと フデは、くにじゅうを あるいた。', en: 'The girl and Fude walked the whole land together.' },
      { who: 'scribe', emote: '♪', jp: 'これは「かわ」。これは「やま」。これは「はな」！', en: 'This is “river”. This is “mountain”. This is “flower”!' },
      { jp: 'かいた なまえは ひかって、せかいに のこった。', en: 'Every name she wrote glowed and stayed in the world.' },
      { jp: 'ようかいたちも あつまって きた。かっぱ、きつね、たぬき…', en: 'The spirits gathered round: kappa, foxes, tanuki… a hundred of them.' },
      { who: 'scribe', jp: 'みんな、ともだちだよ。なまえを よびあえば、ひとりじゃ ない。', en: 'You’re all my friends. As long as we call each other by name, nobody is alone.' },
      { who: 'scribe', emote: '…', jp: 'でもね、フデ。ひとつだけ、どうしても かけない ものが あるの。', en: 'But Fude… there’s one thing I can never write.' },
      { who: 'fude', emote: '?', jp: 'かけない もの？', en: 'Something you can’t write?' },
      { bg: 'void', jp: '……', en: '…The memory fades.' },
      { who: 'fude', jp: 'ようかいたちが、あの こを しってる…！', en: 'The spirits knew her…! If we help more of them, maybe they’ll remember what I can’t.' },
    ],
  },
  {
    id: 'memory-3',
    title: 'Memory III: The Thing Between Words',
    bg: 'fields',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { jp: 'ゆうがた。かぜが やんで、のはらが しずかに なった。', en: 'Evening. The wind dropped and the fields fell quiet.' },
      { who: 'scribe', jp: 'きこえる？ ことばと ことばの あいだの「しずけさ」。', en: 'Can you hear it? The quiet between one word and the next.' },
      { who: 'scribe', jp: 'これに なまえを つけたら… もう しずかじゃ なくなる。', en: 'If I give it a name, it won’t be quiet anymore. So I can’t.' },
      { who: 'scribe', emote: '…', jp: 'ごめんね。あなたにだけ、なまえが ない。', en: 'I’m sorry. You’re the only one without a name.' },
      { enter: 'shadow', who: 'shadow', jp: '…………。', en: '(Something in the dusk is listening.)' },
      { bg: 'void', exit: 'shadow', jp: '……', en: '…The memory fades.' },
      { who: 'fude', emote: '…', jp: 'なまえの ない もの… りゅうも、なまえを もって いなかった。', en: 'Something with no name… The Void Dragon never told us its name either.' },
    ],
  },
  {
    id: 'memory-4',
    title: 'Memory IV: Footsteps in the Mist',
    bg: 'forest',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { jp: 'それから、ふしぎな ことが おきはじめた。', en: 'After that, strange things began to happen.' },
      { jp: 'とりの うたが、ひとつ きえた。こどもの なまえが、ひとつ きえた。', en: 'One birdsong went missing. Then a child’s name.' },
      { enter: 'shadow', who: 'shadow', jp: '…ずるい。みんな なまえが ある。', en: '…Not fair. Everyone has a name.' },
      { who: 'scribe', emote: '!', jp: 'あなた… さびしかったの？', en: 'You… you were lonely?' },
      { who: 'shadow', jp: 'なまえが ないなら… だれも もたなければ いい。', en: 'If I can’t have a name… then nobody should.' },
      { bg: 'void', exit: 'shadow', jp: '……', en: '…The memory fades.' },
      { who: 'fude', jp: 'りゅうは さいしょから りゅうじゃ なかったんだ…', en: 'The dragon wasn’t always a dragon. It was the quiet… and it was lonely.' },
    ],
  },
  {
    id: 'memory-5',
    title: 'Memory V: The Hungry Quiet',
    bg: 'forest',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { shake: true, jp: 'しずけさは どんどん おおきく なった。', en: 'The quiet grew, and grew.' },
      { jp: 'もりの ことばを たべ、むらの なまえを たべた。', en: 'It ate the forest’s words. It ate a whole village’s names.' },
      { who: 'scribe', jp: 'まって！ あなたを きらいに なりたく ない！', en: 'Wait! I don’t want to hate you!' },
      { enter: 'shadow', who: 'shadow', emote: '💢', shake: true, jp: 'なら、なまえを よこせ！', en: 'Then give me a name!' },
      { who: 'scribe', emote: '…', jp: '…まだ、ぴったりの なまえが みつからないの。', en: '…I haven’t found the right one yet.' },
      { bg: 'void', exit: 'shadow', jp: '……', en: '…The memory fades.' },
      { who: 'fude', emote: '?', jp: 'ぴったりの なまえ… あの こは、さがして いたんだ。', en: 'The right name… She was searching for one. Did she ever find it?' },
    ],
  },
  {
    id: 'memory-6',
    title: 'Memory VI: Kotone’s Promise',
    bg: 'shrine',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { jp: 'よるの やしろ。ようかいたちが あつまった。', en: 'The shrine at night. The hundred spirits gathered.' },
      { who: 'scribe', jp: 'みんな、きいて。わたしは あの こを きらわない。', en: 'Listen, everyone. I won’t hate that lonely quiet.' },
      { who: 'scribe', emote: '♪', jp: 'いつか かならず、いちばん やさしい なまえを あげる。やくそく。', en: 'Someday I’ll give it the gentlest name there is. I promise.' },
      { who: 'fude', emote: '♥', jp: 'わたしも てつだう！', en: 'I’ll help you!' },
      { who: 'scribe', jp: 'ありがとう、フデ。…わたしの なまえ、わすれないでね。「ことね」だよ。', en: 'Thank you, Fude. …Don’t forget my name, okay? It’s Kotone.' },
      { flash: '#ffffff', bg: 'void', jp: 'ことね。', en: 'Kotone.' },
      { who: 'fude', emote: '!', jp: 'ことね…！ そうだ、ことねだ！ どうして わすれて いたの…？', en: 'Kotone…! That’s her name! How could I ever forget it…?' },
    ],
  },
  {
    id: 'memory-7',
    title: 'Memory VII: The Night of the Dragon',
    bg: 'tower',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { shake: true, flash: '#000000', jp: 'その よる、しずけさは りゅうの かたちに なった。', en: 'That night, the quiet took the shape of a dragon.' },
      { jp: 'ようかいたちは ちりぢりに にげた。', en: 'The hundred spirits scattered into the dark.' },
      { who: 'scribe', emote: '!', jp: 'すみが… もう ない！', en: 'My ink… it’s all gone!' },
      { who: 'fude', emote: '!', jp: 'ことね、にげて！', en: 'Kotone, run!' },
      { who: 'scribe', emote: '…', jp: 'ううん。まだ かける ものが ひとつ ある。', en: 'No. There’s still one thing I can write with.' },
      { bg: 'void', jp: '……', en: '…The memory fades.' },
      { who: 'fude', emote: '…', jp: 'インクが ないのに… なにで かいたの？', en: 'With no ink left… what did she write with?' },
    ],
  },
  {
    id: 'memory-8',
    title: 'Memory VIII: Ink of the Heart',
    bg: 'void',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { who: 'scribe', jp: 'わたしの なまえを、すみに する。', en: 'I’ll use my own name as ink.' },
      { who: 'fude', emote: '!', jp: 'だめ！ なまえが なくなったら、ことねが きえちゃう！', en: 'No! If your name is used up, you’ll disappear!' },
      { who: 'scribe', emote: '♪', jp: 'だいじょうぶ。なまえは きえても、ことばは のこるよ。', en: 'It’s okay. Even if my name fades, my words will stay.' },
      { flash: '#f7c948', shake: true, jp: 'ひかる もじが りゅうを つつみ、ふかい ねむりに さそった。', en: 'Glowing letters wrapped the dragon and sang it into a deep sleep.' },
      { exit: 'scribe', jp: 'そして、ことねの なまえは だれの きおくからも きえた。', en: 'And Kotone’s name faded from everyone’s memory.' },
      { who: 'fude', emote: '…', jp: 'だから、わたしも わすれて いたんだ…', en: 'That’s why I forgot her too… She gave away her name to save everyone.' },
    ],
  },
  {
    id: 'memory-9',
    title: 'Memory IX: The Last Line',
    bg: 'dawn',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { jp: 'きえる まえに、ことねは さいごの ページを ひらいた。', en: 'Before she faded, Kotone opened the last page.' },
      { who: 'scribe', jp: 'フデ。いつか、ことばが ひかって みえる ひとが くる。', en: 'Fude. Someday, someone will come who can see the words glowing.' },
      { who: 'scribe', jp: 'その ひとに、なまえを きいてね。それが つぎの ぎょう。', en: 'Ask them their name. That’s the next line of the story.' },
      { who: 'scribe', emote: '♥', jp: 'ものがたりは、そうやって つづくんだよ。', en: 'That’s how a story keeps going.' },
      { exit: 'scribe', bg: 'void', jp: '……', en: '…The memory fades.' },
      { who: 'fude', emote: '!', jp: 'わたしが さいしょに あなたの なまえを きいたのは… そういう ことだったんだ。', en: 'That’s why the very first thing I asked was your name…' },
      { who: 'fude', emote: '♥', jp: '{name}さん。あなたが、つぎの ぎょう です。', en: '{name}, you are the next line of Kotone’s story.' },
    ],
  },
  {
    id: 'memory-10',
    title: 'Memory X: The Gentlest Name',
    bg: 'night-hill',
    memory: true,
    music: 'title',
    cast: ['scribe', 'fude'],
    steps: [
      { jp: 'ほしの よる。ことねは ひとりで そらを みて いた。', en: 'A starry night. Kotone sat alone, looking at the sky.' },
      { who: 'scribe', jp: 'やっと みつけた。いちばん やさしい なまえ。', en: 'I finally found it. The gentlest name.' },
      { who: 'scribe', emote: '♪', jp: '「しずか」。しずかで いても いいよ、って いう なまえ。', en: '“Shizuka.” A name that means: it’s okay to be quiet.' },
      { who: 'scribe', emote: '…', jp: 'でも、もう かく ちからが ない。…だれか、かわりに よんで あげて。', en: 'But I no longer have the strength to write it. …Someone, please call it for me.' },
      { bg: 'void', exit: 'scribe', jp: '……', en: '…The memory fades.' },
      { who: 'fude', emote: '!', jp: '「しずか」…！ りゅうに この なまえを とどけよう！', en: '“Shizuka”…! We have to bring this name to the dragon!' },
    ],
  },
  {
    id: 'true-ending',
    title: 'The Hundred Spirits’ Parade',
    bg: 'night-hill',
    music: 'title',
    cast: ['fude', 'you'],
    steps: [
      { pause: 900 },
      { who: 'fude', jp: '{name}さん、さいごの ページ。いっしょに かこう。', en: '{name}, the last page. Let’s write it together.' },
      { enter: 'shadow', who: 'shadow', emote: '?', jp: '…また、なまえの はなしか。', en: '…More talk of names?' },
      { who: 'you', jp: '「しずか」。', en: '“Shizuka.”' },
      { flash: '#ffffff', who: 'shadow', emote: '!', jp: '……しずか。わたしの、なまえ。', en: '…Shizuka. My… name.' },
      { who: 'shadow', emote: '♥', jp: 'しずかで いても… いいのか。', en: 'It’s okay… to be quiet?' },
      { who: 'fude', emote: '♥', jp: 'うん。よるも、ねむりも、ひとやすみも、ぜんぶ あなたの しごと。', en: 'Yes. Night, sleep, every little rest between words — that’s all yours now.' },
      { jp: 'そのとき、ようかいたちの ぎょうれつが やまを くだって きた。ひゃっきやこう！', en: 'Then a parade of spirits came winding down the hill: the Hundred Spirits’ Night Parade!' },
      { who: 'fude', jp: 'そして… わすれられた なまえを、もう ひとつ。', en: 'And one more forgotten name to write…' },
      { who: 'you', jp: '「ことね」。', en: '“Kotone.”' },
      { flash: '#f7c948', enter: 'kotone', who: 'kotone', emote: '♪', jp: '…よんで くれて、ありがとう。', en: '…Thank you for calling me.' },
      { who: 'kotone', jp: 'フデ、いい あいぼうを みつけたね。', en: 'Fude, you found a wonderful partner.' },
      { who: 'fude', emote: '♥', jp: 'ことね…！', en: 'Kotone…!' },
      { who: 'kotone', jp: '{name}さん。ことばの たびは、これからも ずっと つづくよ。', en: '{name}, the journey of words goes on, for as long as you keep learning.' },
      { jp: 'おわり … そして、つぎの ぎょうへ。', en: 'The End… and on to the next line.' },
    ],
  },
]
