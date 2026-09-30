/**
 * Adaptive learning system. A variant of SM-2 that also folds in answer
 * speed, so hesitant-but-correct answers are scheduled sooner than fluent
 * ones. Tracks mistake frequency, time to answer and recall strength.
 */

export interface SrsCard {
  id: string
  ease: number
  /** Current interval in days. */
  interval: number
  /** Timestamp (ms) at which the card is next due. */
  due: number
  reps: number
  lapses: number
  seen: number
  correct: number
  wrong: number
  /** Exponential moving average of answer time (ms). */
  avgMs: number
  lastSeen: number
}

export interface Review {
  itemId: string
  correct: boolean
  /** Milliseconds taken to answer, if measured. */
  ms?: number
}

const DAY = 24 * 60 * 60 * 1000
const MIN_EASE = 1.3

export function newCard(id: string, now = Date.now()): SrsCard {
  return { id, ease: 2.5, interval: 0, due: now, reps: 0, lapses: 0, seen: 0, correct: 0, wrong: 0, avgMs: 0, lastSeen: 0 }
}

/** Convert correctness + speed into an SM-2 quality grade (0–5). */
export function gradeFor(correct: boolean, ms?: number): number {
  if (!correct) return 1
  if (ms === undefined) return 4
  if (ms < 2500) return 5
  if (ms < 6000) return 4
  return 3
}

export function review(card: SrsCard, r: Review, now = Date.now()): SrsCard {
  const q = gradeFor(r.correct, r.ms)
  const c = { ...card }
  c.seen += 1
  c.lastSeen = now
  if (r.ms !== undefined) c.avgMs = c.avgMs === 0 ? r.ms : Math.round(c.avgMs * 0.7 + r.ms * 0.3)

  if (q < 3) {
    c.wrong += 1
    c.lapses += c.reps > 0 ? 1 : 0
    c.reps = 0
    // Relearn soon: 10 minutes.
    c.interval = 0
    c.due = now + 10 * 60 * 1000
  } else {
    c.correct += 1
    // Games show the same item several times per session; a repeat success
    // within the hour shouldn't inflate the interval.
    const burst = card.reps > 0 && now - card.lastSeen < 60 * 60 * 1000
    if (burst) return c
    c.reps += 1
    if (c.reps === 1) c.interval = 1
    else if (c.reps === 2) c.interval = 3
    else c.interval = Math.round(c.interval * c.ease * 10) / 10
    c.due = now + c.interval * DAY
  }
  c.ease = Math.max(MIN_EASE, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  return c
}

/**
 * Recall strength in [0, 1]: estimated probability of remembering now,
 * using an exponential forgetting curve anchored on the card's interval.
 */
export function strength(card: SrsCard | undefined, now = Date.now()): number {
  if (!card || card.seen === 0) return 0
  if (card.reps === 0) return 0.2
  const elapsedDays = (now - card.lastSeen) / DAY
  const stability = Math.max(card.interval, 0.5)
  return Math.exp(-elapsedDays / (stability * 1.5))
}

/** Mastery label shown in the Grimoire. */
export function masteryTier(card: SrsCard | undefined): 0 | 1 | 2 | 3 | 4 {
  if (!card || card.seen === 0) return 0 // unseen
  if (card.reps === 0) return 1 // learning
  if (card.interval < 7) return 2 // familiar
  if (card.interval < 21) return 3 // strong
  return 4 // mastered
}

export const TIER_LABEL = ['Unseen', 'Learning', 'Familiar', 'Strong', 'Mastered'] as const

/** Weakness score for picking items to drill: higher = needs work. */
export function weakness(card: SrsCard | undefined, now = Date.now()): number {
  if (!card || card.seen === 0) return 0.5
  const errRate = card.wrong / Math.max(1, card.seen)
  const overdue = card.due <= now ? 0.3 : 0
  const slow = card.avgMs > 5000 ? 0.15 : 0
  return errRate + overdue + slow + (1 - strength(card, now)) * 0.5
}

export function isDue(card: SrsCard | undefined, now = Date.now()): boolean {
  return !!card && card.seen > 0 && card.due <= now
}
