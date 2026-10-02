import { useEffect, useRef, type ReactNode } from 'react'

/** Phones on their side: the same query the compact landscape styles use. */
const SHORT = '(orientation: landscape) and (max-height: 540px)'
/** Never shrink past this, so words stay readable (the page scrolls instead). */
const MIN_ZOOM = 0.62

/**
 * Shrinks a mini-game to fit the screen height on a sideways phone, so the
 * prompt and its answers are on screen together instead of below the fold.
 * Upright phones and desktops are left alone.
 */
export function FitScreen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(SHORT)
    let raf = 0
    const fit = () => {
      raf = 0
      el.style.zoom = ''
      if (!mq.matches) return
      // measure at full size, then pick the zoom, all before the next paint;
      // the box, not scrollHeight: flying effects poke out and shouldn't count
      const room = window.innerHeight - Math.max(0, el.getBoundingClientRect().top + window.scrollY) - 4
      const tall = () => el.getBoundingClientRect().height
      if (tall() <= room) return
      // shrinking gives the content more width, so it wraps less and gets
      // shorter: settle on the largest zoom that fits in a few passes
      let lo = MIN_ZOOM
      let hi = 1
      for (let i = 0; i < 6; i++) {
        const z = (lo + hi) / 2
        el.style.zoom = z.toFixed(3)
        if (tall() <= room) lo = z
        else hi = z
      }
      el.style.zoom = lo.toFixed(3)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(fit)
    }
    fit()
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    mq.addEventListener?.('change', schedule)
    window.addEventListener('resize', schedule)
    // a turned phone reports its new size a beat late on some browsers
    const late = () => [0, 250, 700].forEach((ms) => setTimeout(schedule, ms))
    window.addEventListener('orientationchange', late)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      mq.removeEventListener?.('change', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', late)
      el.style.zoom = ''
    }
  }, [])

  return (
    <div ref={ref} className="fit-screen">
      {children}
    </div>
  )
}
