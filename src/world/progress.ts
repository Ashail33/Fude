import { ACTIVITIES } from '../data/regions'
import { activityUnlocked, isPassed, type PlayerState } from '../engine/store'
import type { Activity } from '../games/types'

/** Next recommended activity: the first unlocked one not yet passed. */
export function nextActivity(p: PlayerState): Activity | undefined {
  return ACTIVITIES.find((a) => activityUnlocked(p, a) && !isPassed(p, a.id))
}
