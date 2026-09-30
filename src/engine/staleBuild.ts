/**
 * After a new deploy, a page still running the old build asks for code
 * files (lazy chunks) that no longer exist. Detect that and reload once to
 * pick up the new version, instead of showing an error.
 */
const KEY = 'fude.chunkReload'

export function isChunkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed|Unable to preload CSS/i.test(msg)
}

/** Reload to the latest build (at most once a minute, so a real outage can't loop). */
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < 60_000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* storage blocked: still reload once */
  }
  location.reload()
  return true
}

export function installStaleBuildReload() {
  // Vite fires this when a lazy chunk or its CSS fails to load.
  window.addEventListener('vite:preloadError', (e) => {
    if (reloadForNewBuild()) e.preventDefault()
  })
  window.addEventListener('unhandledrejection', (e) => {
    if (isChunkError(e.reason)) reloadForNewBuild()
  })
}
