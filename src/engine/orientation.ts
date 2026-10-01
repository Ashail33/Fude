/**
 * Turning the game sideways from a button. Android browsers can lock the
 * orientation once the page is fullscreen; iOS Safari can't lock at all, so
 * there the caller shows a "turn your phone" hint instead.
 */
type Lockable = ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void }

export function isLandscape(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(orientation: landscape)').matches
}

/** Rotate to the other orientation. Resolves false when the device won't (ask the player to turn it). */
export async function toggleLandscape(): Promise<boolean> {
  const o = screen.orientation as Lockable | undefined
  if (!o?.lock) return false
  const want = isLandscape() ? 'portrait' : 'landscape'
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    await o.lock(want)
    return true
  } catch {
    return false
  }
}
