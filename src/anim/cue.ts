/** Cue parsing shared by <LivingArt> and its callers. */
import type { Cue } from './spring'

const CUES: ReadonlySet<string> = new Set<Cue>(['hit', 'crit', 'attack', 'attack-big', 'defeat', 'spawn', 'hop', 'dodge', 'talk'])

/** Map a free-form state string (e.g. a battle CSS class list) to a cue. */
export function cueOf(s: string | undefined | null): Cue | null {
  if (!s) return null
  const parts = s.split(/\s+/)
  if (parts.includes('lunge')) return parts.includes('big') ? 'attack-big' : 'attack'
  if (parts.includes('dying')) return 'defeat'
  if (parts.includes('crit')) return 'crit'
  if (parts.includes('idle-bounce')) return 'hop'
  for (const p of parts) if (CUES.has(p)) return p as Cue
  return null
}
