/**
 * Runtime access to the illustrated (Higgsfield) art. The list of processed
 * assets is loaded once from public/art/hd/available.json; anything missing
 * falls back to the pixel art, so the game always renders.
 */
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { HD_BY_ID, hdUrl } from './manifest'

let available: Set<string> = new Set()
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof fetch === 'undefined') return
  loaded = true
  fetch(`${import.meta.env.BASE_URL}art/hd/available.json`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : []))
    .then((ids: unknown) => {
      if (Array.isArray(ids)) {
        available = new Set(ids.filter((x): x is string => typeof x === 'string' && HD_BY_ID.has(x)))
        listeners.forEach((l) => l())
      }
    })
    .catch(() => {})
}

function subscribe(l: () => void) {
  load()
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Whether an illustrated asset is available (reactive). */
export function useHd(id: string | undefined): string | null {
  const set = useSyncExternalStore(subscribe, () => available, () => available)
  return id && set.has(id) ? hdUrl(id) : null
}

/** Non-reactive check (after startup load). */
export function hdAvailable(id: string): boolean {
  load()
  return available.has(id)
}

/** Preload images so they appear instantly when needed. */
export function preloadHd(ids: string[]) {
  for (const id of ids) if (available.has(id)) new Image().src = hdUrl(id)
}

/** Map pixel sprite ids to illustrated portrait/enemy ids. */
export const SPRITE_TO_HD: Record<string, string> = {
  mage: 'mage',
  fude: 'fude',
  elder: 'elder',
  merchant: 'merchant',
  guard: 'guard',
  priest: 'priest',
  king: 'king',
  child: 'child',
  'villager-a': 'farmer',
  innkeeper: 'innkeeper',
  jailer: 'jailer',
  slime: 'slime',
  'ice-slime': 'ice-slime',
  imp: 'imp',
  bat: 'bat',
  mushroom: 'mushroom',
  kappa: 'kappa',
  tanuki: 'tanuki',
  golem: 'golem',
  wisp: 'wisp',
  kitsune: 'kitsune',
  harpy: 'harpy',
  treant: 'treant',
  tengu: 'tengu',
  oni: 'oni',
  skeleton: 'skeleton',
  dragon: 'void-dragon',
}

/** Boss art by story speaker / boss key. */
export const BOSS_HD: Record<string, string> = {
  oni: 'kana-oni',
  golem: 'radical-golem',
  guardian: 'particle-guardian',
  librarian: 'silent-librarian',
  chimera: 'shifting-chimera',
  dragon: 'void-dragon',
  'boss-kana': 'kana-oni',
  'boss-radical': 'radical-golem',
  'boss-particle': 'particle-guardian',
  'boss-librarian': 'silent-librarian',
  'boss-chimera': 'shifting-chimera',
  'boss-dragon': 'void-dragon',
}

/**
 * An illustrated image with a fade-in, or `fallback` while it is missing
 * or still loading.
 */
export function HdImage({ id, fallback, className, style, alt, eager }: { id: string | undefined; fallback?: ReactNode; className?: string; style?: CSSProperties; alt?: string; eager?: boolean }) {
  const url = useHd(id)
  const [ok, setOk] = useState(false)
  useEffect(() => setOk(false), [url])
  if (!url) return <>{fallback ?? null}</>
  return (
    <>
      {!ok && fallback}
      <img
        src={url}
        alt={alt ?? HD_BY_ID.get(id!)?.name ?? ''}
        className={`hd-img ${ok ? 'hd-in' : 'hd-loading'} ${className ?? ''}`}
        style={{ ...style, ...(ok ? {} : { position: 'absolute', opacity: 0, pointerEvents: 'none' }) }}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        onLoad={() => setOk(true)}
        onError={() => setOk(false)}
      />
    </>
  )
}
