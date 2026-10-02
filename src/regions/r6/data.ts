/**
 * Region 6 — 数の港, the Harbour of Numbers. A fishing port below the
 * Shrine where everything is counted: the catch, the coins, the hours of
 * the tide. Teaches numbers to 10,000 (with their sound changes), the
 * counters つ・人・本・枚・匹・個, telling the time and the days of the
 * week, and haggling at the market.
 */
import type { RegionData } from '../types'

export const PACK: RegionData = {
  region: {
    id: 6,
    name: 'The Harbour of Numbers',
    jp: '数の港',
    reading: 'かずのみなと',
    tagline: 'Count the catch, name the hour, haggle for the price.',
    teaches: ['Numbers to 10,000', 'Counters つ・人・本・枚・匹・個', 'Time, days and prices'],
    color: '#4fb3d9',
    emoji: '⚓',
    pos: { x: 46, y: 50 },
    map: 'harbour',
  },

  words: [
    // ── Counting the Catch: numbers and money
    ['yon', '四', 'よん', 'four', 'number', '4️⃣', { alt: ['4'] }],
    ['go', '五', 'ご', 'five', 'number', '5️⃣', { alt: ['5'] }],
    ['roku', '六', 'ろく', 'six', 'number', '6️⃣', { alt: ['6'] }],
    ['nana', '七', 'なな', 'seven', 'number', '7️⃣', { alt: ['7'] }],
    ['hachi', '八', 'はち', 'eight', 'number', '8️⃣', { alt: ['8'] }],
    ['kyuu', '九', 'きゅう', 'nine', 'number', '9️⃣', { alt: ['9'] }],
    ['juu', '十', 'じゅう', 'ten', 'number', '🔟', { alt: ['10'] }],
    ['hyaku', '百', 'ひゃく', 'hundred', 'number', '💯', { alt: ['100', 'one hundred', 'a hundred'] }],
    ['sen-1000', '千', 'せん', 'thousand', 'number', '🎑', { alt: ['1000', 'one thousand', 'a thousand'] }],
    ['man', '万', 'まん', 'ten thousand', 'number', '🏦', { alt: ['10000', '10,000'] }],
    ['zero', 'ゼロ', 'ゼロ', 'zero', 'number', '0️⃣', { alt: ['0', 'nought'] }],
    ['en', '円', 'えん', 'yen', 'noun', '💴', { alt: ['yen (money)'] }],
    ['okane', 'お金', 'おかね', 'money', 'noun', '💰', { element: 'metal' }],
    ['ikutsu', 'いくつ', 'いくつ', 'how many', 'adverb', '❓'],
    ['ikura', 'いくら', 'いくら', 'how much', 'adverb', '🏷️', { alt: ['how much (price)'] }],

    // ── Harbour Words: the port, the sea and the first counters
    ['fune', '船', 'ふね', 'ship', 'noun', '⛵', { element: 'water', alt: ['boat'] }],
    ['minato', '港', 'みなと', 'harbour', 'noun', '⚓', { element: 'water', alt: ['harbor', 'port'] }],
    ['kai', '貝', 'かい', 'shellfish', 'noun', '🐚', { element: 'water', alt: ['shell', 'clam'] }],
    ['kani', '蟹', 'かに', 'crab', 'noun', '🦀', { element: 'water' }],
    ['tako', 'たこ', 'たこ', 'octopus', 'noun', '🐙', { element: 'water' }],
    ['ika', 'いか', 'いか', 'squid', 'noun', '🦑', { element: 'water' }],
    ['ami', '網', 'あみ', 'net', 'noun', '🕸️', { alt: ['fishing net'] }],
    ['nami', '波', 'なみ', 'wave', 'noun', '🌊', { element: 'water' }],
    ['suna', '砂', 'すな', 'sand', 'noun', '🏖️', { element: 'earth' }],
    ['shima', '島', 'しま', 'island', 'noun', '🏝️', { element: 'earth' }],
    ['toudai', '灯台', 'とうだい', 'lighthouse', 'noun', '🗼', { element: 'light' }],
    ['ichiba', '市場', 'いちば', 'market', 'noun', '🐟', { alt: ['marketplace'] }],
    ['hitotsu', '一つ', 'ひとつ', 'one (thing)', 'number', '☝️', { alt: ['one thing', 'one'] }],
    ['futatsu', '二つ', 'ふたつ', 'two (things)', 'number', '✌️', { alt: ['two things', 'two'] }],
    ['mittsu', '三つ', 'みっつ', 'three (things)', 'number', '🤟', { alt: ['three things', 'three'] }],

    // ── Time and Tide: hours, parts of the day, the week
    ['ji', '時', 'じ', "o'clock", 'noun', '🕐', { alt: ['oclock', 'hour', 'o clock'] }],
    ['fun', '分', 'ふん', 'minute', 'noun', '⏱️', { alt: ['minutes'] }],
    ['han', '半', 'はん', 'half', 'noun', '🌓', { alt: ['half past', 'thirty minutes'] }],
    ['asa', '朝', 'あさ', 'morning', 'noun', '🌅', { element: 'light' }],
    ['hiru', '昼', 'ひる', 'noon', 'noun', '🌞', { alt: ['midday', 'daytime'], element: 'light' }],
    ['yoru', '夜', 'よる', 'night', 'noun', '🌙', { alt: ['evening'] }],
    ['mainichi', '毎日', 'まいにち', 'every day', 'adverb', '📆', { alt: ['daily'] }],
    ['nanji', '何時', 'なんじ', 'what time', 'expression', '⏰'],
    ['getsuyoubi', '月曜日', 'げつようび', 'Monday', 'noun', '🌙'],
    ['kayoubi', '火曜日', 'かようび', 'Tuesday', 'noun', '🔥'],
    ['suiyoubi', '水曜日', 'すいようび', 'Wednesday', 'noun', '💧'],
    ['mokuyoubi', '木曜日', 'もくようび', 'Thursday', 'noun', '🌳'],
    ['kinyoubi', '金曜日', 'きんようび', 'Friday', 'noun', '🪙'],
    ['doyoubi', '土曜日', 'どようび', 'Saturday', 'noun', '🟫'],
    ['nichiyoubi', '日曜日', 'にちようび', 'Sunday', 'noun', '☀️'],

    // ── Haggling: buying, selling, this and that
    ['yasui', '安い', 'やすい', 'cheap', 'i-adj', '🏷️', { alt: ['inexpensive'] }],
    ['uru', '売る', 'うる', 'sell', 'verb', '🤝', { masu: '売ります', alt: ['to sell'] }],
    ['harau', '払う', 'はらう', 'pay', 'verb', '💸', { masu: '払います', alt: ['to pay'] }],
    ['kazoeru', '数える', 'かぞえる', 'count', 'verb', '🔢', { masu: '数えます', alt: ['to count'] }],
    ['zenbu', '全部', 'ぜんぶ', 'all', 'adverb', '🧺', { alt: ['everything', 'altogether', 'all of it'] }],
    ['sukoshi', '少し', 'すこし', 'a little', 'adverb', '🤏', { alt: ['a few', 'a bit'] }],
    ['takusan', 'たくさん', 'たくさん', 'a lot', 'adverb', '🐟', { alt: ['many', 'lots', 'plenty'] }],
    ['kore', 'これ', 'これ', 'this', 'pronoun', '👇', { alt: ['this one'] }],
    ['sore', 'それ', 'それ', 'that', 'pronoun', '👉', { alt: ['that one', 'that (near you)'] }],
    ['are', 'あれ', 'あれ', 'that over there', 'pronoun', '🫵', { alt: ['that one over there'] }],
    ['dore', 'どれ', 'どれ', 'which', 'pronoun', '🤔', { alt: ['which one'] }],
    ['otsuri', 'おつり', 'おつり', 'change', 'noun', '🪙', { alt: ['change (money)', 'coins back'] }],
    ['saifu', '財布', 'さいふ', 'wallet', 'noun', '👛', { alt: ['purse'] }],
    ['hako', '箱', 'はこ', 'box', 'noun', '📦'],
    ['kippu', '切符', 'きっぷ', 'ticket', 'noun', '🎫'],
  ],

  grammar: [
    { id: 'counter-tsu', region: 6, jp: '〜つ', say: 'hitotsu, futatsu, mittsu…', en: 'counts things in general, one to ten', example: { jp: 'りんごを みっつ ください。', en: 'Three apples, please.' } },
    { id: 'counter-nin', region: 6, jp: '〜人', say: 'hitori, futari, san-nin', en: 'counts people (one and two are special)', example: { jp: 'ふねに ふたり います。', en: 'There are two people on the boat.' } },
    { id: 'counter-hon', region: 6, jp: '〜本', say: 'ippon, nihon, sanbon', en: 'counts long thin things: bottles, pens, rods', example: { jp: 'つりざおが さんぼん あります。', en: 'There are three fishing rods.' } },
    { id: 'counter-mai', region: 6, jp: '〜枚', say: 'ichimai, nimai', en: 'counts flat things: tickets, paper, plates', example: { jp: 'きっぷを にまい ください。', en: 'Two tickets, please.' } },
    { id: 'counter-hiki', region: 6, jp: '〜匹', say: 'ippiki, nihiki, sanbiki', en: 'counts small animals and fish', example: { jp: 'ねこが いっぴき います。', en: 'There is one cat.' } },
    { id: 'counter-ko', region: 6, jp: '〜個', say: 'ikko, niko, sanko', en: 'counts small round or boxy objects', example: { jp: 'たまごを ごこ ください。', en: 'Five eggs, please.' } },
    { id: 'count-order', region: 6, jp: '〜を [数] ください', say: 'o + number + kudasai', en: 'the number and counter go after the thing, right before the verb', example: { jp: 'さかなを さんびき ください。', en: 'Three fish, please.' } },
    { id: 'ikura-desu-ka', region: 6, jp: 'いくらですか', say: 'ikura desu ka', en: 'how much is it?', example: { jp: 'この かには いくらですか。', en: 'How much is this crab?' } },
    { id: 'nanji-desu-ka', region: 6, jp: 'なんじですか', say: 'nanji desu ka', en: 'what time is it?', example: { jp: 'いま なんじですか。', en: 'What time is it now?' } },
    { id: 'ji-han', region: 6, jp: '〜時半', say: '~ji han', en: 'half past ~ (4じ = yoji, 7じ = shichiji, 9じ = kuji)', example: { jp: 'くじはんに あいましょう。', en: 'Let’s meet at half past nine.' } },
    { id: 'kara-made', region: 6, jp: '〜から〜まで', say: 'kara … made', en: 'from ~ until ~ (times and places)', example: { jp: 'いちばは ろくじから じゅうにじまでです。', en: 'The market is open from six until twelve.' } },
    { id: 'big-numbers', region: 6, jp: '百・千・万', say: 'hyaku, sen, man', en: 'sound changes: 300 sanbyaku, 600 roppyaku, 800 happyaku, 3000 sanzen, 8000 hassen', example: { jp: 'さんびゃくえんです。', en: 'It’s 300 yen.' } },
  ],

  sentences: [
    { id: 'h1', en: 'Three fish, please.', tokens: ['魚', 'を', '三匹', 'ください'], distractors: ['三本', 'が'], region: 6, hint: 'Fish are counted with 匹; the number comes after を, right before ください.' },
    { id: 'h2', en: 'How much is this?', tokens: ['これ', 'は', 'いくら', 'ですか'], distractors: ['いくつ', 'を'], region: 6, hint: 'いくら asks for a price; いくつ asks how many.' },
    { id: 'h3', en: 'What time is it now?', tokens: ['今', '何時', 'ですか'], distractors: ['いくら', 'を'], region: 6, hint: '何時 (なんじ) asks the hour.' },
    { id: 'h4', en: 'I wake up at seven every day.', tokens: ['毎日', '七時', 'に', '起きます'], alts: [['七時', 'に', '毎日', '起きます']], distractors: ['を', 'で'], region: 6, hint: 'A clock time takes に; 毎日 needs no particle.' },
    { id: 'h5', en: 'There are two people on the ship.', tokens: ['船', 'に', '二人', 'います'], distractors: ['あります', '二つ'], region: 6, hint: 'People use います and the counter 人: ふたり.' },
    { id: 'h6', en: 'I buy two apples.', tokens: ['りんご', 'を', '二つ', '買います'], distractors: ['二人', 'に'], region: 6, hint: 'Apples are things: ふたつ. Number before the verb.' },
    { id: 'h7', en: 'The market is from six until twelve.', tokens: ['市場', 'は', '六時', 'から', '十二時', 'まで', 'です'], distractors: ['に', 'で'], region: 6, hint: 'から = from, まで = until.' },
    { id: 'h8', en: 'This fish is cheap.', tokens: ['この', '魚', 'は', '安い', 'です'], distractors: ['高い', 'を'], region: 6, hint: 'この goes straight before the noun; 安い = cheap.' },
    { id: 'h9', en: 'I count the shells.', tokens: ['貝', 'を', '数えます'], distractors: ['に', '売ります'], region: 6, hint: 'What you count takes を.' },
    { id: 'h10', en: 'The ship comes on Monday.', tokens: ['船', 'は', '月曜日', 'に', '来ます'], alts: [['月曜日', 'に', '船', 'は', '来ます']], distractors: ['を', '火曜日'], region: 6, hint: 'Days of the week take に.' },
    { id: 'h11', en: 'Three tickets, please.', tokens: ['切符', 'を', '三枚', 'ください'], distractors: ['三本', '三人'], region: 6, hint: 'Tickets are flat: 枚.' },
    { id: 'h12', en: 'One octopus is five hundred yen.', tokens: ['たこ', 'は', '一匹', '五百円', 'です'], distractors: ['一本', 'を'], region: 6, hint: 'Octopus counts with 匹: いっぴき.' },
  ],

  runes: [
    { id: 'h-r1', jp: 'りんごを三つください', reading: 'りんごをみっつください', answer: 'Three apples, please.', wrong: ['Three people, please.', 'I have three apples.'], region: 6 },
    { id: 'h-r2', jp: '今、九時半です', reading: 'いま、くじはんです', answer: 'It is half past nine now.', wrong: ['It is nine o’clock now.', 'It is half past ten now.'], region: 6 },
    { id: 'h-r3', jp: 'この貝は三百円です', reading: 'このかいはさんびゃくえんです', answer: 'This shell is 300 yen.', wrong: ['This shell is 30 yen.', 'This shell is 3,000 yen.'], region: 6 },
    { id: 'h-r4', jp: '船に五人います', reading: 'ふねにごにんいます', answer: 'There are five people on the ship.', wrong: ['There are five ships.', 'Five people go to the ship.'], region: 6 },
    { id: 'h-r5', jp: '土曜日に市場へ行きます', reading: 'どようびにいちばへいきます', answer: 'I go to the market on Saturday.', wrong: ['I go to the market on Sunday.', 'The market is closed on Saturday.'], region: 6 },
    { id: 'h-r6', jp: 'たこが二匹います', reading: 'たこがにひきいます', answer: 'There are two octopuses.', wrong: ['There are two squid.', 'I eat two octopuses.'], region: 6 },
    { id: 'h-r7', jp: '市場は六時から十二時までです', reading: 'いちばはろくじからじゅうにじまでです', answer: 'The market is open from six until twelve.', wrong: ['The market opens at twelve.', 'The market is six minutes away.'], region: 6 },
  ],

  readings: {
    三匹: 'さんびき',
    三本: 'さんぼん',
    一本: 'いっぽん',
    一匹: 'いっぴき',
    二人: 'ふたり',
    三人: 'さんにん',
    三枚: 'さんまい',
    七時: 'しちじ',
    六時: 'ろくじ',
    十二時: 'じゅうにじ',
    五百円: 'ごひゃくえん',
    今: 'いま',
    来ます: 'きます',
  },

  npcs: [
    {
      id: 'fishmonger',
      name: 'Ume the Fishmonger',
      jp: 'さかなやの ウメ',
      emoji: '🐟',
      region: 6,
      personality: 'Loud, quick-witted fishmonger at the harbour market who counts faster than anyone in town and never gives a discount without a joke. Proud of her grandmother’s knife.',
      politeness: 'casual',
      color: '#4fb3d9',
      interests: ['fish', 'prices', 'the weather at sea', 'her grandmother'],
      greeting: { jp: 'いらっしゃい！ いきが いいよ！', en: 'Welcome! Fresh as can be!' },
    },
  ],

  scenarios: [
    {
      id: 'harbour-fishmonger',
      npcId: 'fishmonger',
      region: 6,
      translations: 'always',
      start: 'greet',
      hearts: 4,
      startTrust: 2,
      trustMax: 6,
      intro: [
        'Ume sells the morning catch — but only to customers who count properly.',
        'Fish and crabs are counted with 匹 (ぴき・びき・ひき); bottles with 本; tickets with 枚; anything else with つ.',
        'Pick your reply, then pay and count your change. Wrong answers cost a ❤️.',
      ],
      nodes: {
        greet: {
          id: 'greet',
          line: { jp: 'いらっしゃい！ きょうの さかなは いきが いいよ！', en: 'Welcome! Today’s fish are lively!' },
          wordIds: ['ichiba'],
          next: 'what',
          options: [
            { jp: 'おはようございます！', en: 'Good morning!', correct: true, reply: { jp: 'おはよう！ はやいね！', en: 'Morning! You’re early!' }, effects: { trust: 1 } },
            { jp: 'こんにちは。', en: 'Hello.', correct: true, reply: { jp: 'はい、こんにちは！', en: 'Hello there!' } },
            { jp: 'おやすみなさい。', en: 'Good night.', correct: false, reply: { jp: 'まだ あさだよ！ ねぼけてる？', en: 'It’s still morning! Half asleep?' }, note: 'おやすみなさい is for bedtime. At the morning market, say おはようございます.' },
          ],
        },
        what: {
          id: 'what',
          line: { jp: 'なにに する？ あじ、かに、たこ… なんでも あるよ。', en: 'What’ll it be? Horse mackerel, crab, octopus… we’ve got it all.' },
          wordIds: ['kani', 'tako', 'sakana'],
          hint: 'Fish are counted with 匹: いっぴき, にひき, さんびき.',
          next: 'how-much',
          options: [
            { jp: 'さかなを 三びき ください。', kana: 'さかなを さんびき ください。', en: 'Three fish, please.', correct: true, wordIds: ['sakana', 'mittsu'], reply: { jp: 'はい、さんびき！ まいど！', en: 'Three fish, coming up! Thanks!' }, effects: { trust: 1 } },
            { jp: 'さかなを 三ぼん ください。', kana: 'さかなを さんぼん ください。', en: 'Three (long things of) fish, please.', correct: false, wordIds: ['sakana'], reply: { jp: 'さかなは ぼうじゃ ないよ！', en: 'Fish aren’t sticks!' }, note: '本 counts long thin things (bottles, pens). Fish take 匹: さんびき.' },
            { jp: 'さかなを 三にん ください。', kana: 'さかなを さんにん ください。', en: 'Three (people of) fish, please.', correct: false, wordIds: ['sakana'], reply: { jp: 'さかなが にんげんに なっちゃった！', en: 'You turned the fish into people!' }, note: '人 counts people. Fish take 匹: さんびき.' },
            { jp: '三びき さかなを ください。', kana: 'さんびき さかなを ください。', en: 'Three-fish, please (number first).', correct: false, wordIds: ['sakana'], reply: { jp: 'ん？ いいたい ことは わかるけど…', en: 'Hm? I get what you mean, but…' }, note: 'The number + counter usually comes after the thing and its を: さかなを さんびき ください.' },
          ],
        },
        'how-much': {
          id: 'how-much',
          line: { jp: 'ほかに なにか いる？', en: 'Anything else?' },
          wordIds: ['ikura', 'zenbu'],
          hint: 'Ask how much it is altogether: ぜんぶで いくらですか.',
          next: 'pay',
          options: [
            { jp: 'ぜんぶで いくらですか。', en: 'How much is it altogether?', correct: true, wordIds: ['zenbu', 'ikura'], reply: { jp: 'ぜんぶで きゅうひゃく えん！', en: 'Nine hundred yen altogether!' } },
            { jp: 'ぜんぶで いくつですか。', en: 'How many is it altogether?', correct: false, wordIds: ['ikutsu'], reply: { jp: 'さんびきって いったじゃない！', en: 'You said three yourself!' }, note: 'いくつ asks how many; いくら asks how much (money).' },
            { jp: 'いま なんじですか。', en: 'What time is it?', correct: false, wordIds: ['nanji'], reply: { jp: 'しちじだよ。…で、おかいけいは？', en: 'Seven o’clock. …And the bill?' }, note: 'That asks the time. To ask the price: いくらですか.' },
          ],
        },
        pay: {
          id: 'pay',
          line: { jp: 'きゅうひゃくえんね。', en: 'Nine hundred yen, then.' },
          wordIds: ['hyaku', 'sen-1000', 'en'],
          hint: '900 yen. Hand over a 1,000-yen note: せんえん です.',
          next: 'change',
          options: [
            { jp: 'はい、せんえん です。', en: 'Here, one thousand yen.', correct: true, wordIds: ['sen-1000', 'en', 'harau'], reply: { jp: 'せんえん、おあずかりします！', en: 'One thousand yen, received!' }, effects: { trust: 1 } },
            { jp: 'はい、きゅうえん です。', en: 'Here, nine yen.', correct: false, wordIds: ['en'], reply: { jp: 'きゅうえん！？ ほねしか かえないよ！', en: 'Nine yen?! That buys you the bones!' }, note: 'きゅうひゃく = 900. きゅう alone is just nine.' },
            { jp: 'はい、きゅうせんえん です。', en: 'Here, nine thousand yen.', correct: false, wordIds: ['sen-1000'], reply: { jp: 'おおすぎる！ ふねが かえるよ！', en: 'Way too much! You could buy a boat!' }, note: 'きゅうせん = 9,000. The price was きゅうひゃく (900).' },
          ],
        },
        change: {
          id: 'change',
          line: { jp: 'おつりは いくら？ かぞえて ごらん！', en: 'How much change do you get? Count it yourself!' },
          wordIds: ['otsuri', 'kazoeru'],
          hint: '1,000 − 900 = 100. Hundred is ひゃく.',
          next: 'order',
          options: [
            { jp: 'ひゃくえん です。', en: 'One hundred yen.', correct: true, wordIds: ['hyaku', 'otsuri'], reply: { jp: 'せいかい！ はい、おつり ひゃくえん。', en: 'Right! Here’s your hundred yen change.' }, effects: { trust: 1 } },
            { jp: 'じゅうえん です。', en: 'Ten yen.', correct: false, wordIds: ['juu'], reply: { jp: 'それじゃ わたしが もうかっちゃう！', en: 'Then I’d be making a profit!' }, note: '1,000 − 900 = 100: ひゃくえん.' },
            { jp: 'さんびゃくえん です。', en: 'Three hundred yen.', correct: false, wordIds: ['hyaku'], reply: { jp: 'ずうずうしい！', en: 'Cheeky!' }, note: '1,000 − 900 = 100: ひゃくえん.' },
          ],
        },
        order: {
          id: 'order',
          line: { jp: 'さいごに たこも どう？ ひとつ、じゃ なくて… なんて いう？', en: 'Want an octopus too? Not “one thing”… so how do you say it?' },
          wordIds: ['tako'],
          hint: 'Octopus counts like fish: たこを いっぴき ください.',
          next: 'bye',
          input: {
            accepted: ['たこをいっぴきください', 'たこを一匹ください', 'たこをいっぴき', 'たこを一ぴきください', 'たこいっぴきください'],
            model: 'たこを一匹ください',
            modelKana: 'たこを いっぴき ください',
            wrongReply: { jp: 'たこが こまってるよ。', en: 'The octopus looks confused.' },
            wrongNote: 'One small animal is いっぴき: たこを いっぴき ください.',
            reply: { jp: 'いっぴき！ よく できました！', en: 'One octopus! Well done!' },
          },
        },
        bye: { id: 'bye', line: { jp: 'まいど ありがとう！ また きてね！', en: 'Thanks as always! Come again!' }, end: true },
      },
    },
  ],
}

/** Off the road until the region is finished. */
export const DATA: RegionData | null = null
