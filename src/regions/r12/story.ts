/**
 * Region 12 — the Valley of Hearts. The main road: the dragon's hunger is
 * eating the valley's feelings, and every face has frozen like a Noh mask.
 * Hotaru the firefly child asks for help; Kaede the mask carver explains
 * that a feeling thaws once it is given its true name; three frozen friends
 * (Taro, Mamoru, Sora) are thawed by naming what they feel, with the right
 * grammar for someone else's heart (〜のに, 〜そう, 〜てしまった); and Kaede
 * carves the heart mask that lets you face Hannya in the kagura hall.
 *
 * Folklore: Amanojaku, the little demon who always says the opposite of
 * what it feels (honest feeling words, ほんとうは); Ame-onna, the rain woman
 * whose sadness brings rain (comforting, 〜てくれて ありがとう); and
 * Kerakera-onna, the giant woman who laughs in empty streets (the sound-
 * feelings, えがお).
 */
import { ACTIVITY_BY_ID } from '../../data/regions'
import { isPassed, wardFlag, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from '../../story/tales/r1-village'
import { GATES } from '../../story/tales/road'
import type { Ctx, TaleContent } from '../../story/tales/types'

const HOTARU = { jp: 'ホタル', en: 'Hotaru' }
const KAEDE = { jp: 'カエデ', en: 'Kaede' }
const REN = { jp: 'レン', en: 'Ren' }
const AMANOJAKU = { jp: 'あまのじゃく', en: 'Amanojaku' }
const CHIYO = { jp: 'チヨ おばあさん', en: 'Grandma Chiyo' }
const AMEONNA = { jp: 'あめおんな', en: 'Ame-onna' }
const KERAKERA = { jp: 'けらけらおんな', en: 'Kerakera-onna' }
const MAMORU = { jp: 'マモル', en: 'Mamoru' }

const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1
const flagOf = (s: PlayerState, k: string) => s.flags?.[k] ?? 0
const first = (c: Ctx, key: string) => {
  const f = !c.flag(key)
  c.set(key)
  return f
}
const host = (c: Ctx, activity: string): Step[] => {
  const a = ACTIVITY_BY_ID.get(activity)
  return a ? [{ kind: 'activity', activity: a, speaker: c.speaker, portrait: c.portrait }] : []
}
const hannyaBeaten = (s: PlayerState) => isPassed(s, 'r12-boss')
/** A small reward the first time a landmark answers a word. */
const once = (c: Ctx, key: string) => (first(c, `cast.${key}`) ? c.reward(15, 5) : [])

// ─── Frozen Faces (main) ─────────────────────────────────────────────
const THAWS = ['ko-taro', 'ko-mamoru', 'ko-sora'] as const
const thawed = (s: PlayerState, id: string) => flagOf(s, `r12.thaw.${id}`) > 0
const thawCount = (s: PlayerState) => THAWS.filter((id) => thawed(s, id)).length

function thawDone(c: Ctx, id: string, reply: Step[]): Step[] {
  c.set(`r12.thaw.${id}`)
  c.sparkle('spark')
  c.sfx('correct')
  const n = thawCount(c.s())
  const out: Step[] = [c.narrate('ピシッ… こおった 顔に ひびが はいり、きもちが あふれだした！', 'Crack… the frozen face splits, and the feeling comes pouring out!'), ...reply]
  if (n >= 3) out.push(c.fude('三人 ぜんぶ とけた！ カエデさんに しらせましょう！', 'All three have thawed! Let’s tell Kaede!'), ...c.advance('r12-frozen-faces'))
  else out.push(c.fude(`あと ${3 - n}人！`, `${3 - n} more to go!`))
  return out
}

function thawTaro(c: Ctx): Step {
  return c.choice(
    { jp: 'タロウに なんと いう？', en: 'What do you say to Taro?' },
    [
      ['noni', 'まいにち れんしゅうしたのに まけて、くやしいんだね。', 'You practised every day and still lost. That’s frustrating, huh.'],
      ['kara', 'れんしゅうしたから まけて、うれしいんだね。', 'You practised, so you lost, so you’re happy.'],
      ['yokatta', 'まけて よかったね！', 'Good thing you lost!'],
    ],
    (id) => {
      if (id === 'kara') return [c.say('…うれしく ないよ。', '…I’m not happy.'), c.fude('「のに」：がんばったのに だめだった。その きもちは「くやしい」ですよ。', 'のに: you tried, and still it didn’t work. That feeling is くやしい.'), thawTaro(c)]
      if (id === 'yokatta') return [c.say('ひどい！', 'That’s mean!'), c.fude('「〜て よかった」は ほっと した とき。いまは ちがいますね。', '〜て よかった is for relief. Not now.'), thawTaro(c)]
      c.learn('kuyashii')
      c.learn('naku')
      return thawDone(c, 'ko-taro', [
        c.say('……うわあああん！ くやしい！ くやしいよお！', '……Waaaah! It’s so frustrating! So frustrating!'),
        c.say('…ないたら、すっきり した。つぎは かつ！', '…Crying made me feel better. Next time, I’ll win!'),
      ])
    },
  )
}

function thawMamoru(c: Ctx): Step {
  return c.choice(
    { jp: 'フデ：「マモルさん、どんな きもちだと 思いますか？」', en: 'Fude: “How do you think Mamoru feels?”' },
    [
      ['sou', 'マモルさんは しんぱいそうです。', 'Mamoru looks worried.'],
      ['direct', 'マモルさんは しんぱいです。', 'Mamoru is worried. (said as a fact)'],
      ['tai', 'マモルさんは しんぱいしたいです。', 'Mamoru wants to worry.'],
    ],
    (id) => {
      if (id === 'direct') return [c.fude('ひとの こころの 中は 見えません。見た かんじを いう ときは「〜そう」ですよ。', 'We can’t see inside someone else’s heart. To say how they look, use 〜そう.'), thawMamoru(c)]
      if (id === 'tai') return [c.say('しんぱい… したい？ したく ないよ…', 'Want to… worry? I don’t want to…', MAMORU, 'villager-a'), c.fude('「〜たい」は ねがい。見た かんじは「しんぱいそう」です。', '〜たい is a wish. How he looks: しんぱいそう.'), thawMamoru(c)]
      c.learn('shinpai')
      return thawDone(c, 'ko-mamoru', [
        c.say('…そう、しんぱいなんです！ まつりの 日に 雨が ふったら、みんなが がっかりする… ずっと それが 気に なって いて。', '…Yes, I’m worried! If it rains on festival day, everyone will be so disappointed… it’s been on my mind all along.', MAMORU, 'villager-a'),
        c.say('いえたら、すこし ほっと しました。', 'Saying it out loud, I feel a little relieved.', MAMORU, 'villager-a'),
      ])
    },
  )
}

function thawSora(c: Ctx): Step {
  return c.choice(
    { jp: 'ソラの きもちに なまえを つけよう', en: 'Give Sora’s feeling a name' },
    [
      ['koukai', 'わらって しまって、こうかいして いるんだね。', 'You laughed, and now you regret it.'],
      ['ureshii', 'わらって しまって、うれしいんだね。', 'You laughed, so you’re happy.'],
      ['urayamashii', 'わらって、うらやましいんだね。', 'You laughed, so you’re envious.'],
    ],
    (id) => {
      if (id !== 'koukai') return [c.say('…ちがう。そんな きもちじゃ ない。', '…No. That’s not how I feel.'), c.fude('「〜て しまった」は、しなければ よかった こと。その きもちは「こうかい」ですよ。', '〜て しまった is something you wish you hadn’t done. That feeling is こうかい (regret).'), thawSora(c)]
      c.learn('koukai')
      return thawDone(c, 'ko-sora', [
        c.say('…うん。こうかいしてる。レンが ころんだ とき、つい わらって しまったの。', '…Yeah. I regret it. When Ren fell, I laughed before I could stop myself.'),
        c.say('すぐ あやまれば よかった。…まつりの まえに、ちゃんと あやまる！', 'I wish I’d apologised right away. …I’ll say sorry properly before the festival!'),
      ])
    },
  )
}

/** Until a gate for this region is added to the Sealed Road, Kaede's heart mask opens the boss's ward. */
function openWardIfUngated(c: Ctx) {
  if (!GATES.some((g) => g.region === 12)) c.set(wardFlag(12))
}

// ─── Amanojaku ───────────────────────────────────────────────────────
function amanojakuTruth(c: Ctx): Step {
  return c.choice(
    { jp: 'あまのじゃくの ほんとうの きもちは？', en: 'What does Amanojaku really feel?' },
    [
      ['true', 'ほんとうは、おばあさんが 大好きで、さびしいんだね。', 'You really love Grandma, and you’re lonely, right?'],
      ['said', 'ほんとうに、おばあさんが きらいなんだね。', 'So you really do hate Grandma.'],
      ['iya', 'ここに いるのが いやなんだね。', 'So you hate being here.'],
    ],
    (id) => {
      if (id !== 'true') return [c.say('そうだ！ そのとおり！ …（なぜか、すこし かなしそうだ）', 'That’s right! Exactly! …(For some reason, it looks a little sad.)', AMANOJAKU, 'child'), c.fude('あまのじゃくは はんたいの ことを いう ようかい… ことばを ぎゃくに して みましょう！', 'Amanojaku is a yokai who says the opposite… try turning its words around!'), amanojakuTruth(c)]
      c.learn('iya')
      return [
        c.say('ち、ちがう！ ぜんぜん さびしく ない！ …………。', 'Wr-wrong! Not lonely at all! …………', AMANOJAKU, 'child'),
        c.say('……ほんとうは、そう。でも、ほんとうの ことを いおうと すると、口が かってに うそを つくんだ。', '……Really, yes. But whenever I try to say what’s true, my mouth tells a lie all by itself.', AMANOJAKU, 'child'),
        c.fude('めんうちの カエデさんなら、なにか ほうほうを しって いるかも！', 'Kaede the mask carver might know a way!'),
        ...c.advance('fk12-amanojaku'),
      ]
    },
  )
}

function amanojakuThanks(c: Ctx, tries = 0): Step {
  return c.ask({ jp: 'あまのじゃくに おしえよう：「ごはんを つくって ＿＿ ありがとう」', en: 'Teach Amanojaku: “Thank you for making me dinner” (つくって ___ ありがとう)' }, ['くれて'], (ok) => {
    if (!ok)
      return tries < 1
        ? [c.say('…つくって、あげて？ もらって？ わからない。', '…Make-and-give? Make-and-get? I don’t know.', AMANOJAKU, 'child'), c.fude('じぶんの ために して もらった ことは「〜て くれて ありがとう」！', 'For something done for you: 〜て くれて ありがとう!'), amanojakuThanks(c, tries + 1)]
        : [c.fude('「くれて」ですよ。もう いちど はなしかけて みましょう。', 'It’s くれて. Let’s talk to Grandma again.')]
    c.take('fk12-two-face-mask')
    c.learn('tereru')
    c.sparkle('spark')
    c.sfx('correct')
    return [
      c.narrate('あまのじゃくは めんを ずらして、まっかな 顔で チヨおばあさんの まえに たった。', 'Amanojaku pushes the mask aside and stands before Grandma Chiyo, bright red in the face.'),
      c.say('お、おばあちゃん。…ごはんを つくって くれて、ありがとう。…だいすき。', 'G-Grandma. …Thank you for making me dinner. …I love you.', AMANOJAKU, 'child'),
      c.say('まあ… まあ、まあ。てれちゃって。…わたしもね、あんたが きて くれて、うれしかったんだよ。', 'Oh… oh my. Look at you, all bashful. …I was happy you came too, you know.', CHIYO, 'okami'),
      c.narrate('いろりの ひが、ぽっと あかるく なった。', 'The hearth fire glows a little brighter.'),
      ...c.give('fk12-melon-charm'),
      ...c.reward(110, 45),
      ...c.advance('fk12-amanojaku'),
      ...c.seal('amanojaku'),
      c.say('…ずっと むかし、ふでを もった おねえちゃんも いった。「はんたいの ことばしか いえなくても、こころは うそを つかないよ」って。', '…Long, long ago, a big sister with a brush said it too: “Even if only backwards words come out, your heart doesn’t lie.”', AMANOJAKU, 'child'),
      c.fude('ことね… ここにも きて いたんだね。', 'Kotone… she came here too.'),
    ]
  })
}

// ─── Ame-onna ────────────────────────────────────────────────────────
function comfortAmeonna(c: Ctx): Step {
  return c.choice(
    { jp: 'あめおんなに なんと いう？', en: 'What do you say to Ame-onna?' },
    [
      ['comfort', 'つらかったね。ないても いいんだよ。', 'That must have been hard. It’s okay to cry.'],
      ['stop', 'なかないで！ 雨が ふるから、めいわくだよ。', 'Don’t cry! It makes it rain, and that’s a nuisance.'],
      ['laugh', 'それは おもしろいね！', 'That’s hilarious!'],
    ],
    (id) => {
      if (id === 'stop') return [c.say('…やっぱり、わたしは めいわく なのね。（雨が つよく なった）', '…So I really am a nuisance. (The rain grows heavier.)', AMEONNA, 'villager-b'), c.fude('まずは、なぐさめて あげましょう。', 'First, let’s comfort her.'), comfortAmeonna(c)]
      if (id === 'laugh') return [c.say('……。（雨が ざあざあ ふりだした）', '…… (The rain starts pouring down.)', AMEONNA, 'villager-b'), c.fude('わらうのは ひどいですよ…', 'Laughing is cruel…'), comfortAmeonna(c)]
      c.learn('nagusameru')
      c.learn('namida')
      return [
        c.say('……ないても、いいの？', '……It’s okay to cry?', AMEONNA, 'villager-b'),
        c.say('ずっと「なくな」って いわれて きた。なみだを がまんすると、雨は もっと つめたく なるのに。', 'All my life people told me “don’t cry”. But when I hold back my tears, the rain only gets colder.', AMEONNA, 'villager-b'),
        c.say('たんぼの 人たちは、きっと わたしが きらいね。まつりを いつも 雨に して しまうから…', 'The rice farmers must hate me. I always rain on their festival…', AMEONNA, 'villager-b'),
        c.fude('こめづくりの マモルさんに、きいて みましょう！', 'Let’s go and ask Mamoru the rice farmer!'),
        ...c.advance('fk12-ameonna'),
      ]
    },
  )
}

function readLetter(c: Ctx): Step {
  return c.choice(
    { jp: 'マモルの てがみを よもう', en: 'Read Mamoru’s letter aloud' },
    [
      ['kurete', 'あめおんなさん、雨を ふらせて くれて ありがとう。', 'Dear Ame-onna, thank you for bringing the rain.'],
      ['agete', 'あめおんなさん、雨を ふらせて あげて ありがとう。', '(Dear Ame-onna, thank you for raining-for-someone-else.)'],
      ['ba', 'あめおんなさん、雨を ふらせなければ よかった。', 'Dear Ame-onna, I wish you hadn’t brought rain.'],
    ],
    (id) => {
      if (id !== 'kurete') return [c.fude('マモルさんは かんしゃして いるんですよ。して もらった ことには「〜て くれて ありがとう」！', 'Mamoru is grateful. For something done for you: 〜て くれて ありがとう!'), readLetter(c)]
      c.take('fk12-thanks-letter')
      c.learn('kansha')
      c.sparkle('ripple')
      c.sfx('correct')
      return [
        c.say('……ありがとう、なんて。はじめて いわれた。', '……Thank you, of all things. No one has ever said that to me.', AMEONNA, 'villager-b'),
        c.narrate('あめおんなの なみだが ひかり、つめたい 雨が、あたたかい きりさめに かわった。', 'Ame-onna’s tears shine, and the cold rain turns into a warm, fine mist.'),
        c.narrate('やがて 雨が やみ、たけやぶの 上に にじが かかった。', 'Soon the rain stops, and a rainbow arches over the bamboo.'),
        c.say('うれしくて なく ことも あるのね。…まつりの 日は、ちゃんと 晴れに するわ。やくそく。', 'So you can cry because you’re happy, too. …On festival day, I’ll keep the sky clear. I promise.', AMEONNA, 'villager-b'),
        ...c.give('fk12-rain-pearl'),
        ...c.reward(110, 45),
        ...c.advance('fk12-ameonna'),
        ...c.seal('ame-onna'),
        c.say('…むかし、ふでを もった 女の子が、いっしょに ぬれて くれたの。「雨も、だれかの きもちだね」って。', '…Long ago, a girl with a brush stood in the rain with me. “Rain is somebody’s feeling too,” she said.', AMEONNA, 'villager-b'),
        c.fude('ことねらしい… ほんとうに、ことねらしいです。', 'That’s so like Kotone… so very like her.'),
      ]
    },
  )
}

// ─── Kerakera-onna ───────────────────────────────────────────────────
function riddleOne(c: Ctx): Step {
  return c.choice(
    { jp: '「ぶたいに 上がる まえ、むねは どんな 音？」', en: '“Just before you go on stage, what sound does your heart make?”' },
    [
      ['doki', 'ドキドキ', 'thump-thump (pounding)'],
      ['gakkari', 'がっかり', 'disappointed'],
      ['niya', 'にやにや', 'smirking'],
    ],
    (id) => {
      if (id !== 'doki') return [c.say('けらけら！ ちがう ちがう！', 'Kera-kera! Wrong, wrong!', KERAKERA, 'lady'), c.fude('きんちょうして、むねが はやく なる 音… ドキドキ！', 'The sound of a heart racing with nerves… ドキドキ!'), riddleOne(c)]
      c.learn('dokidoki')
      return [c.say('けらけら！ せいかい！ じゃあ つぎ！', 'Kera-kera! Correct! Next one!', KERAKERA, 'lady'), riddleTwo(c)]
    },
  )
}

function riddleTwo(c: Ctx): Step {
  return c.choice(
    { jp: '「たのしみに して いた まつりが、雨で なくなった。どんな きもち？」', en: '“The festival you were looking forward to got rained out. How do you feel?”' },
    [
      ['gakkari', 'がっかり', 'disappointed'],
      ['ukiuki', 'うきうき', 'cheerful'],
      ['hotto', 'ほっと', 'relieved'],
    ],
    (id) => {
      if (id !== 'gakkari') return [c.say('けらけら！ そんなわけ ない！', 'Kera-kera! As if!', KERAKERA, 'lady'), c.fude('きたいが はずれた ときは… がっかり。', 'When your hopes fall flat… がっかり.'), riddleTwo(c)]
      c.learn('gakkari')
      return [
        c.say('けらけら… せいかい。…あのね、わたし、ほんとうは みんなと いっしょに わらいたいの。', 'Kera-kera… correct. …You know, what I really want is to laugh *with* everyone.', KERAKERA, 'lady'),
        c.say('でも 谷の みんなの 顔は こおって いて、だれも わらって くれない。たんぼの かかしの えがおまで きえて しまった。', 'But everyone’s faces in the valley are frozen, and no one laughs back. Even the smile on the paddy scarecrow has faded.', KERAKERA, 'lady'),
        c.fude('かかしに「えがお」か「にこにこ」と となえて みましょう！', 'Let’s cast えがお (smile) or にこにこ (smiling) at the scarecrow!'),
        ...c.advance('fk12-kerakera'),
      ]
    },
  )
}

export const CONTENT: TaleContent[] = [
  {
    items: [
      { id: 'r12-heart-mask', name: 'Heart Mask', jp: 'こころの めん', kana: 'めん', emoji: '🎭', desc: 'A blank white mask Kaede carved from three thawed feelings. It shows no face of its own, only whatever you truly feel.' },
      { id: 'r12-firefly-lantern', name: 'Firefly Lantern', jp: 'ほたるの ちょうちん', kana: 'ちょうちん', emoji: '🏮', desc: 'Hotaru’s thank-you gift. The fireflies inside glow brighter whenever someone nearby says how they feel.' },
      { id: 'fk12-two-face-mask', name: 'Two-Faced Mask', jp: 'うらおもての めん', kana: 'めん', emoji: '👺', desc: 'Kaede’s reversible mask. Whoever wears it says the opposite of the opposite: the truth.' },
      { id: 'fk12-melon-charm', name: 'Melon Charm', jp: 'うりの おまもり', kana: 'おまもり', emoji: '🍈', desc: 'A tiny melon charm from Grandma Chiyo. Amanojaku says it’s ugly. (It means it is lovely.)' },
      { id: 'fk12-thanks-letter', name: 'Mamoru’s Letter', jp: 'マモルの てがみ', kana: 'てがみ', emoji: '✉️', desc: 'A thank-you letter to the rain, in careful handwriting. Slightly damp.' },
      { id: 'fk12-rain-pearl', name: 'Rain Pearl', jp: 'あめの しずく', kana: 'しずく', emoji: '💧', desc: 'A happy tear from Ame-onna, hard as a pearl. It is always a little warm.' },
      { id: 'fk12-giggle-charm', name: 'Giggle Charm', jp: 'わらいの すず', kana: 'すず', emoji: '🔔', desc: 'Kerakera-onna’s bell. Shake it and somewhere nearby, someone starts to giggle.' },
    ],
    yokai: [
      {
        id: 'amanojaku',
        region: 12,
        name: 'Amanojaku',
        jp: '天邪鬼',
        kana: 'あまのじゃく',
        emoji: '👹',
        lore: 'Amanojaku is a small demon who can read the secret wishes in people’s hearts, and then says and does exactly the opposite. In the folk tale of Uriko-hime, the melon princess, it tricks its way into an old couple’s house while she is home alone. Today a contrary person who always says the opposite is still called an amanojaku.',
        hint: 'In a lonely old farmhouse, a child says everything backwards.',
        words: ['iya', 'uso', 'honki', 'tereru', 'himitsu'],
      },
      {
        id: 'ame-onna',
        region: 12,
        name: 'Ame-onna',
        jp: '雨女',
        kana: 'あめおんな',
        emoji: '🌧️',
        lore: 'Ame-onna, the rain woman, brings rain wherever she goes. In old Chinese and Japanese tales she was a goddess of rain clouds, and some say she appears on rainy nights to carry children away. Today people jokingly call someone who always seems to bring bad weather an ame-onna; but for farmers in a dry summer, rain was a blessing.',
        hint: 'By the river in the firefly grove, a woman cries, and it never stops raining.',
        words: ['naku', 'namida', 'nagusameru', 'kansha', 'shikushiku'],
      },
      {
        id: 'kerakera-onna',
        region: 12,
        name: 'Kerakera-onna',
        jp: '倩兮女',
        kana: 'けらけらおんな',
        emoji: '😂',
        lore: 'Kerakera-onna appears in Toriyama Sekien’s old picture scrolls of yokai: a giant woman in a fine kimono who leans over a wall in a deserted alley and laughs “kera kera!” at passers-by. Whoever hears her laugh is so startled they faint, and the laughter echoes in their ears for days.',
        hint: 'Something laughs over the festival street, but no one laughs back.',
        words: ['warau', 'egao', 'nikoniko', 'dokidoki', 'gakkari'],
      },
    ],
    tales: [
      {
        id: 'r12-frozen-faces',
        region: 12,
        main: true,
        title: 'Frozen Faces',
        jp: 'こおった かお',
        summary: 'Every face in the Valley of Hearts has frozen like a Noh mask, and no one can say how they feel. Hotaru the firefly child asks you to help them thaw.',
        giver: 'ko-hotaru',
        stages: [
          { en: 'Visit Kaede the mask carver in her workshop, north of the gate', jp: 'きたの こうぼうの めんうち カエデに あいに いこう', target: ['kw-kaede'], map: 'kokoro-workshop' },
          { en: 'Thaw three frozen faces by naming their feelings truly: Taro by the river, Mamoru at the terraces and Sora on the festival street', jp: 'こおった 顔を 三人 とかそう：かわの タロウ・たんぼの マモル・まつりの ソラ', target: [...THAWS], map: 'kokoro' },
          { en: 'Tell Kaede that the three have thawed', jp: '三人が とけた ことを カエデに しらせよう', target: ['kw-kaede'], map: 'kokoro-workshop' },
          { en: 'Take the heart mask to the kagura hall and face Hannya, then tell Hotaru at the west gate', jp: 'こころの めんを もって かぐらでんの はんにゃに たちむかい、にしの もんの ホタルに しらせよう', target: ['ks-ren', 'ks-hannya', 'ko-hotaru'], map: 'kokoro-stage' },
        ],
      },
      {
        id: 'fk12-amanojaku',
        region: 12,
        yokai: 'amanojaku',
        title: 'The Backwards Child',
        jp: 'あまのじゃく',
        summary: 'A strange child has turned up at Grandma Chiyo’s farmhouse. It says it hates her, hates the house, hates her cooking… and never leaves.',
        giver: 'kf-obaa',
        stages: [
          { en: 'Talk to the child who says everything backwards', jp: 'はんたいの ことばかり いう 子に はなしかけよう', target: ['fk12-amanojaku'], map: 'kokoro-farmhouse' },
          { en: 'Ask Kaede the mask carver how to help someone who can only say the opposite', jp: 'めんうちの カエデに そうだんしよう', target: ['kw-kaede'], map: 'kokoro-workshop' },
          { en: 'Bring the two-faced mask to the backwards child', jp: 'うらおもての めんを あまのじゃくに とどけよう', target: ['fk12-amanojaku'], map: 'kokoro-farmhouse' },
          { en: 'Help the child say thank you to Grandma Chiyo', jp: 'あまのじゃくが おばあさんに おれいを いえる ように てつだおう', target: ['kf-obaa'], map: 'kokoro-farmhouse' },
        ],
      },
      {
        id: 'fk12-ameonna',
        region: 12,
        yokai: 'ame-onna',
        title: 'The Woman Who Brings the Rain',
        jp: 'あめおんな',
        summary: 'By the river in the firefly grove, a woman is crying, and wherever she cries, it rains.',
        giver: 'fk12-ameonna',
        stages: [
          { en: 'Comfort the crying woman by the river', jp: 'かわべで なく 女の 人を なぐさめよう', target: ['fk12-ameonna'], map: 'kokoro-grove' },
          { en: 'Ask Mamoru the rice farmer what he thinks of the rain', jp: 'こめづくりの マモルに、雨の ことを きこう', target: ['ko-mamoru'], map: 'kokoro' },
          { en: 'Bring Mamoru’s letter to Ame-onna', jp: 'マモルの てがみを あめおんなに とどけよう', target: ['fk12-ameonna'], map: 'kokoro-grove' },
        ],
      },
      {
        id: 'fk12-kerakera',
        region: 12,
        yokai: 'kerakera-onna',
        title: 'Laughter in an Empty Street',
        jp: 'けらけらおんな',
        summary: 'A giant woman leans over the festival stalls and laughs and laughs. Nobody laughs back.',
        giver: 'fk12-kerakera',
        stages: [
          { en: 'Answer the laughing woman’s riddles of sound-feelings', jp: 'けらけらおんなの なぞなぞに こたえよう', target: ['fk12-kerakera'], map: 'kokoro' },
          { en: 'Give the paddy scarecrow its smile back: cast えがお or にこにこ at it', jp: 'たんぼの かかしに「えがお」か「にこにこ」と となえよう', target: ['ko-scarecrow'], map: 'kokoro' },
          { en: 'Tell Kerakera-onna', jp: 'けらけらおんなに しらせよう', target: ['fk12-kerakera'], map: 'kokoro' },
        ],
      },
    ],
    entities: {
      kokoro: [
        // leaning over the festival street, north side
        { id: 'fk12-kerakera', kind: 'npc', sprite: 'lady', x: 52, y: 17, dir: 'down', name: KERAKERA, lines: [{ jp: 'けらけらけら！ …だれも わらって くれない。', en: 'Kera-kera-kera! …No one laughs back.' }] },
      ],
      'kokoro-farmhouse': [{ id: 'fk12-amanojaku', kind: 'npc', sprite: 'child', x: 14, y: 5, dir: 'left', name: AMANOJAKU, lines: [{ jp: 'おばあさんなんか きらい！ この いえも きらい！ …（でも、でて いかない）', en: 'I hate Grandma! I hate this house too! …(But it doesn’t leave.)' }] }],
      'kokoro-grove': [{ id: 'fk12-ameonna', kind: 'npc', sprite: 'villager-b', x: 12, y: 20, dir: 'up', name: AMEONNA, lines: [{ jp: '…しくしく。わたしが なくと、雨が やまないの。', en: '…*sob*. When I cry, the rain never stops.' }] }],
    },
    visible: {
      // each spirit goes home once it has signed the scroll
      'fk12-kerakera': (s) => stageOf(s, 'fk12-kerakera') < 3,
      'fk12-ameonna': (s) => stageOf(s, 'fk12-ameonna') < 3,
    },
    talk: {
      // ── Frozen Faces ──
      'ko-hotaru': (c) => {
        const st = c.stage('r12-frozen-faces')
        if (st < 0)
          return offer(
            c,
            'r12-frozen-faces',
            [
              c.say('この 谷の みんなは、きもちを なくしかけて いるの。顔が こおって、うごかないの。', 'Everyone in this valley is losing their feelings. Their faces have frozen stiff.', HOTARU, 'child'),
              c.say('めんうちの カエデさんが いってた。「きもちに ほんとうの なまえを つければ、顔は とける」って。', 'Kaede the mask carver said: “Give a feeling its true name, and the face will thaw.”', HOTARU, 'child'),
              c.say('いっしょに、みんなの きもちを とかして くれる？', 'Will you help me thaw everyone’s feelings?', HOTARU, 'child'),
            ],
            ['うん、いっしょに やろう！', 'Yes, let’s do it together!'],
            ['ごめん、あとで。', 'Sorry, later.'],
          )
        if (st === 0) return [c.say('カエデさんの こうぼうは、きたの もみじの 中だよ。', 'Kaede’s workshop is to the north, among the maples.', HOTARU, 'child')]
        if (st === 1) return [c.say(`とけた 顔は ${thawCount(c.s())}つ。とけると、ほたるが ひとつ ふえるの！`, `${thawCount(c.s())} face${thawCount(c.s()) === 1 ? '' : 's'} thawed. Every time one thaws, there’s one more firefly!`, HOTARU, 'child')]
        if (st === 2) return [c.say('カエデさんに しらせて！', 'Go and tell Kaede!', HOTARU, 'child')]
        if (st === 3 && hannyaBeaten(c.s())) {
          c.sparkle('spark')
          return [
            c.say('きこえる？ みんなが わらって、ないて、おこって、なかなおり してる！', 'Can you hear it? Everyone’s laughing, crying, getting cross, making up!', HOTARU, 'child'),
            c.say('「うれしい」「くやしい」「ごめんね」「ありがとう」… きもちの ことばが、ほたるみたいに 光ってる。', '“I’m happy.” “It’s so frustrating.” “Sorry.” “Thank you.” …The words for feelings are glowing like fireflies.', HOTARU, 'child'),
            c.say('きて くれて ありがとう。この ちょうちん、あげる。きもちを いう たびに、もっと 明るく なるよ。', 'Thank you for coming. Take this lantern. Every time you say how you feel, it’ll glow brighter.', HOTARU, 'child'),
            ...c.give('r12-firefly-lantern'),
            ...c.bagItem('ether', 2),
            ...c.reward(260, 85),
            ...c.advance('r12-frozen-faces'),
          ]
        }
        if (st === 3) return [c.say('はんにゃは かぐらでんに いる。こころの めんを わすれないでね。', 'Hannya is in the kagura hall. Don’t forget the heart mask.', HOTARU, 'child')]
        return [c.say('ひがしの みちの さきに、そうぞうの とうが ある。こわい？ わくわく？ …どっちでも いいんだよ。', 'At the end of the east road is the Tower of Creation. Scared? Excited? …Either one is fine.', HOTARU, 'child')]
      },
      'kw-kaede': (c) => {
        const st = c.stage('r12-frozen-faces')
        const am = c.stage('fk12-amanojaku')
        const extra: Step[] =
          am === 1
            ? [
                c.say('はんたいの ことしか いえない 子？ ふふ、あまのじゃくね。', 'A child who can only say the opposite? Heh, an amanojaku.', KAEDE, 'maskmaker'),
                c.say('この「うらおもての めん」を かぶせて ごらん。はんたいの はんたいは… ほんとう、でしょ？', 'Have it wear this two-faced mask. The opposite of the opposite is… the truth, right?', KAEDE, 'maskmaker'),
                ...c.give('fk12-two-face-mask'),
                ...c.advance('fk12-amanojaku'),
              ]
            : []
        if (st === 0)
          return [
            ...extra,
            c.say('…いらっしゃい。わたしは めんうちの カエデ。', '…Welcome. I’m Kaede, the mask carver.', KAEDE, 'maskmaker'),
            c.say('めんは かおを かくす ものじゃ ない。きもちを うつす ものなの。でも いま、谷じゅうの 顔が めんに なって しまった。', 'A mask isn’t for hiding a face. It’s for showing a feeling. But now every face in the valley has turned into a mask.', KAEDE, 'maskmaker'),
            c.say('こおった きもちは、ほんとうの なまえで よばれると とけるの。でも、ひとの きもちに なまえを つける ときは きを つけて。', 'A frozen feeling thaws when it’s called by its true name. But be careful when you name someone else’s feeling.', KAEDE, 'maskmaker'),
            c.say('ひとの こころの 中は 見えない。だから「かなしい」じゃ なくて「かなしそう」「かなしい みたい」と いうのよ。', 'You can’t see inside another heart. So you don’t say “sad”: you say “looks sad” or “seems sad”.', KAEDE, 'maskmaker'),
            c.say('かわの タロウ、たんぼの マモル、まつりの ソラ。三人の きもちを とかして きて。', 'Taro by the river, Mamoru at the terraces, Sora on the festival street. Go and thaw those three.', KAEDE, 'maskmaker'),
            ...c.advance('r12-frozen-faces'),
          ]
        if (st === 1) return [...extra, c.say(`とけたのは ${thawCount(c.s())}人ね。ひとの きもちは「〜そう」「〜みたい」で。`, `${thawCount(c.s())} thawed, then. For other people’s feelings: 〜そう and 〜みたい.`, KAEDE, 'maskmaker'), ...host(c, 'r12-feelings')]
        if (st === 2) {
          openWardIfUngated(c)
          return [
            ...extra,
            c.say('三人とも とけたのね！ …ほら、その きもちの かけらが、あなたの まわりで 光ってる。', 'All three have thawed! …Look, the pieces of their feelings are glowing all around you.', KAEDE, 'maskmaker'),
            c.narrate('カエデは 光の かけらを のみに あつめ、まっしろな めんを ほった。', 'Kaede gathers the glowing pieces onto her chisel and carves a pure white mask.'),
            c.say('「こころの めん」。じぶんの 顔は もたない。かぶった 人の ほんとうの きもちだけを うつすの。', 'The heart mask. It has no face of its own. It shows only the true feelings of whoever wears it.', KAEDE, 'maskmaker'),
            c.say('かぐらでんに、はんにゃの めんが でたの。しっとと いかりの めん。でも… あの めんは、かなしい めんでも あるのよ。', 'The Hannya mask has appeared in the kagura hall. The mask of jealousy and rage. But… it is also a sad mask.', KAEDE, 'maskmaker'),
            ...c.give('r12-heart-mask'),
            ...c.advance('r12-frozen-faces'),
          ]
        }
        if (hannyaBeaten(c.s())) return [...extra, c.say('はんにゃの めんを なおしたの。もう こわい 顔じゃ ない。…すこし さびしそうで、すこし うれしそう。いい めんよ。', 'I mended the Hannya mask. It isn’t a frightening face anymore. …A little lonely-looking, a little happy-looking. A good mask.', KAEDE, 'maskmaker'), ...host(c, 'r12-feelings')]
        if (st === 3) return [...extra, c.say('こころの めんが あれば、はんにゃの いかりの 中でも、ほんとうの きもちが いえる はず。', 'With the heart mask, you should be able to say what you truly feel, even inside Hannya’s rage.', KAEDE, 'maskmaker')]
        return extra.length ? extra : null
      },
      'ko-taro': (c) => {
        if (c.stage('r12-frozen-faces') === 1 && !thawed(c.s(), 'ko-taro')) return [c.say('かけっこで まけた。まいにち れんしゅうしたのに… なのに、なみだも でない。', 'I lost the race. I practised every single day… and I can’t even cry.'), thawTaro(c)]
        if (hannyaBeaten(c.s())) return [c.say('ないたり わらったり、いそがしいよ！ でも、こっちの ほうが いい！', 'Crying, laughing, I’m so busy! But I like it better this way!'), ...host(c, 'r12-words-2')]
        return null
      },
      'ko-mamoru': (c) => {
        if (c.stage('fk12-ameonna') === 1 && !c.has('fk12-thanks-letter'))
          return [
            c.say('あめおんな？ …雨は、たんぼの いのちですよ。ことしの いねが よく そだったのも、あの 雨の おかげです。', 'Ame-onna? …Rain is the life of a rice paddy. This year’s rice grew so well because of that rain.', MAMORU, 'villager-a'),
            c.say('きらいだなんて、とんでもない。…てがみを かきます。とどけて くれますか。', 'Hate her? Never. …I’ll write her a letter. Would you take it to her?', MAMORU, 'villager-a'),
            ...c.give('fk12-thanks-letter'),
            ...c.advance('fk12-ameonna'),
          ]
        if (c.stage('r12-frozen-faces') === 1 && !thawed(c.s(), 'ko-mamoru')) return [c.say('……まつりの 日、雨が ふったら……', '……If it rains on festival day……', MAMORU, 'villager-a'), c.fude('マモルさんの 顔、こおって いますね。どんな きもちか、ことばに して みましょう。', 'Mamoru’s face is frozen. Let’s put his feeling into words.'), thawMamoru(c)]
        return null
      },
      'ko-sora': (c) => {
        if (c.stage('r12-frozen-faces') === 1 && !thawed(c.s(), 'ko-sora')) return [c.say('レンが れんしゅうで ころんだ とき… わたし、わらって しまったの。レンは おこって、それから ずっと 口を きいて くれない。', 'When Ren fell at practice… I laughed. Ren got angry, and she hasn’t spoken to me since.'), thawSora(c)]
        if (hannyaBeaten(c.s())) return [c.say('レンと なかなおり したよ！ あの 子、「わたしも おこりすぎた」って。りんごあめ、ひとつ どう？', 'Ren and I made up! She said “I got too angry too.” Want a candy apple?'), ...host(c, 'r12-sorry')]
        return null
      },
      'ks-ren': (c) => {
        if (hannyaBeaten(c.s())) return [c.say('あしたの まつり、はんにゃさんと いっしょに おどるの。いかりの まいじゃ なくて、さびしさが とける まい。', 'At tomorrow’s festival, I’ll dance with Hannya. Not a dance of rage: a dance where loneliness melts.', REN, 'dancer'), ...host(c, 'r12-cheer')]
        if (c.stage('r12-frozen-faces') === 3) return [c.say('はんにゃの めんが、ぶたいの 上に… こわい。でも、あの めん、ないて いる ような 気が する。', 'The Hannya mask, up on the stage… it’s frightening. But I have a feeling that mask is crying.', REN, 'dancer'), ...host(c, 'r12-cheer')]
        return null
      },
      // ── townsfolk once the faces thaw ──
      'ko-teahouse': (c) => (hannyaBeaten(c.s()) ? [c.say('おちゃが おいしいと、ほっと するわね。…あら、わたし、いま わらってる！', 'A good cup of tea makes you feel at ease, doesn’t it. …Oh my, I’m smiling!'), ...host(c, 'r12-words-1')] : null),
      'ko-gen': (c) => (hannyaBeaten(c.s()) ? [c.say('むかし、まいてを ひとり わすれて しまった。もっと はやく 思い出せば よかった… わしの ものがたりに、あの 人の ことも いれよう。', 'Long ago we forgot one of our dancers. I wish we had remembered her sooner… I’ll put her into my tales.'), ...host(c, 'r12-wishes')] : null),
      'ko-kid': (c) => (hannyaBeaten(c.s()) ? [c.say('めんを とったら、ちゃんと わたしの 顔だった！ えへへ、うれしい！', 'When I took off my mask, it was my own face again! Ehehe, I’m so happy!')] : null),
      'ko-bro-a': (c) => (hannyaBeaten(c.s()) ? [c.say('「ごめん」って いえた。リクも「ぼくも ごめん」って。なかなおりって、いいな。', 'I managed to say sorry. Riku said “Me too, sorry.” Making up feels good.')] : null),
      'ko-bro-b': (c) => (hannyaBeaten(c.s()) ? [c.say('にいちゃんと なかなおり したんだ！ きょうは いっしょに やたいを まわるの！', 'I made up with my big brother! Today we’re going round the stalls together!')] : null),
      'ks-flute': (c) => (hannyaBeaten(c.s()) ? [c.say('ふえの 音が もどったの！ うれしい 音も、かなしい 音も、ぜんぶ。', 'My flute’s voice is back! The happy notes and the sad ones, all of them.')] : null),
      // ── Amanojaku ──
      'kf-obaa': (c) => {
        const st = c.stage('fk12-amanojaku')
        if (st < 0)
          return offer(
            c,
            'fk12-amanojaku',
            [
              c.say('このごろ、へんな 子が いえに いるのよ。「おばあさんなんか きらい」「ごはん まずい」って いうのに、ぜんぶ たべて、ずっと いるの。', 'Lately a strange child has been staying here. It says “I hate you, Grandma” and “this food is yucky”, but it eats every bite and never leaves.', CHIYO, 'okami'),
              c.say('ほんとうは なにを 思って いるのかしら。…きいて みて くれる？', 'I wonder what it really thinks. …Would you ask it for me?', CHIYO, 'okami'),
            ],
            ['はい、きいて みます。', 'Yes, I’ll ask.'],
          )
        if (st === 3)
          return [
            c.say('あの 子、なにか いいたい ことが ある みたいね。', 'That child seems to have something it wants to say.', CHIYO, 'okami'),
            c.fude('ありがとうを いう れんしゅうを しましょう！', 'Let’s help it practise saying thank you!'),
            amanojakuThanks(c),
          ]
        if (st >= 4) return [c.say('あの 子、いまでも「きらい」って いうのよ。でもね、こんどは にこにこ しながら いうの。', 'It still says “I hate you”, you know. But now it says it with a big smile.', CHIYO, 'okami')]
        return [c.say('あの 子、いろりの そばが すきみたい。…「きらい」って いいながらね。', 'It seems to like sitting by the hearth. …While saying it hates it, of course.', CHIYO, 'okami')]
      },
      'fk12-amanojaku': (c) => {
        const st = c.stage('fk12-amanojaku')
        if (st === 0)
          return [
            c.say('なんだ おまえ！ きらい！ この いえも、おばあさんも、ごはんも ぜんぶ きらい！ ひとりが だいすき！', 'Who are you?! I hate you! This house, Grandma, the food, I hate it all! I LOVE being alone!', AMANOJAKU, 'child'),
            amanojakuTruth(c),
          ]
        if (st === 1) return [c.say('カエデなんか、ぜったい たすけて くれない！ …（いって こい、と いう 意味らしい）', 'Kaede will NEVER help! …(It seems to mean: go on, ask her.)', AMANOJAKU, 'child')]
        if (st === 2 && c.has('fk12-two-face-mask'))
          return [
            c.narrate('あまのじゃくは、うらおもての めんを そっと かぶった。', 'Amanojaku slips on the two-faced mask.'),
            c.say('……あれ？ 口が、ほんとうの ことを いう。おばあちゃんが、すき。ここが、すき。', '……Huh? My mouth is saying what’s true. I like Grandma. I like it here.', AMANOJAKU, 'child'),
            c.say('でも、どう いえば いいか わからない。いっしょに きて！', 'But I don’t know how to say it. Come with me!', AMANOJAKU, 'child'),
            ...c.advance('fk12-amanojaku'),
          ]
        if (st === 3) return [c.say('お、おばあちゃんに いうの、ドキドキする…', 'S-saying it to Grandma makes my heart pound…', AMANOJAKU, 'child')]
        if (st >= 4) return [c.say('おまえなんか、ぜんぜん すきじゃ ない！ …また あそびに こいよ。', 'I don’t like you one bit! …Come and play again, okay?', AMANOJAKU, 'child')]
        return null
      },
      // ── Ame-onna ──
      'fk12-ameonna': (c) => {
        const st = c.stage('fk12-ameonna')
        if (st < 0)
          return offer(
            c,
            'fk12-ameonna',
            [
              c.say('…しくしく。こないで。わたしが なくと、雨が ふるの。', '…*sob*. Don’t come close. When I cry, it rains.', AMEONNA, 'villager-b'),
              c.say('まつりが すきなのに、わたしが いくと いつも 雨。だから みんな、わたしを「あめおんな」と よんで いやがるの。', 'I love the festival, but whenever I go, it rains. So everyone calls me “the rain woman” and wishes I’d stay away.', AMEONNA, 'villager-b'),
            ],
            ['はなしを きかせて。', 'Tell me about it.'],
          )
        if (st === 0) return [c.say('わたしなんか… いない ほうが いいのに…', 'It would be better if I just weren’t here…', AMEONNA, 'villager-b'), comfortAmeonna(c)]
        if (st === 1) return [c.say('たんぼの 人たち… やっぱり おこって いるかしら。', 'The rice farmers… are they angry after all, I wonder.', AMEONNA, 'villager-b')]
        if (st === 2 && c.has('fk12-thanks-letter')) return [c.say('てがみ…？ わたしに？', 'A letter…? For me?', AMEONNA, 'villager-b'), readLetter(c)]
        return null
      },
      // ── Kerakera-onna ──
      'fk12-kerakera': (c) => {
        const st = c.stage('fk12-kerakera')
        if (st < 0)
          return offer(
            c,
            'fk12-kerakera',
            [
              c.say('けらけらけら！ あら、わたしを 見て たおれない 子は ひさしぶり！', 'Kera-kera-kera! Oh my, it’s been ages since someone saw me and didn’t faint!', KERAKERA, 'lady'),
              c.say('ねえ、なぞなぞ しよう！ こころの 音の なぞなぞ！', 'Let’s play riddles! Riddles of the heart’s sounds!', KERAKERA, 'lady'),
            ],
            ['いいよ、やろう！', 'Sure, let’s play!'],
          )
        if (st === 0) return [riddleOne(c)]
        if (st === 1) return [c.say('かかしの えがお、もどった？', 'Has the scarecrow got its smile back?', KERAKERA, 'lady')]
        if (st === 2) {
          c.sparkle('spark')
          return [
            c.say('きこえる！ たんぼの 子どもたちが、わらってる！', 'I can hear it! The children in the paddies are laughing!', KERAKERA, 'lady'),
            c.narrate('けらけらおんなが わらうと、まつりの みちの 人たちも、つられて くすくす わらいだした。', 'Kerakera-onna laughs, and the people on the festival street can’t help giggling along.'),
            c.say('いっしょに わらうって、こんなに うれしいのね。ひとりで わらうのは、もう おしまい！', 'Laughing together feels this good, doesn’t it. No more laughing alone for me!', KERAKERA, 'lady'),
            ...c.give('fk12-giggle-charm'),
            ...c.reward(100, 45),
            ...c.advance('fk12-kerakera'),
            ...c.seal('kerakera-onna'),
            c.say('…むかし、ふでを もった 子も、わたしを 見て わらったの。こわがらずに、いっしょに。あれは うれしかったなあ。', '…Long ago, a child with a brush saw me and laughed too. Not scared, laughing *with* me. That made me so happy.', KERAKERA, 'lady'),
            c.fude('ことねは、どこでも だれかと いっしょに わらって いたんだね。', 'Wherever she went, Kotone laughed together with someone.'),
          ]
        }
        return null
      },
    },
    cast: {
      // ── Kerakera-onna: the scarecrow's smile ──
      'ko-scarecrow': (c, k) => {
        if (k === 'えがお' || k === 'にこにこ') {
          c.learn(k === 'えがお' ? 'egao' : 'nikoniko')
          c.sparkle('spark')
          if (c.stage('fk12-kerakera') === 1)
            return [
              c.narrate(`「${k}」！ かかしの かすれた えがおに、あかい いろが もどった。`, `“${k === 'えがお' ? 'Egao' : 'Niko-niko'}”! Colour flows back into the scarecrow’s faded smile.`),
              c.narrate('たんぼで あそんで いた 子どもたちが、それを 見て げらげら わらいだした。', 'The children playing in the paddies see it and burst out laughing.'),
              c.fude('けらけらおんなに しらせましょう！', 'Let’s tell Kerakera-onna!'),
              ...c.advance('fk12-kerakera'),
            ]
          return [c.narrate('かかしが、にっこり わらった ような 気が した。', 'You could swear the scarecrow just smiled.'), ...once(c, 'ko-scarecrow')]
        }
        if (k === 'わらう') return (c.learn('warau'), [c.narrate('かかしの そでが、かぜで ぱたぱた ゆれた。わらって いる みたいだ。', 'The scarecrow’s sleeves flap in the wind, as if it were laughing.')])
        return null
      },
      // ── landmarks that answer word magic ──
      'ko-maple': (c, k) => {
        if (k !== 'なつかしい') return null
        c.learn('natsukashii')
        c.sparkle('leaf')
        return [c.narrate('「なつかしい」！ あかい はっぱが まいあがり、だれかの とおい あきの 日が 見えた ような 気が した。', '“Natsukashii”! Red leaves whirl up, and for a moment you seem to glimpse someone’s autumn day, long ago.'), ...once(c, 'ko-maple')]
      },
      'ko-well': (c, k) => {
        if (k === 'なみだ' || k === 'なく') {
          c.learn(k === 'なみだ' ? 'namida' : 'naku')
          c.sparkle('ripple')
          return [c.narrate('いどの そこで、だれかの なみだが きらりと 光り… ふっと きえた。すこし、こころが かるく なった。', 'Deep in the well, someone’s tear glints… and is gone. Your heart feels a little lighter.'), ...once(c, 'ko-well')]
        }
        return null
      },
      'ko-bell': (c, k) => {
        if (k === 'かんしゃ' || k === 'ありがとう') {
          if (k === 'かんしゃ') c.learn('kansha')
          c.sparkle('spark')
          return [c.narrate('からん、からん… おれいの すずが なった。谷じゅうに やさしい 音が ひびいた。', 'Clang, clang… the Bell of Thanks rings out, and its gentle voice carries across the valley.'), ...once(c, 'ko-bell')]
        }
        return null
      },
      'ko-lantern': (c, k) => {
        if (k === 'きたい' || k === 'たのしみ') {
          c.learn(k === 'きたい' ? 'kitai' : 'tanoshimi')
          c.sparkle('spark')
          return [c.narrate('ねがいの とうろうに、ぽっと ひが ともった。まつりが、たのしみに なって きた。', 'A flame flickers to life in the Wishing Lantern. Suddenly you can’t wait for the festival.'), ...once(c, 'ko-lantern')]
        }
        return null
      },
      'kw-oni': (c, k) => {
        if (k === 'いかり' || k === 'おこる') {
          c.learn(k === 'いかり' ? 'ikari' : 'okoru')
          return [c.narrate('おにの めんの 目が、ぎらりと 光った。…いかりも、だいじな きもちの ひとつ。', 'The oni mask’s eyes flash. …Anger, too, is one of the feelings that matter.'), c.say('いかりの めんを こわがらないで。いかりの したには、たいてい べつの きもちが あるの。', 'Don’t be afraid of the mask of anger. There’s usually another feeling underneath.', KAEDE, 'maskmaker'), ...once(c, 'kw-oni')]
        }
        return null
      },
      'kg-shrine': (c, k) => {
        if (k !== 'おもいやり') return null
        c.learn('omoiyari')
        c.sparkle('spark')
        return [c.narrate('ほこらの まわりに ほたるが あつまり、やさしい 光の わに なった。', 'Fireflies gather round the little shrine in a ring of gentle light.'), ...once(c, 'kg-shrine')]
      },
      'kg-willow': (c, k) => {
        if (k === 'しくしく' || k === 'めそめそ') {
          c.learn(k === 'しくしく' ? 'shikushiku' : 'mesomeso')
          return [c.narrate('やなぎが しくしく ゆれた。…でも、ないた あとの やなぎは、すこし すっきり して 見えた。', 'The willow sways, sobbing softly. …But afterwards, it looks a little refreshed.'), ...once(c, 'kg-willow')]
        }
        return null
      },
      'kf-hearth': (c, k) => {
        if (k === 'あんしん' || k === 'ほっと') {
          c.learn(k === 'あんしん' ? 'anshin' : 'hotto')
          c.sparkle('dust')
          return [c.narrate('いろりの ひが、ぱちんと はぜた。あたたかくて、ほっと する。', 'The hearth fire pops. It’s warm, and you breathe out in relief.'), ...once(c, 'kf-hearth')]
        }
        return null
      },
      'ko-cat': (c, k) => (k === 'かわいい' ? (c.learn('kawaii'), [c.narrate('もみじねこは、とくいげに しっぽを ぴんと たてた。', 'The maple cat proudly sticks its tail straight up.')]) : null),
      'ko-bro-a': (c, k) => (k === 'なかなおり' ? (c.learn('nakanaori'), [c.say('な、なかなおり…？ …リクが いいなら。', 'M-make up…? …If Riku wants to.')]) : null),
      'ko-bro-b': (c, k) => (k === 'なかなおり' ? (c.learn('nakanaori'), [c.say('…にいちゃんが さきに あやまったら、ゆるして あげても いい。', '…If my big brother says sorry first, I might forgive him.')]) : null),
      'ko-hotaru': (c, k) => (k === 'わくわく' ? (c.learn('wakuwaku'), c.sparkle('spark'), [c.say('わくわく！ ほたるの ひかりが、ちかちか おどってる！', 'Wakuwaku! My firefly light is dancing!', HOTARU, 'child')]) : null),
    },
    mapCast: {
      kokoro: (c, k) => {
        if (k === 'しあわせ') return (c.learn('shiawase'), c.sparkle('leaf'), [c.narrate('もみじの はっぱが ひらひら まって、あたたかい かぜが ふいた。', 'Maple leaves flutter down, and a warm breeze blows.')])
        if (k === 'わくわく' || k === 'うきうき') return (c.learn(k === 'わくわく' ? 'wakuwaku' : 'ukiuki'), [c.fude('まつりの たいこが きこえると、わくわく しますね！', 'Hearing the festival drums makes you excited, doesn’t it!')])
        if (k === 'さいこう') return (c.learn('saikou'), [c.fude('さいこうの まつりに しましょう！', 'Let’s make it the best festival ever!')])
        return null
      },
      'kokoro-grove': (c, k) => {
        if (k === 'こわい' || k === 'ぞっと') return (c.learn(k === 'こわい' ? 'kowai' : 'zotto'), [c.narrate('たけが ざわざわ ゆれた。…ぞっと したけど、ほたるの 光が すぐ そばに あった。', 'The bamboo rustles. …A shiver runs through you, but the fireflies’ light is right beside you.')])
        if (k === 'しずか') return [c.fude('しずかな よるですね。…しずかなのに、さびしく ない。', 'A quiet night. …Quiet, and yet not lonely.')]
        return null
      },
      'kokoro-stage': (c, k) => {
        if (k === 'どきどき' || k === 'きんちょうする') return (c.learn(k === 'どきどき' ? 'dokidoki' : 'kinchou-suru'), [c.say('ぶたいの 上は、いつも ドキドキ するよ。それで いいんだって。', 'On stage my heart always pounds. That’s how it should be, they say.', REN, 'dancer')])
        return null
      },
    },
  },
]
