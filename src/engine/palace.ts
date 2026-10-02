/**
 * Memory palace logic: which memories the player has placed (met), which
 * are fading (due for review), and recall questions for a place.
 *
 * A memory is placed the moment its item is first learned anywhere in the
 * game, so the palace fills up as you play. Grammar points are placed when
 * their region's lessons begin. A memory fades as its spaced-repetition
 * strength drops; fading places glow in the world to call you back.
 *
 * The palace is personal. Every item has an authored home with a picture
 * story, but the place you actually met it (the teacher whose lesson taught
 * it, the lantern you lit by casting it) is a stronger memory than any
 * picture, so once that happens the item moves there. Places only you have
 * used join the route next to the nearest authored place.
 */
import { activitiesFor } from '../data/regions'
import { GRAMMAR_BY_ID } from '../data/grammar'
import { LOCI, type Locus, type Memory } from '../data/palace'
import { shuffle } from './random'
import { describeItem, type ItemInfo } from './items'
import { strength } from './srs'
import { getMap } from '../world/maps'
import { isPassed, type Episode, type PlayerState } from './store'

export { LOCI }
export type { Locus, Memory }

/** A place in the player's own palace: an authored place, or one they made by playing. */
export type Place = Locus & { personal?: boolean }

export const LOCUS_BY_ITEM = new Map(LOCI.flatMap((l) => l.memories.map((m) => [m.item, l] as const)))
export const MEMORY_BY_ITEM = new Map(LOCI.flatMap((l) => l.memories.map((m) => [m.item, m] as const)))
export const ROOMS = [1, 2, 3, 4, 5]

/** The authored route of a room (before the player's own places join it). */
export function roomLoci(room: number): Locus[] {
  return LOCI.filter((l) => l.room === room)
}

const SPRITE_EMOJI: Record<string, string> = { cat: '🐈', dog: '🐕', fox: '🦊', kitsune: '🦊', tanuki: '🦝', wisp: '👻', elder: '👴', child: '🧒', merchant: '🛍️', guard: '💂', priest: '⛩️', king: '👑', innkeeper: '🏮', golem: '🗿', tengu: '👺', kappa: '🐢', treant: '🌳', oni: '👹', jailer: '🗝️' }
const TILE_EMOJI: Record<string, string> = { lantern: '🏮', well: '🪣', sign: '🪧', statue: '🗿', chest: '🧰', torii: '⛩️', 'shrine-bell': '🔔', bush: '🌿', rock: '🪨', boulder: '🪨', tablet: '📜', campfire: '🔥', altar: '🕯️', sakura: '🌸', tree: '🌳', barrel: '🛢️', bamboo: '🎋', noren: '🏠' }

function entityOf(map: string, anchor: string) {
  return getMap(map)?.entitySpecs.find((e) => e.id === anchor)
}

/** The first moment that ties an item to a place (where it lives for this player). */
export function homeEpisode(s: PlayerState, itemId: string): Episode | undefined {
  return s.episodes?.[itemId]?.find((e) => !!entityOf(e.map, e.anchor))
}

const cache = new WeakMap<PlayerState, Place[]>()

/** The player's palace: authored places plus their own, items moved to where they met them. */
export function palaceOf(s: PlayerState): Place[] {
  const hit = cache.get(s)
  if (hit) return hit
  const places = new Map<string, Place>(LOCI.map((l) => [`${l.map}:${l.anchor}`, { ...l, memories: [] }]))
  const own: Place[] = []
  for (const l of LOCI)
    for (const m of l.memories) {
      const ep = homeEpisode(s, m.item)
      const key = ep ? `${ep.map}:${ep.anchor}` : `${l.map}:${l.anchor}`
      let place = places.get(key)
      if (!place && ep) {
        const spec = entityOf(ep.map, ep.anchor)!
        place = {
          id: `me-${key}`,
          room: getMap(ep.map)?.spec.region ?? l.room,
          map: ep.map,
          anchor: ep.anchor,
          name: spec.name ?? { jp: 'ここ', en: 'This spot' },
          emoji: SPRITE_EMOJI[spec.sprite ?? ''] ?? TILE_EMOJI[spec.tile ?? ''] ?? '📍',
          memories: [],
          personal: true,
        }
        places.set(key, place)
        own.push(place)
      }
      place!.memories.push(m)
    }
  // the player's own places join the route right after the nearest authored place on their map
  const route = LOCI.map((l) => places.get(`${l.map}:${l.anchor}`)!)
  for (const p of own) {
    const at = entityOf(p.map, p.anchor)!
    let best = -1
    let bestD = Infinity
    route.forEach((r, i) => {
      if (r.personal || r.map !== p.map) return
      const e = entityOf(r.map, r.anchor)
      const d = e ? Math.abs(e.x - at.x) + Math.abs(e.y - at.y) : Infinity
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    if (best < 0) best = route.reduce((last, r, i) => (r.room === p.room ? i : last), route.length - 1)
    route.splice(best + 1, 0, p)
  }
  cache.set(s, route)
  return route
}

/** One room of the player's palace, in route order. */
export function roomOf(s: PlayerState, room: number): Place[] {
  return palaceOf(s).filter((l) => l.room === room)
}

/** The place at a map entity, if it holds anything for this player. */
export function placeAt(s: PlayerState, map: string, anchor: string): Place | undefined {
  return palaceOf(s).find((l) => l.map === map && l.anchor === anchor)
}

/** Where an item lives for this player. */
export function homeOf(s: PlayerState, itemId: string): Place | undefined {
  return palaceOf(s).find((l) => l.memories.some((m) => m.item === itemId))
}

/** “You learned this here — First Words I.” (null when the item still lives at its authored place). */
export function episodeCue(s: PlayerState, itemId: string): string | null {
  const ep = homeEpisode(s, itemId)
  if (!ep) return null
  const last = s.episodes?.[itemId]?.at(-1)
  const first = ep.how === 'learned' ? `You learned this here${ep.what ? `: ${ep.what}` : ''}.` : ep.how === 'cast' ? 'You first used this word here.' : 'You anchored this here.'
  if (!last || last === ep) return first
  const place = entityOf(last.map, last.anchor)?.name?.en
  return place ? `${first} Last used at the ${place}.` : first
}

/** Has the player met this item yet? */
export function placed(s: PlayerState, m: Memory): boolean {
  const card = s.srs[m.item]
  if (card && card.seen > 0) return true
  if (m.item.startsWith('g:')) {
    const g = GRAMMAR_BY_ID.get(m.item.slice(2))
    return !!g && activitiesFor(g.region).some((a) => isPassed(s, a.id))
  }
  return false
}

/** Placed, reviewed before, and slipping: worth a visit. */
export function fading(s: PlayerState, m: Memory, now = Date.now()): boolean {
  const card = s.srs[m.item]
  return placed(s, m) && !!card && card.seen > 0 && strength(card, now) < 0.5
}

export function placedIn(s: PlayerState, l: Locus): Memory[] {
  return l.memories.filter((m) => placed(s, m))
}

export function fadingIn(s: PlayerState, l: Locus, now = Date.now()): Memory[] {
  return l.memories.filter((m) => fading(s, m, now))
}

/** Places on a map whose memories are fading (they glow in the world). */
export function fadingAnchors(s: PlayerState, mapId: string): Set<string> {
  const now = Date.now()
  return new Set(palaceOf(s).filter((l) => l.map === mapId && l.memories.some((m) => fading(s, m, now))).map((l) => l.anchor))
}

export function info(m: Memory): ItemInfo | undefined {
  return describeItem(m.item)
}

// ─── Retelling a picture wherever the item lives ──────────────────────────

const PEOPLE = new Set(['mage', 'merchant', 'guard', 'priest', 'king', 'elder', 'innkeeper', 'jailer', 'villager-a', 'villager-b', 'child'])
const ANIMALS = new Set(['cat', 'dog', 'fox', 'kitsune', 'tanuki', 'kappa'])
const TITLES = /^(teacher|grandma|grandpa|granny|old|captain|king|princess|lady|sir|guard|sage|priestess)\b/i
const GENERIC = /\b(innkeeper|villager|child|oni|golem|scribe|monk|hermit|tinker|nanny|page|fisherman|woodcutter|gatherer|racer|sage|farmhand|traveller|wanderer|teacher|captain|smith|miko|seller|cook|guard|keeper|merchant|farmer|priest|pilgrim|maid|wizard|baker|jailer|kid|cat|dog|fox|tanuki|crane|well|lantern|stone|tree|bell|sign|statue|chest|spot|box|pond|tablet|rock|boulder|bush|oven|altar|lectern|figure|apprentice|student|traveller|spirit|knight|elder|bamboo|hearth|portrait|room|garden|anvil|stair|signpost|gate|shrine|ring|cauldron|circle|sundial|loom|fence)\b/i

type Setting = 'person' | 'animal' | 'spirit' | 'flame' | 'well' | 'sign' | 'statue' | 'box' | 'gate' | 'bell' | 'plant' | 'rock' | 'altar' | 'other'

function settingOf(spec: { kind?: string; sprite?: string; tile?: string }): Setting {
  const sp = spec.sprite ?? ''
  if (sp) return PEOPLE.has(sp) ? 'person' : ANIMALS.has(sp) ? 'animal' : 'spirit'
  const t = spec.tile ?? ''
  if (/lantern|campfire|hearth|torch/.test(t)) return 'flame'
  if (/well/.test(t)) return 'well'
  if (/sign|tablet/.test(t)) return 'sign'
  if (/statue/.test(t)) return 'statue'
  if (/chest|barrel|crate|pot/.test(t)) return 'box'
  if (/torii|noren|door|gate/.test(t)) return 'gate'
  if (/bell/.test(t)) return 'bell'
  if (/tree|sakura|bamboo|bush|pine/.test(t)) return 'plant'
  if (/rock|boulder|stone/.test(t)) return 'rock'
  if (/altar|lectern/.test(t)) return 'altar'
  return 'other'
}

/** “the Festival Lantern” / “Teacher Hana”. */
function called(name: string): string {
  if (/^the /i.test(name)) return `the ${name.slice(4)}`
  const proper = / the /i.test(name) || /-/.test(name) || TITLES.test(name) || !GENERIC.test(name)
  return proper ? name : `the ${name}`
}

const FRAMES: Record<Setting, string[]> = {
  person: ['Right in front of {the}, {image}. {The} {react}.', 'As you talk with {the}, {image}. {The} {react}.'],
  animal: ['{The} pricks up its ears: {image}. {The} {pounce}.', 'Right under the nose of {the}, {image}. {The} {pounce}.'],
  spirit: ['Around {the}, the air shimmers and {image}. {The} {glow}.', 'Beside {the}, {image}. {The} {glow}.'],
  flame: ['In the warm glow of {the}, {image}, and the flame flares with every sound.', 'Shadows leap around {the} as {image}.'],
  well: ['Up out of {the} it rises: {image}, the echo booming down the shaft.'],
  sign: ['Painted across {the}, the picture comes alive: {image}.', 'You read {the} and the words peel off into a scene: {image}.'],
  statue: ['{The} creaks awake to watch: {image}.'],
  box: ['The lid of {the} flips open and {image}.'],
  gate: ['Through {the} it comes: {image}.'],
  bell: ['{The} rings once, and {image}.'],
  plant: ['Leaves rain down from {the} as {image}.', 'Hanging from {the}, {image}.'],
  rock: ['Perched on top of {the}, {image}.'],
  altar: ['On {the}, candles flicker as {image}.'],
  other: ['Right by {the}, {image}.'],
}
const REACT = ['jumps back with a yelp', 'bursts out laughing and claps', 'drops everything to stare', 'points and shouts for you to look', 'nods slowly, as if this happens every day']
const POUNCE = ['pounces at it', 'chases it in circles', 'hides, then peeks back out', 'sniffs at it suspiciously']
const GLOW = ['flickers with delight', 'hums along', 'spins in a slow circle', 'glows twice as bright']

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Retell a memory's picture at any place in the world. */
export function retell(m: Memory, place: { map: string; anchor: string; name: { en: string } }): string {
  const spec = entityOf(place.map, place.anchor)
  const img = (m.image ?? m.story).trim().replace(/[.!]+$/, '')
  const frames = FRAMES[spec ? settingOf(spec) : 'other']
  const h = hash(m.item + place.anchor)
  const the = called(place.name.en)
  return frames[h % frames.length]
    .replace(/\{The\}/g, cap(the))
    .replace(/\{the\}/g, the)
    .replace('{image}', img)
    .replace('{react}', REACT[h % REACT.length])
    .replace('{pounce}', POUNCE[h % POUNCE.length])
    .replace('{glow}', GLOW[h % GLOW.length])
}

/** The picture as this player should see it: the authored story at home, retold anywhere else. */
export function storyOf(s: PlayerState, m: Memory): string {
  const home = homeOf(s, m.item)
  if (!home || !retellNeeded(s, m)) return m.story
  // a story Claude wrote for this very place, if there is one (engine/palaceAI)
  return s.palaceStories?.[`${m.item}@${home.map}:${home.anchor}`] ?? retell(m, home)
}

/** Has the item moved away from the place its hand-written story is set in? */
export function retellNeeded(s: PlayerState, m: Memory): boolean {
  const home = homeOf(s, m.item)
  const authored = LOCUS_BY_ITEM.get(m.item)
  return !!home && !!authored && (home.map !== authored.map || home.anchor !== authored.anchor)
}

/** Hide the item's own writing (and reading) inside a cue, just in case. */
export function cueOf(s: PlayerState, m: Memory): string {
  const i = info(m)
  let out = storyOf(s, m)
  for (const t of [i?.front, i?.reading].filter((x): x is string => !!x && /[^\x00-\x7f]/.test(x))) out = out.split(t).join('？')
  return out
}

export interface RecallQ {
  memory: Memory
  answer: ItemInfo
  options: ItemInfo[]
}

/** A 4-option question: the item and three of the same kind from the palace. */
export function recallQuestion(s: PlayerState, m: Memory): RecallQ | null {
  const answer = info(m)
  if (!answer) return null
  const prefix = m.item.split(':')[0]
  const pool = LOCI.flatMap((l) => l.memories).filter((x) => x.item !== m.item && x.item.startsWith(`${prefix}:`))
  // prefer things the player has met: wrong options they might confuse
  const met = shuffle(pool.filter((x) => placed(s, x)))
  const rest = shuffle(pool.filter((x) => !placed(s, x)))
  const seen = new Set([answer.front])
  const options: ItemInfo[] = [answer]
  for (const x of [...met, ...rest]) {
    const d = info(x)
    if (!d || seen.has(d.front)) continue
    seen.add(d.front)
    options.push(d)
    if (options.length === 4) break
  }
  return { memory: m, answer, options: shuffle(options) }
}

/** What a route walk should cover: placed memories in route order (fading ones always included). */
export function walkMemories(s: PlayerState, room: number, max = 24): { locus: Place; memories: Memory[] }[] {
  const now = Date.now()
  const stops = roomOf(s, room)
    .map((locus) => ({ locus, memories: placedIn(s, locus) }))
    .filter((x) => x.memories.length)
  const total = stops.reduce((n, x) => n + x.memories.length, 0)
  if (total <= max) return stops
  // too many for one walk: keep fading ones, then the weakest, but never break the route order
  const keep = new Set<string>()
  for (const x of stops) for (const m of x.memories) if (fading(s, m, now)) keep.add(m.item)
  const rest = stops
    .flatMap((x) => x.memories)
    .filter((m) => !keep.has(m.item))
    .sort((a, b) => strength(s.srs[a.item], now) - strength(s.srs[b.item], now))
  for (const m of rest) {
    if (keep.size >= max) break
    keep.add(m.item)
  }
  return stops.map((x) => ({ locus: x.locus, memories: x.memories.filter((m) => keep.has(m.item)) })).filter((x) => x.memories.length)
}
