/**
 * UI sound helpers. The menu/typewriter sounds live in engine/sfx (added by
 * the audio work); call them guarded so the UI never breaks if one is absent.
 */
import { sfx } from '../engine/sfx'

type Fx = Record<string, ((...args: number[]) => void) | undefined>

function play(name: string, fallback: string | null, ...args: number[]) {
  const s = sfx as unknown as Fx
  const f = s[name] ?? (fallback ? s[fallback] : undefined)
  try {
    f?.(...args)
  } catch {
    /* audio unavailable */
  }
}

export const uiSound = {
  /** Cursor moved in a menu. */
  cursor: () => play('cursor', null),
  /** Command confirmed. */
  confirm: () => play('confirm', 'click'),
  /** Menu cancelled / closed. */
  cancel: () => play('cancel', 'click'),
  /** Typewriter blip; `voice` shifts pitch by semitones. */
  blip: (voice = 0) => play('blip', null, voice),
}
