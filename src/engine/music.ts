/**
 * Chiptune music (CONTRACT). Original compositions sequenced with
 * WebAudio oscillators. STUB: silent; the music implementation replaces it.
 */
export type TrackId = 'title' | 'village' | 'fields' | 'forest' | 'shrine' | 'tower' | 'battle' | 'boss' | 'victory' | 'shop' | 'game'

/** Start (or cross-fade to) a looping track. No-op if already playing it. */
export function playMusic(_track: TrackId): void {}

/** Stop music (fade out). */
export function stopMusic(): void {}

/** Play a one-shot jingle (e.g. 'victory'), then resume the previous track. */
export function playJingle(_track: TrackId): void {}

/** The track currently playing (or null). */
export function currentTrack(): TrackId | null {
  return null
}
