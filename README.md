# 言葉の魔法 · Kotoba no Mahō: The Magic of Words

A Japanese-learning fantasy RPG for the web. Words are magic: learn them, and you can burn, flood, grow and shape the world.

**v2 is a 16-bit Japanese RPG.** You walk your mage (with Fude, a floating brush spirit) through five hand-built pixel-art regions, talk to townsfolk in Japanese, enter buildings to take on trials, open word-locked chests, and fight turn-based battles in the tall grass where every command (たたかう・まほう・どうぐ・にげる) is powered by Japanese. All art (tiles, characters, 16 folklore monsters) and all music (11 chiptune tracks in yo/in scales) are original and generated in code.

The player travels through five elemental regions, from **English → mixed → mostly Japanese → fully Japanese**. Each region follows **Learn → Practice → Challenge → Boss → Mastery**, so progress can't be brute-forced.

## Play it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (deployable to any static host, e.g. GitHub Pages)
npm test           # unit tests (vitest)
```

Everything runs in the browser. Progress is saved to `localStorage`, and you can export or import the save from Settings. No backend is needed.

## The world

| Region | Teaches | Games |
| --- | --- | --- |
| 🏘️ **The Village of First Words** (はじまりの村) | Hiragana, 30 core words, asking with ください | Word lessons, Arcana Drawing, Falling Spell Defense, Spot the Imposter, Listening, NPC merchant · **Boss: The Kana Oni** |
| 🌾 **The Elemental Fields** (元素の野) | Katakana, kanji roots, radical combinations | Kanji Evolution (木+木+木→森), Shape the Land world-building, katakana & kanji brushwork, Speed Casting · **Boss: The Radical Golem** |
| 🌲 **The Forest of Sentences** (文の森) | Verbs, particles は・が・を・に・で・へ・と・の, word order | Sentence Forge, Word Crossword (kana → kanji), Bridge Guard dialogue puzzle · **Boss: The Particle Guardian** |
| ⛩️ **The Shrine of Reading** (読みの社) | Adjectives, reading comprehension, listening | Rune Interpretation, Listening, Shrine Priest (Japanese-only dialogue) · **Boss: The Silent Librarian** |
| 🗼 **The Tower of Creation** (創造の塔) | Casting sentences, adjective conjugation, politeness | Spell Creation Combat (type or **speak** incantations like 火を使います), Audience with the King · **Bosses: The Shifting Chimera, The Void Dragon** |

### Mini-games
1. **Falling Spell Defense**: objects fall toward the village; cast the right word to destroy them. Three difficulties, up to typing kana with several blocks falling at once.
2. **Arcana Drawing**: trace or recall kana and kanji on a scroll. Every stroke is checked live for shape, direction and **stroke order**, using KanjiVG stroke data.
3. **Spot the Difference**: find the imposter among look-alikes (さ/き/ち, シ/ツ, ソ/ン, へ/ヘ, 土/士…).
4. **Magic Crafting**: fuse radicals into kanji (人+木→休, 日+月→明). Use elemental spells to build rivers, forests and hot springs on a map.
5. **Word Crossword**: generated from your own vocabulary; answers in kana, later in kanji.
6. **Sentence Forge**: hammer word tiles into sentences; particles are colour-coded.
7. **Rune Interpretation**: read ancient tablets and choose their meaning.
8. **Spell Creation Combat**: exploit enemy weaknesses by casting grammatical sentences, typed or spoken.
9. **Speed Spell Casting**: rapid-fire recognition with combos.
10. **Listening Challenge**: hear a word, pick the kanji.

Bosses are built around grammar concepts. The Particle Guardian only exposes weak points when the correct particle is used. The Shifting Chimera forces i-/na-adjective conjugation (熱い火, 大きくない火, 静かな風).

### Systems from the design spec
- **Adaptive learning**: every answer records correctness and response time into an SM-2-style spaced-repetition engine, which tracks mistake frequency, answer speed and recall strength. Games draw weak items more often.
- **Chronos Narrative**: three procedurally generated quests each day, written around your weakest words ("The baker's fire has been hidden in the forest!").
- **Ghost Recall**: words you haven't practised fade from the world. A 5-second recall re-stabilises them.
- **Mnemonic Bloom / emotional anchoring**: words used for a boss's killing blow are remembered. When they come up in review, the game replays an echo of that victory.
- **Echo-Soul Tavern**: free conversation with NPCs in Japanese. With an Anthropic API key (Settings, stored only in your browser), NPCs are powered by Claude with a comprehension filter: they don't understand English, slow down for broken Japanese, and remember politeness. Without a key, an offline rule-based NPC still works.
- **Voice-to-Magic**: speak spells into the microphone (Web Speech API, Chrome/Edge/Safari). Japanese text-to-speech plays throughout.
- **Immersion levels**: the UI shifts from English to Japanese as you level up (or pin a level in Settings).
- **Rewards**: XP, levels and titles, spirit shards, outfits, spell effects, streaks, and a daily rotation of featured games at ×1.5 XP.
- Designed for **10–15 minute sessions**, mobile-first, with keyboard shortcuts on desktop.

## Illustrated art (Higgsfield)
The game can show high-resolution illustrations on top of the pixel art: title key art, dialogue portraits, bosses and monsters, battle backgrounds and story scenes. `src/art/hd/manifest.ts` lists all 49 images with their prompts, sizes and filenames. Put raw images in `art-src/<category>/<id>.png` and run `npm run art:process`: it removes the flat green/magenta background, trims, converts to WebP in `public/art/hd/` and updates `available.json`. Missing images fall back to pixel art.

## Graphics
The overworld runs an HD-2D WebGL post-process (`src/fx/`): tilt-shift focus around the player, bloom, dynamic lantern/campfire/staff lights, per-region colour grading, light shafts and water glints. It steps down automatically on slow devices and can be set to High/Low/Off in Settings.

## Controls
Arrow keys / WASD to walk (hold X or Shift to run), Z / Enter / Space to talk or confirm, X / Esc to cancel, Esc for the menu. On phones: on-screen D-pad with A/B buttons, or tap anywhere to walk there.

## Project layout

```
src/
  data/       vocabulary (150 words), kana, kanji recipes, sentences, regions & activities, NPCs, stroke data
  engine/     srs, store (save state), quests, speech (TTS/recognition), sfx (WebAudio), stroke evaluation, crossword, dialogue, echoSoul
  games/      one component per mini-game + bosses/, all implementing GameProps → GameResult
  art/        original pixel art (tiles, characters, enemies, icons) authored as palette-indexed pixel maps
  world/      overworld engine, renderer, maps (5 regions + interiors), NPCs, dialogue
  battle/     turn-based random-encounter battles
  story/      cutscenes and the story script
  ui/         pause menu
  screens/    Title, Journal, Region, Play (game host + results), Grimoire, Tavern, Wardrobe, Settings
```

To add content, add words to `src/data/vocab.ts` and activities to `src/data/regions.ts`. Games read their parameters from the activity.

## Credits
Stroke order data: [KanjiVG](http://kanjivg.tagaini.net) by Ulrich Apel, CC BY-SA 3.0 (see `src/data/STROKES_LICENSE.md`).
