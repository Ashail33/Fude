import type { MapSpec } from '../types'
import { LAYOUTS } from './layouts'

/** Region 3 — 文の森: a deep forest cut by a river, a guarded bridge and a smithy. */
export const FOREST: MapSpec = {
  id: 'forest',
  name: 'The Forest of Sentences',
  jp: '文の森',
  region: 3,
  music: 'forest',
  particles: 'fireflies',
  tint: 'rgba(30, 90, 80, 0.16)',
  rows: LAYOUTS.forest,
  spawn: 'west',
  inn: 'west',
  points: {
    q: { name: 'west', dir: 'right' },
    v: { name: 'north', dir: 'down' },
  },
  exits: [
    { at: '9', to: 'fields', point: 'east' },
    { at: '0', to: 'shrine', point: 'south' },
  ],
  entities: [
    { at: '5', id: 'fo-hermit', kind: 'activity', sprite: 'elder', dir: 'down', activities: ['r3-words-1'], name: { jp: 'もりの せんにん', en: 'Forest Hermit' }, lines: [{ jp: 'たべる、のむ、みる… うごく ことばを おしえよう。', en: 'Eat, drink, see… I shall teach you words that move.' }] },
    { at: '1', id: 'fo-anvil', kind: 'activity', tile: 'anvil', activities: ['r3-forge-1'], name: { jp: 'ぶんの かなとこ', en: 'Sentence Anvil' }, lines: [{ jp: 'かなとこの 上で、ことばを うちあわせよう。', en: 'Hammer words together on the anvil.' }] },
    { at: '2', id: 'fo-smith', kind: 'activity', sprite: 'villager-a', dir: 'right', activities: ['r3-forge-2'], name: { jp: 'かじや', en: 'Blacksmith' }, lines: [{ jp: 'にせの タイルに きをつけろ！ ただしい ぶんだけ きたえるんだ。', en: 'Watch out for decoy tiles! Forge only true sentences.' }] },
    { at: '3', id: 'fo-guard', kind: 'activity', sprite: 'guard', dir: 'right', activities: ['r3-guard'], name: { jp: 'はしの ばんにん', en: 'Bridge Guard' }, lines: [{ jp: 'とまれ！ この はしを わたりたければ、にほんごで はなせ。', en: 'Halt! If you wish to cross this bridge, speak Japanese.' }] },
    { at: '4', id: 'fo-riddle', kind: 'activity', tile: 'boulder', activities: ['r3-cross-1'], name: { jp: 'なぞの いし', en: 'Riddle Stone' }, lines: [{ jp: 'いしに ますめが きざまれている…', en: 'A grid of squares is carved into the stone…' }] },
    { at: 'E', id: 'fo-stump', kind: 'activity', tile: 'stump', activities: ['r3-cross-2'], name: { jp: 'こずえの きりかぶ', en: 'Ancient Stump' }, lines: [{ jp: 'ねんりんに かんじが うかんでいる。', en: 'Kanji float in the tree rings.' }] },
    { at: 'U', id: 'fo-student', kind: 'activity', sprite: 'child', dir: 'down', wander: 1, activities: ['r3-words-2'], name: { jp: 'がくせい', en: 'Student' }, lines: [{ jp: 'ともだちと がっこうへ いくの。いっしょに おぼえよう！', en: 'I’m going to school with my friends. Let’s learn together!' }] },
    { at: '6', id: 'fo-treant', kind: 'boss', sprite: 'treant', activities: ['r3-boss'], name: { jp: 'じょしの しゅご', en: 'The Particle Guardian' }, lines: [{ jp: 'は？ が？ を？ ただしい じょしで なければ、ここは とおれぬ。', en: 'Wa? Ga? O? Only the right particle may pass.' }] },
    { at: '7', id: 'fo-trial', kind: 'activity', tile: 'statue', activities: ['r3-mastery'], name: { jp: 'しれんの いし', en: 'Trial Stone' }, lines: [{ jp: 'もりの しれん。とけいは まってくれない。', en: 'The forest trial. The clock waits for no one.' }] },
    { at: '8', id: 'fo-sign', kind: 'sign', tile: 'sign', name: { jp: 'かんばん', en: 'Sign' }, lines: [{ jp: 'きた：読みの社。じょしの しゅごが みちを まもっている。', en: 'North: the Shrine of Reading. The Particle Guardian bars the way.' }] },
    { at: '$', id: 'fo-chest-secret', kind: 'chest', tile: 'chest', chest: { item: 'smoke', n: 2, shards: 30 } },
    { at: '?', id: 'fo-chest-pond', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 15, lock: { answer: 'わたる', jp: '「はしを ＿＿」。こたえを となえよ。', en: '“Hashi o ___” (to cross the bridge). Chant the missing verb.' } } },
    { at: '(', id: 'fo-fox', kind: 'npc', sprite: 'fox', wander: 2, name: { jp: 'きつね', en: 'Fox' }, lines: [{ jp: 'コン… もりの きたに、ひみつの こみちが あるよ。', en: 'Kon… in the north of the forest there’s a secret trail.' }] },
    { at: ')', id: 'fo-gatherer', kind: 'npc', sprite: 'villager-b', wander: 2, name: { jp: 'きのこ とり', en: 'Mushroom Gatherer' }, lines: [{ jp: 'きのこを さがしています。どこに あるかな…', en: 'I’m looking for mushrooms. Where could they be…' }] },
    { at: '+', id: 'fo-woodcutter', kind: 'npc', sprite: 'villager-a', wander: 1, name: { jp: 'きこり', en: 'Woodcutter' }, lines: [{ jp: 'はしを わたると、じんじゃが あるよ。', en: 'Cross the bridge and you’ll find a shrine.' }] },
    { at: ']', id: 'fo-signpost', kind: 'landmark', tile: 'sign', word: 'hashi', name: { jp: 'みちしるべ', en: 'Signpost' }, lines: [{ jp: '→ 橋', en: '→ Bridge' }] },
    { at: '{', id: 'fo-spring', kind: 'landmark', tile: 'well', word: 'nomu', name: { jp: 'わきみず', en: 'Spring' }, lines: [{ jp: 'わきみずだ。のむと げんきが でる。', en: 'A spring. Drinking from it lifts your spirits.' }] },
  ],
}
