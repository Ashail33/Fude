/**
 * Claude as the memory palace's storyteller. When an item moves to a place
 * the player made by playing, the template retelling (engine/palace) works
 * offline; with an API key in Settings, Claude writes a fresh image that
 * actually involves that place: the teacher, the lantern, the tanuki.
 *
 * Stories are written once per item and place, checked (no answer leaks,
 * the sound hook survives, sensible length) and kept in the save, so the
 * same place always tells the same story. Anything that fails a check is
 * dropped and the template version stays.
 */
import { describeItem } from './items'
import { requestText, EchoError } from './echoSoul'
import { getState, setState, type PlayerState } from './store'
import { getMap } from '../world/maps'
import { homeEpisode, MEMORY_BY_ITEM, palaceOf, retellNeeded, type Memory, type Place } from './palace'

export const STORY_SCHEMA = {
  type: 'object',
  properties: {
    stories: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, story: { type: 'string' } },
        required: ['id', 'story'],
        additionalProperties: false,
      },
    },
  },
  required: ['stories'],
  additionalProperties: false,
} as const

export const storyKey = (item: string, place: { map: string; anchor: string }) => `${item}@${place.map}:${place.anchor}`

/** Capitalised sound hooks in an image ("AH", "SACK", "NO-MOO"). */
export function hooksOf(text: string): string[] {
  return (text.match(/[A-Z][A-Z'’-]*[A-Z]/g) ?? []).filter((h) => h.length >= 2)
}

/** Is a story Claude wrote safe to show as a recall cue? */
export function validStory(story: string, m: Memory): boolean {
  const words = story.trim().split(/\s+/).length
  if (words < 12 || words > 70) return false
  const d = describeItem(m.item)
  for (const t of [d?.front, d?.reading].filter((x): x is string => !!x && /[^\x00-\x7f]/.test(x))) if (story.includes(t)) return false
  const hooks = hooksOf(m.image)
  return !hooks.length || hooks.some((h) => story.includes(h))
}

const KIND_OF: Record<string, string> = { mage: 'a young mage', merchant: 'a merchant', guard: 'a guard', priest: 'a shrine priest', king: 'the king', elder: 'an elderly villager', innkeeper: 'the innkeeper', jailer: 'a jailer', 'villager-a': 'a villager', 'villager-b': 'a villager', child: 'a child', cat: 'a cat', dog: 'a dog', fox: 'a fox', kitsune: 'a fox spirit', tanuki: 'a tanuki', kappa: 'a kappa (river imp)', wisp: 'a floating spirit', golem: 'a stone golem', treant: 'a walking tree spirit', tengu: 'a tengu', oni: 'an oni' }

/** A short description of a place for the prompt. */
export function placeBrief(place: Place): string {
  const map = getMap(place.map)
  const spec = map?.entitySpecs.find((e) => e.id === place.anchor)
  const what = spec?.sprite ? (KIND_OF[spec.sprite] ?? 'a character') : spec?.tile ? `a ${spec.tile.replace(/-/g, ' ')}` : 'a spot'
  const says = spec?.lines?.[0]?.en
  return `${place.name.en} (${what}) in ${map?.spec.name ?? 'the world'}${says ? `. It says: “${says}”` : ''}`
}

const SYSTEM = [
  'You write memory-palace images for a Japanese-learning adventure game. Each image ties one Japanese item (a kana, a word or a grammar point) to a real place in the game world where this player met or used it, so that picturing the place brings the item back.',
  'For each job, retell the base image so it happens at the given place and involves it: the person, creature or object there takes part, it does not just stand nearby.',
  'Keep from the base image: its sound hook in CAPS, spelled exactly the same; the shape cue for kana and kanji; the meaning for words and grammar (for grammar, what the form does).',
  'Make it vivid and concrete: one striking, slightly absurd moment with motion and at least one sense besides sight. Present tense, 20 to 45 words, one or two sentences. Vary the openings across jobs and never begin with "Right", "As you" or "At the".',
  'The image is shown as a recall cue with the answer hidden, so never write the item in Japanese characters or its kana reading, and avoid Japanese text altogether.',
  'If the player’s own moment is given (they learned it here, or used it here), you may weave it in lightly.',
].join('\n')

function moment(s: PlayerState, item: string): string | undefined {
  const ep = homeEpisode(s, item)
  if (!ep) return undefined
  return ep.how === 'learned' ? `learned it here${ep.what ? ` in the lesson “${ep.what}”` : ''}` : ep.how === 'cast' ? 'cast it here as word magic' : 'used it here to save a fading landmark'
}

export function buildStoryPrompt(s: PlayerState, place: Place, memories: Memory[]): string {
  // jobs are numbered: the item id itself would give the answer away
  const jobs = memories.map((m, i) => {
    const d = describeItem(m.item)
    return {
      id: String(i + 1),
      kind: d?.kind ?? 'word',
      meaning: d?.kind === 'kana' ? `the sound “${d.reading}”` : d?.meaning,
      base_image: m.image,
      players_moment: moment(s, m.item),
    }
  })
  return `Place: ${placeBrief(place)}\n\nJobs:\n${JSON.stringify(jobs, null, 1)}`
}

/** Pull the stories out of Claude's reply, keeping only the ones that pass the checks. */
export function parseStories(text: string, memories: Memory[]): Record<string, string> {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  let raw: unknown
  try {
    raw = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1))
  } catch {
    return {}
  }
  const out: Record<string, string> = {}
  const list = (raw as { stories?: { id?: unknown; story?: unknown }[] })?.stories ?? []
  for (const r of list) {
    const m = memories[Number(r.id) - 1]
    if (m && typeof r.story === 'string' && validStory(r.story, m)) out[m.item] = r.story.trim()
  }
  return out
}

// ─── Running it ───────────────────────────────────────────────────────────

const inFlight = new Set<string>()
/** After a key/model problem, stop asking for the rest of the session. */
let disabledFor = ''

export function aiStoriesOn(s: PlayerState): boolean {
  return !!s.settings.apiKey && s.settings.aiStories !== false && disabledFor !== s.settings.apiKey
}

/** Moved memories at a place that don't have a Claude-written story yet. */
export function storiesWanted(s: PlayerState, place: Place): Memory[] {
  return place.memories.filter((m) => retellNeeded(s, m) && !s.palaceStories?.[storyKey(m.item, place)] && !inFlight.has(storyKey(m.item, place)))
}

/** Ask Claude for one place's stories and keep the good ones. Resolves to how many were written. */
export async function writeStories(place: Place, memories: Memory[]): Promise<number> {
  const s = getState()
  if (!aiStoriesOn(s) || !memories.length) return 0
  const keys = memories.map((m) => storyKey(m.item, place))
  keys.forEach((k) => inFlight.add(k))
  try {
    const text = await requestText(
      { apiKey: s.settings.apiKey, model: s.settings.aiModel, system: SYSTEM, messages: [{ role: 'user', content: buildStoryPrompt(s, place, memories) }], schema: STORY_SCHEMA, effort: 'low' },
      { timeoutMs: 90000 },
    )
    const stories = parseStories(text, memories)
    const n = Object.keys(stories).length
    if (n)
      setState((st) => {
        const all = { ...(st.palaceStories ?? {}) }
        for (const [item, story] of Object.entries(stories)) all[storyKey(item, place)] = story
        return { ...st, palaceStories: all }
      })
    return n
  } catch (e) {
    if (e instanceof EchoError && ['auth', 'permission', 'model'].includes(e.kind)) disabledFor = s.settings.apiKey
    return 0
  } finally {
    keys.forEach((k) => inFlight.delete(k))
  }
}

/** Fill in missing stories for some places (a few at a time, in route order). */
export async function ensureStories(places: Place[], maxPlaces = 3): Promise<void> {
  const s = getState()
  if (!aiStoriesOn(s)) return
  const todo = places.map((p) => ({ p, ms: storiesWanted(s, p) })).filter((x) => x.ms.length)
  for (const { p, ms } of todo.slice(0, maxPlaces)) await writeStories(p, ms.slice(0, 8))
}

/** Places holding a given item (e.g. what a game just placed). */
export function placesOf(s: PlayerState, items: string[]): Place[] {
  const want = new Set(items.filter((i) => MEMORY_BY_ITEM.has(i)))
  return palaceOf(s).filter((p) => p.memories.some((m) => want.has(m.item)))
}
