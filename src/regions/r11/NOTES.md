# Region 11 notes (for the core)

## Done: the Sealed Road gate for region 11

Added to `src/story/tales/road.ts` (the third part is Hayato’s Bamboo Bridge at 40 pillars instead of the dojo echo). Original suggestion kept below for reference.

### The original note

`wardOpen(s, 11)` is only true once `road.ward.r11` is set or the boss is
beaten, and that flag is only ever set by a `GATES` entry in
`src/story/tales/road.ts`. Without one, **`r11-boss` can never be
unlocked** (and so the Tower can't be reached through region 11). The pack
doesn't set the flag itself, so the gate stays the core's call.

A suggested entry, in the house style (put it after region 10's gate):

```ts
// ── 11 · The Chattering Station Town ─────────────────────────────
{
  region: 11,
  boss: 'p-nopperabo',
  activity: 'r11-boss',
  title: 'The Sealed Road: A Lantern That Says Hello',
  jp: 'ふうじられた みち：あいさつの ちょうちん',
  summary: 'At the end of platform one, a smooth, blank stillness swallows every word before it is spoken.',
  ward: [
    ['…なにを 言っても、のっぺりと きえて しまう！', '…Whatever you say just smooths away into nothing!'],
    ['だれかに「おはよう」って 言える あかりが あれば…', 'If only we had a light that could say “good morning” to someone…'],
    ['わらの ひもと、うめの はなびらと、こだまの すみ。それで「あいさつの ちょうちん」が できる！', 'Sandal straw, a plum petal and echo ink: that makes a Greeting Lantern!'],
  ],
  parts: [
    {
      item: item('sandal-straw', 'Sandal Straw', 'ぞうりの わら', 'わら', '🪢', 'A twist of straw from a sandal that found its way home.'),
      from: 'e-grandma',
      ready: tale('fk11-bakezori'),
      give: [['ぞうりを つれて かえって くれた おれいだよ。この わら、ちょうちんの ひもに なさい。', 'Thanks for bringing my sandal home. Use this straw for your lantern’s cord.']],
      hint: ['ホームの まいごの ぞうりを、おうちに かえして あげよう。', 'Take the lost sandal on the platform home.'],
    },
    {
      item: item('plum-petal', 'Flying Plum Petal', 'とびうめの はなびら', 'はなびら', '🌸', 'A petal that still flies east on its own.'),
      from: 'fk10-plum',
      ready: tale('fk10-tobiume'),
      give: [['ひがしの 風に のせて、あなたの ことばも とどきますように。', 'May the east wind carry your words, too.']],
      hint: ['くもの みやこの そらの にわで、とびうめの うたを おもいだそう。（くもの みやこに もどろう）', 'Help Tobiume remember her poem, back in the Cloud Capital’s sky garden.'],
    },
    {
      item: item('echo-ink', 'Echo Ink', 'こだまの すみ', 'すみ', '🔁', 'Ink that repeats whatever is written with it, twice.'),
      from: 'vb-sumi',
      ready: dojo(5),
      give: [SUMI_GIVES, ['こだまの かげの すみじゃ。書いた ことばが、もう いちど ひびく。', 'Ink from the echoing shadow. Every word written with it rings out twice.']],
      hint: ['スミせんせいの まきもので、つぎの かげを たおそう！（むらの たけやぶ）', 'Defeat the next echo in Master Sumi’s scroll (the Village’s bamboo grove)!'],
    },
  ],
  gather: ['ちょうちんの ざいりょう：ぞうりの わら（アパートの フミさん）・とびうめの はなびら（くもの みやこ）・こだまの すみ（むらの スミせんせい）', 'Gather the lantern: sandal straw (Grandma Fumi, at the apartments), a plum petal (back in the Cloud Capital) and echo ink (Master Sumi, in the Village)'],
  bring: ['ふたつ そろったら、一ばんせんの のっぺらぼうへ', 'Take two of them to Nopperabō on platform one'],
  key: item('hello-lantern', 'Greeting Lantern', 'あいさつの ちょうちん', 'ちょうちん', '🏮', 'Hold it up and say hello: the light reaches even a face with no face.'),
  word: 'ohayou',
},
```

`dojo(5)` is the dojo's fifth and last echo (earlier gates use
1 to 4); swap in another side activity if that feels too steep here. The Tower's gate test in `road.test.ts` lists the
bosses beaten before the Tower; once regions 11 and 12 are live it may need
`'r11-boss'` (and `'r12-boss'`) added to that list.

## Small notes

- **Words from later regions.** The Tower (region 5) and the Valley of
  Hearts (region 12) come after this region, so their words (ありがとう and
  すみません aside, which already appear in dialogue everywhere) aren't used
  in this pack's word lists, sentences or boss lines. 心 appears only in kana
  (こころの たに). The feelings grammar (〜そう, 〜てほしい, 〜のに, みたい,
  気がする, the regret sense of 〜てしまう) is left to region 12; `chau` here
  teaches only the spoken contraction.
- **`atsui` was taken** (熱い, hot to the touch, region 4), so 暑い (hot
  weather) is `atsui-weather`. No other word of the list existed already.
- **Speech in the boss.** Nopperabō speaks with `speak(…, { force: true })`
  so the fight works with voice turned off in settings. If the device has
  no Japanese voice, or the player taps “Can’t hear? Show the words”, it
  falls back to showing the lines (the same rule as the Listening game).
  In phase 3 it borrows the `stationmaster`, `grocer` and `tanuki` voices.
- **Pon** uses the existing `tanuki` sprite (and voice) as a speaker and on
  the map; folklore spirits use `monkey` (Satori), `child`
  (Hitotsume-kozō) and `imp` (Bakezōri) on the map, with their own HD
  portraits mapped through `entities`.
