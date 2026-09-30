/**
 * Story cutscenes (CONTRACT). STUB: immediately finishes. The story
 * implementation replaces it (scenes live in story/scenes.ts).
 */
import { useEffect } from 'react'

export interface CutsceneProps {
  /** Scene id, e.g. 'intro', 'arrive-village', 'arrive-fields', 'pre-boss-r1', 'post-boss-r1', 'ending'. */
  id: string
  onDone: () => void
}

export function Cutscene({ onDone }: CutsceneProps) {
  useEffect(() => {
    onDone()
  }, [onDone])
  return null
}

/** Whether a scene with this id exists. */
export function hasScene(_id: string): boolean {
  return false
}
