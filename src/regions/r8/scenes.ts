/**
 * Region 8 cutscenes: arriving in the rude castle town, Nurarihyon in the
 * lord's seat, the town's manners flying home, and two of Fude's memories.
 *
 * The memories: Kotone in this town long ago, naming the pause before a
 * polite reply (間, ma), and finding the quiet sitting comfortably inside
 * it; then, remembered by the beckoning cat, the day she invited the quiet
 * in for tea, when nobody else ever had.
 */
import type { RegionScenes } from '../types'

export const SCENES: RegionScenes = {
  speakers: {
    tadashi: { sprite: 'samurai', name: 'Tadashi', jp: 'ただし', color: '#7a8bd9' },
    kiku: { sprite: 'lady', name: 'Kiku', jp: 'キク', color: '#d9534f' },
    sen: { sprite: 'child', name: 'Sen', jp: 'セン', color: '#f0b34a' },
    nurarihyon: { sprite: 'nurarihyon', name: 'Nurarihyon', jp: 'ぬらりひょん', color: '#8f6bb3' },
  },
  pages: [
    { scene: 'memory-r8-a', region: 8, kind: 'core', title: 'The Pause Before a Reply', jp: 'へんじの まえの ま' },
    { scene: 'memory-r8-b', region: 8, kind: 'bonus', title: 'The Cat Who Waited', jp: 'まつ ねこ' },
  ],
  scenes: [
    {
      id: 'arrive-castletown',
      title: 'The Castle Town',
      bg: 'castletown',
      music: 'castletown',
      cast: ['you', 'fude'],
      steps: [
        { pause: 500 },
        { who: 'fude', emote: '!', jp: 'わあ、にぎやか！ ここが 城下町です。', kana: 'わあ、にぎやか！ ここが じょうかまちです。', en: 'Wow, so lively! This is the Castle Town.' },
        { who: 'fude', jp: 'あかい ちょうちん、おみせの のれん、ほりの むこうに しろい おしろ…', en: 'Red lanterns, shop curtains, and across the moat, a white castle…' },
        { enter: 'sen', pause: 300 },
        { who: 'sen', emote: '💢', shake: true, jp: 'おい、そこ！ じゃまだ、どけ！', en: 'Hey, you! You’re in the way, move it!' },
        { who: 'sen', emote: '…', jp: '…あっ、ちがう！ ごめんなさい！「ようこそ」って いいたかったのに…', en: '…Ah, no! I’m sorry! I meant to say “welcome”…' },
        { who: 'sen', jp: 'おしろに へんな おじいさんが はいって から、まちじゅうの ことばが らんぼうに なっちゃったんだ。', en: 'Ever since a strange old man walked into the castle, everyone in town talks rough.' },
        { who: 'fude', emote: '?', jp: 'ていねいな ことばが、たべられた…？', en: 'The polite words… have been eaten?' },
        { who: 'sen', jp: 'ぼくは セン、まちの あんないや。みちを おしえて あげるよ！ みぎ、ひだり、まっすぐ！', en: 'I’m Sen, the town guide. I’ll show you the way! Right, left, straight on!' },
        { who: 'fude', emote: '♪', jp: '「どうぞ」「ありがとう」「いらっしゃいませ」… ていねいな ことばを、まちに かえしましょう！', en: '“Dōzo”, “arigatō”, “irasshaimase”… let’s give this town back its polite words!' },
      ],
    },
    {
      id: 'pre-boss-r8',
      title: 'Nurarihyon',
      bg: 'castletown',
      music: 'boss',
      cast: ['you', 'fude'],
      steps: [
        { jp: 'てんしゅかくの おくざしき。殿の ざに、だれかが すわって いる。', kana: 'てんしゅかくの おくざしき。とのの ざに、だれかが すわって いる。', en: 'The inner hall of the keep. Someone is sitting in the lord’s seat.' },
        { enter: 'nurarihyon', pause: 400 },
        { who: 'nurarihyon', emote: '♪', jp: 'ほっほっほ。おや、おきゃくさんかね。…いや、ちがうな。ここは わしの いえじゃ。かってに はいって きたのは、おまえの ほうじゃろう？', en: 'Ho ho ho. Oh, a visitor? …No, wait. This is MY house. YOU are the one who barged in, aren’t you?' },
        { who: 'fude', emote: '💢', jp: 'ちがいます！ ここは 殿の おしろです！', kana: 'ちがいます！ ここは とのの おしろです！', en: 'It is not! This is the lord’s castle!' },
        { who: 'nurarihyon', jp: 'わしは ぬらりひょん。どこの いえにも「おじゃまします」なしで はいり、ちゃを のみ、あるじの かおを する。', en: 'I am Nurarihyon. I walk into any house without an “excuse me”, drink the tea, and play the master.' },
        { who: 'nurarihyon', jp: '「どうぞ」も「ありがとう」も、ぜんぶ たべて やった。れいぎなど、じゃまな だけじゃ。', en: 'Every “please” and “thank you” in town, I ate them all. Manners only get in the way.' },
        { who: 'fude', emote: '!', jp: '{name}さん、ていねいに こたえて！ しつれいな ことばは、あの ようかいを ふくらませる だけ！', en: '{name}, answer him politely! Rude words only make that yokai swell up!' },
        { who: 'you', jp: 'しつれい いたします。…まいります！', en: 'Pardon me (humbly). …Here I come!' },
      ],
    },
    {
      id: 'post-boss-r8',
      title: 'Manners Come Home',
      bg: 'castletown',
      music: 'castletown',
      cast: ['you', 'fude', 'nurarihyon'],
      steps: [
        { who: 'nurarihyon', emote: '…', shake: true, jp: 'む、むう… こんなに ていねいに されては、いすわれん…', en: 'Hm, hmph… treated THIS politely, I can’t stay put…' },
        { flash: '#fff2d6', jp: 'ぬらりひょんの きものから「どうぞ」や「ありがとう」が こぼれおちて、まちへ とんで いった。', en: 'From Nurarihyon’s robes spilled “dōzo”, “arigatō” and every polite word, flying back out over the town.' },
        { who: 'nurarihyon', jp: '…わしは ただ、だれかに「どうぞ」と いわれたかった だけかも しれんな。', en: '…Perhaps all I really wanted was for someone to say “dōzo” to me.' },
        { who: 'you', jp: 'どうぞ、また きて ください。こんどは「おじゃまします」と いって。', en: 'Please, come again. Next time, say “excuse me” at the door.' },
        { who: 'nurarihyon', emote: '♪', jp: 'ほっほ。…おじゃま しました。', en: 'Ho ho. …Sorry to have intruded.' },
        { exit: 'nurarihyon', enter: 'tadashi', pause: 300 },
        { who: 'tadashi', emote: '♥', jp: '殿が「ありがとう」と おっしゃって います！ わたしからも、ありがとう ございました！', kana: 'とのが「ありがとう」と おっしゃって います！ わたしからも、ありがとう ございました！', en: 'The lord says “thank you”! And from me too, thank you so very much!' },
        { who: 'fude', emote: '♪', jp: 'つぎは ひがしの みち、雪の寺です。さむいから、あたたかく して いきましょう！', kana: 'つぎは ひがしの みち、ゆきの てらです。さむいから、あたたかく して いきましょう！', en: 'Next is the east road to the Snowbound Temple. It’s cold up there, so let’s bundle up!' },
      ],
    },

    // ─── Fude's memories ────────────────────────────────────────────
    {
      id: 'memory-r8-a',
      title: 'Memory: The Pause Before a Reply',
      bg: 'castletown',
      memory: true,
      music: 'title',
      cast: ['kotone', 'fude'],
      steps: [
        { pause: 800 },
        { jp: 'むかし、この 町の ちゃやで。', kana: 'むかし、この まちの ちゃやで。', en: 'Long ago, in a tea house in this very town.' },
        { who: 'kotone', emote: '♪', jp: 'フデ、見て。おちゃを もらう とき、みんな すこし まって から「ありがとう」って いうの。', kana: 'フデ、みて。おちゃを もらう とき、みんな すこし まって から ありがとうって いうの。', en: 'Fude, look. When people are handed tea, they all wait a moment before they say “thank you”.' },
        { who: 'fude', emote: '?', jp: 'まって いるの？ なにを？', en: 'They’re waiting? For what?' },
        { who: 'kotone', jp: 'あいての ことばが、ちゃんと とどく まで。ことばと ことばの あいだに、ちいさな すきまを あけて おくの。', en: 'For the other person’s words to land. They leave a little space between one word and the next.' },
        { who: 'kotone', jp: 'この すきまに、なまえを つけたいな。…「ま」。どう？', en: 'I want to give that space a name. …“Ma”, the pause. What do you think?' },
        { flash: '#fff6d0', jp: 'ことねが「間」と かくと、ちゃやの なかが ふわりと あたたかく なった。', kana: 'ことねが まと かくと、ちゃやの なかが ふわりと あたたかく なった。', en: 'Kotone wrote 間, and the whole tea house felt softly warmer.' },
        { enter: 'shadow', jp: '…………。', en: '(Inside the pause, something small and quiet sat listening. It did not look lonely there.)' },
        { who: 'kotone', emote: '!', jp: '…あ。あなた、ここに いたんだ。「ま」の なかは、いごこちが いい？', en: '…Oh. So this is where you were. Is it cozy, inside the pause?' },
        { who: 'shadow', jp: '……ここでは、だれかが ことばを まって いる。わたしは、じゃまに ならない。', en: '…Here, someone is waiting for a word. Here, I am not in the way.' },
        { who: 'kotone', jp: 'しずけさは、さびしい だけじゃ ない。あいてに ゆずる、やさしい しずけさも あるんだね。', en: 'Quiet isn’t only lonely. There’s a kind quiet too: the one you give someone so they can speak.' },
        { who: 'kotone', emote: '…', jp: 'でも「ま」は すきまの なまえ。あなたの なまえじゃ ない。…もう すこし、さがすね。', en: 'But “ma” is the name of the space, not your name. …I’ll keep looking a little longer.' },
        { bg: 'void', exit: 'shadow', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '♥', jp: 'やさしい しずけさ… ことねは、りゅうに ぴったりの なまえを、ずっと さがして いたんだね。', en: 'A kind quiet… Kotone never stopped looking for the right name for it.' },
      ],
    },
    {
      id: 'memory-r8-b',
      title: 'Memory: The Cat Who Waited',
      bg: 'castletown',
      memory: true,
      music: 'title',
      cast: ['fude'],
      steps: [
        { pause: 700 },
        { jp: 'まねきねこが、むかしの ことを おもいだした。', en: 'The beckoning cat remembered something from long ago.' },
        { enter: 'kotone', who: 'kotone', emote: '♪', jp: 'ねこさん、じょうず！ 手を あげて… そして、まつの。', kana: 'ねこさん、じょうず！ てを あげて… そして、まつの。', en: 'Well done, kitty! Raise your paw… and then you wait.' },
        { who: 'fude', emote: '?', jp: 'まつの？ よぶ だけじゃ なくて？', en: 'Wait? Not just call them in?' },
        { who: 'kotone', jp: '「どうぞ」は、あけて おく とびら。はいるか どうかは、あいてが きめるの。', en: '“Dōzo” is a door you hold open. Whether they come in is for them to decide.' },
        { who: 'kotone', jp: 'ぬらりひょんさんみたいに、かってに はいっちゃ だめ。まねかれる まで、まつの。', en: 'You never barge in the way Mr Nurarihyon does. You wait until you’re invited.' },
        { enter: 'shadow', jp: 'みちの すみに、ちいさな かげが たって いた。はいって いいのか、わからない かおで。', en: 'At the corner of the street stood a small shadow, looking unsure whether it was allowed in.' },
        { who: 'kotone', jp: '…いっしょに おちゃ、のみませんか。', en: '…Won’t you have some tea with us?' },
        { who: 'shadow', emote: '…', jp: '……いいの？', en: '…Is that all right?' },
        { who: 'kotone', emote: '♥', jp: 'どうぞ。あなたの せきも、ちゃんと あるよ。', en: 'Please. There’s a seat for you, too.' },
        { bg: 'void', exit: 'shadow', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '…', jp: 'ことねは、しずけさを まねいたんだ。だれも まねかなかった しずけさを。', en: 'Kotone invited the quiet in. The quiet nobody had ever invited.' },
      ],
    },
  ],
}
