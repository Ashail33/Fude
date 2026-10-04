# Region 12 notes (for the core)

## 1. The Sealed Road needs a gate for region 12 (important)

`activityUnlocked` keeps a boss locked until `wardOpen(s, 12)` is true. That
is only set by a `GATES` entry in `src/story/tales/road.ts`, and there is no
entry for region 12 yet.

**Stopgap in this pack:** when Kaede hands over the heart mask (main tale,
stage 2 → 3), `story.ts` calls `openWardIfUngated`. It sets
`wardFlag(12)` **only if `GATES` has no region-12 entry**, so the boss is
playable now. Once a real gate is added, the stopgap switches itself off.
You can delete it then, but you don't have to.

A suggested gate, in the style of the others (all ids exist):

```ts
// ── 12 · The Valley of Hearts ─────────────────────────────────────
{
  region: 12,
  boss: 'ks-hannya',
  activity: 'r12-boss',
  title: 'The Sealed Road: A Mask With No Face',
  jp: 'ふうじられた みち：かおの ない めん',
  summary: 'Hannya’s rage has frozen the kagura hall: no feeling can get through.',
  ward: [
    ['ぶたいが こおりで おおわれて いる… きもちが とどかない！', 'The stage is sealed in ice… no feeling can reach it!'],
    ['こおった きもちを とかすには、あたたかい ものが いるね。', 'To thaw frozen feelings, we need something warm.'],
    ['うりの おまもりと、あまいみずと、ちゃみせの おちゃ。それで「えがおの ちょうちん」が できる！', 'A melon charm, sweet water and teahouse tea: that makes a Smiling Lantern!'],
  ],
  parts: [
    {
      item: item('melon-charm', 'Melon Charm', 'うりの おまもり', 'おまもり', '🍈', 'Grandma Chiyo’s charm. Warm as a kept promise.'),
      from: 'kf-obaa',
      ready: tale('fk12-amanojaku'),
      give: [['あの 子が くれた ことばの おれいだよ。もって おいき。', 'A thank-you for the words that child gave me. Take it.']],
      hint: ['チヨおばあさんの いえの、はんたいの 子を たすけよう。', 'Help the backwards child at Grandma Chiyo’s farmhouse.'],
    },
    {
      item: item('sweet-water', 'Sweet Falls Water', 'あまいみず', 'みず', '🫗', 'Water from Yōrō Falls. It tastes of kindness.'),
      from: 'fk7-sanpei',
      ready: tale('fk7-yoro'),
      give: [['ようろうの たきの みずじゃ。こころが やわらかく なるぞ。', 'Water from Yōrō Falls. It softens the heart.']],
      hint: ['ゆのさとの サンペイさんの たきの はなしを おわらせよう。（ゆのさとに もどろう）', 'Finish Grandpa Sanpei’s waterfall tale (back at the Hot-Spring Hollow).'],
    },
    {
      item: item('teahouse-tea', 'Teahouse Tea', 'ちゃみせの おちゃ', 'おちゃ', '🍵', 'From Granny Tane’s teahouse in the hidden village.'),
      from: 'fh-tane',
      ready: teahouse,
      give: [['あったかい おちゃは、こおった こころも とかすよ。', 'Hot tea melts even a frozen heart.']],
      hint: ['かくれざとに ちゃみせを たてよう！（タネばあちゃん）', 'Build a teahouse in the hidden village (Granny Tane)!'],
    },
  ],
  gather: ['ちょうちんの ざいりょう：うりの おまもり（チヨおばあさん）・あまいみず（ゆのさとの サンペイ）・ちゃみせの おちゃ（タネばあちゃん）', 'Gather the lantern: a melon charm (Grandma Chiyo), sweet falls water (Sanpei, back at the Hot-Spring Hollow) and teahouse tea (Granny Tane)'],
  bring: ['ふたつ そろったら、かぐらでんの はんにゃへ', 'Take two of them to Hannya in the kagura hall'],
  key: item('smile-lantern', 'Smiling Lantern', 'えがおの ちょうちん', 'ちょうちん', '🏮', 'A paper lantern with a painted smile. Frozen faces thaw in its light.'),
  word: 'egao',
},
```

Check that `fh-tane` / `teahouse` isn't already used by a nearby gate in a
way you don't want, and that the `fk12-melon-charm` key item (given when the
Amanojaku tale ends) doesn't clash in tone with the road part. Rename either if
needed.

## 2. Small suggestions (nothing is broken without them)

- **A maple (momiji) tile.** The valley's red maples use the `sakura` tile
  under an orange autumn tint (`K` in the legend). A `momiji` tile (red and
  orange leaves) would make autumn maps read better.
- **Words from the Tower.** The Tower (region 5) still comes after this
  region, so 心 (`kokoro`) belongs to a later region. The pack writes こころ
  in kana in names (こころの谷, こころの めん) and doesn't teach or drill
  the word.
- **Hannya's voice.** Phase 3 of the boss speaks Hannya's lines with
  `speak(text, { force: true, speaker: 'hannya' })`, so the player hears the
  feeling in her voice even with voice-over off. If speech isn't available,
  the text is shown straight away, and there is always a "Show her words"
  button.

## 3. Test notes at the time of writing

Every `src/regions/r12` check passes (`npx tsc -b`, `npx vitest run`,
`npx oxlint src/regions/r12`). The remaining failures come from region 11,
which is still being built in parallel:

- `tsc`: `src/regions/r11/battle.ts` uses the element `'metal'`.
- `story/scenes.test.ts`: `arrive-ekimae#5` has kanji but no `kana`. This
  test stops at its first failure, so `r12/hannya.test.ts` repeats the same
  scene checks for this pack's scenes.
- `engine/audio/voices.test.ts`: `yamabiko` TTS pitch 1.925 > 1.9. This test
  also stops early, so `r12/hannya.test.ts` checks this pack's four voices.
