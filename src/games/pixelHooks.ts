/** Hooks shared by the mini-games' pixel art (see pixel.tsx). */
import { useEffect, useRef, useState } from 'react'

export { tintFilter } from './pixelTint'

/** True for `ms` after `trigger` changes to a new truthy value. */
export function useHitFlash(trigger: unknown, ms = 160): boolean {
  const [on, setOn] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!trigger) return
    setOn(true)
    const t = setTimeout(() => setOn(false), ms)
    return () => clearTimeout(t)
  }, [trigger, ms])
  return on
}

/** True when the viewport is at least `px` wide (for choosing integer sprite scales). */
export function useWide(px = 700): boolean {
  const q = `(min-width: ${px}px)`
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches)
  useEffect(() => {
    const m = window.matchMedia?.(q)
    if (!m) return
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [q])
  return wide
}
