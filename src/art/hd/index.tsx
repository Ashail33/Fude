/**
 * Runtime access to the illustrated (Higgsfield) art. The list of processed
 * assets is loaded once from public/art/hd/available.json; anything missing
 * falls back to the pixel art, so the game always renders.
 */
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { HD_BY_ID, hdUrl } from './manifest'
import './hd.css'
import { PACK_BOSS_HD, PACK_ENTITY_HD, PACK_SPEAKER_HD, PACK_SPRITE_HD } from '../../regions/art'

let available: Set<string> = new Set()
let loaded = false
let listReady = false
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
        listReady = true
        const q = [...pending]
        pending.clear()
        preloadHd(q)
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

/** Ids asked for before the list arrived. */
const pending = new Set<string>()

/** Fully decoded image URLs (safe to show without pop-in). */
let decoded: Set<string> = new Set()
const decoding = new Map<string, Promise<boolean>>()
const decodedListeners = new Set<() => void>()

/** Load and decode one image URL once; resolves true when it can be shown. */
export function loadHdUrl(url: string): Promise<boolean> {
  if (decoded.has(url)) return Promise.resolve(true)
  let p = decoding.get(url)
  if (p) return p
  p = new Promise<boolean>((res) => {
    if (typeof Image === 'undefined') return res(false)
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const done = () => {
        decoded = new Set(decoded).add(url)
        decodedListeners.forEach((l) => l())
        res(true)
      }
      if (img.decode) img.decode().then(done, done)
      else done()
    }
    img.onerror = () => res(false)
    img.src = url
  })
  decoding.set(url, p)
  return p
}

/** Preload images so they appear instantly when needed (safe to call before the list has loaded). */
export function preloadHd(ids: (string | undefined | null)[]) {
  load()
  for (const id of ids) {
    if (!id) continue
    if (available.has(id)) void loadHdUrl(hdUrl(id))
    else if (!listReady) pending.add(id)
  }
}

function subscribeDecoded(l: () => void) {
  load()
  decodedListeners.add(l)
  listeners.add(l)
  return () => {
    decodedListeners.delete(l)
    listeners.delete(l)
  }
}

/**
 * The asset URL once it is available AND decoded (reactive), else null.
 * Use this to choose between the illustration and the pixel fallback
 * without a half-loaded frame.
 */
export function useHdLoaded(id: string | undefined | null): string | null {
  const url = id && available.has(id) ? hdUrl(id) : null
  useSyncExternalStore(subscribeDecoded, () => decoded, () => decoded)
  useSyncExternalStore(subscribe, () => available, () => available)
  useEffect(() => {
    if (url) void loadHdUrl(url)
  }, [url])
  return url && decoded.has(url) ? url : null
}

/** Like useHdLoaded for a list of ids (stable length not required). */
export function useHdLoadedMany(ids: (string | undefined | null)[]): (string | null)[] {
  const dec = useSyncExternalStore(subscribeDecoded, () => decoded, () => decoded)
  const av = useSyncExternalStore(subscribe, () => available, () => available)
  const urls = ids.map((id) => (id && av.has(id) ? hdUrl(id) : null))
  const sig = urls.join('|')
  useEffect(() => {
    for (const u of sig.split('|')) if (u) void loadHdUrl(u)
  }, [sig])
  return urls.map((u) => (u && dec.has(u) ? u : null))
}

/** Reactive CSS media query. */
export function useMediaQuery(query: string): boolean {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches
  const [m, setM] = useState(get)
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [query])
  return m
}

/** Optional extra media (e.g. the title video): checked once with HEAD. */
const mediaChecks = new Map<string, Promise<boolean>>()
export function useOptionalMedia(path: string, prefix: string): string | null {
  const url = `${import.meta.env?.BASE_URL ?? './'}${path}`
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    let p = mediaChecks.get(url)
    if (!p) {
      p = typeof fetch === 'undefined'
        ? Promise.resolve(false)
        : fetch(url, { method: 'HEAD' })
            .then((r) => r.ok && (r.headers.get('content-type') ?? '').startsWith(prefix))
            .catch(() => false)
      mediaChecks.set(url, p)
    }
    p.then((v) => alive && setOk(v))
    return () => {
      alive = false
    }
  }, [url])
  return ok ? url : null
}

/** Map pixel sprite ids to illustrated portrait/enemy ids. */
export const SPRITE_TO_HD: Record<string, string> = {
  mage: 'mage',
  fude: 'fude',
  elder: 'elder',
  merchant: 'merchant',
  scribe: 'scribe',
  'villager-b': 'villager',
  cat: 'cat',
  dog: 'dog',
  fox: 'fox',
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
  ...PACK_SPRITE_HD,
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
  ...PACK_BOSS_HD,
}

/** HD art for a story/dialogue speaker: boss art for boss keys, else the portrait/enemy art. */
/** Cutscene speakers with art of their own (not their sprite's). */
export const SPEAKER_HD: Record<string, string> = { shadow: 'shadow', ...PACK_SPEAKER_HD }

/**
 * Characters in the world with art of their own: the folklore spirits wear
 * a stand-in sprite on the map, but talk with their real portrait.
 */
export const ENTITY_HD: Record<string, string> = {
  'fk1-warashi': 'yokai-zashiki-warashi',
  'fk1-kasa': 'yokai-kasa-obake',
  'fk1-suzume': 'yokai-shitakiri-suzume',
  'fk2-kappa': 'yokai-kappa',
  'fk2-crane': 'yokai-tsuru',
  'fk2-tsuu': 'yokai-tsuru',
  'fk3-tengu': 'yokai-tengu',
  'fk3-chagama': 'yokai-bunbuku',
  'fk3-yamabiko': 'yokai-yamabiko',
  'fk4-usagi': 'yokai-tsuki-usagi',
  'fk4-noppera': 'yokai-noppera-bo',
  'fk4-orihime': 'yokai-tanabata',
  'fk4-hikoboshi': 'yokai-tanabata',
  'fk5-kaguya': 'yokai-kaguya-hime',
  'fk5-baku': 'yokai-baku',
  'fk5-urashima': 'yokai-urashima',
  ...PACK_ENTITY_HD,
}

export function speakerHd(sprite?: string | null, key?: string | null): string | undefined {
  if (key && BOSS_HD[key]) return BOSS_HD[key]
  if (key && SPEAKER_HD[key]) return SPEAKER_HD[key]
  return sprite ? SPRITE_TO_HD[sprite] : undefined
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
