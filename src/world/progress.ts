import { ACTIVITIES, activitiesFor } from '../data/regions'
import { activityUnlocked, isPassed, type PlayerState } from '../engine/store'
import type { Activity } from '../games/types'

/**
 * Next recommended activity: the first unlocked one not yet passed —
 * preferring the region the player is standing in.
 */
export function nextActivity(p: PlayerState, region?: number): Activity | undefined {
  const open = (a: Activity) => activityUnlocked(p, a) && !isPassed(p, a.id)
  return (region ? activitiesFor(region).find(open) : undefined) ?? ACTIVITIES.find(open)
}
