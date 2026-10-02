/**
 * Question generators for the Counting Umibōzu (pure; see ./Boss.tsx).
 *
 * Phase 1, Count the Catch: a pile of things → the number with the right
 * counter. Phase 2, the Hour and the Price: he booms a time or a price →
 * pick what you heard. Phase 3, Read the Tide: written numbers → their
 * reading, sound changes and all (三百 → さんびゃく, 六本 → ろっぽん).
 */
import { item } from '../../engine/items'
import { shuffle } from '../../engine/random'

export type CounterId = 'hiki' | 'hon' | 'mai' | 'nin' | 'ko' | 'tsu'

interface Counter {
  grammar: string
  kanji: string
  /** Readings for 1–6. */
  readings: string[]
  /** Plausible but wrong forms (sound-change slips) for 1–6, where there is one. */
  slips: Partial<Record<number, string>>
  things: [emoji: string, en: string][]
  /** Counters that are also correct for these things. */
  alsoOk?: CounterId[]
}

export const COUNTERS: Record<CounterId, Counter> = {
  hiki: { grammar: 'counter-hiki', kanji: '匹', readings: ['いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき'], slips: { 1: 'いちひき', 2: 'にびき', 3: 'さんぴき', 6: 'ろくひき' }, things: [['🐟', 'fish'], ['🦀', 'crabs'], ['🐙', 'octopuses'], ['🐈', 'cats']] },
  hon: { grammar: 'counter-hon', kanji: '本', readings: ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん'], slips: { 1: 'いちほん', 2: 'にぼん', 3: 'さんほん', 6: 'ろくほん' }, things: [['🍶', 'bottles'], ['🌂', 'umbrellas'], ['✏️', 'pencils'], ['🎣', 'fishing rods']] },
  mai: { grammar: 'counter-mai', kanji: '枚', readings: ['いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい'], slips: {}, things: [['🎫', 'tickets'], ['🍘', 'rice crackers'], ['📄', 'sheets of paper'], ['🍽️', 'plates']] },
  nin: { grammar: 'counter-nin', kanji: '人', readings: ['ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん', 'ろくにん'], slips: { 1: 'いちにん', 2: 'ににん', 4: 'よんにん' }, things: [['🧑', 'people'], ['🧒', 'children'], ['🧑‍🍳', 'cooks']] },
  ko: { grammar: 'counter-ko', kanji: '個', readings: ['いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ'], slips: { 1: 'いちこ', 3: 'さんご', 6: 'ろくこ' }, things: [['🍎', 'apples'], ['🥚', 'eggs'], ['🍊', 'oranges']], alsoOk: ['tsu'] },
  tsu: { grammar: 'counter-tsu', kanji: 'つ', readings: ['ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ'], slips: { 1: 'いちつ', 3: 'さんつ', 4: 'よんつ' }, things: [['🐚', 'shells'], ['📦', 'boxes'], ['🍙', 'rice balls']], alsoOk: ['ko'] },
}

export interface UmiQ {
  kind: 'count' | 'listen' | 'read'
  /** What is shown: emoji pile, or the written form. */
  shown: string
  /** Kana to speak (listen questions are spoken; others after answering). */
  say: string
  label: string
  options: string[]
  answer: string
  itemIds: string[]
  /** Short explanation after answering. */
  why: string
}

const pick = <T>(xs: readonly T[], rng: () => number) => xs[Math.floor(rng() * xs.length)]

/** Phase 1: count a pile of things with the right counter. */
export function countQuestion(rng: () => number = Math.random): UmiQ {
  const ids = Object.keys(COUNTERS) as CounterId[]
  const id = pick(ids, rng)
  const c = COUNTERS[id]
  const n = 1 + Math.floor(rng() * 6)
  const [emoji, en] = pick(c.things, rng)
  const answer = c.readings[n - 1]
  const ok = new Set<CounterId>([id, ...(c.alsoOk ?? [])])
  const wrongCounters = shuffle(ids.filter((x) => !ok.has(x)))
  const opts = new Set([answer])
  const slip = c.slips[n]
  if (slip) opts.add(slip)
  for (const w of wrongCounters) {
    if (opts.size >= 4) break
    opts.add(COUNTERS[w].readings[n - 1])
  }
  // a near miss in the number, same counter
  if (opts.size < 4) opts.add(c.readings[n === 6 ? 4 : n])
  return {
    kind: 'count',
    shown: Array(n).fill(emoji).join(''),
    say: answer,
    label: `How many ${en}? Count with the right counter.`,
    options: shuffle([...opts].slice(0, 4)),
    answer,
    itemIds: [item.grammar(c.grammar)],
    why: `${en[0].toUpperCase()}${en.slice(1)} are counted with ${c.kanji}: ${answer}.`,
  }
}

export const HOURS = ['', 'いちじ', 'にじ', 'さんじ', 'よじ', 'ごじ', 'ろくじ', 'しちじ', 'はちじ', 'くじ', 'じゅうじ', 'じゅういちじ', 'じゅうにじ']
export const HUNDREDS = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく']
export const THOUSANDS = ['', 'せん', 'にせん', 'さんぜん', 'よんせん', 'ごせん', 'ろくせん', 'ななせん', 'はっせん', 'きゅうせん']
const KANJI_DIGIT = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
/** Hours that sound alike to a new ear. */
const HOUR_TWINS: Record<number, number[]> = { 1: [7, 11], 4: [7, 9], 7: [1, 4], 9: [4, 10], 10: [9, 12], 11: [1, 7], 12: [2, 10] }

const clock = (h: number, half: boolean) => `${h}:${half ? '30' : '00'}`
const yen = (n: number) => `¥${n.toLocaleString('en-US')}`

/** Phase 2: hear a time or a price, pick it. */
export function listenQuestion(rng: () => number = Math.random): UmiQ {
  if (rng() < 0.5) {
    const h = 1 + Math.floor(rng() * 12)
    const half = rng() < 0.5
    const say = HOURS[h] + (half ? 'はん' : '')
    const answer = clock(h, half)
    const twins = HOUR_TWINS[h] ?? [h === 12 ? 1 : h + 1]
    const opts = new Set([answer, clock(h, !half), ...twins.map((t) => clock(t, half))])
    for (let k = 1; opts.size < 4; k++) opts.add(clock(((h + k * 5) % 12) + 1, half))
    return { kind: 'listen', shown: '🔊', say, label: 'The Umibōzu booms the hour. What time did he say?', options: shuffle([...opts].slice(0, 4)), answer, itemIds: [item.grammar(half ? 'ji-han' : 'nanji-desu-ka'), item.word('ji')], why: `${say} = ${answer}` }
  }
  const d = 1 + Math.floor(rng() * 9)
  const thousands = rng() < 0.4
  const value = d * (thousands ? 1000 : 100)
  const say = (thousands ? THOUSANDS[d] : HUNDREDS[d]) + 'えん'
  const answer = yen(value)
  const other = 1 + ((d + 2) % 9)
  const opts = new Set([answer, yen(thousands ? d * 100 : d * 1000), yen(d * 10), yen(other * (thousands ? 1000 : 100))])
  for (let k = 1; opts.size < 4; k++) opts.add(yen(((d + k) % 9 + 1) * (thousands ? 1000 : 100)))
  return { kind: 'listen', shown: '🔊', say, label: 'The Umibōzu names a price. How much did he say?', options: shuffle([...opts].slice(0, 4)), answer, itemIds: [item.grammar('big-numbers'), item.word(thousands ? 'sen-1000' : 'hyaku')], why: `${say} = ${answer}` }
}

/** Slips for written numbers: the forms a learner says before the sound changes stick. */
const HUNDRED_SLIPS: Record<number, string[]> = { 3: ['さんひゃく', 'さんぴゃく'], 6: ['ろくひゃく', 'ろくびゃく'], 8: ['はちひゃく', 'はちびゃく'] }
const THOUSAND_SLIPS: Record<number, string[]> = { 3: ['さんせん'], 8: ['はちせん', 'はっぜん'] }

/** Phase 3: read a written number (prices, times, counted things). */
export function readQuestion(rng: () => number = Math.random): UmiQ {
  const r = rng()
  if (r < 0.4) {
    const d = pick([3, 6, 8, 3, 6, 8, 1, 2, 4, 5, 7, 9], rng)
    const thousands = rng() < 0.4 && (d === 3 || d === 8 || rng() < 0.3)
    const shown = `${d === 1 ? '' : KANJI_DIGIT[d]}${thousands ? '千' : '百'}円`
    const answer = (thousands ? THOUSANDS[d] : HUNDREDS[d]) + 'えん'
    const slips = (thousands ? THOUSAND_SLIPS[d] : HUNDRED_SLIPS[d]) ?? []
    const opts = new Set([answer, ...slips.map((x) => x + 'えん')])
    opts.add((thousands ? HUNDREDS[d] : THOUSANDS[d]) + 'えん')
    for (let k = 1; opts.size < 4; k++) opts.add((thousands ? THOUSANDS : HUNDREDS)[((d + k) % 9) + 1] + 'えん')
    return { kind: 'read', shown, say: answer, label: 'Read the price on the tide-stone.', options: shuffle([...opts].slice(0, 4)), answer, itemIds: [item.grammar('big-numbers')], why: `${shown} = ${answer}` }
  }
  if (r < 0.7) {
    const h = pick([4, 7, 9, 4, 7, 9, 1, 2, 3, 5, 6, 8, 10], rng)
    const half = rng() < 0.5
    const shown = `${KANJI_DIGIT[h]}時${half ? '半' : ''}`
    const answer = HOURS[h] + (half ? 'はん' : '')
    const naive: Record<number, string> = { 4: 'よんじ', 7: 'ななじ', 9: 'きゅうじ' }
    const opts = new Set([answer])
    if (naive[h]) opts.add(naive[h] + (half ? 'はん' : ''))
    opts.add(HOURS[h] + (half ? '' : 'はん'))
    for (const t of HOUR_TWINS[h] ?? [h + 1]) opts.add(HOURS[t] + (half ? 'はん' : ''))
    for (let k = 1; opts.size < 4; k++) opts.add(HOURS[((h + k * 3) % 12) + 1] + (half ? 'はん' : ''))
    return { kind: 'read', shown, say: answer, label: 'Read the hour on the stopped clock.', options: shuffle([...opts].slice(0, 4)), answer, itemIds: [item.grammar('ji-han')], why: `${shown} = ${answer}${naive[h] ? ` (not ${naive[h]})` : ''}` }
  }
  const id = pick(['hiki', 'hon', 'nin', 'ko'] as CounterId[], rng)
  const c = COUNTERS[id]
  const n = pick([1, 3, 6, 1, 3, 6, 2, 4], rng)
  const shown = `${KANJI_DIGIT[n]}${c.kanji}`
  const answer = c.readings[n - 1]
  const opts = new Set([answer])
  if (c.slips[n]) opts.add(c.slips[n]!)
  for (const w of shuffle((['hiki', 'hon', 'mai', 'nin'] as CounterId[]).filter((x) => x !== id))) {
    if (opts.size >= 4) break
    opts.add(COUNTERS[w].readings[n - 1])
  }
  return { kind: 'read', shown, say: answer, label: 'Read the count chalked on the crate.', options: shuffle([...opts].slice(0, 4)), answer, itemIds: [item.grammar(c.grammar)], why: `${shown} = ${answer}` }
}
