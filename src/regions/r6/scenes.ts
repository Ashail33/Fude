/**
 * Region 6 cutscenes: arriving at a harbour whose numbers were swallowed,
 * the Umibōzu before and after the fight, and two of Fude's memories that
 * the sea remembers: Kotone naming the hour between day and night, and a
 * mermaid who taught her that forever is longer than any number.
 */
import type { RegionScenes } from '../types'

export const SCENES: RegionScenes = {
  speakers: {
    kai: { sprite: 'sailor', name: 'Captain Kai', jp: 'カイせんちょう', color: '#7fc4f0' },
    ume: { sprite: 'fisher', name: 'Ume', jp: 'ウメ', color: '#4fb3d9' },
    sachi: { sprite: 'elder', name: 'Toki the Keeper', jp: 'とうだいもりの トキ', color: '#f7c948' },
    umibozu: { sprite: 'umibozu', name: 'Umibōzu', jp: 'うみぼうず', color: '#2b4a7a' },
  },

  pages: [
    { scene: 'memory-r6-a', region: 6, kind: 'core', title: 'The Hour Between', jp: 'たそがれの みなと' },
    { scene: 'memory-r6-b', region: 6, kind: 'bonus', title: 'Longer Than Any Number', jp: 'かずより ながい もの' },
  ],

  scenes: [
    {
      id: 'arrive-harbour',
      title: 'The Harbour of Numbers',
      bg: 'harbour',
      music: 'harbour',
      cast: ['you', 'fude'],
      steps: [
        { pause: 600 },
        { who: 'fude', emote: '!', jp: 'うみだ！ しおの におい！', en: 'The sea! Smell that salt!' },
        { enter: 'ume', pause: 300 },
        { who: 'ume', jp: 'いらっしゃい！ …って いいたいけど、たいへんなの。', en: 'Welcome! …is what I’d like to say, but we’re in trouble.' },
        { who: 'ume', jp: 'うみぼうずが 港の かずを ぜんぶ のみこんじゃった。', kana: 'うみぼうずが みなとの かずを ぜんぶ のみこんじゃった。', en: 'The Umibōzu swallowed every number in the harbour.' },
        { who: 'ume', jp: 'とけいは とまるし、ねだんは めちゃくちゃ。さかなも かぞえられない！', en: 'The clocks have stopped, the prices are nonsense, and nobody can count the fish!' },
        { who: 'fude', emote: '?', jp: 'かずが ない みなと…？', en: 'A harbour without numbers…?' },
        { who: 'fude', jp: 'いち、に、さん… ひとつ、ふたつ… {name}さん、かずの ことばを とりもどしましょう！', en: 'One, two, three… one thing, two things… {name}, let’s win back the words for numbers!' },
        { who: 'you', jp: 'うん、かぞえよう！', en: 'Yes — let’s count!' },
      ],
    },
    {
      id: 'pre-boss-r6',
      title: 'The Counting Umibōzu',
      bg: 'harbour',
      music: 'boss',
      cast: ['you', 'fude'],
      steps: [
        { jp: 'うみが きゅうに しずかに なった。', en: 'The sea fell suddenly still.' },
        { enter: 'umibozu', shake: true, flash: '#1d4e7a', pause: 500 },
        { who: 'umibozu', jp: 'ひとつ… ふたつ… みっつ…', en: 'One… two… three…' },
        { who: 'umibozu', jp: 'かずは ぜんぶ わしの ものだ。かぞえる こえが うるさくて、ねむれんのだ。', en: 'Every number is mine. All that counting kept me awake.' },
        { who: 'fude', emote: '!', jp: 'うみぼうず！ かずを かえして！', en: 'Umibōzu! Give the numbers back!' },
        { who: 'umibozu', jp: 'ならば かぞえて みせよ。さかなは なんびき？ いまは なんじ？', en: 'Then count for me. How many fish? What time is it?' },
        { who: 'you', jp: 'まけないよ！', en: 'I won’t lose!' },
      ],
    },
    {
      id: 'post-boss-r6',
      title: 'The Lighthouse Burns Again',
      bg: 'harbour',
      music: 'harbour',
      cast: ['you', 'fude', 'umibozu'],
      steps: [
        { who: 'umibozu', emote: '…', jp: 'ひとつ、ふたつ… ああ、かずが… あたたかい。', en: 'One, two… ah, the numbers… they’re warm.' },
        { flash: '#f7c948', jp: 'かずが みなとへ もどった。とけいが うごき、とうだいの ひが ともった。', en: 'The numbers flowed back into the harbour. The clocks ticked again and the lighthouse flame burned bright.' },
        { who: 'umibozu', jp: 'わしは さびしかったのだ。よるの うみは、しずかすぎる。', en: 'I was lonely. The sea at night is far too quiet.' },
        { who: 'fude', emote: '…', jp: '「しずかすぎる」… りゅうと おなじ…', en: '“Far too quiet”… just like the dragon…' },
        { exit: 'umibozu', enter: 'kai', pause: 300 },
        { who: 'kai', emote: '♪', jp: 'ありがとう！ これで あさ ごじに ふねが だせる！', en: 'Thank you! Now we can sail at five in the morning!' },
        { who: 'kai', jp: 'やまの むこうに、ゆけむりの さとが ある。つかれた からだを やすめて いけ。', en: 'Beyond the hills lies a village of hot springs. Go and rest your tired bones.' },
        { who: 'fude', emote: '♪', jp: 'つぎは ゆけむりの さと！ おんせんですよ、{name}さん！', en: 'Next, the Hot-Spring Hollow! Hot springs, {name}!' },
      ],
    },

    // ─── Fude's memories (the sea remembers) ─────────────────────────────
    {
      id: 'memory-r6-a',
      title: 'Memory: The Hour Between',
      bg: 'harbour',
      memory: true,
      music: 'title',
      cast: ['scribe', 'fude'],
      steps: [
        { jp: 'ゆうがたの みなと。ふねが ひとつ、まだ かえって こない。', en: 'Evening at the harbour. One boat still hasn’t come home.' },
        { who: 'scribe', jp: 'ひるでも よるでも ない じかん。みんな この じかんが こわいんだって。', en: 'Not day, not night. They say everyone is afraid of this hour.' },
        { who: 'fude', emote: '?', jp: 'どうして？', en: 'Why?' },
        { who: 'scribe', jp: 'かおが みえなくて、「だれ？」って きくから。「たそがれ」… 「たそ かれ」、あれは だれ？', en: 'Because you can’t see faces, so you ask, “Who’s that?” Tasogare… “who is he, there?”' },
        { who: 'scribe', emote: '♪', jp: 'じゃあ、この じかんに なまえを あげよう。なまえが あれば、こわくない。', en: 'Then let’s give this hour a name. With a name, it isn’t scary.' },
        { flash: '#f7c948', jp: 'ことねが かいた「たそがれ」が、うみに ひかりの みちを つくった。', en: 'The word Kotone wrote, tasogare, laid a path of light across the water.' },
        { jp: 'さいごの ふねが、その ひかりを たどって かえって きた。', en: 'The last boat followed that light home.' },
        { who: 'scribe', emote: '…', jp: 'でもね、フデ。ひると よるの あいだに なまえを つけても… ことばと ことばの あいだには、まだ なまえが ないの。', en: 'But Fude… even with a name for the hour between day and night… the space between words still has no name.' },
        { exit: 'scribe', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '!', jp: '「あいだ」の もの… あの こは ずっと、それを さがして いたんだ。', en: 'The things in between… she was searching for that all along.' },
      ],
    },
    {
      id: 'memory-r6-b',
      title: 'Memory: Longer Than Any Number',
      bg: 'harbour',
      memory: true,
      music: 'title',
      cast: ['scribe', 'fude'],
      steps: [
        { jp: 'つきの よる。いわの うえで、にんぎょが うたって いた。', en: 'A moonlit night. A mermaid was singing on the rocks.' },
        { who: 'scribe', jp: 'その うた、なにを かぞえてるの？', en: 'That song — what is it counting?' },
        { jp: '「なみの かず。いちまん、にまん… おわらないの。」', en: '“The waves. Ten thousand, twenty thousand… it never ends.”' },
        { who: 'scribe', emote: '?', jp: 'いつまで かぞえるの？', en: 'How long will you keep counting?' },
        { jp: '「えいえんに。わたしは しなないから。えいえんは、どんな かずより ながいのよ。」', en: '“Forever. I can’t die, you see. Forever is longer than any number.”' },
        { who: 'scribe', emote: '…', jp: 'かずより ながい もの…', en: 'Something longer than any number…' },
        { who: 'scribe', emote: '♪', jp: 'じゃあ わたしは、かずより ながい やくそくを かく。わたしが いなくなっても、ずっと のこる やくそく。', en: 'Then I’ll write a promise longer than any number. One that stays, even after I’m gone.' },
        { who: 'fude', emote: '?', jp: 'ことね…？ いなくなるって…？', en: 'Kotone…? Gone…?' },
        { exit: 'scribe', bg: 'void', jp: '……', en: '…The memory fades.' },
        { who: 'fude', emote: '…', jp: 'あの やくそく… 「つぎの ぎょう」の ことだったのかな。', en: 'That promise… was it about “the next line”?' },
      ],
    },
  ],
}
