/**
 * Chronos Narrative: procedural daily quests built from the player's own
 * vocabulary, weighted toward their weakest words, plus the daily rotation
 * of featured mini-games.
 */
import { ACTIVITIES } from '../data/regions'
import { VOCAB, WORD_BY_ID, type Word } from '../data/vocab'
import type { Activity } from '../games/types'
import { item } from './items'
import { hashString, seeded, todayKey } from './random'
import { weakness } from './srs'
import { activityUnlocked, regionUnlocked, setState, type PlayerState, type Quest } from './store'

const PLACES = ['mori', 'yama', 'kawa', 'umi', 'ie', 'gakkou', 'mise', 'eki', 'jinja', 'tera', 'shiro', 'tou', 'hayashi', 'michi', 'hashi', 'izumi']
const PEOPLE = ['tomodachi', 'sensei', 'gakusei', 'ou', 'yuusha', 'ko', 'hito']
const CREATURES = ['inu', 'neko', 'tori', 'sakana', 'ryuu', 'oni']

interface Template {
  needs: ('thing' | 'place' | 'person' | 'creature')[]
  title: (w: Word[]) => string
  story: (w: Word[]) => string
  storyJp: (w: Word[]) => string
  game: Quest['game']
}

const TEMPLATES: Template[] = [
  {
    needs: ['thing', 'place'],
    title: ([t]) => `The Stolen ${cap(t.en)}`,
    story: ([t, p]) => `The baker's ${t.en} ${t.emoji} has been stolen and hidden in the ${p.en} ${p.emoji}! Blast through the falling words to recover it.`,
    storyJp: ([t, p]) => `${t.jp}が${p.jp}に隠されました！`,
    game: 'spell-defense',
  },
  {
    needs: ['person', 'place'],
    title: ([, p]) => `Escort to the ${cap(p.en)}`,
    story: ([person, p]) => `A villager needs to go to the ${p.en} ${p.emoji} with a ${person.en} ${person.emoji}. Words bar the road: cast them away at speed.`,
    storyJp: ([person, p]) => `${person.jp}と${p.jp}に行きたいです。`,
    game: 'speedcast',
  },
  {
    needs: ['creature', 'place'],
    title: ([c]) => `The Lost ${cap(c.en)}`,
    story: ([c, p]) => `A ${c.en} ${c.emoji} is lost somewhere near the ${p.en} ${p.emoji}. Listen carefully to the whispers to track it down.`,
    storyJp: ([c, p]) => `${c.jp}が${p.jp}で迷子になりました。`,
    game: 'listening',
  },
  {
    needs: ['thing'],
    title: ([t]) => `Storm of ${cap(t.en)}`,
    story: ([t]) => `A magical storm is raining ${t.en} ${t.emoji} on the village! Stop every falling word before it lands.`,
    storyJp: ([t]) => `${t.jp}のあらしだ！`,
    game: 'spell-defense',
  },
  {
    needs: ['place'],
    title: ([p]) => `Whispers of the ${cap(p.en)}`,
    story: ([p]) => `Faded words echo from the ${p.en} ${p.emoji}. Recall them before they vanish forever.`,
    storyJp: ([p]) => `${p.jp}からことばが聞こえます。`,
    game: 'lesson',
  },
]

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Words the player can be quizzed on: every word in unlocked regions. */
export function availableWords(s: PlayerState): Word[] {
  return VOCAB.filter((w) => regionUnlocked(s, w.region))
}

/** The player's weakest words (seen words first, by weakness score). */
export function weakestWords(s: PlayerState, n: number, pool = availableWords(s)): Word[] {
  const now = Date.now()
  const scored = pool.map((w) => {
    const card = s.srs[item.word(w.id)]
    // Seen words that are weak matter most; unseen words are a mild priority.
    const score = card && card.seen > 0 ? weakness(card, now) + 0.3 : 0.35
    return { w, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, n).map((x) => x.w)
}

export function generateQuests(s: PlayerState, day = todayKey()): Quest[] {
  const rng = seeded(hashString(day + s.createdAt))
  const pool = availableWords(s)
  const poolIds = new Set(pool.map((w) => w.id))
  const pickFrom = (ids: string[], avoid: Set<string>) => {
    const opts = ids.filter((id) => poolIds.has(id) && !avoid.has(id))
    const src = opts.length ? opts : ids.filter((id) => WORD_BY_ID.has(id) && !avoid.has(id))
    return WORD_BY_ID.get(src[Math.floor(rng() * src.length)])!
  }
  const weak = weakestWords(s, 12, pool)
  const things = pool.filter((w) => w.pos === 'noun' && !PLACES.includes(w.id) && !PEOPLE.includes(w.id)).map((w) => w.id)

  const quests: Quest[] = []
  const usedTemplates = new Set<number>()
  for (let q = 0; q < 3; q++) {
    let ti = Math.floor(rng() * TEMPLATES.length)
    while (usedTemplates.has(ti)) ti = (ti + 1) % TEMPLATES.length
    usedTemplates.add(ti)
    const t = TEMPLATES[ti]
    const used = new Set<string>()
    const slots = t.needs.map((need) => {
      const w =
        need === 'place' ? pickFrom(PLACES, used) : need === 'person' ? pickFrom(PEOPLE, used) : need === 'creature' ? pickFrom(CREATURES, used) : pickFrom(things, used)
      used.add(w.id)
      return w
    })
    // Four weak words per quest (rotating through the weak list) + the slot words.
    const drill = weak.slice((q * 4) % Math.max(1, weak.length), (q * 4) % Math.max(1, weak.length) + 4)
    const wordIds = [...new Set([...slots.map((w) => w.id), ...drill.map((w) => w.id)])]
    while (wordIds.length < 6) {
      const extra = pool[Math.floor(rng() * pool.length)]
      if (!wordIds.includes(extra.id)) wordIds.push(extra.id)
    }
    quests.push({
      id: `${day}-${q}`,
      title: t.title(slots),
      story: t.story(slots),
      storyJp: t.storyJp(slots),
      wordIds,
      game: t.game,
      xp: 40 + q * 10,
      done: false,
    })
  }
  return quests
}

/** Ensure today's quests exist; regenerate at the start of each day. */
export function ensureQuests(s: PlayerState): void {
  const day = todayKey()
  if (s.quests.day === day && s.quests.list.length) return
  const list = generateQuests(s, day)
  setState((st) => ({ ...st, quests: { day, list } }))
}

export function completeQuest(id: string) {
  setState((s) => ({ ...s, quests: { ...s.quests, list: s.quests.list.map((q) => (q.id === id ? { ...q, done: true } : q)) } }))
}

export function questActivity(q: Quest): Activity {
  const base = { id: `quest:${q.id}`, region: 0, stage: 'practice' as const, title: q.title, jp: q.storyJp, description: q.story }
  switch (q.game) {
    case 'spell-defense':
      return { ...base, game: 'spell-defense', params: { wordIds: q.wordIds, difficulty: 1, goal: 10 } }
    case 'speedcast':
      return { ...base, game: 'speedcast', params: { wordIds: q.wordIds, direction: 'mixed', durationSec: 45 } }
    case 'listening':
      return { ...base, game: 'listening', params: { wordIds: q.wordIds, rounds: 8 } }
    case 'lesson':
      return { ...base, game: 'lesson', params: { wordIds: q.wordIds } }
  }
}

/** Mini-games rotate each day: three featured unlocked activities give bonus XP. */
export function featuredToday(s: PlayerState, day = todayKey()): Activity[] {
  const rng = seeded(hashString('featured' + day))
  const eligible = ACTIVITIES.filter((a) => activityUnlocked(s, a) && a.stage !== 'boss' && a.game !== 'lesson' && a.game !== 'dialogue')
  const games = new Set<string>()
  const out: Activity[] = []
  const shuffled = [...eligible]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  for (const a of shuffled) {
    if (games.has(a.game)) continue
    games.add(a.game)
    out.push(a)
    if (out.length === 3) break
  }
  return out
}

export const FEATURED_MULTIPLIER = 1.5

/** Items due for spaced-repetition review, most overdue first. */
export function dueItems(s: PlayerState, limit = 20): string[] {
  const now = Date.now()
  return Object.values(s.srs)
    .filter((c) => c.seen > 0 && c.due <= now && !c.id.startsWith('a:'))
    .sort((a, b) => a.due - b.due)
    .slice(0, limit)
    .map((c) => c.id)
}
