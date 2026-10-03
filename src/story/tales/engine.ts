/**
 * Runs the story content: tale stages and flags, key items, the script
 * context handed to talk/cast scripts, story markers for the map, and the
 * playful fallback when a word is cast at something that doesn't react.
 */
import { toHiragana } from 'wanakana'
import type { SpriteId } from '../../art'
import { ENTITY_HD } from '../../art/hd'
import { ITEM_BY_ID } from '../../battle/items'
import { VOCAB, type Word } from '../../data/vocab'
import { item as itemId } from '../../engine/items'
import { addItem, flagOf, recordEpisodes, getState, giveKeyItem, grantRewards, hasKeyItem, recordReviews, setFlag, takeKeyItem, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import type { Entity, Line } from '../../world/types'
import { pageUnlockedBySeal, sealCount, YOKAI, YOKAI_BY_ID } from '../chronicle'
import { CONTENT } from './content'
import type { CastScript, Ctx, KeyItem, Tale, TalkScript } from './types'

export const TALES: Tale[] = CONTENT.flatMap((c) => c.tales)
export const TALE_BY_ID = new Map(TALES.map((t) => [t.id, t]))
export const KEY_ITEMS: KeyItem[] = CONTENT.flatMap((c) => c.items)
export const KEY_ITEM_BY_ID = new Map(KEY_ITEMS.map((k) => [k.id, k]))
const TALK: Record<string, TalkScript> = Object.assign({}, ...CONTENT.map((c) => c.talk))
const WRAP: Record<string, NonNullable<(typeof CONTENT)[number]['wrapTalk']>[string]> = Object.assign({}, ...CONTENT.map((c) => c.wrapTalk ?? {}))
const CAST: Record<string, CastScript> = Object.assign({}, ...CONTENT.map((c) => c.cast))
const MAP_CAST: Record<string, CastScript> = Object.assign({}, ...CONTENT.map((c) => c.mapCast ?? {}))
const VISIBLE: Record<string, (s: PlayerState) => boolean> = Object.assign({}, ...CONTENT.map((c) => c.visible ?? {}))
const GHOST: Record<string, (s: PlayerState) => boolean> = Object.assign({}, ...CONTENT.map((c) => c.ghost ?? {}))
const MOVED: Record<string, (s: PlayerState) => { x: number; y: number } | null> = Object.assign({}, ...CONTENT.map((c) => c.moved ?? {}))

export const WORD_BY_KANA = new Map<string, Word>()
for (const w of VOCAB) {
  // keyed by hiragana: cast input is normalised to hiragana, so パン is found as ぱん
  const k = toHiragana(w.kana)
  if (!WORD_BY_KANA.has(k)) WORD_BY_KANA.set(k, w)
}

const taleKey = (id: string) => `tale.${id}`

/** -1 = not started; stages.length = finished. */
export function taleStage(s: PlayerState, id: string): number {
  const v = s.flags?.[taleKey(id)]
  return v === undefined ? -1 : v
}

export function taleDone(s: PlayerState, id: string): boolean {
  const t = TALE_BY_ID.get(id)
  return !!t && taleStage(s, id) >= t.stages.length
}

export function taleOffered(s: PlayerState, t: Tale): boolean {
  return taleStage(s, t.id) < 0 && (t.available ? t.available(s) : true)
}

export function talkScript(id: string): TalkScript | undefined {
  const base = TALK[id]
  const wrap = WRAP[id]
  return wrap ? (c) => wrap(c, base) : base
}
export function castScript(id: string): CastScript | undefined {
  return CAST[id]
}
export function mapCastScript(mapId: string): CastScript | undefined {
  return MAP_CAST[mapId]
}
export function entityVisible(s: PlayerState, id: string): boolean {
  const f = VISIBLE[id]
  return f ? f(s) : true
}
export function entityGhost(s: PlayerState, id: string): boolean {
  return GHOST[id]?.(s) ?? false
}
export function entityMoved(s: PlayerState, id: string): { x: number; y: number } | null {
  return MOVED[id]?.(s) ?? null
}

/** Story markers: givers of offered tales and the current targets of active ones. */
export function storyMarkers(s: PlayerState): Set<string> {
  const out = new Set<string>()
  for (const t of TALES) {
    const st = taleStage(s, t.id)
    if (st < 0) {
      if (t.giver && taleOffered(s, t)) out.add(t.giver)
    } else if (st < t.stages.length) for (const id of t.stages[st].target ?? []) out.add(id)
  }
  return out
}

/** Tales for the log: active first (main story first), then finished. */
export function taleLog(s: PlayerState): { tale: Tale; stage: number; done: boolean }[] {
  const rows = TALES.filter((t) => taleStage(s, t.id) >= 0).map((t) => ({ tale: t, stage: taleStage(s, t.id), done: taleDone(s, t.id) }))
  return rows.sort((a, b) => Number(a.done) - Number(b.done) || Number(!!b.tale.main) - Number(!!a.tale.main) || a.tale.region - b.tale.region)
}

/** Normalise typed input (romaji or kana) to hiragana. */
export function toKana(input: string): string {
  return toHiragana(input.trim().toLowerCase(), { passRomaji: false }).replace(/[\s。、！!？?ー〜~]/g, '')
}

export interface Hooks {
  sparkle: (e: Entity | null, kind: 'spark' | 'leaf' | 'dust' | 'ripple') => void
  sfx: (name: string) => void
  scene: (id: string) => void
  /** Open a route once the dialog closes (optional: tests and previews leave it out). */
  play?: (route: string) => void
  /** Current map id (where word magic happens, for the memory palace). */
  map?: () => string | undefined
}

/** Build the script context for an entity (or for casting into the open). */
export function makeCtx(e: Entity | null, hooks: Hooks): Ctx {
  const speaker = e?.spec.name
  const portrait = e?.spec.sprite as SpriteId | undefined
  const hd = e ? ENTITY_HD[e.spec.id] : undefined
  const say = (jp: string, en: string, who?: Line, pic?: SpriteId): Step => ({ kind: 'say', speaker: who ?? speaker, portrait: pic ?? (who ? undefined : portrait), line: { jp, en }, ...(hd && (!who || pic === portrait) ? { hd } : {}) })
  const narrate = (jp: string, en: string): Step => ({ kind: 'say', line: { jp, en }, voice: false })
  const c: Ctx = {
    s: getState,
    e,
    speaker,
    portrait,
    say,
    narrate,
    fude: (jp, en) => ({ kind: 'say', speaker: { jp: 'フデ', en: 'Fude' }, portrait: 'fude', line: { jp, en } }),
    stage: (id) => taleStage(getState(), id),
    done: (id) => taleDone(getState(), id),
    start(id) {
      const t = TALE_BY_ID.get(id)
      if (!t || taleStage(getState(), id) >= 0) return []
      setFlag(taleKey(id), 0)
      hooks.sfx('confirm')
      return [narrate(`📜 あたらしい ものがたり：『${t.jp}』`, `📜 New tale: “${t.title}”`), narrate(`▶ ${t.stages[0].jp}`, `▶ ${t.stages[0].en}`)]
    },
    advance(id, to) {
      const t = TALE_BY_ID.get(id)
      if (!t) return []
      const cur = taleStage(getState(), id)
      const next = to ?? cur + 1
      if (next <= cur) return []
      setFlag(taleKey(id), next)
      if (next >= t.stages.length) {
        hooks.sfx('levelUp')
        return [narrate(`✨ ものがたり かんりょう：『${t.jp}』`, `✨ Tale complete: “${t.title}”`)]
      }
      return [narrate(`▶ ${t.stages[next].jp}`, `▶ ${t.stages[next].en}`)]
    },
    flag: (k) => flagOf(getState(), k),
    set: (k, v = 1) => setFlag(k, v),
    has: (id) => hasKeyItem(getState(), id),
    give(id) {
      const k = KEY_ITEM_BY_ID.get(id)
      giveKeyItem(id)
      hooks.sfx('chest')
      return k ? [narrate(`${k.emoji} ${k.jp}（${k.kana}）を てに いれた！`, `${k.emoji} You got the ${k.name}!`)] : []
    },
    take: (id) => takeKeyItem(id),
    reward(xp, shards = 0) {
      grantRewards(xp, shards)
      return [narrate(`+${xp} EXP${shards ? ` ・ 💠${shards}` : ''}`, `+${xp} EXP${shards ? ` · ${shards} spirit shards` : ''}`)]
    },
    bagItem(id, n = 1) {
      addItem(id, n)
      const it = ITEM_BY_ID.get(id)
      return it ? [{ kind: 'say', portrait: it.icon, line: { jp: `${it.jp}（${it.kana}）を ${n}こ もらった！`, en: `You received ${n} × ${it.name}!` }, voice: false }] : []
    },
    learn(wordId) {
      recordReviews([{ itemId: itemId.word(wordId), correct: true }])
      // using a word on something in the world ties it to that place in the memory palace
      const map = hooks.map?.() ?? getState().world.map
      if (e && map) recordEpisodes([itemId.word(wordId)], { map, anchor: e.spec.id, how: 'cast' })
    },
    cast: (prompt, on) => ({ kind: 'cast', prompt, onCast: (kana) => on(kana) }),
    choice: (prompt, options, on) => ({ kind: 'choice', prompt, options: options.map(([id, jp, en]) => ({ id, label: { jp, en } })), onPick: on }),
    ask: (prompt, answer, on) => ({ kind: 'cast', prompt, plain: true, onCast: (kana) => on((Array.isArray(answer) ? answer : [answer]).some((a) => toKana(a) === kana)) }),
    sparkle: (kind = 'spark') => hooks.sparkle(e, kind),
    sfx: (name) => hooks.sfx(name),
    scene: (id) => hooks.scene(id),
    play: (route) => hooks.play?.(route),
    seal(id) {
      const y = YOKAI_BY_ID.get(id)
      if (!y || flagOf(getState(), `seal.${id}`) > 0) return []
      const before = getState()
      setFlag(`seal.${id}`, 1)
      const after = getState()
      hooks.sfx('levelUp')
      hooks.sparkle(e, 'spark')
      const n = sealCount(after)
      const out: Step[] = [
        narrate(`🖌️ ${y.kana}が「ひゃっきの まきもの」に はんこを おした！（${n}/${YOKAI.length}）`, `🖌️ ${y.name} signed your Spirit Scroll! (${n}/${YOKAI.length})`),
      ]
      // the spirit's own memories come first; Fude's plays when the talk ends
      const page = pageUnlockedBySeal(before, after)
      if (page) hooks.scene(page.scene)
      return out
    },
  }
  return c
}

const FIZZLE: Record<string, [string, string][]> = {
  fire: [['ちいさな ひのこが ぱちぱち はねて、きえた。', 'A few sparks crackle and wink out.']],
  water: [['つめたい しずくが ぽたぽた おちた。', 'Cool droplets patter down.']],
  wood: [['はっぱが ひらひら まいおちた。', 'A few leaves flutter down.']],
  wind: [['そよかぜが ふいて、かみが ゆれた。', 'A breeze ruffles your hair.']],
  light: [['ぽわっと あたたかい ひかりが ともった。', 'A warm little light glows, then fades.']],
  earth: [['じめんが すこし ごろっと ゆれた。', 'The ground rumbles, just a little.']],
  metal: [['チリン、と どこかで おとが した。', 'Somewhere, something goes “ting”.']],
}

/** A cast that nothing answers: playful, and it still counts as practice for known words. */
export function fizzle(c: Ctx, kana: string): Step[] {
  const w = WORD_BY_KANA.get(kana)
  if (!w) return [c.fude('…それは まだ まほうの ことばじゃ ないみたい。', '…That doesn’t seem to be a magic word — yet. Try one from your grimoire!')]
  c.learn(w.id)
  c.sparkle('spark')
  const el = FIZZLE[w.element ?? ''] ?? null
  const target = c.e?.spec.name
  const lines: Step[] = [c.narrate(`「${w.jp}」！ ${w.emoji}`, `“${w.kana}” — ${w.en}! ${w.emoji}`)]
  if (el) lines.push(c.narrate(el[0][0], el[0][1]))
  if (target) lines.push(c.narrate(`${target.jp}は なにも かわらない…`, `The ${target.en} doesn’t react… maybe another word?`))
  else lines.push(c.fude('ことばは きこえたよ。でも ここでは なにも おきないね。', 'The word rang out, but nothing here answers it.'))
  return lines
}
