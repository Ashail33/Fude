# Region packs

The journey runs through ten regions. The original five live in the core
files (`src/data`, `src/world/maps`, `src/story/tales`, …). The five newer
ones, which sit between the Shrine and the Tower, are **region packs**.
Each pack is one folder, `src/regions/rN/`, and the core registries merge
it in, so a region can be written without touching anything else.

## The road

| Order | id | Region | Main map | Teaches |
|---|---|---|---|---|
| 1 | 1 | The Village of First Words (はじまりの村) | `village` | hiragana, first words, 〜をください |
| 2 | 2 | The Elemental Fields (元素の野) | `fields` | katakana, kanji roots, radicals |
| 3 | 3 | The Forest of Sentences (文の森) | `forest` | verbs (〜ます), particles, word order |
| 4 | 4 | The Shrine of Reading (読みの社) | `shrine` | い/な-adjectives, reading, listening |
| 5 | **6** | The Harbour of Numbers (数の港) | `harbour` | numbers, counters, time, days, prices |
| 6 | **7** | The Hot-Spring Hollow (湯の里) | `onsen` | past tense, て-form, 〜ている, permission |
| 7 | **8** | The Castle Town (城下町) | `castletown` | polite everyday talk: directions, shopping, likes and wants, giving and receiving, keigo basics |
| 8 | **9** | The Snowbound Temple (雪の寺) | `snowtemple` | about 60 more kanji, with on/kun readings and compounds |
| 9 | **10** | The Cloud Capital (雲の都) | `clouds` | N4 grammar: plain form, comparisons, potential, conditionals, reasons, 〜と思う, 〜つもり |
| 10 | 5 | The Tower of Creation (創造の塔) | `tower` | casting sentences, free expression; the finale |

A region's **id is stable**: saves, activity ids and story flags all key on
it. Its **place on the road** comes from `data/journey.ts`, built from
`PACK_REGIONS` in `regions/ids.ts`. Never compare region ids with `<`. Use
`regionRank`, `atOrBefore`, `prevRegion` and `nextRegion`.

A pack is in the game once its `data.ts` exports a non-null `DATA`.

## Files

Each file has a fixed export. Keep these imports light so nothing forms a
cycle: "types only" means `import type`, plus other files in the pack.

| File | Exports | May import |
|---|---|---|
| `data.ts` | `DATA: RegionData` (the region, words, grammar, sentences, runes, kanji, readings, NPCs, dialogue scenarios) | types only |
| `activities.ts` | `ACTIVITIES: Activity[]` | `data/journey`, `data/vocab`, `./data` |
| `maps.ts` | `MAPS: MapSpec[]` | types only |
| `story.ts` | `CONTENT: TaleContent[]` (main-road tales and folklore) | anything a tale needs (see `src/story/tales/*`) |
| `scenes.ts` | `SCENES: RegionScenes` (cutscenes, memory pages, speakers) | types only |
| `palace.ts` | `ROOM: Locus[]` (memory-palace room) | types only |
| `battle.ts` | `BATTLE: RegionBattle` (encounter pool, monster stats) | types only |
| `sprites.ts` | `SPRITES: RegionSprites` (pixel art for the pack's characters and monsters) | types only |
| `art.ts` | `ART: RegionArt` (HD asset prompts, portrait mapping, motion, voices) | `art/hd/cast`, `anim/profileKit`, types |
| `Boss.tsx` | default export: the boss fight component | anything (see `src/games/bosses/*`) |

Names that the core game needs to know ahead of time are declared in
`regions/ids.ts`:

- character and monster sprite ids
- cutscene speaker ids
- boss game ids
- music tracks
- cutscene backdrops

Use exactly the ones listed for your region.

## What a region needs

These are the minimums. More is welcome where it serves the learner.

- **Words.** At least 60 (`DATA.words`), taught in four lessons of 15. Ids
  must be unique across the whole game, so check `VOCAB` first. Don't
  re-teach a word that already exists: use it instead.
- **Grammar points.** At least 10 (`DATA.grammar`). Each has an example
  sentence.
- **Forge sentences.** At least 10. Every kanji tile needs a reading:
  either it is a word's written form or masu form, or you add it to
  `DATA.readings`.
- **Rune tablets.** At least 6 short reading-comprehension lines, each with
  two plausible wrong answers.
- **Dialogue scenario.** At least one, plus its NPC (`DATA.npcs`,
  `DATA.scenarios`); see `data/npcs.ts`.
- **Stages.** At least 12 activities: learn, then practice, then challenge,
  then exactly one `boss` (your boss game id), then at least one
  `mastery`. Ids are `rN-…`. Mix the games (lesson, arcana, dialogue,
  listening, forge, runes, crossword, spell-defense, speedcast, combat).
  **Each activity is hosted by exactly one entity on your maps.**
- **Maps.** A main map of at least 56×40 tiles, plus 3–4 side areas
  (interiors or outdoor areas such as caves, piers or gardens). Each should
  feel like its own place, with something to discover: secrets, chests,
  townsfolk with personality, landmarks tied to words (`word:`). The main
  map:
  - links to the previous region with `{ to: '@prev', point: 'east' }` and
    to the next with `{ to: '@next', point: 'west' }`;
  - defines the arrival points `west` (coming from the previous region) and
    `east` (coming from the next).

  Map tests check that every row is the same width, markers are unique,
  every entity and exit is reachable from the spawn, and arrival points are
  on open ground.
- **Cutscenes.**
  - `arrive-<main map>`, `pre-boss-rN` and `post-boss-rN`. The post-boss
    scene points the player on to the next region by name.
  - Two memory pages: a `core` page earned by beating the boss and a
    `bonus` page earned when two of the region's spirits have sealed. Their
    scene ids are `memory-rN-a` and `memory-rN-b`.
  - Speakers come from your ids in `PACK_SPEAKERS`.
  - Every line with kanji in `jp` needs a `kana` reading.
- **Story.** One or more main-road tales about the region's trouble, which
  lead to the boss. Plus **at least 3 folklore spirits (yokai)**, each with
  a tale that ends in `c.seal(id)` and teaches the region's language.
  Folklore entities are added with `TaleContent.entities` at free, walkable
  tiles.
- **Memory palace.** A room (`ROOM`) holding **every** word, grammar point
  and taught kanji of the region:
  - 2–9 memories per place, at least 6 places;
  - places are anchored to entities on your maps, in walking order;
  - each memory has a `story` (set at that place) and an `image` (no place
    named, lower case, 40 words at most);
  - each has a CAPS sound-alike hook and never contains the answer's own
    Japanese.

  See `data/palace/types.ts` and `r1.ts`–`r5.ts`.
- **Battles.** An encounter pool (3–4 monsters, mixing earlier ones with
  your new one) and stats for your new monsters (`BATTLE.enemies`).
- **Sprites.** Pixel art for your two characters (16×16, `CharDef`, see
  `art/sprites/characters.ts`) and two monsters (32×32, `EnemyDef`, see
  `art/sprites/enemies.ts`). The boss is one of the two monsters.
- **Art.** HD asset entries for:
  - a portrait for each new character (cut-out);
  - your monster and boss (cut-outs);
  - a portrait for each yokai (`yokai-<id>`);
  - a `battle-<main map>` backdrop (1920×1080) and an `arrive-<main map>`
    scene;
  - one scene per memory page (id = the scene id).

  Also give every HD figure a motion profile (`profiles`, use
  `anim/profileKit`), map sprites to portraits (`sprites`), bosses to boss
  art (`bosses`, keyed by boss game id and boss speaker id) and yokai
  entities to their portraits (`entities`). Give each new sprite a voice
  (`voices`). Don't generate images; the prompts are enough.
- **The boss.** A real fight using `BossArena` and `useBossBattle` (see
  `games/bosses/`), with two or three phases and its own twist. It tests
  the region's language.

## Language and immersion

By the Harbour the player can read hiragana and katakana and knows about
150 words, the main particles, 〜ます/〜ません and い/な adjectives. Write
Japanese lines in kana with the kanji the player has met, and always give
English. Later regions lean more Japanese-first.

Fude speaks in simple Japanese with a gloss. Townsfolk speak naturally for
their level.

## The story so far

- **The Void Dragon** is the *nameless quiet*: the silence between words.
  Kotone never named it, and alone and hungry it became a dragon.
- **Kotone** was a girl from long ago. She found the broken brush Fude,
  named everything in the land, and befriended the hundred spirits. Out of
  ink, she sealed the dragon by writing with her own name, so everyone
  forgot her.
- **The memory pages** reveal this bit by bit. The new regions' pages are
  Kotone's travels with Fude, remembered by each land's spirits. Each one
  explores naming an *in-between* thing:
  - the harbour: dusk, the hour between day and night;
  - steam;
  - the pause before a polite reply (間);
  - the hush of falling snow;
  - the quiet before thunder.

  Together they lead to the name she finally chooses for the quiet,
  "Shizuka" (memory X, at the Tower).
- **The player** is the one who can see words glowing: "the next line"
  of Kotone's story.

Each region's trouble is the dragon's hunger eating the land's words in
that region's way. For example, the Umibōzu swallowed the harbour's
numbers.

## Checks

Run all three and make sure each passes:

```
npx tsc -b
npx vitest run
npx oxlint
```

Only edit files inside your own `src/regions/rN/`. If the core game needs
a change, describe it in `src/regions/rN/NOTES.md`.
