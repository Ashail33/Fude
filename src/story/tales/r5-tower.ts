/**
 * Region 5 — the Tower of Creation, the finale. Three tales: win back the
 * King's lost words (こころ from the dragon statue, なまえ from a lantern
 * choked with darkness, and a cracked ありが… from the jailer — the last shard
 * lies in the Void Dragon's heart), free four spirits the dragon swallowed by
 * reminding each what it is, and a trade chain to wake Gonta the gate golem.
 */
import { ACTIVITY_BY_ID } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from './r1-village'
import type { Ctx, TaleContent } from './types'

const SAKURA = { jp: 'おうじょ サクラ', en: 'Princess Sakura' }
const GONTA = { jp: 'ゴンタ', en: 'Gonta' }
const MOCHI = { jp: 'モチ', en: 'Mochi' }
const LOST = { jp: '？？？', en: '???' }

const flagOf = (s: PlayerState, k: string) => s.flags?.[k] ?? 0
const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1
const first = (c: Ctx, key: string) => {
  const f = !c.flag(key)
  c.set(key)
  return f
}
const host = (c: Ctx, activity: string): Step[] => {
  const a = ACTIVITY_BY_ID.get(activity)
  return a ? [{ kind: 'activity', activity: a, speaker: c.speaker, portrait: c.portrait }] : []
}
/** The Void Dragon (the region's mastery trial, after the Chimera boss). */
const dragonBeaten = (s: PlayerState) => isPassed(s, 'r5-dragon')

// ─── The King's lost words (main) ────────────────────────────────────
const echoCount = (c: Ctx) => [c.has('echo-kokoro'), c.has('echo-namae'), c.has('echo-arigatou')].filter(Boolean).length

function echoFound(c: Ctx): Step[] {
  const n = echoCount(c)
  if (c.stage('kings-words') !== 1) return []
  if (n >= 3) return [c.fude('3つ そろった！ 王さまの ところへ いそごう！', 'All three! Let’s hurry to the King!'), ...c.advance('kings-words')]
  return [c.fude(`ことばの こだま、あと ${3 - n}つ！`, `${3 - n} more echo${3 - n === 1 ? '' : 'es'} to find!`)]
}

function jailerGives(c: Ctx, extra: Step[]): Step[] {
  return [
    ...extra,
    ...c.give('echo-arigatou'),
    c.narrate('びんの なかで、われた ことばが ささやく：「ありが…」', 'Inside the jar, a cracked word whispers: “Ariga…”'),
    c.fude('われてる… さいごまで いえない みたい。', 'It’s cracked… it can’t reach the end.'),
    ...echoFound(c),
  ]
}

// ─── Lost spirits ────────────────────────────────────────────────────
const SPIRITS: Record<string, { words: Record<string, string>; free: [string, string][] }> = {
  'tp-sp-cat': {
    words: { ねこ: 'neko' },
    free: [
      ['「ねこ」… そうだ、わたしは ねこ！ なまえは モチ！', '“Neko”… That’s right, I’m a cat! My name is Mochi!'],
      ['おなか すいた にゃ。おうちに かえる にゃ！', 'I’m hungry, nya. Going home, nya!'],
    ],
  },
  'tp-sp-tree': {
    words: { き: 'ki', もり: 'mori' },
    free: [
      ['ざわざわっ！ そうじゃ、わしは 木 じゃ！', 'Rustle-rustle! Of course — I am a tree!'],
      ['ねっこが うずく。森へ かえろう。ありがとうよ。', 'My roots are itching. Back to the forest. Thank you.'],
    ],
  },
  'tp-sp-bird': {
    words: { とり: 'tori' },
    free: [
      ['ぴよっ！ とり！ ぼく、とり だった！', 'Peep! A bird! I was a bird!'],
      ['ひかりの つばさを ひろげて、よぞらへ とんでいった。', 'It spreads wings of light and soars into the night.'],
    ],
  },
  'tp-sp-stone': {
    words: { いし: 'ishi', いわ: 'iwa' },
    free: [
      ['ごろん… そう、いわの せいれい。わすれて いた。', 'Grind… Yes. A spirit of stone. I had forgotten.'],
      ['かたい ことばを ありがとう。…ほめて ないか。', 'Thank you for such a solid word. …That wasn’t a compliment, was it.'],
    ],
  },
}
/** What each swallowed spirit mumbles when spoken to. */
const TOWER_SPIRIT_LINES: Record<string, [string, string]> = {
  'tp-sp-cat': ['にゃ… わたしは… なに…？ おもち… すき…', 'Nya… what… am I…? I like… rice cakes…'],
  'tp-sp-tree': ['ざわ… ざわ… ねっこが… どこかに かえりたい…', 'Rustle… rustle… my roots… want to go home…'],
  'tp-sp-bird': ['ぴ… ぴよ…？ はねが ある… でも なんの はね…？', 'Pee… peep…? I have wings… but whose wings…?'],
  'tp-sp-stone': ['ごろ… ごろ… わたしは… かたくて… おもい…', 'Grind… grind… I am… hard… and heavy…'],
}
const SPIRIT_IDS = Object.keys(SPIRITS)
const freed = (s: PlayerState, id: string) => flagOf(s, `r5.${id}`) > 0

function freeSpirit(c: Ctx, id: string, k: string): Step[] | null {
  const sp = SPIRITS[id]
  if (freed(c.s(), id) || c.stage('lost-spirits') !== 0) return null
  const wordId = sp.words[k]
  if (!wordId) {
    if (id === 'tp-sp-bird' && k === 'とぶ') return (c.learn('tobu'), [c.narrate('はねを ばたばた… でも じぶんが なにか わからないと、とべない みたい。', 'Flap, flap… but it can’t fly without knowing what it is.')])
    return null
  }
  c.learn(wordId)
  c.set(`r5.${id}`)
  c.sparkle('spark')
  c.sfx('correct')
  const out: Step[] = [c.narrate('すけた すがたに いろが もどっていく…！', 'Colour floods back into the see-through figure…!'), ...sp.free.map(([jp, en]) => c.say(jp, en, LOST, c.portrait))]
  const n = SPIRIT_IDS.filter((x) => freed(c.s(), x)).length
  if (n >= 4) out.push(c.fude('4つ ぜんぶ じゆうに なった！ めしつかいさんに しらせよう！', 'All four spirits are free! Let’s tell the maid!'), ...c.advance('lost-spirits'))
  else out.push(c.fude(`あと ${4 - n}つ！`, `${4 - n} to go!`))
  return out
}

export const TOWER_TALES: TaleContent = {
  items: [
    { id: 'echo-kokoro', name: 'Echo of “Heart”', jp: 'こころの こだま', kana: 'こだま', emoji: '💗', desc: 'A warm light that whispers こころ. It beats, very softly.' },
    { id: 'echo-namae', name: 'Echo of “Name”', jp: 'なまえの こだま', kana: 'こだま', emoji: '🏷️', desc: 'A word freed from darkness: なまえ — the word for calling someone.' },
    { id: 'echo-arigatou', name: 'Cracked Echo', jp: 'われた こだま', kana: 'こだま', emoji: '🫙', desc: 'A jar holding a broken word. It whispers “ありが…” and stops.' },
    { id: 'kings-thanks', name: 'The King’s Thanks', jp: '王の ありがとう', kana: 'ありがとう', emoji: '👑', desc: 'ありがとう in the King’s own hand — the first word he has written in a hundred years.' },
    { id: 'spirit-feather', name: 'Spirit Feather', jp: 'ひかりの はね', kana: 'はね', emoji: '🪶', desc: 'Dropped by a bird spirit on its way home. Still warm.' },
    { id: 'dog-bread', name: 'Slightly Damp Bread', jp: 'しめった パン', kana: 'パン', emoji: '🍞', desc: 'The Knight Captain’s lunch. It has been in a dog’s mouth.' },
    { id: 'golem-shield', name: 'Gonta’s Shield', jp: 'ゴンタの たて', kana: 'たて', emoji: '🛡️', desc: 'Huge, heavy, and dented from a century of knight practice.' },
    { id: 'hero-crest', name: 'Hero’s Crest', jp: 'ゆうしゃの もんしょう', kana: 'もんしょう', emoji: '🎖️', desc: 'Guarded by Gonta for a hundred years. Given only to a true 勇者.' },
  ],
  tales: [
    {
      id: 'kings-words',
      region: 5,
      main: true,
      title: 'The King’s Lost Words',
      jp: '王の なくした ことば',
      summary: 'The night the dragon came, it swallowed the King’s words. He hasn’t said his daughter’s name since.',
      giver: 'tt-princess',
      stages: [
        { en: 'Ask the Court Wizard in the courtyard how lost words return', jp: 'にわの きゅうてい まじゅつしに、ことばの とりもどしかたを きこう', target: ['t-wizard'], map: 'tower' },
        { en: 'Recover the King’s three lost words: from the dragon statue, the darkened lantern and the jailer', jp: '王の ことばを 3つ とりもどそう：竜の ぞう・とうろうの 闇・ろうばん', target: ['t-dragon-statue', 't-lantern', 't-jailer'], map: 'tower' },
        { en: 'Bring the words back to the King', jp: 'ことばを 王さまに とどけよう', target: ['tt-king'], map: 'tower-throne' },
        { en: 'Defeat the Void Dragon at the summit — then return to the King', jp: '塔の いただきで こくうの りゅうを たおし、王の もとへ', target: ['tp-dragon', 'tt-king'], map: 'tower-top' },
      ],
    },
    {
      id: 'lost-spirits',
      region: 5,
      title: 'Spirits of the Void',
      jp: 'のみこまれた たましい',
      summary: 'Pale, forgetful spirits drift at the summit — creatures the dragon swallowed. One might be the maid’s cat.',
      giver: 't-maid',
      stages: [
        { en: 'At the summit, free the four swallowed spirits: cast the word for what each one has forgotten it is', jp: '塔の いただきの 4つの たましいに、じぶんが なにかを ことばで おしえよう', target: SPIRIT_IDS, map: 'tower-top' },
        { en: 'Tell the castle maid', jp: 'めしつかいに しらせよう', target: ['t-maid'], map: 'tower' },
      ],
    },
    {
      id: 'gonta',
      region: 5,
      title: 'The Sleeping Gatekeeper',
      jp: 'ねむる もんばん',
      summary: 'Gonta the gate golem has snored for a hundred years. Legend says he guards a hero’s treasure.',
      giver: 't-squire',
      stages: [
        { en: 'Wake the gate golem: cast おきる (wake up) at him', jp: 'もんばんの ゴーレムに「おきる」と となえよう', target: ['t-golem'], map: 'tower' },
        { en: 'Find Gonta’s shield — ask the Knight Captain', jp: 'ゴンタの たてを さがそう（きしだんちょうに きこう）', target: ['t-captain'], map: 'tower' },
        { en: 'Get the captain’s bread back from the dog: tell it to wait — cast まつ', jp: 'いぬから パンを とりかえそう：「まつ」と となえて', target: ['t-dog'], map: 'tower' },
        { en: 'Trade the bread to the captain for the shield', jp: 'パンと たてを こうかんしよう', target: ['t-captain'], map: 'tower' },
        { en: 'Return the shield to Gonta', jp: 'ゴンタに たてを かえそう', target: ['t-golem'], map: 'tower' },
      ],
    },
  ],
  entities: {
    tower: [
      { id: 't-golem', kind: 'npc', sprite: 'golem', x: 38, y: 19, dir: 'down', name: GONTA, lines: [{ jp: 'ゴゴー… ゴゴー…', en: 'GRRRNK… GRRRNK…' }] },
      { id: 't-squire', kind: 'npc', sprite: 'child', x: 36, y: 21, dir: 'right', name: { jp: 'みならい きし', en: 'Squire' }, lines: [{ jp: 'いつか ゆうしゃに なるんだ！', en: 'Someday I’ll be a hero!' }] },
      { id: 't-mochi', kind: 'npc', sprite: 'cat', x: 27, y: 21, dir: 'left', name: MOCHI, lines: [{ jp: 'にゃ〜ん♪', en: 'Mrrrow~♪' }] },
    ],
    'tower-throne': [{ id: 'tt-princess', kind: 'npc', sprite: 'villager-b', x: 10, y: 7, dir: 'left', name: SAKURA, lines: [{ jp: 'ちちうえ…', en: 'Father…' }] }],
    'tower-top': [
      { id: 'tp-sp-cat', kind: 'npc', sprite: 'cat', x: 2, y: 2, dir: 'down', name: LOST, lines: [{ jp: 'にゃ… わたしは… なに…？', en: 'Nya… what… am I…?' }] },
      { id: 'tp-sp-tree', kind: 'npc', sprite: 'treant', x: 12, y: 2, dir: 'down', name: LOST, lines: [{ jp: 'ざわ… ざわ… ねっこが… どこかに…', en: 'Rustle… rustle… my roots… belong somewhere…' }] },
      { id: 'tp-sp-bird', kind: 'npc', sprite: 'wisp', x: 12, y: 8, dir: 'down', name: LOST, lines: [{ jp: 'ぴ… ぴよ…？ そらを… とびたい… でも…', en: 'Pee… peep…? I want to… fly… but…' }] },
      { id: 'tp-sp-stone', kind: 'npc', sprite: 'golem', x: 4, y: 8, dir: 'down', name: LOST, lines: [{ jp: 'ごろ… ごろ… わたしは… かたい… なにか…', en: 'Grind… grind… I am… something… hard…' }] },
    ],
  },
  visible: {
    't-mochi': (s) => stageOf(s, 'lost-spirits') >= 2,
    ...Object.fromEntries(SPIRIT_IDS.map((id) => [id, (s: PlayerState) => stageOf(s, 'lost-spirits') >= 0 && !freed(s, id)])),
  },
  ghost: Object.fromEntries(SPIRIT_IDS.map((id) => [id, () => true])),
  moved: {
    // Sakura stands at her father's side once he can say her name again.
    'tt-princess': (s) => (stageOf(s, 'kings-words') >= 3 ? { x: 6, y: 3 } : null),
  },
  talk: {
    // ── The King's lost words ──
    'tt-princess': (c) => {
      const st = c.stage('kings-words')
      if (st < 0)
        return offer(
          c,
          'kings-words',
          [
            c.say('…あなたが うわさの まほうつかい？', '…Are you the mage everyone’s talking about?'),
            c.say('ちちうえは、もう なんねんも わたしの なまえを よんで くれないの。', 'Father hasn’t called me by my name in years.'),
            c.say('りゅうが きた よる、ちちうえの ことばも のみこまれたの。', 'The night the dragon came, it swallowed Father’s words too.'),
            c.say('のこったのは「よくぞ まいった」みたいな、かたい ことば だけ。', 'All he has left are stiff phrases like “Well met.”'),
            c.say('おねがい。ちちうえの ことばを とりもどして。', 'Please. Bring back my father’s words.'),
          ],
          ['まかせてください。', 'Leave it to me.'],
          ['すみません、いまは…', 'Sorry, not right now…'],
        )
      if (st === 0) return [c.say('きゅうてい まじゅつしなら、なにか しっている はず。にわに いるわ。', 'The Court Wizard will know something. He’s in the courtyard.')]
      if (st === 1) return [c.say(`ことばの こだまは ${echoCount(c)}つ… おねがい、あと すこし。`, `${echoCount(c)} echo${echoCount(c) === 1 ? '' : 'es'} so far… please, just a little more.`)]
      if (st === 2) return [c.say('はやく ちちうえの ところへ！', 'Quickly — go to Father!')]
      if (st === 3) return dragonBeaten(c.s()) ? [c.say('りゅうが… たおれた？ ちちうえが まっているわ！', 'The dragon… fell? Father is waiting!')] : [c.say('りゅうは 塔の いちばん うえ。…どうか ぶじで かえってきて。', 'The dragon is at the very top. …Please come back safe.')]
      return [c.say('ちちうえったら、なんにでも「ありがとう」って いうの。パンにも。', 'Father says “thank you” to everything now. Even to bread.')]
    },
    't-wizard': (c) => {
      const st = c.stage('kings-words')
      if (st === 0)
        return [
          c.say('王の ことば、か。…ふむ。', 'The King’s words, you say. …Hmm.'),
          c.say('りゅうに のまれた ことばは きえぬ。こだまに なって のこるのじゃ。', 'Words the dragon swallows never vanish. They linger as echoes.'),
          c.say('ひとつは 竜の ぞうの 口の なか。なまえを よべば 口を ひらこう。', 'One sits in the dragon statue’s mouth. Call it by its name and it will open.'),
          c.say('ひとつは とうろうの 闇の なか。闇には ひかりじゃ。', 'One is trapped in the lantern’s darkness. Against darkness — light.'),
          c.say('さいごの ひとつは… ろうばんが「ぼっしゅう」したそうじゃ。', 'The last… I hear the jailer “confiscated” it.'),
          c.say('あやつには ていねいに たのむのじゃぞ。ていねいに な。', 'Ask him politely, mind you. Politely.'),
          ...c.advance('kings-words'),
        ]
      if (st === 1) return [c.say('ぞうには なまえを。闇には ひかりを。ろうばんには れいぎを。', 'A name for the statue. Light for the dark. Manners for the jailer.'), ...host(c, 'r5-words-1')]
      return null
    },
    't-jailer': (c) => {
      if (c.stage('kings-words') !== 1 || c.has('echo-arigatou') || c.flag('r5.jar')) return null
      return [
        c.say('あん？ この びんか？ そらから おちてきた。ぼっしゅうひんだ。', 'Huh? This jar? Fell out of the sky. Confiscated.'),
        c.say('ほしけりゃ、それなりの たのみかたが あるだろ？', 'Want it? Then ask the proper way.'),
        c.choice(
          { jp: 'どう たのむ？', en: 'How will you ask?' },
          [
            ['rude', 'おい、よこせ！', 'Oi. Hand it over!'],
            ['polite', 'それを ください。', 'Please give me that.'],
            ['super', 'おそれいりますが、いただけますでしょうか。', 'Pardon me terribly, but might I humbly receive it?'],
          ],
          (id) => {
            if (id === 'rude') return [c.say('なんだと！？ ろうやに いれるぞ！', 'WHAT did you say!? I’ll throw you in a cell!'), c.say('…なーんてな。でも やりなおしだ。ていねいにな。', '…Kidding. But try again. Politely.')]
            c.set('r5.jar')
            if (id === 'polite') return jailerGives(c, [c.say('へへ、わかってるじゃねえか。ほらよ。', 'Heh, you know how it’s done. Here.')])
            return jailerGives(c, [c.say('な、なんだ その ていねいさ… こわい… もってけ！', 'W-what’s with all that politeness… it’s scary… just take it!'), ...c.reward(15, 5)])
          },
        ),
      ]
    },
    'tt-king': (c) => {
      const st = c.stage('kings-words')
      if (st === 2 && echoCount(c) >= 3) {
        c.take('echo-kokoro')
        c.take('echo-namae')
        c.sparkle('spark')
        return [
          c.narrate('3つの こだまを 王に さしだした。', 'You hold out the three echoes to the King.'),
          c.narrate('「こころ」と「なまえ」が、王の むねに すいこまれて いく…', '“Heart” and “name” sink softly into the King’s chest…'),
          c.say('…おお。…これは…', '…Oh. …This is…'),
          c.say('サクラ。…サクラ！ わが むすめ、サクラ！', 'Sakura. …Sakura! My daughter — Sakura!'),
          c.say('ちちうえ…！ やっと、よんで くれた…！', 'Father…! You finally said it…!', SAKURA, 'villager-b'),
          c.say('ながい あいだ すまなかった。心は あっても、ことばが なかった。', 'Forgive me, all these years. I had a heart, but no words.'),
          c.say('そなたにも 礼を いわねば。あり… が…', 'And to you, I owe my thanks. Ari… ga…'),
          c.narrate('われた こだまが ふるえ、こえが とぎれた。', 'The cracked echo trembles. His voice breaks off.'),
          c.say('…いえぬ。さいごの ひとかけらは、りゅうの むねの なかに ある。', '…I cannot say it. The last shard lies within the dragon’s heart.'),
          c.fude('いこう！ 塔の いちばん うえへ！', 'Let’s go! To the very top of the tower!'),
          ...c.advance('kings-words'),
        ]
      }
      if (st === 3 && dragonBeaten(c.s())) {
        c.take('echo-arigatou')
        c.sparkle('spark')
        return [
          c.narrate('りゅうが たおれた とき、そらから ひかりの かけらが ひとつ おちてきた。', 'When the dragon fell, one shard of light drifted down from the sky.'),
          c.narrate('かけらは われた こだまに はまり… カチリ。', 'It slots into the cracked echo… click.'),
          c.say('…ありがとう。', '…Thank you.'),
          c.say('ありがとう。ありがとう、ちいさな まどうしよ。', 'Thank you. Thank you, little mage.'),
          c.say('サクラにも、フデにも、この 塔にも。…ありがとう。', 'To Sakura, to Fude, to this very tower… thank you.'),
          c.say('ちちうえ、いいすぎ。', 'Father, that’s too many.', SAKURA, 'villager-b'),
          c.say('ひゃくねんぶん たまって おるのじゃ。ゆるせ。', 'I have a hundred years of them saved up. Indulge me.'),
          c.fude('ことばは、こころを はこぶ ふね なんだね。', 'Words are little boats that carry the heart.'),
          c.say('これを うけとって おくれ。わしが かいた、さいしょの ことばじゃ。', 'Please accept this. The first word I have written in a century.'),
          ...c.give('kings-thanks'),
          ...c.bagItem('charm', 3),
          ...c.reward(300, 100),
          ...c.advance('kings-words'),
        ]
      }
      if (st === 3) return [c.say('りゅうを たおせば、きっと… いや、ぶじで もどれ。それが いちばんじゃ。', 'Defeat the dragon and surely… no. Come back safe. That matters most.'), ...host(c, 'r5-king')]
      if (st >= 4) return [c.say('ありがとう！ …うむ、なんど いっても よい ことばじゃ。', 'Thank you! …Mm. A fine word, no matter how often you say it.'), ...host(c, 'r5-king')]
      return null
    },
    // ── Lost spirits ──
    't-maid': (c) => {
      const st = c.stage('lost-spirits')
      if (st < 0)
        return offer(
          c,
          'lost-spirits',
          [
            c.say('あの… りゅうが きた よる、ねこの モチが いなくなったんです。', 'Um… the night the dragon came, our cat Mochi vanished.'),
            c.say('塔の いただきに、すけた どうぶつが さまよって いるって…', 'They say see-through creatures wander at the top of the tower…'),
            c.say('りゅうに のまれて、じぶんが なにか わすれちゃったのかも。', 'Maybe the dragon swallowed them, and they forgot what they are.'),
          ],
          ['さがして みます', 'I’ll go look'],
        )
      if (st === 0) return [c.say('モチは しろくて まるくて… おもち みたいな ねこ なんです。', 'Mochi is white and round… like a little rice cake.')]
      if (st === 1)
        return [
          c.narrate('「にゃーん！」 どこからか しろい ねこが かけてきた！', '“Nyaaan!” A white cat comes running from somewhere!'),
          c.say('モチ！！ …おかえり、おかえり！', 'Mochi!! …Welcome home, welcome home!'),
          c.narrate('ひかりの はねが 一まい、ひらりと そらから おちてきた。', 'A single feather of light flutters down from the sky.'),
          ...c.give('spirit-feather'),
          c.say('ほんとうに ありがとう ございます！ これ、おしろの くすりばこから。', 'Thank you so, so much! Please — from the castle medicine chest.'),
          ...c.bagItem('herb', 3),
          ...c.bagItem('charm', 1),
          ...c.reward(150, 50),
          ...c.advance('lost-spirits'),
        ]
      return [c.say('モチは いま、王さまの ひざの うえが おきにいり なんです。', 'Mochi’s favourite spot now is the King’s lap.')]
    },
    ...Object.fromEntries(
      SPIRIT_IDS.map((id) => [
        id,
        (c: Ctx) => {
          if (c.stage('lost-spirits') !== 0 || freed(c.s(), id)) return null
          const line = TOWER_SPIRIT_LINES[id]
          return [c.say(line[0], line[1]), c.fude('じぶんが なにか わすれてる… ことばで おしえて あげよう！', 'It’s forgotten what it is… let’s tell it with a word!')]
        },
      ]),
    ),
    't-mochi': (c) => [c.say('にゃ〜ん♪', 'Mrrrow~♪', MOCHI, 'cat'), c.narrate('モチは おもちの ように まるく なった。', 'Mochi curls up, round as a rice cake.')],
    // ── Gonta ──
    't-squire': (c) => {
      const st = c.stage('gonta')
      if (st < 0)
        return offer(
          c,
          'gonta',
          [
            c.say('しーっ！ この ゴーレムは ゴンタ。塔の もんばんだ。', 'Shh! This golem is Gonta, the tower’s gatekeeper.'),
            c.say('もう ひゃくねん ねてる。いびきが うるさくて、ぼくが ねむれない！', 'He’s been asleep for a hundred years. His snoring keeps ME awake!'),
            c.say('ゴンタが おきたら、ゆうしゃの たからを くれるって でんせつが…', 'Legend says if he wakes, he’ll give the hero’s treasure to…'),
          ],
          ['おこそう！', 'Let’s wake him!'],
        )
      if (st === 0) return [c.say('ふつうに よんでも おきないよ。まほうの ことばで ためしてみて！', 'Shouting doesn’t work. Try a magic word!')]
      if (st < 5) return [c.say('がんばれ！ ゴンタの たての ために！', 'Go go! For Gonta’s shield!')]
      return [c.say('ゴンタ、おきすぎて こんどは ねむれない らしい。', 'Now Gonta’s too awake to sleep. Can’t win.')]
    },
    't-golem': (c) => {
      const st = c.stage('gonta')
      if (st <= 0) return [c.narrate('ゴゴー… ゴゴー… ものすごい いびきだ。', 'GRRRNK… GRRRNK… a colossal snore.')]
      if (st === 4 && c.has('golem-shield')) {
        c.take('golem-shield')
        c.sparkle('dust')
        return [
          c.say('わしの たて！！', 'MY SHIELD!!'),
          c.narrate('ゴンタは たてを かかげ、ずしんと むねを はった。', 'Gonta raises the shield high and puffs out his chest — THOOM.'),
          c.say('ちいさき 勇者よ、礼を いう。ゆうしゃの たからを うけとれ。', 'Little hero, you have my thanks. Take the hero’s treasure.'),
          ...c.give('hero-crest'),
          ...c.bagItem('ether', 2),
          ...c.bagItem('charm', 1),
          ...c.reward(150, 50),
          ...c.advance('gonta'),
        ]
      }
      if (st < 5) return [c.say('たて… わしの たて… しくしく。', 'Shield… my shield… *sniff*')]
      return [c.say('もんばん、いじょう なし！', 'Gate report: all clear!')]
    },
    't-captain': (c) => {
      const st = c.stage('gonta')
      if (st === 1)
        return [
          c.say('ゴンタの たて？ ああ、けいこに かりてる。いい たてだ。', 'Gonta’s shield? Ah, I borrowed it for training. Fine shield.'),
          c.say('かえしても いいが… いぬに パンを とられて、はらぺこで うごけん。', 'I’d return it, but… the dog stole my bread and I’m too hungry to move.'),
          c.say('パンを とりかえして くれたら、たてと こうかんだ！', 'Get my bread back and the shield is yours!'),
          ...c.advance('gonta'),
        ]
      if (st === 2) return [c.say('パン… わたしの パン…', 'Bread… my bread…'), ...host(c, 'r5-combat-2')]
      if (st === 3 && c.has('dog-bread')) {
        c.take('dog-bread')
        return [
          c.narrate('パンを わたした。', 'You hand over the bread.'),
          c.say('…ちょっと しめってるな。いぬの よだれか。…まあ いい！', '…It’s a bit damp. Dog drool. …Eh, good enough!'),
          c.say('やくそくだ。ゴンタに よろしくな。', 'A deal’s a deal. Say hi to Gonta.'),
          ...c.give('golem-shield'),
          ...c.advance('gonta'),
        ]
      }
      return null
    },
    't-dog': (c) => {
      if (c.stage('gonta') !== 2) return null
      return [c.narrate('いぬが パンを くわえて、しっぽを ぶんぶん ふっている。', 'The dog has the bread in its mouth, tail going like mad.'), c.say('わふ！', 'Wuff!'), c.fude('めいれいの ことば… 「まつ」（まて）で どうかな？', 'A command word… how about まつ (wait)?')]
    },
  },
  cast: {
    // ── The King's lost words ──
    't-dragon-statue': (c, k) => {
      if (k === 'りゅう') {
        c.learn('ryuu')
        c.sparkle('dust')
        if (c.stage('kings-words') === 1 && !c.has('echo-kokoro')) {
          c.sfx('door')
          return [
            c.narrate('「りゅう」！ 竜の ぞうの 目が あかく ひかった…', '“Ryuu”! The statue’s eyes flare red…'),
            c.narrate('ゴゴゴ… いしの 口が ひらき、あたたかい ひかりが ころがりでた。', 'Grrrind… the stone jaws open, and a warm light rolls out.'),
            c.narrate('ひかりは ちいさく ささやいた：「こころ」', 'The light whispers: “kokoro” — heart.'),
            ...c.give('echo-kokoro'),
            ...echoFound(c),
          ]
        }
        return [c.narrate('竜の ぞうの 目が ぎらりと ひかった。…いまにも うごきそうだ。', 'The statue’s eyes glint. …It looks ready to move.'), ...(first(c, 'cast.t-dragon-statue') ? c.reward(15, 5) : [])]
      }
      if (k === 'ほのお' || k === 'ひ') return (c.learn(k === 'ひ' ? 'hi' : 'honoo'), [c.narrate('ぞうの 口から けむりが ぽわっ。…くしゃみ？', 'A puff of smoke from the statue’s mouth. …A sneeze?')])
      return null
    },
    't-lantern': (c, k) => {
      if (k === 'ひかり' || k === 'ひかる') {
        c.learn(k === 'ひかり' ? 'hikari' : 'hikaru')
        c.sparkle('spark')
        if (c.stage('kings-words') === 1 && !c.has('echo-namae'))
          return [
            c.narrate('とうろうが まぶしく かがやいた！', 'The lantern blazes blindingly bright!'),
            c.narrate('闇が はじけとび、なかから ことばが ひとつ まいおちた。', 'The darkness bursts apart, and a single word drifts down.'),
            c.narrate('「なまえ」── だれかを よぶ ための ことば。', '“Namae” — the word you need to call someone.'),
            ...c.give('echo-namae'),
            ...echoFound(c),
          ]
        return [c.narrate('とうろうが いっしゅん、ひるまの ように かがやいた。', 'For a moment the lantern shines like midday.')]
      }
      if (k === 'やみ') return (c.learn('yami'), [c.narrate('とうろうの ひが すうっと ちいさく なった… さむけが する。', 'The flame shrinks to a pinprick… a chill runs down your spine.')])
      if (k === 'けす') return (c.learn('kesu'), [c.narrate('ふっ… ひが きえた。…と おもったら、また ついた。がんこな とうろうだ。', 'Fwoosh — it goes out. …Then relights itself. A stubborn lantern.')])
      return null
    },
    'tt-king': (c, k) => {
      if (k === 'ありがとう') {
        c.learn('arigatou')
        if (c.stage('kings-words') >= 4) return [c.say('ありがとうの ありがとうじゃ！', 'Thank you for your thank you!')]
        return [c.narrate('王は くちを ひらいたが… こえに ならなかった。', 'The King opens his mouth… but no sound comes.')]
      }
      if (k === 'すみません') return (c.learn('sumimasen'), [c.say('よい。ていねいな ことばは ここちよい。', 'Granted. Polite words are pleasant to the ear.')])
      if (k === 'こころ') return (c.learn('kokoro'), [c.narrate('王は そっと むねに てを あてた。', 'The King quietly lays a hand over his heart.')])
      if (k === 'おう') return (c.learn('ou'), [c.say('いかにも、わしが 王じゃ。…かんむりが おもい。', 'Indeed, I am the King. …This crown is heavy.')])
      return null
    },
    // ── Lost spirits ──
    ...Object.fromEntries(SPIRIT_IDS.map((id) => [id, (c: Ctx, k: string) => freeSpirit(c, id, k)])),
    't-maid': (c, k) => (k === 'やさしい' ? (c.learn('yasashii'), [c.say('え、わたしが やさしい？ …えへへ。モチにも いって あげて。', 'Me, kind? …Hehe. Tell Mochi that too.')]) : null),
    't-mochi': (c, k) => (k === 'ねこ' ? (c.learn('neko'), [c.say('にゃ！ (モチは じぶんが ねこだと もう わすれない)', 'Nya! (Mochi will never forget she’s a cat again.)', MOCHI, 'cat')]) : null),
    // ── Gonta ──
    't-golem': (c, k) => {
      const st = c.stage('gonta')
      if (k === 'おきる') {
        c.learn('okiru')
        c.sparkle('dust')
        if (st === 0)
          return [
            c.narrate('「おきる」！ ゴゴ… ゴ…？', '“Okiru”! GRRN… GRR…?'),
            c.narrate('ゴーレムの 目に、ぽっと あかりが ともった。', 'A light flickers on in the golem’s eyes.'),
            c.say('…だれだ。わしの ゆめを じゃまする のは。', '…Who dares interrupt my dream?'),
            c.say('む…？ わしの たてが ない！ たてが なければ、もんばんは つとまらぬ！', 'Hm…? My shield is GONE! Without it, I cannot guard the gate!'),
            c.say('…しくしく。', '…*sniff*'),
            ...c.advance('gonta'),
          ]
        if (st < 0) return [c.narrate('ゴゴ…？ …ゴゴー。ねがえりを うって、また ねた。', 'GRR…? …GRRRNK. He rolls over and goes back to sleep.')]
        return [c.say('おきてる！ ずっと おきてる！', 'I’m AWAKE! Very awake!')]
      }
      if (k === 'たて' && st >= 1 && st < 5) return (c.learn('tate'), [c.say('たて！ そうだ、わしの たて！ どこだ！？', 'Shield! Yes, MY shield! Where is it!?')])
      if (k === 'ねる' || k === 'ゆめ') {
        c.learn(k === 'ねる' ? 'neru' : 'yume')
        if (st >= 5) return [c.narrate('ゴンタは たったまま ねむってしまった… ゴゴー。', 'Gonta falls asleep standing up… GRRRNK.'), c.say('…はっ！ ねてない！', '…Hm! I wasn’t asleep!')]
        return [c.narrate('いびきが 2ばいに なった。', 'The snoring doubles in volume.')]
      }
      return null
    },
    't-dog': (c, k) => {
      if (k === 'まつ') {
        c.learn('matsu')
        c.sparkle('dust')
        if (c.stage('gonta') === 2 && !c.has('dog-bread'))
          return [c.narrate('「まつ」！ いぬは ぴたっと すわった。', '“Matsu”! The dog sits, perfectly still.'), c.narrate('…ぽとり。パンが おちた。', '…Plop. Down drops the bread.'), c.say('わん！', 'Woof!'), ...c.give('dog-bread'), ...c.advance('gonta')]
        return [c.narrate('いぬは ぴたっと すわった。えらい！', 'The dog sits instantly. Good dog!')]
      }
      if (k === 'いぬ') {
        c.learn('inu')
        if (c.stage('gonta') === 2) return [c.say('わんわん！', 'Woof woof!'), c.narrate('よばれて うれしくて、パンを くわえたまま はしりまわった！', 'Thrilled to be called, it zooms around with the bread still in its mouth!')]
        return [c.say('わんわん！', 'Woof woof!')]
      }
      return null
    },
    // ── Playful reactions ──
    't-guard': (c, k) => {
      if (k === 'ありがとう') return (c.learn('arigatou'), [c.say('え、なにが？ …まあ、どういたしまして！', 'Er, for what? …Well, you’re welcome!')])
      if (k === 'すみません') return (c.learn('sumimasen'), [c.say('なんだ？ …うむ、ていねいで よろしい。', 'Yes? …Mm. Very polite. Carry on.')])
      return null
    },
    'tt-guard-l': (c, k) => (k === 'しずか' ? (c.learn('shizuka'), [c.narrate('このえへいは、さらに しずかに なった。…いきは している。', 'The royal guard becomes even quieter. …Still breathing, though.')]) : null),
    'tt-guard-r': (c, k) => (k === 'ゆうしゃ' ? (c.learn('yuusha'), [c.say('ゆ、ゆうしゃ どの！？ …あとで サインを ください。', 'A-a hero!? …Could I get your autograph later?')]) : null),
    't-anvil': (c, k) => {
      if (k !== 'つるぎ') return null
      c.learn('tsurugi')
      c.sparkle('spark')
      return [c.narrate('カーン！ かなとこから ひばなが とび、つるぎの かたちに ひかった。', 'CLANG! Sparks leap from the anvil and flash into the shape of a sword.'), ...(first(c, 'cast.t-anvil') ? c.reward(15, 5) : [])]
    },
    't-knight': (c, k) => {
      if (k === 'たたかう') return (c.learn('tatakau'), [c.say('いいぞ！ その こえだ！ かかってこい！', 'That’s the spirit! Come at me!')])
      if (k === 'まもる') return (c.learn('mamoru'), [c.say('まもりの かまえ！ …わるくない。', 'A defensive stance! …Not bad.')])
      return null
    },
    't-wizard': (c, k) => (k === 'まほう' ? (c.learn('mahou'), c.sparkle('spark'), [c.say('まほうとは、ことばの ちからじゃ。…それと、すこしの おやつ。', 'Magic is the power of words. …And a few snacks.')]) : null),
  },
  mapCast: {
    tower: (c, k) => {
      if (k === 'とぶ') return (c.learn('tobu'), c.sparkle('dust'), [c.narrate('「とぶ」！ ぴょーん…… すとん。', '“Tobu”! Boing…… thud.'), c.fude('いまのは ジャンプ だね。', 'That was more of a hop.')])
      if (k === 'ゆうしゃ') return (c.learn('yuusha'), [c.narrate('あなたは かっこいい ポーズを きめた。', 'You strike a heroic pose.'), c.say('おお〜！', 'Ooooh!', { jp: 'えいへい', en: 'Guard' }, 'guard')])
      if (k === 'しろ') return (c.learn('shiro'), [c.fude('しろ、は 城。…白い「しろい」と にてるね！', 'しろ is castle. …Sounds like しろい, white!')])
      if (k === 'ほし') return (c.learn('hoshi'), c.sparkle('spark'), [c.narrate('塔の うえに、ほしが ひとつ ひときわ つよく かがやいた。', 'Above the tower, one star burns brighter than the rest.')])
      return null
    },
    'tower-top': (c, k) => {
      if (k === 'せかい') {
        c.learn('sekai')
        return dragonBeaten(c.s())
          ? [c.narrate('「せかい」！ よあけの ひかりが、どこまでも ひろがる せかいを てらした。', '“Sekai”! Dawn light spills over a world that goes on forever.'), c.fude('ことばが もどった せかい… きれいだね。', 'A world with its words back… it’s beautiful.')]
          : [c.narrate('「せかい」… くらい そらの むこうに、せかいが ねむっている。', '“Sekai”… beyond the dark sky, the world lies sleeping.')]
      }
      if (k === 'ゆめ') return (c.learn('yume'), [c.fude('ゆめ… りゅうも ゆめを みるのかな。', 'Dreams… I wonder if dragons dream too.')])
      if (k === 'こころ') return (c.learn('kokoro'), c.sparkle('spark'), [c.narrate('むねの おくが、ぽっと あたたかく なった。', 'Something deep in your chest glows warm.')])
      return null
    },
  },
}
