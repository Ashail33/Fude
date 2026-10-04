/**
 * Region 11 — the Chattering Station Town. The main road: Nopperabō, the
 * faceless yokai, has wiped the townsfolk's faces, and with them went the
 * small talk. People can only grunt nouns, nobody greets anybody, and no
 * train can leave because nobody can call out いってらっしゃい. Pon the tanuki
 * (who can make himself any face he likes, so his never went) asks for
 * help; Tetsu the stationmaster needs three greetings given back to the
 * town before his voice will carry onto the platform: good morning at the
 * grocer's, いただきます and ごちそうさま over a family's bento, and おかえり at
 * the apartments.
 *
 * Folklore: Satori, the mind-reader who finishes your sentences, beaten
 * not by thinking but by listening (あいづち); Hitotsume-kozō, the one-eyed
 * boy who asks endless questions and has never been asked one (question
 * words); and Bakezōri, a lost straw sandal hopping about the platform,
 * looking for the home where someone says おかえり (住む, ただいま).
 */
import { ACTIVITY_BY_ID } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from '../../story/tales/r1-village'
import type { Ctx, TaleContent } from '../../story/tales/types'

const PON = { jp: 'ポン', en: 'Pon' }
const TETSU = { jp: 'テツ', en: 'Tetsu' }
const SATORI = { jp: 'さとり', en: 'Satori' }
const HITOTSUME = { jp: 'ひとつめこぞう', en: 'Hitotsume-kozō' }
const ZORI = { jp: 'ばけぞうり', en: 'Bakezōri' }
const FUMI = { jp: 'フミさん', en: 'Grandma Fumi' }
const KID = { jp: 'こども', en: 'Kid' }

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
const noppBeaten = (s: PlayerState) => isPassed(s, 'r11-boss')

// ─── The Lost Small Talk (main) ──────────────────────────────────────
const GREETS = ['y-mari', 'e-family', 'e-mom'] as const
const greeted = (s: PlayerState, id: string) => flagOf(s, `r11.greet.${id}`) > 0
const greetCount = (s: PlayerState) => GREETS.filter((id) => greeted(s, id)).length

function greetDone(c: Ctx, id: string, reply: Step[]): Step[] {
  c.set(`r11.greet.${id}`)
  c.sparkle('spark')
  c.sfx('correct')
  const n = greetCount(c.s())
  const out: Step[] = [...reply, c.narrate('つるんとした 顔に、目と 口が もどって きた！', 'Eyes and a mouth come back onto the smooth face!')]
  if (n >= 3) out.push(c.fude('三人 ぜんぶ、顔が もどった！ テツさんの ところへ 行きましょう！', 'All three have their faces back! Let’s go to Tetsu!'), ...c.advance('r11-smalltalk'))
  else out.push(c.fude(`あと ${3 - n}人！`, `${3 - n} more to go!`))
  return out
}

function greetMari(c: Ctx): Step {
  return c.choice(
    { jp: 'あさの やおや。マリさんに なんと 言う？', en: 'Morning at the grocer’s. What do you say to Mari?' },
    [
      ['konbanwa', 'こんばんは！', 'Good evening!'],
      ['ohayou', 'おはよう ございます！', 'Good morning!'],
      ['oyasumi', 'おやすみなさい！', 'Good night!'],
    ],
    (id) => {
      if (id === 'konbanwa') return [c.say('…よる？', '…Night?'), c.fude('いまは あさですよ。あさの あいさつは？', 'It’s morning now. What’s the morning greeting?'), greetMari(c)]
      if (id === 'oyasumi') return [c.say('…ねる？', '…Sleep?'), c.fude('「おやすみ」は ねる まえ。あさは…？', 'おやすみ is for bedtime. In the morning…?'), greetMari(c)]
      c.learn('ohayou')
      return greetDone(c, 'y-mari', [
        c.say('お… おは… おはよう！ いらっしゃい！ きょうは なにに する？', 'G… good… good morning! Welcome! What’ll it be today?'),
        c.say('あ〜、やっと 言えた！ 「いらっしゃい」が 言えない やおやなんて、やおやじゃ ないよ！', 'Ahh, finally! A grocer who can’t say “welcome” is no grocer at all!'),
      ])
    },
  )
}

function familyAfter(c: Ctx): Step {
  return c.choice(
    { jp: 'みんな たべおわった。子どもが あなたを 見て いる。たべた あとは…？', en: 'Everyone has finished eating. The child is looking at you. After a meal, you say…?' },
    [
      ['itadakimasu', 'いただきます！', 'Let’s eat!'],
      ['gochisousama', 'ごちそうさま！', 'Thanks for the meal!'],
      ['ohayou', 'おはよう！', 'Good morning!'],
    ],
    (id) => {
      if (id !== 'gochisousama') return [c.say('…？', '…?', KID, 'child'), c.fude('たべる まえは「いただきます」、たべた あとは…？', 'Before eating it’s いただきます; after eating it’s…?'), familyAfter(c)]
      c.learn('gochisousama')
      return greetDone(c, 'e-family', [
        c.say('ごちそうさまでした！ …おいしかった〜！', 'Thank you for the meal! …That was so good!', KID, 'child'),
        c.say('ああ… ちゃんと 言えた。この ことば、こんなに あったかかったんだな。', 'Ah… we said it properly. I never knew these words were so warm.'),
      ])
    },
  )
}

function greetFamily(c: Ctx): Step {
  return c.choice(
    { jp: 'おべんとうを まえに、かぞくが かたまって いる。たべる まえの ことばを 言って あげよう', en: 'The family sits frozen over their bento. Say the words you say before eating.' },
    [
      ['tadaima', 'ただいま！', 'I’m home!'],
      ['gochisousama', 'ごちそうさま！', 'Thanks for the meal!'],
      ['itadakimasu', 'いただきます！', 'Let’s eat!'],
    ],
    (id) => {
      if (id === 'tadaima') return [c.say('…いえ？', '…Home?'), c.fude('ここは こうえんですよ。たべる まえの ことばです。', 'This is the park. We need the words for before eating.'), greetFamily(c)]
      if (id === 'gochisousama') return [c.say('…まだ。', '…Not yet.'), c.fude('「ごちそうさま」は たべた あと。まえは…？', 'ごちそうさま is for after. Before…?'), greetFamily(c)]
      c.learn('itadakimasu')
      return [
        c.say('…いただきます！', '…Let’s eat!', KID, 'child'),
        c.narrate('かぞくが いっせいに 手を あわせ、おべんとうを たべはじめた。', 'The whole family puts their hands together and starts on their bento.'),
        familyAfter(c),
      ]
    },
  )
}

function greetMom(c: Ctx): Step {
  return c.choice(
    { jp: '子どもが「ただいま！」と かえって きた。おかあさんに、こたえる ことばを おしえて あげよう', en: 'The child calls “I’m home!” Teach the mother the reply.' },
    [
      ['okaeri', 'おかえり！', 'Welcome home!'],
      ['sayounara', 'さようなら！', 'Goodbye!'],
      ['oyasumi', 'おやすみ！', 'Good night!'],
    ],
    (id) => {
      if (id === 'sayounara') return [c.say('え、もう でて いくの…？', 'What, you’re leaving again…?', KID, 'child'), c.fude('かえって きた 人には…？', 'To someone who has just come home…?'), greetMom(c)]
      if (id === 'oyasumi') return [c.say('まだ ねないよ！ おやつ たべたい！', 'I’m not going to bed yet! I want a snack!', KID, 'child'), c.fude('「ただいま」の へんじは…？', 'The answer to ただいま is…?'), greetMom(c)]
      c.learn('okaeri')
      return greetDone(c, 'e-mom', [
        c.say('…おかえり。おかえり！ がっこう、どうだった？', '…Welcome home. Welcome home! How was school?'),
        c.say('ふつう！ …あ、おかあさんの 顔、もどってる！', 'Same as always! …Oh, Mum, your face is back!', KID, 'child'),
      ])
    },
  )
}

// ─── Satori ──────────────────────────────────────────────────────────
function satoriChat(c: Ctx, round: number): Step {
  const rounds: { line: [string, string]; ask: [string, string]; options: [string, string, string][]; right: string; note: [string, string] }[] = [
    {
      line: ['きのう、山で 大きな くまを 見たんだ。', 'Yesterday I saw a huge bear in the mountains.'],
      ask: ['あいづちを うとう', 'Show you’re listening'],
      options: [
        ['hee', 'へえ、ほんと？', 'Ooh, really?'],
        ['itadakimasu', 'いただきます。', 'Let’s eat.'],
        ['oyasumi', 'おやすみ。', 'Good night.'],
      ],
      right: 'hee',
      note: ['びっくり した ときは「へえ！」「ほんと？」', 'When something surprises you: へえ! ほんと?'],
    },
    {
      line: ['くまがね、わたしを 見たら、にげちゃったの。', 'And the bear took one look at me and ran away.'],
      ask: ['あいづちを うとう', 'Show you’re listening'],
      options: [
        ['dare', 'だれ？', 'Who?'],
        ['sou', 'そうなんだ！', 'No way, really!'],
        ['uun', 'ううん。', 'Nope.'],
      ],
      right: 'sou',
      note: ['はなしを うけとる ときは「そうなんだ」', 'To take in someone’s story: そうなんだ (oh, I see / is that so)'],
    },
    {
      line: ['だから、くまより わたしの ほうが つよいって わけ。', 'Which means I’m stronger than a bear, you see.'],
      ask: ['あいづちを うとう', 'Show you’re listening'],
      options: [
        ['gomennasai', 'ごめんなさい。', 'I’m sorry.'],
        ['tadaima', 'ただいま。', 'I’m home.'],
        ['naruhodo', 'なるほど！', 'I see!'],
      ],
      right: 'naruhodo',
      note: ['わかった！の ときは「なるほど」', 'When it all makes sense: なるほど'],
    },
  ]
  const r = rounds[round]
  return c.choice({ jp: `「${r.line[0]}」 …${r.ask[0]}`, en: `“${r.line[1]}” …${r.ask[1]}` }, r.options, (id) => {
    if (id !== r.right) return [c.say('ほら、やっぱり。あなたが そう 言うのは、わかって いた。', 'See? I knew you would say that.', SATORI, 'monkey'), c.fude(r.note[0], r.note[1]), satoriChat(c, round)]
    c.learn(r.right)
    if (round < rounds.length - 1) return [c.say('……！', '……!', SATORI, 'monkey'), satoriChat(c, round + 1)]
    c.sparkle('leaf')
    return [
      c.say('…ふしぎ。あなたの へんじは、さきに 読めない。', '…How strange. I can’t read your replies ahead of time.', SATORI, 'monkey'),
      c.say('あなたは 考えて こたえて いない。ただ、わたしの はなしを 聞いて いるだけ。…だから 読めないんだ。', 'You aren’t thinking up your answers. You’re just listening to me. …That’s why I can’t read them.', SATORI, 'monkey'),
      c.say('こんなふうに 聞いて もらったの、はじめて。…うれしい。', 'Nobody has ever listened to me like this before. …I’m glad.', SATORI, 'monkey'),
      ...c.give('fk11-chestnut'),
      ...c.reward(110, 45),
      ...c.advance('fk11-satori'),
      ...c.seal('satori'),
      c.say('…むかし、ふでを もった 女の子も、そう だった。わたしが さきに 言っても、いつも「へえ！」って わらって くれた。', '…Long ago, a girl with a brush was the same. Even when I said it first, she always laughed and said “Ooh!”', SATORI, 'monkey'),
      c.fude('ことね…！ ことねは、聞く のが じょうずだったんだ。', 'Kotone…! She was so good at listening.'),
    ]
  })
}

// ─── Hitotsume-kozō ──────────────────────────────────────────────────
function hitotsumeQuiz(c: Ctx, round: number): Step {
  const rounds: { q: [string, string]; options: [string, string, string][]; right: string; word: string; note: [string, string] }[] = [
    {
      q: ['ねえねえ！ なにしに 来たの？', 'Hey, hey! What did you come here for?'],
      options: [
        ['when', 'きのう 来たよ。', 'I came yesterday.'],
        ['what', 'のっぺらぼうを さがしに 来たんだ。', 'I came to look for Nopperabō.'],
        ['who', 'フデと 来たよ。', 'I came with Fude.'],
      ],
      right: 'what',
      word: 'nani',
      note: ['「なに」は what。なにを しに 来たのか、こたえよう。', '何 (なに) is “what”: say what you came to do.'],
    },
    {
      q: ['だれと 来たの？', 'Who did you come with?'],
      options: [
        ['who', 'フデと 来たよ。', 'I came with Fude.'],
        ['where', '雲の みやこから。', 'From the Cloud Capital.'],
        ['how', 'あるいて 来た。', 'I walked.'],
      ],
      right: 'who',
      word: 'dare',
      note: ['「だれ」は who。いっしょに 来た 人を こたえよう。', '誰 (だれ) is “who”: say who came with you.'],
    },
    {
      q: ['いつ 来たの？', 'When did you get here?'],
      options: [
        ['why', 'たすけたいから。', 'Because I want to help.'],
        ['when', 'けさ 来たよ。', 'I got here this morning.'],
        ['what', 'ぞうりだよ。', 'It’s a sandal.'],
      ],
      right: 'when',
      word: 'itsu',
      note: ['「いつ」は when。じかんを こたえよう。', 'いつ is “when”: answer with a time.'],
    },
    {
      q: ['どうして ここに いるの？', 'Why are you here?'],
      options: [
        ['why', 'みんなの ことばを とりもどしたいから。', 'Because I want to get everyone’s words back.'],
        ['when', 'あしたまで。', 'Until tomorrow.'],
        ['who', 'ポンだよ。', 'It’s Pon.'],
      ],
      right: 'why',
      word: 'doushite',
      note: ['「どうして」は why。りゆうを「〜から」で こたえよう。', 'どうして is “why”: give a reason with 〜から.'],
    },
  ]
  const r = rounds[round]
  return c.choice({ jp: r.q[0], en: r.q[1] }, r.options, (id) => {
    if (id !== r.right) return [c.say('べろべろばあ！ ちがうよ〜！ しつもんに こたえて ない！', 'Blehhh! Wrong! That doesn’t answer my question!', HITOTSUME, 'child'), c.fude(r.note[0], r.note[1]), hitotsumeQuiz(c, round)]
    c.learn(r.word)
    if (round < rounds.length - 1) return [c.say('ふうん！ じゃあ…', 'Huh! Then…', HITOTSUME, 'child'), hitotsumeQuiz(c, round + 1)]
    return [
      c.say('ぜんぶ こたえた！ すごい！ …でも、ねえ。', 'You answered them all! Amazing! …But, hey.', HITOTSUME, 'child'),
      c.say('ぼく、いつも しつもん する ばっかり。だれも、ぼくに しつもん して くれないんだ。目が 一つだから、みんな にげちゃう。', 'All I ever do is ask questions. Nobody ever asks me one. I’ve only got one eye, so everyone runs away.', HITOTSUME, 'child'),
      c.fude('こんどは わたしたちが しつもん しましょう！ でも… どんな しつもんが いいかな。レポーターの アヤさんに 聞いて みましょう！', 'This time let’s ask him a question! But… what kind? Let’s ask Aya the reporter!'),
      ...c.advance('fk11-hitotsume'),
    ]
  })
}

function askHitotsume(c: Ctx): Step {
  return c.choice(
    { jp: 'ひとつめこぞうに、しつもん しよう', en: 'Ask Hitotsume-kozō a question' },
    [
      ['eye', 'なんで 目が 一つなの？', 'Why have you only got one eye?'],
      ['who', '…だれ？', '…Who are you?'],
      ['donna', 'どんな あそびが 好き？', 'What kind of games do you like?'],
    ],
    (id) => {
      if (id === 'eye') return [c.say('…………。', '…………', HITOTSUME, 'child'), c.narrate('ひとつめこぞうは、うつむいて しまった。', 'Hitotsume-kozō hangs his head.'), c.fude('いやな しつもんだったかも… たのしく こたえられる しつもんに しましょう。', 'That might have been a mean question… let’s ask something fun to answer.'), askHitotsume(c)]
      if (id === 'who') return [c.say('え、さっき 言ったじゃん！ ひとつめこぞうだって！', 'Huh, I told you already! I’m Hitotsume-kozō!', HITOTSUME, 'child'), c.fude('アヤさんの カード：「どんな 〜が 好き？」', 'Aya’s card says: “What kind of ~ do you like?”'), askHitotsume(c)]
      c.learn('donna')
      c.take('fk11-question-card')
      c.sparkle('spark')
      return [
        c.say('え… ぼくに？ しつもん？ ぼくに？！', 'Huh… to me? A question? For ME?!', HITOTSUME, 'child'),
        c.say('えっとね、えっとね！ かくれんぼ！ あと、しりとり！ あと、ひとに しつもん する あそび！', 'Um, um! Hide-and-seek! And shiritori! And the game where you ask people questions!', HITOTSUME, 'child'),
        c.say('…あのね。しつもん されるのって、こんなに うれしいんだね。', '…You know what? Being asked a question makes you this happy.', HITOTSUME, 'child'),
        ...c.give('fk11-tofu-lantern'),
        ...c.reward(100, 45),
        ...c.advance('fk11-hitotsume'),
        ...c.seal('hitotsume'),
        c.say('むかし、ふでの おねえちゃんも、ぼくに しつもん して くれたよ。「あなたの 一つの 目には、なにが 見える？」って。', 'Long ago, the brush girl asked me a question too. “What can you see with your one eye?” she said.', HITOTSUME, 'child'),
        c.fude('ことねは、こわがらないで、聞いたんだ…', 'Kotone wasn’t afraid. She just asked…'),
      ]
    },
  )
}

// ─── Bakezōri ────────────────────────────────────────────────────────
function zoriWhose(c: Ctx): Step {
  return c.choice(
    { jp: 'はねまわる ぞうりに、なんと 聞く？', en: 'What do you ask the hopping sandal?' },
    [
      ['dare', 'だれの ぞうり なの？', 'Whose sandal are you?'],
      ['itsu', 'いつの ぞうり なの？', 'When’s sandal are you?'],
      ['itadakimasu', 'いただきます！', 'Let’s eat!'],
    ],
    (id) => {
      if (id === 'itsu') return [c.say('いつ…？ カラン？', 'When…? Clack?', ZORI, 'imp'), c.fude('もちぬしを 聞きたいなら「だれの」ですよ。', 'To ask who it belongs to: だれの (whose).'), zoriWhose(c)]
      if (id === 'itadakimasu') return [c.say('カラ！？ たべないで！', 'CLACK?! Don’t eat me!', ZORI, 'imp'), zoriWhose(c)]
      c.learn('dare')
      return [
        c.say('わからない… カラン、コロン… わすれちゃった。', 'I don’t know… clack, clonk… I forgot.', ZORI, 'imp'),
        c.say('おぼえて いるのは、まいにち「ただいま」って 言う こえ だけ。あの こえの ところに かえりたい。', 'All I remember is a voice that said “I’m home” every day. I want to go back to that voice.', ZORI, 'imp'),
        c.fude('いっしょに さがしましょう！ ばいてんの おばさんなら、ホームで おとしものを たくさん 見て いるかも。', 'Let’s look together! The kiosk lady sees lots of lost things on the platform.'),
        c.narrate('ぞうりが ぴょんと はねて、あなたの かばんに とびこんだ。', 'The sandal gives a hop and jumps into your bag.'),
        ...c.give('fk11-sandal'),
        ...c.advance('fk11-bakezori'),
      ]
    },
  )
}

function kioskClues(c: Ctx): Step {
  return c.choice(
    { jp: 'おばさんは なまえしか 言えない。「…フミ。…アパート。…三がい。」 ぞうりの もちぬしは どこに 住んで いる？', en: 'She can only say nouns: “…Fumi. …Apartments. …Third floor.” Where does the owner live?' },
    [
      ['hospital', 'びょういんに 住んでる。', 'She lives at the hospital.'],
      ['apart', 'アパートの 三がいに 住んでる。', 'She lives on the third floor of the apartments.'],
      ['station', 'えきに 住んでる。', 'She lives at the station.'],
    ],
    (id) => {
      if (id !== 'apart') return [c.say('…ちがう。…アパート。', '…No. …Apartments.'), c.fude('なまえだけでも、よく 聞けば わかりますよ！', 'Even from nouns alone, you can work it out if you listen!'), kioskClues(c)]
      c.learn('sumu')
      return [c.say('…（うん うん と、大きく うなずいた）', '…(She nods hard.)'), c.fude('アパートの フミさん！ 行きましょう！', 'Grandma Fumi at the apartments! Let’s go!'), ...c.advance('fk11-bakezori')]
    },
  )
}

function zoriHome(c: Ctx): Step {
  return c.choice(
    { jp: 'ぞうりが かえって きた。ぞうりは なんと 言う？', en: 'The sandal is home at last. What does it say?' },
    [
      ['okaeri', 'おかえり！', 'Welcome home!'],
      ['tadaima', 'ただいま！', 'I’m home!'],
      ['sayounara', 'さようなら！', 'Goodbye!'],
    ],
    (id) => {
      if (id === 'okaeri') return [c.say('カラン？ それは フミさんが 言う ほう…', 'Clack? That’s what Fumi says…', ZORI, 'imp'), c.fude('かえって きた ほうは「ただいま」ですよ。', 'The one who comes home says ただいま.'), zoriHome(c)]
      if (id === 'sayounara') return [c.say('カラ… また いなく なるの？', 'Clack… am I leaving again?', ZORI, 'imp'), zoriHome(c)]
      c.learn('tadaima')
      c.take('fk11-sandal')
      c.sparkle('dust')
      return [
        c.say('ただいま！', 'I’m home!', ZORI, 'imp'),
        c.say('…おかえり。まあまあ、こんな ところまで あるいて きたのかい。', '…Welcome home. Well I never, did you walk all this way?', FUMI, 'okami'),
        c.narrate('フミさんが ぞうりを はくと、ぞうりは うれしそうに カランと なった。', 'Fumi slips the sandal on, and it gives a happy little clack.'),
        c.say('ずっと だいじに はいて きたからねえ。ものも、ながく つかうと こころが できるんだよ。', 'I’ve worn it with care for years, you see. Things that are used long enough grow a heart of their own.', FUMI, 'okami'),
        ...c.give('fk11-straw-charm'),
        ...c.reward(100, 40),
        ...c.advance('fk11-bakezori'),
        ...c.seal('bakezori'),
        c.say('…カラン。むかし、ふでの 女の子が、ぼくを ひろって くれた ことが ある。「ものにも、おかえりって 言って あげたいね」って。', '…Clack. Long ago, a girl with a brush picked me up once. “I want to say welcome home to things, too,” she said.', ZORI, 'imp'),
        c.fude('ことねは、なんにでも あいさつ したんですね。', 'Kotone said hello to everything, didn’t she.'),
      ]
    },
  )
}

export const CONTENT: TaleContent[] = [
  {
    items: [
      { id: 'r11-whistle', name: 'Stationmaster’s Whistle', jp: 'えきちょうの ふえ', kana: 'ふえ', emoji: '📯', desc: 'Tetsu’s brass whistle. Blow it and your voice carries all the way to the end of the platform.' },
      { id: 'r11-stamp-card', name: 'Station Stamp Card', jp: 'えきの スタンプカード', kana: 'スタンプカード', emoji: '🎫', desc: 'Stamped with a little smiling face for every greeting you gave back to the town.' },
      { id: 'fk11-chestnut', name: 'Satori’s Chestnut', jp: 'さとりの くり', kana: 'くり', emoji: '🌰', desc: 'A mountain chestnut from the mind-reader. Holding it, you somehow listen better.' },
      { id: 'fk11-question-card', name: 'Aya’s Question Card', jp: 'アヤの しつもんカード', kana: 'しつもんカード', emoji: '🗒️', desc: 'A reporter’s card: “What kind of ~ do you like?” The question that opens every door.' },
      { id: 'fk11-tofu-lantern', name: 'One-Eyed Lantern', jp: 'ひとつめの ちょうちん', kana: 'ちょうちん', emoji: '🏮', desc: 'A paper lantern with one big painted eye. It blinks when someone asks a good question.' },
      { id: 'fk11-sandal', name: 'Bakezōri the Sandal', jp: 'ばけぞうり', kana: 'ぞうり', emoji: '🩴', desc: 'A lost straw sandal riding in your bag. Every so often it goes “clack”.' },
      { id: 'fk11-straw-charm', name: 'Straw Sandal Charm', jp: 'わらの おまもり', kana: 'おまもり', emoji: '🪢', desc: 'Woven by Grandma Fumi from old sandal straw. “So you always find your way home.”' },
    ],
    yokai: [
      {
        id: 'satori',
        region: 11,
        name: 'Satori, the Mind-Reader',
        jp: '覚',
        kana: 'さとり',
        emoji: '🐒',
        lore: 'In the mountains of Hida lived the satori, a hairy, ape-like creature that could read every thought of anyone who met it. When a woodcutter met one, it spoke each of his thoughts aloud before he could act — “Now you think you’ll catch me,” “Now you think I’m frightening” — until he gave up and went back to chopping wood. Then a chip of wood flew off his axe by pure accident and struck the satori, which fled, crying that humans are frightening because they do things without thinking.',
        hint: 'In the park, something hairy finishes everyone’s sentences before they can say them.',
        words: ['hee', 'sou', 'naruhodo', 'un'],
      },
      {
        id: 'hitotsume',
        region: 11,
        name: 'Hitotsume-kozō',
        jp: '一つ目小僧',
        kana: 'ひとつめこぞう',
        emoji: '👁️',
        lore: 'Hitotsume-kozō is a bald little boy, dressed like a temple novice, with a single huge eye in the middle of his face and a long tongue. He pops out on lonely evening roads to give people a fright — and then does no other harm at all. On certain nights of the year people hung bamboo baskets full of holes outside their doors, because the one-eyed boy is said to be scared of anything with more eyes than he has.',
        hint: 'At dusk in the shopping arcade, a little boy with one big eye asks question after question.',
        words: ['nani', 'dare', 'itsu', 'doushite', 'donna'],
      },
      {
        id: 'bakezori',
        region: 11,
        name: 'Bakezōri, the Sandal Spirit',
        jp: '化け草履',
        kana: 'ばけぞうり',
        emoji: '🩴',
        lore: 'Bakezōri is a tsukumogami: an everyday object that comes to life after being used for many years. A straw sandal that was carelessly treated or thrown away grows one eye, two arms and a pair of legs, and runs about the house at night singing “karari, kororin, kankororin!” Treat your things with care, the old folk said, and they will repay you; neglect them, and they may get up and leave.',
        hint: 'On the platform, a lost straw sandal hops about on its own, looking for home.',
        words: ['tadaima', 'okaeri', 'sumu', 'dare'],
      },
    ],
    tales: [
      {
        id: 'r11-smalltalk',
        region: 11,
        main: true,
        title: 'The Lost Small Talk',
        jp: 'きえた おしゃべり',
        summary: 'Nopperabō has wiped the faces off the townsfolk, and the little words went with them. Pon the tanuki asks you to give the town its small talk back.',
        giver: 'e-pon',
        stages: [
          { en: 'Meet Tetsu the stationmaster at the ticket gate', jp: 'かいさつの えきちょう テツさんに 会おう', target: ['e-tetsu'], map: 'ekimae' },
          { en: 'Give three people their greetings back: Mari at the grocer’s, the family with bento in the park and the mother at the apartments', jp: 'あいさつを 三人に かえそう：やおやの マリさん・こうえんの かぞく・アパートの おかあさん', target: [...GREETS], map: 'ekimae' },
          { en: 'Go back to Tetsu at the ticket gate', jp: 'かいさつの テツさんの ところへ もどろう', target: ['e-tetsu'], map: 'ekimae' },
          { en: 'Face Nopperabō at the end of platform one, then tell Pon', jp: '一ばんせんの のっぺらぼうに たちむかい、ポンに しらせよう', target: ['p-nopperabo', 'e-pon'], map: 'ekimae-platform' },
        ],
      },
      {
        id: 'fk11-satori',
        region: 11,
        yokai: 'satori',
        title: 'The One Who Knows What You’ll Say',
        jp: 'さきに いう もの',
        summary: 'In the park, a hairy mountain spirit finishes every sentence before you can say it, and nobody bothers talking to her any more.',
        giver: 'fk11-satori',
        stages: [
          { en: 'Ask Old Gen on the park bench how to talk to someone who already knows what you’ll say', jp: 'ベンチの ゲンさんに、さとりとの はなしかたを 聞こう', target: ['e-oldman'], map: 'ekimae' },
          { en: 'Listen to Satori’s story, and answer with real あいづち', jp: 'さとりの はなしを 聞いて、あいづちを うとう', target: ['fk11-satori'], map: 'ekimae' },
        ],
      },
      {
        id: 'fk11-hitotsume',
        region: 11,
        yokai: 'hitotsume',
        title: 'The Boy Who Only Asks',
        jp: 'きいて ばかりの こぞう',
        summary: 'At dusk in the arcade, a one-eyed boy fires question after question at passers-by. Nobody has ever asked him one back.',
        giver: 'fk11-hitotsume',
        stages: [
          { en: 'Answer the one-eyed boy’s questions', jp: 'ひとつめこぞうの しつもんに こたえよう', target: ['fk11-hitotsume'], map: 'ekimae' },
          { en: 'Ask Aya the reporter what makes a good question', jp: 'レポーターの アヤさんに、いい しつもんを 聞こう', target: ['e-reporter'], map: 'ekimae' },
          { en: 'Ask Hitotsume-kozō a question of his own', jp: 'ひとつめこぞうに しつもん しよう', target: ['fk11-hitotsume'], map: 'ekimae' },
        ],
      },
      {
        id: 'fk11-bakezori',
        region: 11,
        yokai: 'bakezori',
        title: 'Clack, Clonk, Home',
        jp: 'カラン コロン ただいま',
        summary: 'A lost straw sandal hops about platform one on its own. All it remembers is a voice that said “I’m home” every day.',
        giver: 'fk11-zori',
        stages: [
          { en: 'Find out whose sandal it is', jp: 'だれの ぞうりか 聞こう', target: ['fk11-zori'], map: 'ekimae-platform' },
          { en: 'Ask the kiosk lady on the platform about lost things', jp: 'ホームの ばいてんの おばさんに 聞こう', target: ['p-kiosk'], map: 'ekimae-platform' },
          { en: 'Take the sandal home to its owner', jp: 'ぞうりを もちぬしに とどけよう', target: ['e-grandma'], map: 'ekimae' },
        ],
      },
    ],
    entities: {
      ekimae: [
        // under the cherry trees at the park's east edge
        { id: 'fk11-satori', kind: 'npc', sprite: 'monkey', x: 17, y: 25, dir: 'left', name: SATORI, lines: [{ jp: 'あなたは いま、「この さる、なに？」と 思った。…でしょ？', en: 'Right now you’re thinking, “What is this monkey?” …Aren’t you?' }] },
        // on the lower lane by the old house, where the lanterns are dimmest
        { id: 'fk11-hitotsume', kind: 'npc', sprite: 'child', x: 43, y: 34, dir: 'left', name: HITOTSUME, lines: [{ jp: 'ねえねえ！ なに？ だれ？ いつ？ どこ？ なんで？', en: 'Hey, hey! What? Who? When? Where? How come?' }] },
      ],
      'ekimae-platform': [{ id: 'fk11-zori', kind: 'npc', sprite: 'imp', x: 12, y: 8, dir: 'left', name: ZORI, lines: [{ jp: 'カラン、コロン… カラン、コロン… おうち、どこ？', en: 'Clack, clonk… clack, clonk… where’s home?' }] }],
    },
    visible: {
      // the sandal rides in your bag once you agree to help
      'fk11-zori': (s) => stageOf(s, 'fk11-bakezori') < 1,
    },
    talk: {
      // ── The Lost Small Talk ──
      'e-pon': (c) => {
        const st = c.stage('r11-smalltalk')
        if (st < 0)
          return offer(
            c,
            'r11-smalltalk',
            [
              c.say('ねえねえ、聞いて！ この 町の みんな、顔を けされちゃったの。のっぺらぼうって おばけに。', 'Hey, listen! Everyone in this town had their faces wiped off. By a ghost called Nopperabō.'),
              c.say('ぼくは たぬきだから、顔なんて すきに つくれる。でも みんなは… 「おはよう」も 言えないんだ。', 'I’m a tanuki, so I can make any face I like. But everyone else… they can’t even say “good morning”.'),
              c.say('えきの テツさんなら、なにか わかるかも。…いっしょに、町の おしゃべり、とりもどして くれる？', 'Tetsu at the station might know something. …Will you help me get the town’s chatter back?'),
            ],
            ['うん、まかせて！', 'Yeah, leave it to me!'],
            ['ごめん、あとで。', 'Sorry, later.'],
          )
        if (st === 0) return [c.say('テツさんは えきの かいさつに いるよ。ぼうしの おじさん！', 'Tetsu is at the ticket gate. The man with the cap!'), ...host(c, 'r11-words-1')]
        if (st === 1) return [c.say(`顔が もどった 人は ${greetCount(c.s())}人！ あいさつって、すごいね。`, `${greetCount(c.s())} ${greetCount(c.s()) === 1 ? 'person has' : 'people have'} their face back! Greetings are amazing, huh.`), ...host(c, 'r11-words-1')]
        if (st === 2) return [c.say('テツさんの ところへ 行って！ はやく はやく！', 'Go and see Tetsu! Quick, quick!'), ...host(c, 'r11-words-1')]
        if (st === 3 && noppBeaten(c.s())) {
          c.sparkle('spark')
          return [
            c.say('聞こえる？ 町じゅうが しゃべってる！ 「おはよう」「おかえり」「へえ、マジで？」…', 'Hear that? The whole town is talking! “Morning!” “Welcome back!” “No way, seriously?”…'),
            c.say('ありがとう！ これ、ぼくからの おれい。あいさつ ひとつに、えがおの スタンプ ひとつ！', 'Thank you! This is from me. One smiley stamp for every greeting!'),
            ...c.give('r11-stamp-card'),
            ...c.bagItem('ether', 2),
            ...c.reward(240, 80),
            ...c.advance('r11-smalltalk'),
          ]
        }
        if (st === 3) return [c.say('のっぺらぼうは、一ばんせんの いちばん はしに いるよ。…こわいけど、がんばってね！', 'Nopperabō is at the very end of platform one. …It’s scary, but do your best!'), ...host(c, 'r11-words-1')]
        return [c.say('ひがしの みちを 行くと、こころの たにだよ。きもちの ことばが ねむってる たに。…また あそびに 来てね！ ぽん！', 'Take the east road and you’ll reach the Valley of Hearts, where the words for feelings sleep. …Come and play again! Pon!'), ...host(c, 'r11-words-1')]
      },
      'e-tetsu': (c) => {
        const st = c.stage('r11-smalltalk')
        if (st === 0)
          return [
            c.say('…電車。…出ない。…', '…Train. …Won’t leave. …', TETSU, 'stationmaster'),
            c.fude('テツさん、ことばが 出ないんですね。…あれ、手帳に なにか 書いて います！', 'Tetsu, the words won’t come, will they. …Oh, he’s writing something in his notebook!'),
            c.narrate('「あいさつが ない 町では、わしの こえも ホームまで とどかない。三人に あいさつを かえして くれ。そう すれば、ふえを ふける」', '“In a town with no greetings, my voice can’t reach the platform. Give three people their greetings back. Then I can blow my whistle.”'),
            c.fude('やおやの マリさん、こうえんの かぞく、アパートの おかあさん… 三人に あいさつを とどけましょう！', 'Mari at the grocer’s, the family in the park, the mother at the apartments… let’s bring greetings to all three!'),
            ...c.advance('r11-smalltalk'),
          ]
        if (st === 1) return [c.say(`…あいさつ。…${greetCount(c.s())}。`, `…Greetings. …${greetCount(c.s())}.`, TETSU, 'stationmaster'), ...host(c, 'r11-casual')]
        if (st === 2) {
          c.sparkle('spark')
          return [
            c.say('…あ。あ… 声が、すこし 出る。三人ぶんの あいさつが、とどいた んだな。', '…Ah. Ah… my voice, a little of it’s back. Three people’s greetings reached me, I suppose.', TETSU, 'stationmaster'),
            c.say('のっぺらぼうは 一ばんせんの はしに いる。この ふえを もって いけ。おまえの こえが、ちゃんと とどく ように。', 'Nopperabō is at the end of platform one. Take this whistle, so your voice will carry all the way.', TETSU, 'stationmaster'),
            c.say('あいては 顔が ない。字も 見えないかも しれん。耳で 聞け。…たのんだぞ。', 'It has no face. You might not even see its words written down. Listen with your ears. …I’m counting on you.', TETSU, 'stationmaster'),
            ...c.give('r11-whistle'),
            ...c.advance('r11-smalltalk'),
          ]
        }
        if (noppBeaten(c.s())) return [c.say('一ばんせん、ていこくどおり！ いい 声が 出るように なったよ。おまえの おかげだ。', 'Platform one, right on time! My voice is back to its old self. All thanks to you.', TETSU, 'stationmaster'), ...host(c, 'r11-casual')]
        if (st === 3) return [c.say('…ホーム。…のっぺらぼう。…きを つけて。', '…Platform. …Nopperabō. …Careful.', TETSU, 'stationmaster'), ...host(c, 'r11-casual')]
        return null
      },
      'y-mari': (c) => {
        if (c.stage('r11-smalltalk') === 1 && !greeted(c.s(), 'y-mari')) return [c.say('…やさい。…たまご。…', '…Vegetables. …Eggs. …'), c.fude('マリさん、いらっしゃいが 言えないんですね。まず わたしたちから、あいさつ しましょう！', 'Mari can’t say “welcome”. Let’s greet her first!'), greetMari(c)]
        if (greeted(c.s(), 'y-mari') || noppBeaten(c.s())) return [c.say('いらっしゃい！ きょうは だいこんが やすいよ！ …あ、べんきょう？ いいよ、おしえて あげる！', 'Welcome! Daikon’s cheap today! …Oh, studying? Sure, I’ll teach you!'), ...host(c, 'r11-words-4')]
        return null
      },
      'e-family': (c) => {
        if (c.stage('r11-smalltalk') === 1 && !greeted(c.s(), 'e-family')) return [c.say('…べんとう。…はし。…', '…Bento. …Chopsticks. …'), c.fude('たべる まえの ことばが きえて、たべはじめられないんだ…', 'The words for before eating are gone, so they can’t start…'), greetFamily(c)]
        if (greeted(c.s(), 'e-family') || noppBeaten(c.s())) return [c.say('こうえんで たべる お弁当は、さいこう だね。…ごちそうさまでした！', 'A bento in the park is the best, isn’t it. …Thanks for the meal!')]
        return null
      },
      'e-mom': (c) => {
        if (c.stage('r11-smalltalk') === 1 && !greeted(c.s(), 'e-mom')) return [c.say('ただいま〜！', 'I’m hooome!', KID, 'child'), c.say('…………。', '…………'), c.fude('おかあさん、へんじが できないんだ…', 'The mother can’t answer…'), greetMom(c)]
        if (greeted(c.s(), 'e-mom') || noppBeaten(c.s())) return [c.say('「ただいま」「おかえり」。まいにちの ことばだけど、ないと こんなに さびしいのね。', '“I’m home.” “Welcome back.” Everyday words, but how lonely it is without them.')]
        return null
      },
      // ── townsfolk once their faces are back ──
      'e-clerk': (c) => (noppBeaten(c.s()) ? [c.say('いらっしゃいませ〜！ あ、おべんとう あたためますか？ …言えた！ ぜんぶ 言えた！', 'Welcome~! Oh, shall I heat up your bento? …I said it! I said all of it!'), ...host(c, 'r11-words-3')] : null),
      'e-commuter': (c) => (noppBeaten(c.s()) ? [c.say('おはよう ございます！ …あ、もう こんにちは か。ははは。いってきます！', 'Good morning! …Oh, it’s afternoon already. Ha ha. Off I go!')] : null),
      'e-taxi': (c) => (noppBeaten(c.s()) ? [c.say('どちらまで？ …って、やっと 聞けたよ。のって いく？', 'Where to? …Finally, I can ask! Hop in?')] : null),
      'e-salaryman': (c) => (noppBeaten(c.s()) ? [c.say('しごとは 大変だけど… 「おつかれさま」って 言われると、がんばれるんだよなあ。', 'Work’s hard, but… when someone says “thanks for your hard work”, I can keep going.')] : null),
      'e-nurse': (c) => (noppBeaten(c.s()) ? [c.say('「大丈夫ですか？」「おだいじに！」 …やっと かんじゃさんに 言える。', '“Are you all right?” “Take care of yourself!” …At last I can say them to my patients.'), ...host(c, 'r11-words-6')] : null),
      'e-karaoke': (c) => (noppBeaten(c.s()) ? [c.say('ことばが もどった！ きょうは ぜんきょく、むりょうで うたって いいよ！ …うそ、一きょくだけ。', 'The words are back! Sing every song free today! …Kidding, just one.')] : null),
      'k-yui': (c) => (noppBeaten(c.s()) ? [c.say('いらっしゃいませ！ …あ、きみか！ いつもの？ ははっ、言って みたかったんだ。', 'Welcome! …Oh, it’s you! The usual? Ha, I always wanted to say that.'), ...host(c, 'r11-cafe')] : null),
      'k-regular': (c) => (noppBeaten(c.s()) ? [c.say('ユイちゃんと 十五分 しゃべったよ。コーヒーは さめちゃった けどね。', 'I chatted with Yui for fifteen minutes. My coffee went cold, mind.')] : null),
      'p-haruto': (c) => (noppBeaten(c.s()) ? [c.say('電車、来た！ マジで ありがとな！ …あ、また 週末の はなし しようぜ！', 'The train came! Seriously, thanks! …Hey, let’s talk weekends again sometime!'), ...host(c, 'r11-weekend')] : null),
      // ── Satori ──
      'fk11-satori': (c) => {
        const st = c.stage('fk11-satori')
        if (st < 0)
          return offer(
            c,
            'fk11-satori',
            [
              c.say('あなたは いま、「さるが しゃべった！」と 思った。', 'Right now you thought, “The monkey talked!”', SATORI, 'monkey'),
              c.say('つぎに「なんで わかるの？」と 思う。…ほらね。わたしは さとり。人の 心が 読めるの。', 'Next you’ll think, “How does it know?” …See? I’m Satori. I can read people’s hearts.', SATORI, 'monkey'),
              c.say('だから だれも わたしと 話さない。言う まえに、ぜんぶ わかっちゃうから。…つまらない。', 'So nobody talks to me. I know everything before they say it. …It’s boring.', SATORI, 'monkey'),
            ],
            ['いっしょに 話そうよ。', 'Let’s talk anyway.'],
            ['また こんど。', 'Another time.'],
          )
        if (st === 0) return [c.say('どうせ、なにを 言うか わかってる。…ベンチの おじいさんに でも 聞いたら？', 'I already know what you’ll say. …Why not ask the old man on the bench?', SATORI, 'monkey')]
        if (st === 1) return [c.say('…また 来たの。じゃあ、わたしの はなしを 聞いて。どうせ へんじは わかってる けど。', '…Back again. Then listen to my story. I already know your replies, of course.', SATORI, 'monkey'), satoriChat(c, 0)]
        return [c.say('へえ、そうなんだ、なるほど… ふふ。あなたの まねを して みた。', 'Ooh, really, I see… heh. I was copying you.', SATORI, 'monkey')]
      },
      'e-oldman': (c) => {
        if (c.stage('fk11-satori') !== 0) return null
        return [
          c.say('さとり？ ああ、さきに ぜんぶ 言って しまう やつ じゃな。', 'Satori? Ah, the one who says everything before you can.'),
          c.say('ええか。かいわは、話す ことより 聞く ことの ほうが だいじ なんじゃ。「うん」「へえ」「そうなんだ」「なるほど」。それが あいづち。', 'Listen. In a conversation, listening matters more than talking. “Yeah.” “Ooh.” “Is that so.” “I see.” Those are aizuchi.'),
          c.choice({ jp: 'ゲンさんの しつもん：びっくり した ときの あいづちは？', en: 'Gen’s question: which aizuchi shows surprise?' }, [
            ['hee', 'へえ！', 'Ooh! / Wow!'],
            ['un', 'うん。', 'Yeah.'],
            ['jaa', 'じゃあね。', 'See ya.'],
          ], (id) => {
            if (id !== 'hee') return [c.say('ちがう ちがう。それは びっくり じゃ ないのう。', 'No, no. That’s not surprise.'), c.fude('びっくり したら「へえ！」ですよ。', 'When you’re surprised: へえ!')]
            c.learn('hee')
            return [
              c.say('そうじゃ。あいづちは、考えて うつ もんじゃ ない。聞いて いれば、しぜんに 出る。', 'That’s it. You don’t think up aizuchi. If you’re really listening, they just come out.'),
              c.say('さとりにも 読めん はずじゃ。考えて おらんのだからな。', 'Even Satori can’t read them. There’s no thought in them to read.'),
              ...c.advance('fk11-satori'),
            ]
          }),
        ]
      },
      // ── Hitotsume-kozō ──
      'fk11-hitotsume': (c) => {
        const st = c.stage('fk11-hitotsume')
        if (st < 0)
          return offer(
            c,
            'fk11-hitotsume',
            [
              c.say('べろべろばあ！ …あれ？ にげないの？', 'Blehhh! …Huh? You’re not running away?', HITOTSUME, 'child'),
              c.say('じゃあ、しつもん ゲーム しよう！ ぼくが 聞くから、こたえてね！', 'Then let’s play the question game! I ask, you answer!', HITOTSUME, 'child'),
            ],
            ['いいよ、やろう！', 'Sure, let’s play!'],
            ['また あとでね。', 'Later, okay?'],
          )
        if (st === 0) return [hitotsumeQuiz(c, 0)]
        if (st === 1) return [c.say('ぼくに しつもん？ …どうせ、だれも しないよ。', 'A question for me? …Nobody ever does.', HITOTSUME, 'child')]
        if (st === 2) return [c.say('…なに？', '…What?', HITOTSUME, 'child'), askHitotsume(c)]
        return [c.say('ねえねえ、もっと しつもん して！ どんな しつもんでも いいよ！', 'Hey, hey, ask me more questions! Any kind you like!', HITOTSUME, 'child')]
      },
      'e-reporter': (c) => {
        if (c.stage('fk11-hitotsume') !== 1) return noppBeaten(c.s()) ? [c.say('「どこから 来たんですか？」「どんな 町ですか？」 …やっと インタビューが できる！', '“Where are you from?” “What kind of town is it?” …At last I can do interviews!'), ...host(c, 'r11-words-2')] : null
        return [
          c.say('いい しつもん？ かんたん！ 「はい」「いいえ」で おわらない しつもん。', 'A good question? Easy! One that can’t be answered with just yes or no.'),
          c.say('とくに「どんな 〜が 好き？」。あいてが すきな ことを 話せる でしょ？ みんな、えがおに なるの。', 'Especially “What kind of ~ do you like?” It lets people talk about what they love. Everyone smiles.'),
          c.say('はい、わたしの しつもんカード。がんばってね！', 'Here, have my question card. Good luck!'),
          ...c.give('fk11-question-card'),
          ...c.advance('fk11-hitotsume'),
        ]
      },
      // ── Bakezōri ──
      'fk11-zori': (c) => {
        const st = c.stage('fk11-bakezori')
        if (st < 0)
          return offer(
            c,
            'fk11-bakezori',
            [
              c.say('カラン、コロン！ …あ、見えるの？ ぼくの こと。', 'Clack, clonk! …Oh, you can see me?', ZORI, 'imp'),
              c.say('ぼく、ばけぞうり。ながく はかれた ぞうりは、こころが できるんだ。でも、まいごに なっちゃった…', 'I’m Bakezōri. A sandal worn long enough grows a heart. But I got lost…', ZORI, 'imp'),
            ],
            ['いっしょに おうちを さがそう！', 'Let’s find your home together!'],
            ['ごめん、いまは ちょっと…', 'Sorry, not right now…'],
          )
        if (st === 0) return [zoriWhose(c)]
        return null
      },
      'p-kiosk': (c) => {
        if (c.stage('fk11-bakezori') === 1 && c.has('fk11-sandal')) return [c.narrate('かばんから ぞうりが カランと かおを 出した。', 'The sandal peeks out of your bag with a clack.'), c.say('…あ。…ぞうり。…フミ。…アパート。…三がい。', '…Oh. …Sandal. …Fumi. …Apartments. …Third floor.'), kioskClues(c)]
        if (noppBeaten(c.s())) return [c.say('いらっしゃい！ お弁当、お茶、しんぶん、なんでも あるよ！ …あ〜、しゃべれるって いいねえ！', 'Welcome! Bento, tea, newspapers, we’ve got it all! …Ah, it’s good to talk!')]
        return null
      },
      'e-grandma': (c) => {
        const st = c.stage('fk11-bakezori')
        if (st === 2 && c.has('fk11-sandal')) return [c.say('おや、その ぞうり…！ あたしの じゃないか！', 'Why, that sandal…! Isn’t it mine?', FUMI, 'okami'), zoriHome(c)]
        if (st >= 3) return [c.say('この ぞうり、もう 五十年 はいてるの。…ただいまって 言う あいてが いるのは、いい ことだねえ。', 'I’ve worn this sandal fifty years now. …It’s nice to have someone to say “I’m home” to.', FUMI, 'okami')]
        return null
      },
    },
    cast: {
      // ── landmarks that answer word magic ──
      'e-clock': (c, k) => {
        if (k !== 'じかん' && k !== 'いつ') return null
        c.learn(k === 'じかん' ? 'jikan' : 'itsu')
        c.sparkle('spark')
        return [c.narrate('カチ、カチ… とけいの はりが、すこし だけ はやく うごいた 気が する。', 'Tick, tick… the clock hands seem to move a little faster.'), ...(first(c, 'cast.e-clock') ? c.reward(15, 5) : [])]
      },
      'e-car': (c, k) => {
        if (k !== 'くるま') return null
        c.learn('kuruma')
        return [c.narrate('プップー！ タクシーが げんきよく クラクションを ならした。', 'Beep beep! The taxi gives a cheerful honk.'), ...(first(c, 'cast.e-car') ? c.reward(15, 5) : [])]
      },
      'e-timetable': (c, k) => {
        if (k !== 'ばす') return null
        c.learn('basu')
        c.sparkle('dust')
        return [c.narrate('かすれた じこくひょうに、「こころの たに ゆき」の 時間が うかび あがった。', 'On the faded timetable, the times for the Valley of Hearts float back into view.'), ...(first(c, 'cast.e-timetable') ? c.reward(15, 5) : [])]
      },
      'e-bikes': (c, k) => {
        if (k !== 'じてんしゃ') return null
        c.learn('jitensha')
        return [c.narrate('ちりん、ちりん、ちりん！ じてんしゃの ベルが いっせいに なった。', 'Ring-ring-ring! Every bicycle bell rings at once.'), ...(first(c, 'cast.e-bikes') ? c.reward(15, 5) : [])]
      },
      'e-bank': (c, k) => {
        if (k !== 'ぎんこう') return null
        c.learn('ginkou')
        return [c.narrate('ぎんこうの シャッターが ガラガラと あいた。…中で、だれかが コインを かぞえて いる。', 'The bank shutter rattles open. …Inside, someone is counting coins.')]
      },
      'e-hospital': (c, k) => {
        if (k !== 'びょういん' && k !== 'だいじょうぶ') return null
        c.learn(k === 'びょういん' ? 'byouin' : 'daijoubu')
        return [c.narrate('びょういんの まどから、だれかが「だいじょうぶ」と 手を ふった。', 'From the hospital window, someone waves: “All right!”')]
      },
      'e-bandstand': (c, k) => {
        if (k !== 'おんがく') return null
        c.learn('ongaku')
        c.sparkle('dust')
        return [c.narrate('ステージから、だれも いないのに やさしい おんがくが ながれだした。', 'Though no one is there, gentle music starts to drift from the bandstand.'), ...(first(c, 'cast.e-bandstand') ? c.reward(15, 5) : [])]
      },
      'e-poster': (c, k) => {
        if (k !== 'えいが') return null
        c.learn('eiga')
        return [c.narrate('ポスターの のっぺらぼうが、こっちを 見て… ウインクした？ 目は ないのに。', 'The Nopperabō on the poster looks at you and… winks? It has no eyes.')]
      },
      'e-phonebox': (c, k) => (k === 'でんわ' ? (c.learn('denwa'), [c.narrate('ジリリリ！ でんわが いっそう 大きく なった。', 'BRRRING! The phone rings even louder.')]) : null),
      'e-pon': (c, k) => {
        if (k === 'おはよう' || k === 'こんばんは' || k === 'こんにちは') {
          c.learn(k === 'おはよう' ? 'ohayou' : k === 'こんばんは' ? 'konbanwa' : 'konnichiwa')
          return [c.say(`${k}！ ぽん！ …えへへ、あいさつ されると、しっぽが ふくらむんだ。`, `${k}! Pon! …Hehe, my tail puffs up when someone greets me.`, PON, 'tanuki')]
        }
        return null
      },
      'p-car': (c, k) => {
        if (k !== 'でんしゃ') return null
        c.learn('densha')
        c.sparkle('spark')
        return [c.narrate('プシュー… 三ごうしゃの ドアが しまって、また あいた。電車も、出たがって いる。', 'Pssssh… the doors of car three close, then open again. The train wants to go, too.'), ...(first(c, 'cast.p-car') ? c.reward(15, 5) : [])]
      },
      'p-bell': (c, k) => (k === 'はじまる' || k === 'おわる' ? (c.learn(k === 'はじまる' ? 'hajimaru' : 'owaru'), [c.narrate('ベルが ちいさく 「ピッ」と なった。…まだ、はっしゃの 時間じゃ ない らしい。', 'The bell gives a tiny “beep”. …It’s not departure time yet, apparently.')]) : null),
      'k-coffee': (c, k) => (k === 'こひ' ? (c.learn('koohii'), c.sparkle('dust'), [c.narrate('ポットから ゆげが ふわっと 立ちのぼり、カフェじゅうに いい においが ひろがった。', 'Steam puffs from the pot, and a lovely smell fills the café.')]) : null),
      'y-veg': (c, k) => (k === 'やさい' ? (c.learn('yasai'), [c.narrate('だいこんが、ちょっと むねを はった。', 'A daikon puffs out its chest a little.')]) : null),
      'y-eggs': (c, k) => (k === 'たまご' ? (c.learn('tamago'), [c.narrate('からっぽの かごの なかで、たまごが ひとつ ころんと あらわれた！ …と 思ったら、まぼろしだった。', 'An egg rolls into the empty basket! …No, just a daydream.')]) : null),
      'y-milk': (c, k) => (k === 'ぎゅうにゅう' ? (c.learn('gyuunyuu'), [c.narrate('れいぞうこが ブーンと ひくく うなった。', 'The cooler hums low: bzzzz.')]) : null),
      'y-desk': (c, k) => (k === 'しゅくだい' || k === 'つくえ' ? (c.learn(k === 'つくえ' ? 'tsukue' : 'shukudai'), [c.say('しゅくだいって 言わないで〜！', 'Don’t say homework~!', KID, 'child')]) : null),
      'r-view': (c, k) => {
        if (k !== 'とおい' && k !== 'ちかい') return null
        c.learn(k === 'とおい' ? 'tooi' : 'chikai')
        return [c.narrate(k === 'とおい' ? 'ぼうえんきょうの むこう、ずっと とおくに たにが かすんで 見えた。' : 'ぼうえんきょうを のぞくと、ちかくの 電車が 大きく 見えた。', k === 'とおい' ? 'Through the telescope, far, far away, a valley shimmers in the haze.' : 'Through the telescope, a nearby train looks huge.'), ...(first(c, 'cast.r-view') ? c.reward(15, 5) : [])]
      },
      'r-aerial': (c, k) => (k === 'てれび' ? (c.learn('terebi'), [c.narrate('ザザッ… アパートの どこかで、テレビの 声が 聞こえはじめた。', 'Krrsh… somewhere in the building, a TV starts talking.')]) : null),
      'r-planter': (c, k) => (k === 'あかるい' ? (c.learn('akarui'), c.sparkle('leaf'), [c.narrate('プランターに 日が さして、トマトが きらきら ひかった。', 'Sunlight falls on the planter, and the tomatoes sparkle.')]) : null),
    },
    mapCast: {
      ekimae: (c, k) => {
        if (k === 'おはよう') return (c.learn('ohayou'), [c.narrate('「おはよう」！ 近くの 人が、顔の ない 顔を、ちょっと だけ こっちに むけた。', '“Good morning!” Someone nearby turns their faceless face towards you, just a little.')])
        if (k === 'おやすみ') return (c.learn('oyasumi'), [c.fude('まだ ねる じかんじゃ ないですよ！', 'It’s not bedtime yet!')])
        if (k === 'みんな') return (c.learn('minna'), [c.narrate('「みんな」… その ことばに、町じゅうの 人が ふりむいた 気が した。', '“Everyone”… for a moment, it feels as if the whole town turned to look.')])
        return null
      },
      'ekimae-platform': (c, k) => {
        if (k === 'でんしゃ') return (c.learn('densha'), [c.narrate('とまった 電車の まどが、ガタガタ ふるえた。', 'The windows of the stalled train rattle.')])
        if (k === 'がんばる') return (c.learn('ganbaru'), [c.fude('はい！ がんばりましょう！', 'Yes! Let’s do our best!')])
        return null
      },
      'ekimae-rooftop': (c, k) => {
        if (k === 'しゅうまつ') return (c.learn('shuumatsu'), [c.narrate('しゅうまつの においが する。せんたくものと、どこかの カレーの におい。', 'It smells like the weekend: clean laundry and somebody’s curry.')])
        return null
      },
    },
  },
]
