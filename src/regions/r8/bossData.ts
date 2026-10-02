/**
 * Nurarihyon's turns. Every wrong option here is genuinely wrong for the
 * situation (not merely another way to say it), since the boss punishes
 * mistakes.
 *
 * Phase 1, the uninvited guest: he barges into a situation; pick the polite
 * phrase that fits. Phase 2, words for the lord: he says it plainly; raise
 * the lord with respectful verbs, lower yourself with humble ones. Phase 3,
 * who gives to whom: giving, receiving, lending and borrowing, with the
 * particles that go with them.
 */
import { item } from '../../engine/items'

export interface BossTurn {
  /** The situation he barges into (English). */
  situation: string
  /** What Nurarihyon says (shown in his speech bubble). */
  say: { jp: string; en: string }
  /** A sentence with ＿ where the answer goes (phase 3). */
  frame?: string
  /** Who gives what to whom (phase 3), drawn as a little arrow. */
  arrow?: string
  answer: string
  wrong: string[]
  /** Items reviewed by this turn. */
  items: string[]
  /** Why the answer is right (shown after answering). */
  rule: string
}

const w = item.word
const g = item.grammar

export const PHASE_1: BossTurn[] = [
  { situation: 'He slides open the door of YOUR house and strolls in. Show him what a guest says on the way in.', say: { jp: 'ほっほ、はいるぞ。', en: 'Ho ho, coming in.' }, answer: 'しつれいします。', wrong: ['いらっしゃいませ。', 'ようこそ。', 'どうぞ。'], items: [w('shitsureishimasu')], rule: 'A guest coming in says しつれいします (excuse me for intruding). The others are what the host says.' },
  { situation: 'He sits behind a shop counter as a customer walks in. Show him what a shop says.', say: { jp: 'なんじゃ、きゃくか。', en: 'What, a customer?' }, answer: 'いらっしゃいませ！', wrong: ['しつれいします！', 'おねがいします！', 'どこですか！'], items: [w('irasshaimase')], rule: 'Shops greet customers with いらっしゃいませ.' },
  { situation: 'On a narrow bridge he barks at you to move. Let him go first, politely.', say: { jp: 'どけ、どけ！', en: 'Out of my way!' }, answer: 'おさきに どうぞ。', wrong: ['おさきに しつれいします。', 'おねがいします。', 'いらっしゃいませ。'], items: [w('douzo')], rule: 'どうぞ offers: please, go ahead. おさきに しつれいします is what you say when YOU go first.' },
  { situation: 'He only grunts at the tea-house mistress. Order the dango for him, politely.', say: { jp: 'だんご！', en: 'Dango!' }, answer: 'だんごを おねがいします。', wrong: ['だんごが おねがいします。', 'だんごを あげます。', 'だんごを もらいます。'], items: [w('dango'), w('onegaishimasu'), g('wo-onegaishimasu')], rule: 'What you ask for takes を, then おねがいします.' },
  { situation: 'He wants to know if this shop sells fans. Ask for him.', say: { jp: 'せんす、ある？', en: 'Got fans?' }, answer: 'せんすは ありますか。', wrong: ['せんすは いますか。', 'せんすを ありますか。', 'せんすに しますか。'], items: [w('sensu'), g('wa-arimasu-ka')], rule: 'For things, ask 〜は ありますか: あります, not います, and は, not を.' },
  { situation: 'He holds a kimono in his own hands and wants to buy it. Say “I’ll take this kimono.”', say: { jp: 'どれに するかのう。', en: 'Which shall I have, hm?' }, answer: 'この きものに します。', wrong: ['あの きものに します。', 'この きものを します。', 'どの きものに します。'], items: [w('kono'), w('kimono'), g('ni-shimasu')], rule: 'The kimono in hand is この; deciding on something is 〜に します.' },
  { situation: 'Nobody has ever invited him anywhere. Invite him to the play with you.', say: { jp: 'しばい？ ふん。', en: 'A play? Hmph.' }, answer: 'いっしょに しばいを 見ませんか。', wrong: ['いっしょに しばいを 見ましたか。', 'ひとりで しばいを 見ませんか。', 'いっしょに しばいを 見たいですか。'], items: [w('isshoni'), w('shibai'), g('masen-ka')], rule: 'Invite gently with いっしょに 〜ませんか. Asking 〜たいですか straight out sounds pushy.' },
  { situation: 'His long pipe looks heavy. Offer to carry it yourself.', say: { jp: 'おもいのう、この きせる。', en: 'Heavy, this pipe.' }, answer: 'わたしが もちましょうか。', wrong: ['わたしが もちませんか。', 'もちましたか。', 'きせるが ほしいです。'], items: [g('mashou-ka')], rule: '〜ましょうか offers your help. 〜ませんか would invite HIM to do it.' },
  { situation: 'He asks the way to the tea house. It is right next to the bridge.', say: { jp: 'ちゃやは どこじゃ？', en: 'Where’s the tea house?' }, answer: 'はしの となりです。', wrong: ['はしの うしろです。', 'はしの まえです。', 'はしを となりです。'], items: [w('tonari'), g('no-ichi')], rule: 'Next to the bridge: はしの となり. の links the landmark to the place word.' },
  { situation: 'He asks which way the castle gate is. It is far from you both: answer politely.', say: { jp: 'もんは どっちじゃ？', en: 'Which way’s the gate?' }, answer: 'あちらです。', wrong: ['どちらです。', 'こちらです。', 'ここです。'], items: [w('achira'), g('kochira-polite')], rule: 'Far from you both, politely: あちら. どちら is the question “which way?”.' },
  { situation: 'He stands lost at the crossroads. The castle is dead ahead.', say: { jp: 'しろへは どう いく？', en: 'How do I get to the castle?' }, answer: 'この とおりを まっすぐです。', wrong: ['この とおりを ひだりです。', 'ここの とおりを まっすぐです。', 'この とおりに うしろです。'], items: [w('massugu'), w('toori'), w('kono')], rule: 'Straight along this street: この とおりを まっすぐ.' },
]

export const PHASE_2: BossTurn[] = [
  { situation: 'About the LORD, he says it plainly. Raise the lord.', say: { jp: '殿は おくに いる。', en: 'The lord is in the back.' }, answer: '殿は おくに いらっしゃいます。', wrong: ['殿は おくに おります。', '殿は おくに まいります。'], items: [w('irassharu'), w('tono'), g('sonkeigo')], rule: 'いらっしゃる raises the lord. おります and まいります are humble: only for yourself.' },
  { situation: 'About YOURSELF, he makes you say it plainly. Lower yourself.', say: { jp: 'おまえが いけ。「わたしが いく」と いえ。', en: 'You go. Say “I’ll go.”' }, answer: 'わたしが まいります。', wrong: ['わたしが いらっしゃいます。', 'わたしが めしあがります。'], items: [g('kenjougo')], rule: 'For yourself, humble まいります. Never raise yourself with いらっしゃる.' },
  { situation: 'About the LORD eating. Raise the lord.', say: { jp: '殿が だんごを たべる。', en: 'The lord eats dango.' }, answer: '殿が だんごを めしあがります。', wrong: ['殿が だんごを まいります。', '殿が だんごを おっしゃいます。'], items: [w('meshiagaru'), g('sonkeigo')], rule: 'めしあがる is the respectful “eat / drink”.' },
  { situation: 'About what the LORD said. Raise the lord.', say: { jp: '殿が「ありがとう」と いった。', en: 'The lord said “thanks”.' }, answer: '殿が「ありがとう」と おっしゃいました。', wrong: ['殿が「ありがとう」と もうしました。', '殿が「ありがとう」と めしあがりました。'], items: [w('ossharu'), g('sonkeigo')], rule: 'おっしゃる is the respectful “say”. もうす is humble, for your own words.' },
  { situation: 'About YOURSELF being here. Lower yourself.', say: { jp: '「わたしは ここに いる」と いえ。', en: 'Say “I am here.”' }, answer: 'わたしは ここに おります。', wrong: ['わたしは ここに いらっしゃいます。', 'わたしは ここに めしあがります。'], items: [g('kenjougo'), w('koko')], rule: 'おります is the humble “to be”, for yourself.' },
  { situation: 'About YOURSELF guiding the lord. Lower yourself.', say: { jp: '「わたしが あんないする」と いえ。', en: 'Say “I’ll show the way.”' }, answer: 'わたしが あんない いたします。', wrong: ['わたしが あんない いらっしゃいます。', 'わたしが あんない めしあがります。'], items: [w('annaisuru'), g('kenjougo')], rule: 'いたします is the humble します.' },
  { situation: 'To a guest, he snaps “wait!”. Ask the guest to wait, very politely.', say: { jp: 'まて！', en: 'Wait!' }, answer: 'こちらで おまちください。', wrong: ['こちらで まって。', 'こちらで まちましょうか。'], items: [g('o-kudasai'), w('kochira')], rule: 'お + stem + ください is the very polite request: おまちください.' },
  { situation: 'He asks the lord what he’ll eat, rudely. Ask the lord properly.', say: { jp: 'なにを たべる？', en: 'Whatcha eating?' }, answer: 'なにを めしあがりますか。', wrong: ['なにを まいりますか。', 'なにを たべる？'], items: [w('meshiagaru')], rule: 'To the lord: めしあがりますか.' },
  { situation: 'About the LORD coming to the garden. Raise the lord.', say: { jp: '殿が 庭に くる。', en: 'The lord comes to the garden.' }, answer: '殿が 庭に いらっしゃいます。', wrong: ['殿が 庭に まいります。', '殿が 庭に おります。'], items: [w('irassharu'), w('niwa')], rule: 'いらっしゃる is respectful for いる, くる and いく alike.' },
  { situation: 'About YOURSELF leaving his presence. Lower yourself.', say: { jp: '「しつれいする」と いえ。', en: 'Say “excuse me”.' }, answer: 'しつれい いたします。', wrong: ['しつれい いらっしゃいます。', 'しつれい めしあがります。'], items: [w('shitsureishimasu'), g('kenjougo')], rule: 'しつれい いたします: humble いたします in place of します.' },
]

export const PHASE_3: BossTurn[] = [
  { situation: 'Nurarihyon gave YOU a dango.', arrow: '🧓 → 🙋 🍡', say: { jp: 'わしが やったんじゃ。', en: 'I gave it, I did.' }, frame: 'ぬらりひょんが わたしに だんごを ＿。', answer: 'くれました', wrong: ['あげました', 'もらいました'], items: [w('kureru'), g('ageru-kureru')], rule: 'Someone gives to ME: くれる.' },
  { situation: 'YOU gave Nurarihyon tea.', arrow: '🙋 → 🧓 🍵', say: { jp: 'ちゃを もらったぞ。', en: 'I got tea.' }, frame: 'わたしは ぬらりひょんに おちゃを ＿。', answer: 'あげました', wrong: ['くれました', 'もらいました'], items: [w('ageru'), g('ageru-kureru')], rule: 'I give to someone else: あげる.' },
  { situation: 'YOU received a gate pass from Tadashi.', arrow: '🗡️ → 🙋 🪪', say: { jp: 'てがた？ だれに？', en: 'A pass? From whom?' }, frame: 'わたしは ただしさんに てがたを ＿。', answer: 'もらいました', wrong: ['くれました', 'あげました'], items: [w('morau'), g('ni-morau')], rule: 'I received, from Tadashi (に): もらう.' },
  { situation: 'Kiku gave YOU dango.', arrow: '🍵 → 🙋 🍡', say: { jp: 'ずるいぞ。', en: 'Not fair.' }, frame: 'キクさんが わたしに だんごを ＿。', answer: 'くれました', wrong: ['あげました', 'もらいました'], items: [w('kureru'), g('ageru-kureru')], rule: 'Kiku gives to ME: くれる.' },
  { situation: 'YOU received dango FROM Kiku. Which particle marks the giver?', arrow: '🍵 → 🙋 🍡', say: { jp: 'だれから じゃ？', en: 'From whom?' }, frame: 'わたしは キクさん＿ だんごを もらいました。', answer: 'に', wrong: ['を', 'で'], items: [g('ni-morau')], rule: 'With もらう the giver takes に (or から).' },
  { situation: 'Nurarihyon LENT you his umbrella.', arrow: '🧓 ☂️ → 🙋', say: { jp: 'かさを かして やったろう。', en: 'I lent you my umbrella.' }, frame: 'ぬらりひょんは わたしに かさを ＿。', answer: 'かしました', wrong: ['かりました', 'あげました'], items: [w('kasu')], rule: 'Lending is かす; borrowing is かりる.' },
  { situation: 'YOU BORROWED a book from a friend.', arrow: '🧑 📖 → 🙋', say: { jp: 'その ほんは だれの じゃ？', en: 'Whose book is that?' }, frame: 'わたしは ともだちに ほんを ＿。', answer: 'かりました', wrong: ['かしました', 'あげました'], items: [w('kariru')], rule: 'Borrowing is かりる; the lender takes に.' },
  { situation: 'Nurarihyon wants your fan. Which particle?', arrow: '🧓 💭 🪭', say: { jp: 'その せんす、よこせ！', en: 'Give me that fan!' }, frame: 'わしは その せんす＿ ほしい！', answer: 'が', wrong: ['を', 'に'], items: [w('hoshii'), g('ga-hoshii')], rule: 'The thing you want takes が: せんすが ほしい.' },
  { situation: 'He is bad at bowing. Which particle?', arrow: '🧓 🙇 ✗', say: { jp: 'おじぎなど しらん。', en: 'Bowing? Never learned.' }, frame: 'ぬらりひょんは おじぎ＿ へたです。', answer: 'が', wrong: ['を', 'で'], items: [w('heta'), g('ga-suki')], rule: 'Skill words (じょうず, へた) take が.' },
  { situation: 'To reach the keep: straight on, then left at the corner. Which particle for the corner?', arrow: '⬆️ ↰', say: { jp: 'わしの へやへは こられまい。', en: 'You’ll never find my room.' }, frame: 'まっすぐ いって、かど＿ ひだりに まがります。', answer: 'を', wrong: ['で', 'が'], items: [w('kado'), g('wo-ni-magaru')], rule: 'The corner you go round takes を; the direction takes に.' },
]

export const PHASES = [PHASE_1, PHASE_2, PHASE_3]
