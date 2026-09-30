import { useEffect, useRef, useState, type ReactNode } from 'react'
import { uiSound } from '../ui/sound'

export interface Command {
  id: string
  label: ReactNode
  /** Small text shown after the label (e.g. a count). */
  hint?: ReactNode
  disabled?: boolean
}

/**
 * A JRPG command window list: ▶ cursor on the selected entry, arrow keys /
 * WASD to move, Z / Enter / Space to choose, X / Esc / Backspace to cancel.
 * Mouse hover and taps select too. Only listens to the keyboard while `active`.
 */
export function CommandMenu({
  items,
  onSelect,
  onCancel,
  onHighlight,
  active = true,
  columns = 1,
  initial = 0,
  className,
  label,
}: {
  items: Command[]
  onSelect: (id: string) => void
  onCancel?: () => void
  onHighlight?: (id: string) => void
  active?: boolean
  columns?: number
  initial?: number
  className?: string
  label?: string
}) {
  const [sel, setSel] = useState(Math.min(initial, items.length - 1))
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const cb = useRef({ onSelect, onCancel, onHighlight })
  cb.current = { onSelect, onCancel, onHighlight }

  const move = (to: number) => {
    const n = items.length
    const next = ((to % n) + n) % n
    if (next !== sel) {
      uiSound.cursor()
      setSel(next)
      cb.current.onHighlight?.(items[next].id)
    }
  }

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      const k = e.key
      if (k === 'ArrowDown' || k === 's' || k === 'S') move(sel + columns)
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') move(sel - columns)
      else if (columns > 1 && (k === 'ArrowRight' || k === 'd' || k === 'D')) move(sel + 1)
      else if (columns > 1 && (k === 'ArrowLeft' || k === 'a' || k === 'A')) move(sel - 1)
      else if (k === 'z' || k === 'Z' || k === 'Enter' || k === ' ') {
        if (e.repeat) return
        const it = items[sel]
        if (it && !it.disabled) {
          uiSound.confirm()
          cb.current.onSelect(it.id)
        }
      } else if (k === 'x' || k === 'X' || k === 'Escape' || k === 'Backspace') {
        if (e.repeat || !cb.current.onCancel) return
        uiSound.cancel()
        cb.current.onCancel()
      } else return
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    // Capture phase so a menu shown over the overworld swallows its keys.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  return (
    <ul className={`cmd-list ${className ?? ''}`} role="menu" aria-label={label} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <li key={it.id} role="none">
          <button
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="menuitem"
            className={`cmd ${i === sel && active ? 'sel' : ''}`}
            disabled={it.disabled}
            onMouseEnter={() => !it.disabled && move(i)}
            onFocus={() => i !== sel && move(i)}
            onClick={() => {
              if (it.disabled) return
              setSel(i)
              uiSound.confirm()
              onSelect(it.id)
            }}
          >
            <span className="cmd-label">{it.label}</span>
            {it.hint != null && <span className="cmd-hint">{it.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}
