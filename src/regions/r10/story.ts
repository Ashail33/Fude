/**
 * Region 10 — the Cloud Capital. The main road: Raijin's drums shatter
 * every sentence in the sky city (the dragon's quiet whispered that if he
 * drummed loud enough, he would never have to hear the hush before
 * thunder). Amane the celestial maiden asks for help; the Sky-Scholar
 * knows how to make sentences hold together; three shattered sentences are
 * mended with real grammar (でしょう, より…のほうが, 〜ば), and the word-chime
 * he builds from them opens the way to the drum hall.
 *
 * Folklore: the Hagoromo maiden, whose feather robe a cloud-fisher took
 * (reasons with から, a promise); Raitarō the thunder child, fallen into an
 * old woman's cloud-field with a cracked drum (the potential and 〜ば); and
 * Tobiume, Tenjin's faithful plum tree, who has forgotten her master's poem
 * (“if the east wind blows…”, 〜ば and 忘れる).
 */
import { ACTIVITY_BY_ID } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from '../../story/tales/r1-village'
import type { Ctx, TaleContent } from '../../story/tales/types'

const HAGOROMO = { jp: 'はごろもの てんにん', en: 'The Hagoromo Maiden' }
const HAKURYO = { jp: '雲つりの ハクリョウ', en: 'Hakuryō the Cloud-Fisher' }
const RAITARO = { jp: 'らいたろう', en: 'Raitarō' }
const GRANDMA = { jp: 'おばあさん', en: 'Grandma' }
const TOBIUME = { jp: 'とびうめ', en: 'Tobiume' }
const SCHOLAR = { jp: 'はかせ', en: 'Sky-Scholar' }

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
const raijinBeaten = (s: PlayerState) => isPassed(s, 'r10-boss')

// ─── Shattered Sentences (main) ──────────────────────────────────────
const MENDS = ['c-shigure', 'c-candy', 'c-poet'] as const
const mended = (s: PlayerState, id: string) => flagOf(s, `r10.mend.${id}`) > 0
const mendCount = (s: PlayerState) => MENDS.filter((id) => mended(s, id)).length

function mendDone(c: Ctx, id: string, reply: Step[]): Step[] {
  c.set(`r10.mend.${id}`)
  c.sparkle('spark')
  c.sfx('correct')
  const n = mendCount(c.s())
  const out: Step[] = [...reply, c.narrate('ちぎれた ことばが、ひとつの ぶんに もどった！', 'The torn words snap back together into one whole sentence!')]
  if (n >= 3) out.push(c.fude('三つ ぜんぶ なおった！ はかせの ところへ もどりましょう！', 'All three are mended! Let’s go back to the scholar!'), ...c.advance('r10-shattered'))
  else out.push(c.fude(`あと ${3 - n}つ！`, `${3 - n} more to go!`))
  return out
}

function mendForecast(c: Ctx): Step {
  return c.choice(
    { jp: '「あしたは 雨が ふる…」 の あとに なにを つなぐ？', en: '“Tomorrow it will rain…” — what joins on to the end?' },
    [
      ['mashou', '…ましょう。', '…let’s.'],
      ['deshou', '…でしょう。', '…probably.'],
      ['kudasai', '…ください。', '…please.'],
    ],
    (id) => {
      if (id !== 'deshou') return [c.say('「雨が ふりましょう」？ 雨に たのんで どうするの！', '“Let’s rain”? What good is asking the rain?'), c.fude('よほうは「でしょう」ですよ。', 'A forecast uses でしょう.'), mendForecast(c)]
      c.learn('furu')
      return mendDone(c, 'c-shigure', [c.say('「あしたは 雨が ふるでしょう」！ やっと 一つ、よほうが 書けた！', '“Tomorrow it will probably rain”! At last, one whole forecast!')])
    },
  )
}

function mendSign(c: Ctx): Step {
  return c.choice(
    { jp: 'どの かんばんが ただしい？（モモの おすすめは、あまい ぶどうあめ）', en: 'Which sign is right? (Momo’s pick is the grape candy — it’s the sweeter one.)' },
    [
      ['a', 'いちごあめより ぶどうあめの ほうが あまい！', 'Grape candy is sweeter than strawberry candy!'],
      ['b', 'ぶどうあめより いちごあめの ほうが あまい！', 'Strawberry candy is sweeter than grape candy!'],
      ['c', 'いちごあめより ぶどうあめを あまい！', '(Than strawberry, grape-object sweet!)'],
    ],
    (id) => {
      if (id === 'b') return [c.say('それじゃ、いちごの ほうが あまく なっちゃう！', 'That makes the strawberry one sweeter!'), c.fude('「Bより Aの ほうが」：あまい ほう（ぶどう）に「の ほうが」ですよ。', 'B より A の ほうが: the sweeter one (grape) takes の ほうが.'), mendSign(c)]
      if (id !== 'a') return [c.say('うーん、それだと よく わからないよ。', 'Hmm, that doesn’t really make sense.'), c.fude('くらべる ときは「が」ですよ：Aの ほうが あまい。', 'In a comparison the winner takes が: A の ほうが あまい.'), mendSign(c)]
      c.learn('hou')
      return mendDone(c, 'c-candy', [c.say('「いちごあめより ぶどうあめの ほうが あまい」！ これで みんな わかるね！', '“Grape candy is sweeter than strawberry!” Now everyone will get it!')])
    },
  )
}

function mendPoem(c: Ctx): Step {
  return c.choice(
    { jp: '「かなしい ときも、うたを ＿、こころが かるく なる」', en: '“Even when you’re sad, if you ___ a poem, your heart grows light.” (よむ = recite)' },
    [
      ['yomuba', 'よむば', 'yomu-ba'],
      ['yomeba', 'よめば', 'yomeba'],
      ['yondeba', 'よんでば', 'yonde-ba'],
    ],
    (id) => {
      if (id !== 'yomeba') return [c.say('…ひびきが ちがう。うたが ないて いる。', '…That doesn’t ring true. The poem is crying.'), c.fude('「〜ば」は、さいごの 音を え の だんに：よむ → よめば。', 'For 〜ば, change the last sound to the え row: よむ → よめば.'), mendPoem(c)]
      c.learn('kanashii')
      return mendDone(c, 'c-poet', [c.say('「かなしい ときも、うたを よめば、こころが かるく なる」… ああ、わたしの うたが かえって きた。', '“Even when you’re sad, if you recite a poem, your heart grows light”… Ah, my poem has come home.')])
    },
  )
}

// ─── Raitarō ─────────────────────────────────────────────────────────
function raitaroPromise(c: Ctx): Step {
  return c.choice(
    { jp: 'らいたろうに なんと いう？', en: 'What do you tell Raitarō?' },
    [
      ['a', 'たいこを なおせば、とべるよ。', 'If we fix your drum, you’ll be able to fly.'],
      ['b', 'たいこを なおすば、とぶよ。', '(If fix-ba the drum, fly.)'],
      ['c', 'たいこが なくても、とべないよ。', 'Even without a drum, you can’t fly.'],
    ],
    (id) => {
      if (id === 'b') return [c.say('なおす…ば？ へんなの。', 'Fix… ba? That sounds funny.', RAITARO, 'child'), c.fude('「なおす」は「なおせば」。「とぶ」は「とべる」で「とぶ ことが できる」ですよ。', 'なおす → なおせば (if we fix), and とぶ → とべる (can fly).'), raitaroPromise(c)]
      if (id === 'c') return [c.say('うわーん！ やっぱり とべないんだ！', 'Waaah! So I really can’t fly!', RAITARO, 'child'), c.fude('ちがう ちがう！ げんきが でる ことを いおう。', 'No, no! Let’s say something that cheers him up.'), raitaroPromise(c)]
      c.learn('dekiru')
      return [
        c.say('ほんと？ なおせば、とべる？ じゃあ、さがす！', 'Really? If we fix it, I can fly? Then let’s find a way!', RAITARO, 'child'),
        c.fude('たいこを なおせる 人… たいこどのの たいこうちさんなら、きっと！', 'Someone who can mend a drum… the drummer in the drum hall, surely!'),
        ...c.give('fk10-cracked-drum'),
        ...c.advance('fk10-raitaro'),
      ]
    },
  )
}

function grandmaFarewell(c: Ctx): Step {
  return c.choice(
    { jp: 'おばあさんに なにか いって あげよう', en: 'Say something to Grandma' },
    [
      ['stay', 'らいたろうは かえらない ほうが いいです。', 'It’s better if Raitarō doesn’t go home.'],
      ['back', 'らいたろうは、雨が ふれば いつでも あいに きますよ。', 'Whenever it rains, Raitarō will come to see you.'],
      ['shrug', 'しりません。', 'I don’t know.'],
    ],
    (id) => {
      if (id === 'shrug') return [c.say('…そうかい。', '…I see.', GRANDMA, 'innkeeper'), grandmaFarewell(c)]
      if (id === 'stay') return [c.say('ありがとうね。でも、この 子の うちは 空の 上なんだよ。', 'Thank you, dear. But this child’s home is up in the sky.', GRANDMA, 'innkeeper'), grandmaFarewell(c)]
      c.take('fk10-mended-drum')
      c.sparkle('spark')
      return [
        c.say('雨が ふれば… そうだね。雨の 日が たのしみに なったよ。', 'Whenever it rains… yes. Now I’ll look forward to rainy days.', GRANDMA, 'innkeeper'),
        c.say('おばあちゃん、ありがとう！ わすれないよ！ ずっと！', 'Thank you, Grandma! I won’t forget! Not ever!', RAITARO, 'child'),
        c.narrate('らいたろうが たいこを うつと、ちいさな いなずまが はしり… 雲だに やさしい 雨が ふりはじめた。', 'Raitarō beats his drum: a tiny bolt of lightning flickers… and soft rain begins to fall on the cloud-field.'),
        c.narrate('雨の あと、たんぼの いねが きらきら ひかって いた。', 'When the rain stops, the rice in the field is shining.'),
        ...c.give('fk10-rain-bell'),
        ...c.reward(110, 45),
        ...c.advance('fk10-raitaro'),
        ...c.seal('raitaro'),
        c.say('…あのね。ずっと むかし、ふでを もった おねえちゃんに あったんだ。しずかに なると こわかった ぼくに、いきの すいかたを おしえて くれた。', '…You know what? A long, long time ago, I met a big sister with a brush. I was scared whenever it went quiet, and she taught me how to breathe.', RAITARO, 'child'),
        c.fude('ことね…！ ここにも きて いたんだ。', 'Kotone…! She came here too.'),
      ]
    },
  )
}

// ─── Hagoromo ────────────────────────────────────────────────────────
function persuadeFisher(c: Ctx): Step {
  return c.choice(
    { jp: 'ハクリョウを せっとくしよう', en: 'Persuade Hakuryō' },
    [
      ['kara', 'はごろもが ないと 天に かえれないから、かえして ください。', 'She can’t go back to heaven without the feather robe, so please give it back.'],
      ['order', 'から かえして ください。はごろもが ないと…', '(Because give it back. Without the robe…)'],
      ['keep', 'きれいだから、もって いて ください。', 'It’s pretty, so please keep it.'],
    ],
    (id) => {
      if (id === 'order') return [c.say('ん？ 「から」が まいごに なって いるぞ。', 'Hm? Your から has wandered off somewhere.', HAKURYO, 'villager-a'), c.fude('りゆうが さき、「から」は りゆうの すぐ あとですよ。', 'The reason comes first, and から goes right after it.'), persuadeFisher(c)]
      if (id === 'keep') return [c.say('だろう！ …いや、まて。あの ひとが ないて いるのは、それでか。', 'Right?! …No, wait. Is that why she’s crying?', HAKURYO, 'villager-a'), c.fude('てんにんさんの きもちも 考えて あげましょう。', 'Let’s think about how she feels too.'), persuadeFisher(c)]
      c.learn('riyuu')
      return [
        c.say('…天に かえれない、か。それは かわいそうだ。', '…She can’t go back to heaven, eh. That’s a sad thing.', HAKURYO, 'villager-a'),
        c.say('かえしても いい。でも、かえしたら にげて しまう かもしれない。', 'I’ll return it. But if I do, she might just fly away without a word.', HAKURYO, 'villager-a'),
        c.say('せめて、てんにんの まいを 見たいんだ。いちどだけ。', 'At least I’d like to see a heavenly dance. Just once.', HAKURYO, 'villager-a'),
        c.fude('てんにんさんに きいて みましょう！', 'Let’s go and ask her!'),
        ...c.advance('fk10-hagoromo'),
      ]
    },
  )
}

function promiseDance(c: Ctx, tries = 0): Step {
  return c.ask({ jp: 'ハクリョウに つたえよう：「まいを みせる ＿＿＿ です」', en: 'Tell Hakuryō: “It’s a ___ that she’ll dance.” (promise)' }, ['やくそく', '約束'], (ok) => {
    if (!ok)
      return tries < 1
        ? [c.say('ん？ なにを するって？', 'Hm? She’ll do what, now?', HAKURYO, 'villager-a'), c.fude('「かならず する」と ちかう ことば… やくそく！', 'The word for swearing you’ll do something: a promise, やくそく!'), promiseDance(c, tries + 1)]
        : [c.fude('「やくそく」ですよ。もう いちど はなしかけて みましょう。', 'It’s やくそく. Let’s talk to him again.')]
    c.learn('yakusoku')
    c.sfx('correct')
    return [
      c.say('やくそく、か。…うたがって、すまなかった。', 'A promise, then. …Forgive me for doubting her.', HAKURYO, 'villager-a'),
      c.narrate('ハクリョウは、まつの えだから しろい はごろもを おろした。', 'Hakuryō lifts the white feather robe down from the pine branch.'),
      ...c.give('fk10-hagoromo-robe'),
      c.fude('てんにんさんに とどけましょう！', 'Let’s take it to her!'),
      ...c.advance('fk10-hagoromo'),
    ]
  })
}

// ─── Tobiume ─────────────────────────────────────────────────────────
function finishPoem(c: Ctx, tries = 0): Step {
  return c.ask({ jp: '「ひがしの 風が ＿＿＿、においを とどけて おくれ」（ふく → ？）', en: '“If the east wind ___, send me your scent” (ふく → if it blows?)' }, ['ふけば', '吹けば'], (ok) => {
    if (!ok)
      return tries < 1
        ? [c.say('…その ことばでは、風が ふかないのです。', '…With that word, the wind doesn’t blow.', TOBIUME, 'villager-b'), c.fude('「〜ば」は え の だん：ふく → ふけば！', '〜ば uses the え row: ふく → ふけば!'), finishPoem(c, tries + 1)]
        : [c.fude('「ふけば」ですよ。もう いちど はなしかけて みましょう。', 'It’s ふけば. Let’s talk to her again.')]
    c.learn('fuku')
    c.learn('wasureru')
    c.sparkle('leaf')
    c.sfx('correct')
    return [
      c.say('「ひがしの 風が ふけば、においを とどけて おくれ、うめの 花よ。あるじが いなくても、はるを わすれるな」', '“If the east wind blows, send me your scent, plum blossoms. Even with your master gone, do not forget the spring.”', TOBIUME, 'villager-b'),
      c.say('…おもいだしました。あるじの さいごの うた。わたしは、これを わすれたく なかった。', '…I remember now. My master’s last poem. I never wanted to forget it.', TOBIUME, 'villager-b'),
      c.narrate('ひがしから 風が ふき、うめの 花びらが てんじんさまの ほこらへ とんで いった。', 'An east wind rises, and plum petals fly across the sky toward Tenjin’s little shrine.'),
      ...c.give('fk10-plum-blossom'),
      ...c.reward(100, 45),
      ...c.advance('fk10-tobiume'),
      ...c.seal('tobiume'),
      c.say('…むかし、ふでを もった 女の子も、この うたを 書きうつして いました。「わすれないって、いちばん やさしい ちからだね」と。', '…Long ago, a girl with a brush copied this poem down too. “Not forgetting is the gentlest kind of strength,” she said.', TOBIUME, 'villager-b'),
      c.fude('わすれない ちから…。ことね、わたしも もう わすれないよ。', 'The strength of not forgetting… Kotone, I won’t forget you again.'),
    ]
  })
}

export const CONTENT: TaleContent[] = [
  {
    items: [
      { id: 'r10-word-chime', name: 'Word-Chime', jp: 'ことばの ふうりん', kana: 'ふうりん', emoji: '🎐', desc: 'A glass wind chime made from three mended sentences. While it rings, words stay whole, even in thunder.' },
      { id: 'r10-drum-skin', name: 'Thunder-Drum Skin', jp: 'かみなりの たいこの かわ', kana: 'たいこのかわ', emoji: '🥁', desc: 'A drumhead Raijin gave you. Tap it and it rumbles softly, like distant thunder that isn’t angry anymore.' },
      { id: 'fk10-hagoromo-robe', name: 'The Feather Robe', jp: 'はごろも', kana: 'はごろも', emoji: '🪽', desc: 'A celestial maiden’s robe of white feathers. It weighs nothing at all and keeps trying to float away.' },
      { id: 'fk10-heaven-feather', name: 'Feather from Heaven', jp: '天の はね', kana: 'てんのはね', emoji: '🪶', desc: 'A single feather left behind by the Hagoromo maiden’s dance. It hums a tune with no sound.' },
      { id: 'fk10-cracked-drum', name: 'Raitarō’s Cracked Drum', jp: 'われた たいこ', kana: 'たいこ', emoji: '🪘', desc: 'A thunder child’s tiny drum, split right across. It sparks sadly when tapped.' },
      { id: 'fk10-mended-drum', name: 'Raitarō’s Mended Drum', jp: 'なおった たいこ', kana: 'たいこ', emoji: '🪘', desc: 'Good as new, and louder than it looks. Do not tap it indoors.' },
      { id: 'fk10-rain-bell', name: 'Rain Bell', jp: '雨の すず', kana: 'あめのすず', emoji: '🔔', desc: 'A gift from Raitarō. Ring it on a dry day and somewhere, a little rain falls.' },
      { id: 'fk10-poem-slip', name: 'Tenjin’s Poem', jp: 'てんじんの うた', kana: 'うた', emoji: '📜', desc: 'The Sky-Scholar’s copy of an old poem, half-smudged: “If the east wind… send me your scent…”' },
      { id: 'fk10-plum-blossom', name: 'Flying Plum Blossom', jp: 'とびうめの 花', kana: 'うめのはな', emoji: '🌸', desc: 'A plum blossom that flew across the sky on an east wind. It never wilts, and smells of early spring.' },
    ],
    yokai: [
      {
        id: 'hagoromo',
        region: 10,
        name: 'The Hagoromo Maiden',
        jp: '羽衣',
        kana: 'はごろも',
        emoji: '🪽',
        lore: 'On the pine beach of Miho, a fisherman named Hakuryō found a robe of feathers hanging on a pine and decided to keep it as a treasure. Its owner, a tennin (celestial maiden), wept that without it she could never return to heaven. He agreed to give it back if she would dance for him; when he worried she would fly off without dancing, she answered, “Doubt is for mortals; in heaven there is no deceit.” She danced, and rose into the sky over Mount Fuji.',
        hint: 'By a pine at the edge of the clouds, a celestial maiden is crying. Someone has her robe.',
        words: ['riyuu', 'yakusoku', 'ten', 'shinjiru'],
      },
      {
        id: 'raitaro',
        region: 10,
        name: 'Raitarō',
        jp: '雷太郎',
        kana: 'らいたろう',
        emoji: '⚡',
        lore: 'In a dry summer, a bolt of lightning struck a poor old couple’s field, and in the smoke they found a baby boy: a child of the thunder. They named him Raitarō and raised him with love, and wherever he went, rain came at just the right time and the harvests grew rich. When he was grown, he told them he had to go home, turned into a white cloud or a dragon, and rose back into the sky, leaving them happy for the rest of their days.',
        hint: 'Something fell into an old woman’s cloud-field with a great BOOM.',
        words: ['kaminari', 'dekiru', 'wasureru', 'ame'],
      },
      {
        id: 'tobiume',
        region: 10,
        name: 'Tobiume, the Flying Plum',
        jp: '飛梅',
        kana: 'とびうめ',
        emoji: '🌸',
        lore: 'When the scholar-poet Sugawara no Michizane was exiled from the capital to far-off Dazaifu, he said goodbye to his beloved plum tree with a poem: “If the east wind blows, send me your scent, plum blossoms; though your master is gone, do not forget the spring.” That night the plum tree flew all the way to Dazaifu to be with him. Michizane was later worshipped as Tenjin, god of learning — and, after storms struck the capital, as a god of thunder.',
        hint: 'In the sky garden, an old plum tree has forgotten a poem and keeps facing east.',
        words: ['fuku', 'wasureru', 'oboeru', 'omoide'],
      },
    ],
    tales: [
      {
        id: 'r10-shattered',
        region: 10,
        main: true,
        title: 'Shattered Sentences',
        jp: 'ばらばらの ぶん',
        summary: 'Raijin’s drums break every sentence in the Cloud Capital to pieces. Amane the celestial maiden asks you to make the words whole again.',
        giver: 'c-amane',
        stages: [
          { en: 'Ask the Sky-Scholar in the star observatory why the drums won’t stop', jp: 'ほしの やかたの はかせに、たいこの ことを きこう', target: ['co-hakase'], map: 'clouds-observatory' },
          { en: 'Mend three shattered sentences: Shigure’s forecast, Momo’s candy sign and Harukaze’s poem', jp: 'こわれた ぶんを 三つ なおそう：シグレの よほう・モモの かんばん・ハルカゼの うた', target: [...MENDS], map: 'clouds' },
          { en: 'Bring the mended sentences back to the Sky-Scholar', jp: 'なおった ぶんを はかせに とどけよう', target: ['co-hakase'], map: 'clouds-observatory' },
          { en: 'Carry the word-chime into the thunder-drum hall and face Raijin, then tell Amane at the west gate', jp: 'ことばの ふうりんを もって らいじんに たちむかい、にしの もんの アマネに しらせよう', target: ['c-hall-guard', 'ch-raijin', 'c-amane'], map: 'clouds-hall' },
        ],
      },
      {
        id: 'fk10-hagoromo',
        region: 10,
        yokai: 'hagoromo',
        title: 'The Feather Robe',
        jp: 'はごろも',
        summary: 'A celestial maiden weeps under a pine at the cloud’s edge. Without her feather robe, she can never go home to heaven.',
        giver: 'fk10-tennin',
        stages: [
          { en: 'Find who has the robe: talk to the cloud-fisher near the pine', jp: 'はごろもを もって いる 人を さがそう：まつの ちかくの 雲つりに はなそう', target: ['fk10-fisher'], map: 'clouds' },
          { en: 'Ask the maiden whether she will dance for the fisherman', jp: 'てんにんに、まいを みせて くれるか きこう', target: ['fk10-tennin'], map: 'clouds' },
          { en: 'Tell Hakuryō her answer', jp: 'ハクリョウに こたえを つたえよう', target: ['fk10-fisher'], map: 'clouds' },
          { en: 'Return the feather robe to the maiden', jp: 'はごろもを てんにんに かえそう', target: ['fk10-tennin'], map: 'clouds' },
        ],
      },
      {
        id: 'fk10-raitaro',
        region: 10,
        yokai: 'raitaro',
        title: 'The Thunder Child',
        jp: 'かみなりの 子',
        summary: 'Something fell into an old woman’s cloud-field during the drumming: a little boy with sparks in his hair and a cracked drum.',
        giver: 'c-grandma',
        stages: [
          { en: 'Talk to the thunder child in the cloud-field', jp: '雲だの かみなりの 子に はなしかけよう', target: ['fk10-raitaro'], map: 'clouds' },
          { en: 'Find someone in the thunder-drum hall who can mend Raitarō’s drum', jp: 'たいこどので、たいこを なおせる 人を さがそう', target: ['ch-drummer'], map: 'clouds-hall' },
          { en: 'Bring the mended drum back to Raitarō', jp: 'なおった たいこを らいたろうに とどけよう', target: ['fk10-raitaro'], map: 'clouds' },
          { en: 'Help Grandma say goodbye', jp: 'おばあさんの さよならを てつだおう', target: ['c-grandma'], map: 'clouds' },
        ],
      },
      {
        id: 'fk10-tobiume',
        region: 10,
        yokai: 'tobiume',
        title: 'If the East Wind Blows',
        jp: 'こちふかば',
        summary: 'In the sky garden, the spirit of an old plum tree keeps facing east. She has forgotten the last poem her master wrote for her.',
        giver: 'fk10-plum',
        stages: [
          { en: 'Ask the Sky-Scholar about an old poem for a plum tree', jp: 'はかせに、うめの 木の ふるい うたの ことを きこう', target: ['co-hakase'], map: 'clouds-observatory' },
          { en: 'Make the east wind blow: cast ふく (blow) at the old plum tree', jp: 'ふるい うめの 木に「ふく」と となえよう', target: ['cg-plum'], map: 'clouds-garden' },
          { en: 'Help the plum spirit finish her master’s poem', jp: 'うめの せいれいと、あるじの うたを しあげよう', target: ['fk10-plum'], map: 'clouds-garden' },
        ],
      },
    ],
    entities: {
      clouds: [
        // the pine cliff, south-west
        { id: 'fk10-tennin', kind: 'npc', sprite: 'tennin', x: 16, y: 33, dir: 'left', name: HAGOROMO, lines: [{ jp: '…しくしく。はごろもが ないと、天に かえれない…', en: '…*sniff*. Without my feather robe, I can’t go back to heaven…' }] },
        { id: 'fk10-fisher', kind: 'npc', sprite: 'villager-a', x: 13, y: 37, dir: 'up', name: HAKURYO, lines: [{ jp: '雲の 上で つりを して いる。きょうは めずらしい ものが つれたぞ。', en: 'I fish above the clouds. Caught something rare today, I did.' }] },
        // the cloud-field by the houses, south-east
        { id: 'fk10-raitaro', kind: 'npc', sprite: 'child', x: 52, y: 39, dir: 'left', name: RAITARO, lines: [{ jp: 'ぐすん… とうちゃんの ところに かえりたい…', en: '*Sniffle*… I want to go home to my dad…' }] },
      ],
      'clouds-garden': [{ id: 'fk10-plum', kind: 'npc', sprite: 'villager-b', x: 9, y: 11, dir: 'right', name: TOBIUME, lines: [{ jp: 'ひがしの 風… まだ ふかない…', en: 'The east wind… still doesn’t blow…' }] }],
    },
    visible: {
      // she flies home to heaven once the robe is back
      'fk10-tennin': (s) => stageOf(s, 'fk10-hagoromo') < 4,
      // he rides the rain home
      'fk10-raitaro': (s) => stageOf(s, 'fk10-raitaro') < 4,
    },
    talk: {
      // ── Shattered Sentences ──
      'c-amane': (c) => {
        const st = c.stage('r10-shattered')
        if (st < 0)
          return offer(
            c,
            'r10-shattered',
            [
              c.say('…ごめんなさい。たいこが なる たびに、ことばが われて しまうの。', '…Sorry. Every time the drums boom, my words break apart.'),
              c.say('らいじんさまが、なにかに おびえて たたいて いる みたい。', 'Lord Raijin seems to be drumming because something has frightened him.'),
              c.say('ほしの やかたの はかせなら、ぶんを つなぎなおす ほうほうを しって いるかもしれない。', 'The scholar in the star observatory might know a way to join sentences back together.'),
              c.say('いっしょに、雲の みやこの ことばを たすけて くれますか。', 'Will you help me save the words of the Cloud Capital?'),
            ],
            ['もちろん！ たすけます。', 'Of course! I’ll help.'],
            ['すみません、あとで。', 'Sorry, later.'],
          )
        if (st === 0) return [c.say('はかせは きたの ほしの やかたに いるわ。かいだんを のぼって ね。', 'The scholar is in the star observatory to the north. Up the walkway.')]
        if (st === 1) return [c.say(`なおった ぶんは ${mendCount(c.s())}つ。ぶんが つながると、あたたかい 音が するの。`, `${mendCount(c.s())} sentence${mendCount(c.s()) === 1 ? '' : 's'} mended so far. When a sentence joins up, it makes a warm little sound.`)]
        if (st === 2) return [c.say('はかせの ところへ いそいで！', 'Hurry to the scholar!')]
        if (st === 3 && raijinBeaten(c.s())) {
          c.sparkle('spark')
          return [
            c.say('きこえる？ みんなが、ぶんを さいごまで 話してる！', 'Can you hear it? Everyone is finishing their sentences!'),
            c.say('「あしたは 晴れるでしょう」「雲がしの ほうが あまい」「また あそびに きてね」…', '“It will probably be sunny tomorrow.” “The cloud candy is sweeter.” “Come and visit again”…'),
            c.say('ありがとう。この はごろもの はねを あげる。天の 風が、いつも あなたの みかたに なるように。', 'Thank you. Please take this feather from my shawl, so the winds of heaven will always be on your side.'),
            ...c.give('fk10-heaven-feather'),
            ...c.bagItem('ether', 2),
            ...c.reward(240, 80),
            ...c.advance('r10-shattered'),
          ]
        }
        if (st === 3) return [c.say('ふうりんが あれば、たいこの 音の 中でも ことばが われないわ。がんばって。', 'With the word-chime, your words won’t break even inside the drumming. Good luck.')]
        return [c.say('ひがしの かいだんを おりると、えきの ある 町に つく。とうは その ずっと さき。…きっと だいじょうぶ。わたしは そう 思う。', 'Down the eastern stair is a town with a railway station. The Tower is far beyond it. …You’ll be all right. I really think so.')]
      },
      'co-hakase': (c) => {
        const st = c.stage('r10-shattered')
        const tb = c.stage('fk10-tobiume')
        const extra: Step[] =
          tb === 0
            ? [
                c.say('うめの 木の うた？ ああ、てんじんさまの うたじゃな。', 'A poem for a plum tree? Ah — Tenjin’s poem.'),
                c.say('「こち ふかば」… むかしの ことばで「ひがしの 風が ふけば」という いみじゃ。', '“Kochi fukaba”… old words meaning “if the east wind blows.”'),
                c.say('のこりは かすれて よめん。うたの かみを わたそう。まずは 風を よぶ ことじゃな。', 'The rest is too smudged to read. Take the poem slip. First, you must call the wind.'),
                ...c.give('fk10-poem-slip'),
                ...c.advance('fk10-tobiume'),
              ]
            : []
        if (st === 0)
          return [
            ...extra,
            c.say('…ドン、と なると ぶんが われる、か。ふむ。', '…Each BOOM breaks a sentence, you say. Hm.'),
            c.say('ことばは ひとつずつでは よわい。でも「から」「より」「ば」で つなげば、つよく なる。', 'Words on their own are weak. But joined with から, より and ば, they grow strong.'),
            c.say('まちの われた ぶんを 三つ なおして きなさい。その ぶんで、われない ふうりんを つくろう。', 'Go and mend three broken sentences in town. With them, I’ll make a chime that cannot break.'),
            c.say('天気よみの シグレ、雲がしやの モモ、うたよみの ハルカゼ。三人とも、こまって おる じゃろう。', 'Shigure the weather-reader, Momo the candy seller, Harukaze the poet. All three are in trouble, I’d wager.'),
            ...c.advance('r10-shattered'),
          ]
        if (st === 1) return [...extra, c.say(`なおった ぶんは ${mendCount(c.s())}つ じゃな。のこりも たのむぞ。`, `${mendCount(c.s())} mended, I see. The rest are up to you.`), ...host(c, 'r10-opinions')]
        if (st === 2)
          return [
            ...extra,
            c.say('おお、三つの ぶんが ひかって おる！', 'Oh! The three sentences are glowing!'),
            c.narrate('はかせは ぶんを ガラスに とかし、ちいさな ふうりんを ふいた。', 'The scholar melts the sentences into glass and blows a little wind chime.'),
            c.say('これが ことばの ふうりん。これが なって いれば、たいこの 中でも ことばは われん。', 'This is the word-chime. While it rings, no drum can break your words.'),
            c.say('らいじんは なにかを こわがって おる。こわい ときほど、大きな 音を たてる ものじゃ。', 'Raijin is afraid of something. The more frightened we are, the louder we get.'),
            ...c.give('r10-word-chime'),
            ...c.advance('r10-shattered'),
          ]
        if (raijinBeaten(c.s())) return [...extra, c.say('しずけさを こわがらなく なった かみなり、か。よい おとじゃ。', 'Thunder that no longer fears the quiet. A fine sound.'), ...host(c, 'r10-opinions')]
        return extra.length ? extra : null
      },
      'c-shigure': (c) => {
        if (c.stage('r10-shattered') !== 1 || mended(c.s(), 'c-shigure')) return null
        return [c.say('あしたは 雨が ふる… ふる… ドン！ …つづきが いえないの！', 'Tomorrow it will rain… rain… BOOM! …I can’t say the rest!'), mendForecast(c)]
      },
      'c-candy': (c) => {
        if (c.stage('r10-shattered') !== 1 || mended(c.s(), 'c-candy')) return null
        return [c.say('かんばんが ばらばらに なっちゃった！「いちごあめ」「ぶどうあめ」「あまい」… どう ならべるんだっけ？', 'My sign fell to pieces! “Strawberry candy”, “grape candy”, “sweet”… how did it go again?'), mendSign(c)]
      },
      'c-poet': (c) => {
        if (c.stage('r10-shattered') !== 1 || mended(c.s(), 'c-poet')) return null
        return [c.say('わたしの いちばん すきな うたの、まんなかが ちぎれて しまった…', 'The middle of my favourite poem has been torn away…'), mendPoem(c)]
      },
      'c-hall-guard': (c) => {
        const st = c.stage('r10-shattered')
        if (raijinBeaten(c.s())) return [c.say('かみなりさまの たいこ、きいたか？ ちゃんと 休みが ある。いい 音だ。', 'Did you hear the thunder god’s drums? There are rests in it now. A good sound.')]
        if (st === 3) return [c.narrate('ことばの ふうりんが ちりんと なった。', 'The word-chime gives a clear little ring.'), c.say('…お、ことばが われない！ その ふうりんが あれば、なかに はいれる。きを つけて な。', '…Oh, my words aren’t breaking! With that chime you can go in. Be careful.')]
        return null
      },
      // ── townsfolk once the drums are calm ──
      'c-shepherd': (c) => (raijinBeaten(c.s()) ? [c.say('雲たちが のんびり して いる。かみなりが なくても、雨は ちゃんと ふるんだって。', 'The clouds are all relaxed now. Turns out rain still falls just fine without the thunder throwing a fit.'), ...host(c, 'r10-words-1')] : null),
      'c-kid': (c) => (raijinBeaten(c.s()) ? [c.say('かみなりさま、もう おへそ とらない？ …ほんとう？ じゃあ、おなか 出しても いい？', 'The thunder god won’t steal belly buttons anymore? …Really? So can I show my tummy now?')] : null),
      'c-captain': (c) => (raijinBeaten(c.s()) ? [c.say('らいじゅうが へった。でも くさむらには まだ いる。くんれんを つづけるぞ！', 'Fewer raijū about. But there are still some in the cloud-grass. We keep training!'), ...host(c, 'r10-combat')] : null),
      // ── Hagoromo ──
      'fk10-tennin': (c) => {
        const st = c.stage('fk10-hagoromo')
        if (st < 0)
          return offer(
            c,
            'fk10-hagoromo',
            [
              c.say('…しくしく。あ、ごめんなさい。', '…*sniff*. Oh, I’m sorry.'),
              c.say('この まつに はごろもを かけて、すこし 休んで いたら… なくなって しまったの。', 'I hung my feather robe on this pine to rest for a moment… and now it’s gone.'),
              c.say('はごろもが ないと、天に かえれない。あの つりびとが もって いるかもしれない…', 'Without it, I can’t go back to heaven. That fisherman might have it…'),
            ],
            ['いっしょに さがします！', 'I’ll help you look!'],
          )
        if (st === 0) return [c.say('あの つりびとさんに、きいて みて ください。', 'Please, try asking that fisherman.')]
        if (st === 1)
          return [
            c.say('まいを 見たい、と？ …ええ、よろこんで。', 'He wants to see a dance? …Yes, gladly.'),
            c.say('でも、はごろもが なければ、天の まいは まえません。さきに かえして くれたら、かならず まいます。', 'But without the robe, I cannot dance a heavenly dance. If he gives it back first, I will surely dance.'),
            c.say('うたがいは 人の もの。天に うそは ありません。', 'Doubt belongs to mortals. In heaven, there are no lies.'),
            c.fude('ハクリョウさんに、そう つたえましょう！', 'Let’s tell Hakuryō that!'),
            ...c.advance('fk10-hagoromo'),
          ]
        if (st === 2) return [c.say('わたしの ことばを、あの 人に。', 'Please carry my words to him.')]
        if (st === 3 && c.has('fk10-hagoromo-robe')) {
          c.take('fk10-hagoromo-robe')
          c.sparkle('spark')
          return [
            c.narrate('はごろもを わたすと、てんにんの せなかで しろい はねが ふわりと ひらいた。', 'You hand back the robe, and white feathers unfold softly on the maiden’s back.'),
            c.say('ありがとう。やくそくの まいを。', 'Thank you. Here is the dance I promised.'),
            c.narrate('てんにんは 音の ない まいを まった。風も 雲も、いきを とめて 見て いた。', 'The maiden dances a dance without a sound. The wind and the clouds hold their breath to watch.'),
            c.say('…しずかなのに、うたが きこえる みたいだ。', '…It’s silent, and yet it’s like I can hear a song.', HAKURYO, 'villager-a'),
            c.say('しずかな 音楽も あるのです。', 'There is such a thing as quiet music.'),
            ...c.give('fk10-heaven-feather'),
            ...c.reward(110, 45),
            ...c.advance('fk10-hagoromo'),
            ...c.seal('hagoromo'),
            c.say('…ずっと むかし、ふでを もった 女の子も この まいを 見て、ないて いました。「しずかなのに、さびしく ない」と。', '…Long ago, a girl with a brush watched this dance too, and cried. “It’s quiet, but it isn’t lonely,” she said.'),
            c.fude('しずかなのに、さびしく ない… ことねは、しずけさの なまえを さがして いたんだ。', 'Quiet, but not lonely… Kotone was searching for the quiet’s name.'),
            c.narrate('てんにんは にっこり わらって、雲の むこうへ のぼって いった。', 'The maiden smiles, and rises away beyond the clouds.'),
          ]
        }
        return null
      },
      'fk10-fisher': (c) => {
        const st = c.stage('fk10-hagoromo')
        if (st === 0)
          return [
            c.say('この はごろもか？ まつに かかって いたんだ。こんな きれいな もの、はじめて 見た。', 'This feather robe? It was hanging on the pine. I’ve never seen anything so beautiful.'),
            c.say('いえの たからに したい。どうして かえさなければ ならないんだ？', 'I want it as a family treasure. Why should I have to give it back?'),
            persuadeFisher(c),
          ]
        if (st === 1) return [c.say('まいを 見せて くれるか、きいて きて くれ。', 'Go and ask her if she’ll dance for me.')]
        if (st === 2) return [c.say('で、なんと いって いた？ …まう？ さきに かえしたら、にげない？', 'So what did she say? …She’ll dance? If I give it back first, she won’t just fly off?'), promiseDance(c)]
        if (st >= 4) return [c.say('天の まいを 見た。いい 思い出に なった。…はごろもより ずっと いい たからだ。', 'I saw a heavenly dance. It became a wonderful memory. …A far better treasure than any robe.')]
        return null
      },
      // ── Raitarō ──
      'c-grandma': (c) => {
        const st = c.stage('fk10-raitaro')
        if (st < 0)
          return offer(
            c,
            'fk10-raitaro',
            [
              c.say('ゆうべ、たいこの 音が いちばん 大きかった とき、雲だに なにかが おちて きたの。', 'Last night, when the drums were loudest, something fell into my cloud-field.'),
              c.say('見に いったら、かみの けが ぱちぱち ひかる、ちいさな 男の子が いたのよ。', 'When I went to look, there was a little boy whose hair crackled with sparks.'),
              c.say('ずっと ないて いるの。どうしたら いいか… たすけて くれる？', 'He hasn’t stopped crying. I don’t know what to do… will you help?'),
            ],
            ['はい、話して みます。', 'Yes, I’ll talk to him.'],
          )
        if (st === 3)
          return [
            c.say('らいたろうが、かえるって いうのよ。…うれしいけど、ちょっと さびしいね。', 'Raitarō says he’s going home. …I’m happy for him, but it’s a little lonely.', GRANDMA, 'innkeeper'),
            grandmaFarewell(c),
          ]
        if (st >= 4) return [c.say('雨が ふると、あの 子の わらいごえが きこえる 気が するの。', 'When it rains, I fancy I can hear that boy laughing.', GRANDMA, 'innkeeper')]
        return [c.say('あの 子、らいたろうって いうんだって。かみなりの 子かしら。', 'He says his name is Raitarō. A child of the thunder, perhaps.', GRANDMA, 'innkeeper')]
      },
      'fk10-raitaro': (c) => {
        const st = c.stage('fk10-raitaro')
        if (st === 0)
          return [
            c.say('ぼく、らいたろう。とうちゃんの たいこの 音で、ころんで おちちゃった。', 'I’m Raitarō. Dad’s drumming made me trip, and I fell.'),
            c.say('ぼくの たいこ、われちゃった。たいこが ないと、空に かえれない…', 'My drum broke. Without a drum, I can’t get back up to the sky…'),
            raitaroPromise(c),
          ]
        if (st === 1) return [c.say('たいこを なおせる 人、いた？', 'Did you find someone who can fix it?')]
        if (st === 2 && c.has('fk10-mended-drum'))
          return [
            c.say('なおってる！ これなら とべる！ …でも、かえらなければ ならないんだね。', 'It’s fixed! Now I can fly! …But that means I have to go home.'),
            c.say('おばあちゃんに、さよならを いわなきゃ。いっしょに きて くれる？', 'I have to say goodbye to Grandma. Will you come with me?'),
            ...c.advance('fk10-raitaro'),
          ]
        if (st === 3) return [c.say('おばあちゃん、ないちゃうかな…', 'Will Grandma cry, do you think…')]
        return null
      },
      'ch-drummer': (c) => {
        if (c.stage('fk10-raitaro') !== 1 || !c.has('fk10-cracked-drum')) return null
        return [
          c.say('これは… かみなりの 子の たいこ！ われて いるね。', 'This is… a thunder child’s drum! It’s split.'),
          c.choice({ jp: 'たいこうちに なんと きく？', en: 'How do you ask the drummer?' }, [
            ['a', 'この たいこを なおせますか。', 'Can you fix this drum?'],
            ['b', 'この たいこを なおしますか。', 'Will you fix this drum? (just asking his plans)'],
            ['c', 'この たいこを なおしませんか。', 'Won’t you fix this drum? (an invitation)'],
          ], (id) => {
            if (id !== 'a') return [c.say('え？ なおす かどうか じゃなくて… なおせるか、でしょ？', 'Huh? It’s not whether I *will*… you mean whether I *can*, right?'), c.fude('「なおす」→「なおせる」：できるか きく ときは かのうけい！', 'なおす → なおせる: to ask if someone CAN, use the potential form!')]
            c.take('fk10-cracked-drum')
            c.learn('taiko')
            c.sparkle('dust')
            return [
              c.say('なおせるよ！ かみなりさまの たいこを、まいにち はって いるからね。', 'I can! I re-skin the thunder god’s drums every day, after all.'),
              c.narrate('トン、トン、トン… たいこうちは あたらしい かわを はった。', 'Tap, tap, tap… the drummer stretches on a fresh drumhead.'),
              ...c.give('fk10-mended-drum'),
              ...c.advance('fk10-raitaro'),
            ]
          }),
        ]
      },
      // ── Tobiume ──
      'fk10-plum': (c) => {
        const st = c.stage('fk10-tobiume')
        if (st < 0)
          return offer(
            c,
            'fk10-tobiume',
            [
              c.say('わたしは うめの 木の せいれい。とおい むかし、あるじを おって、空を とんで きました。', 'I am the spirit of a plum tree. Long ago I flew across the sky to follow my master.'),
              c.say('あるじは さいごに、わたしに うたを くれました。でも、たいこの 音で、その うたを わすれて しまったの。', 'My master gave me one last poem. But the drumming has made me forget it.'),
              c.say('「こち…」 その あとが、どうしても 思いだせない…', '“Kochi…” I simply can’t remember what comes after…'),
            ],
            ['いっしょに 思いだしましょう。', 'Let’s remember it together.'],
          )
        if (st === 0) return [c.say('ほしの やかたの はかせなら、ふるい うたを しって いるかもしれません。', 'The scholar in the star observatory may know old poems.')]
        if (st === 1) return [c.say('うたには「風」が いるのです。ひがしの 風が…', 'The poem needs wind. An east wind…'), c.fude('うめの 木に「ふく」と となえて、風を よんで みましょう！', 'Let’s cast ふく (blow) at the old plum tree and call the wind!')]
        if (st === 2) return [c.say('ああ、ひがしの 風… においが とどく。あと すこしで 思いだせそう…', 'Ah, the east wind… the scent is carrying. I can almost remember…'), finishPoem(c)]
        return [c.say('あるじの ことは、もう わすれません。うめの 花が さく たびに、思いだします。', 'I will never forget my master again. Every time the plum blossoms open, I will remember.')]
      },
    },
    cast: {
      // ── Tobiume: calling the east wind ──
      'cg-plum': (c, k) => {
        if (k === 'ふく' || k === 'かぜ') {
          c.learn(k === 'ふく' ? 'fuku' : 'kaze')
          c.sparkle('leaf')
          if (c.stage('fk10-tobiume') === 1 && k === 'ふく')
            return [
              c.narrate('「ふく」！ ひがしから、あたたかい 風が ふいて きた。', '“Fuku”! A warm wind begins to blow from the east.'),
              c.narrate('うめの 花が いっせいに ひらき、あまい においが にわじゅうに ひろがった。', 'Every plum blossom opens at once, and a sweet scent fills the whole garden.'),
              c.fude('うめの せいれいに、はなしかけて みましょう！', 'Let’s talk to the plum spirit!'),
              ...c.advance('fk10-tobiume'),
            ]
          return [c.narrate('えだが ゆれて、花びらが ひらひら まった。', 'The branches sway and petals flutter down.')]
        }
        if (k === 'おもいで') return (c.learn('omoide'), [c.narrate('うめの かおりが、だれかの やさしい 思い出を はこんで きた。', 'The plum scent carries someone’s gentle memory past you.')])
        return null
      },
      // ── landmarks that answer word magic ──
      'c-rainbow': (c, k) => {
        if (k !== 'にじ') return null
        c.learn('niji')
        c.sparkle('spark')
        return [c.narrate('「にじ」！ はしらから 七つの 色が ふきだし、空に もう 一本 にじが かかった。', '“Niji”! Seven colours burst from the pillar, and a second rainbow arches across the sky.'), ...(first(c, 'cast.c-rainbow') ? c.reward(15, 5) : [])]
      },
      'c-kite': (c, k) => {
        if (k === 'てんきよほう' || k === 'てんき') {
          c.learn(k === 'てんき' ? 'tenki' : 'tenki-yohou')
          return [c.narrate('たこが ぐんと 空へ のぼり、あしたの 天気を 書いた 字が きらりと ひかった。', 'The kite soars higher, and the letters of tomorrow’s weather flash in the sun.'), ...(first(c, 'cast.c-kite') ? c.reward(15, 5) : [])]
        }
        if (k === 'あらし') return (c.learn('arashi'), [c.narrate('たこが きりきり まいして、シグレが ひめいを あげた。', 'The kite spins wildly and Shigure shrieks.')])
        return null
      },
      'c-rod': (c, k) => {
        if (k === 'かみなり' || k === 'いなずま') {
          c.learn(k === 'かみなり' ? 'kaminari' : 'inazuma')
          c.sparkle('spark')
          return [c.narrate('バリバリッ！ はしらに いなずまが おちて、かみの けが さかだった。', 'KRAK-KRAK! Lightning strikes the pillar, and your hair stands on end.'), c.fude('…フデの けも さかだちました。', '…So did my bristles.'), ...(first(c, 'cast.c-rod') ? c.reward(15, 5) : [])]
        }
        return null
      },
      'c-fog': (c, k) => {
        if (k === 'きり') return (c.learn('kiri'), c.sparkle('dust'), [c.narrate('きりが こく なって、じぶんの 手も 見えなく なった。', 'The fog thickens until you can’t see your own hands.')])
        if (k === 'はれる' || k === 'はれ') return (c.learn(k === 'はれ' ? 'hare' : 'hareru'), c.sparkle('spark'), [c.narrate('きりが すうっと 晴れて、とおくの 山が 見えた。', 'The fog melts away, and far-off mountains come into view.')])
        return null
      },
      'cg-sunflower': (c, k) => {
        if (k === 'はれ' || k === 'はれる') {
          c.learn(k === 'はれ' ? 'hare' : 'hareru')
          c.sparkle('spark')
          return [c.narrate('ひまわりが かおを 上げて、ぱっと 花を ひらいた！', 'The sunflower lifts its head and bursts into bloom!'), ...(first(c, 'cast.cg-sunflower') ? c.reward(15, 5) : [])]
        }
        if (k === 'くもり' || k === 'あめ') return (c.learn(k === 'あめ' ? 'ame' : 'kumori'), [c.narrate('ひまわりは、しょんぼり うつむいた。', 'The sunflower droops sadly.')])
        return null
      },
      'cg-shrine': (c, k) => {
        if (k === 'おぼえる' || k === 'おしえる') {
          c.learn(k === 'おぼえる' ? 'oboeru' : 'oshieru')
          c.sparkle('spark')
          return [c.narrate('ほこらの すずが ちりんと なった。あたまが すっきり した 気が する。', 'The shrine bell gives a tiny ring. Your head feels clearer, somehow.'), ...(first(c, 'cast.cg-shrine') ? c.reward(15, 5) : [])]
        }
        return null
      },
      'c-chimes': (c, k) => (k === 'おと' ? (c.learn('oto'), c.sparkle('dust'), [c.narrate('ふうりんが、いままで きいた 音を ぜんぶ くりかえした。ちりん、ドン、にゃあ、ちりん…', 'The chimes replay every sound they’ve ever heard. Chirin, BOOM, meow, chirin…')]) : null),
      'c-kid': (c, k) => (k === 'かみなり' ? (c.learn('kaminari'), [c.say('ぎゃー！ おへそ かくして！ はやく！', 'EEK! Hide your belly button! Quick!')]) : null),
      'c-cat': (c, k) => (k === 'くも' ? (c.learn('kumo'), [c.narrate('雲ねこの しっぽが、ふわっと ふくらんだ。', 'The cloud cat’s tail puffs up like a fresh little cloud.')]) : null),
      'c-amane': (c, k) => (k === 'てん' ? (c.learn('ten'), [c.say('天… わたしの ふるさと。はごろもで いつでも かえれるのよ。', 'Heaven… my home. With my feather shawl I can go back whenever I like.')]) : null),
      'ch-drum': (c, k) => (k === 'たいこ' ? (c.learn('taiko'), c.sparkle('dust'), [c.narrate('ドーン… おおだいこが ひくく うなり、ゆかが ふるえた。', 'DOOOM… the great drum growls low, and the floor trembles.')]) : null),
    },
    mapCast: {
      clouds: (c, k) => {
        if (k === 'にじ') return (c.learn('niji'), c.sparkle('spark'), [c.narrate('雲の あいだに、ちいさな にじが かかった。', 'A small rainbow appears between the clouds.')])
        if (k === 'あらし') return (c.learn('arashi'), [c.narrate('とおくで あらしの 音が した。…いまは やめて おこう。', 'A storm rumbles far away. …Best not to, right now.')])
        if (k === 'てん') return (c.learn('ten'), [c.narrate('上を 見ると、雲の もっと 上に、きんいろの 光が すこし 見えた。', 'You look up: far above even these clouds, a little golden light glimmers.')])
        if (k === 'みらい') return (c.learn('mirai'), [c.fude('ひがしの とうの むこうに、みらいが ある 気が します。', 'I feel like the future is out there, beyond the tower in the east.')])
        return null
      },
      'clouds-observatory': (c, k) => {
        if (k === 'ほし') return (c.learn('hoshi'), c.sparkle('spark'), [c.narrate('てんじょうの まどの 外で、ほしが ひとつ ウインクした。', 'Outside the dome window, a star winks.')])
        if (k === 'ふしぎ') return (c.learn('fushigi'), [c.say('ふしぎ、か。ふしぎこそ、がくもんの はじまりじゃ。', 'Mysterious, eh? Wonder is where all learning begins.', SCHOLAR, 'scholar')])
        return null
      },
      'clouds-garden': (c, k) => {
        if (k === 'あめ') return (c.learn('ame'), c.sparkle('ripple'), [c.narrate('ぱらぱらと やさしい 雨が ふり、花たちが よろこんだ。', 'A gentle shower patters down, and the flowers are delighted.')])
        if (k === 'たのしい') return (c.learn('tanoshii'), [c.fude('そらの にわで さんぽ、たのしいですね！', 'Strolling in a sky garden is fun, isn’t it!')])
        return null
      },
    },
  },
]
