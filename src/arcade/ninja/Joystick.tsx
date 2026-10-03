/**
 * A thumb joystick for Stick Ninja on touch screens. Push left or right to
 * run; hold it down to crouch (with an attack: a low sweep, or the Ink Arts
 * moves); flick it up to jump. The knob follows the thumb inside its ring, and the
 * ring re-centres wherever the thumb first lands in the stick's zone, so it
 * works without looking.
 */
import { useRef, useState } from 'react'
import type { Input } from './sim'

/** How far the knob travels from the centre (px). */
const RANGE = 44
/** Deflection (0–1) that counts as a push in a direction. */
const SIDE = 0.32
const DOWN = 0.55
const UP = 0.5

export function Joystick({ input }: { input: React.MutableRefObject<Input> }) {
  const zone = useRef<HTMLDivElement>(null)
  const pointer = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })
  const wasUp = useRef(false)
  const [knob, setKnob] = useState({ x: 0, y: 0, cx: 0, cy: 0, on: false })

  const apply = (x: number, y: number) => {
    let dx = x - origin.current.x
    let dy = y - origin.current.y
    const len = Math.hypot(dx, dy)
    if (len > RANGE) {
      dx *= RANGE / len
      dy *= RANGE / len
    }
    const nx = dx / RANGE
    const ny = dy / RANGE
    const inp = input.current
    inp.left = nx < -SIDE
    inp.right = nx > SIDE
    inp.down = ny > DOWN
    const up = ny < -UP
    if (up && !wasUp.current) inp.jump = true
    wasUp.current = up
    setKnob((k) => ({ ...k, x: dx, y: dy, on: true }))
  }

  const release = () => {
    pointer.current = null
    wasUp.current = false
    const inp = input.current
    inp.left = inp.right = inp.down = false
    setKnob((k) => ({ ...k, x: 0, y: 0, on: false }))
  }

  return (
    <div
      ref={zone}
      className="nj-stick-zone"
      onPointerDown={(e) => {
        if (pointer.current !== null) return
        e.preventDefault()
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        pointer.current = e.pointerId
        const r = zone.current!.getBoundingClientRect()
        // the ring centres under the thumb (kept inside the zone)
        const cx = Math.max(r.left + RANGE + 14, Math.min(r.right - RANGE - 14, e.clientX))
        const cy = Math.max(r.top + RANGE + 14, Math.min(r.bottom - RANGE - 14, e.clientY))
        origin.current = { x: cx, y: cy }
        setKnob({ x: 0, y: 0, cx: cx - r.left, cy: cy - r.top, on: true })
        apply(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (e.pointerId === pointer.current) apply(e.clientX, e.clientY)
      }}
      onPointerUp={(e) => {
        if (e.pointerId === pointer.current) release()
      }}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Move: push left or right, down to crouch, up to jump"
      role="application"
    >
      <div className={`nj-stick${knob.on ? ' on' : ''}`} style={knob.on ? { left: knob.cx, top: knob.cy } : undefined}>
        <span className="nj-stick-arrows" aria-hidden>
          <i>▲</i>
          <i>◀</i>
          <i>▶</i>
          <i>▼</i>
        </span>
        <div className="nj-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
    </div>
  )
}
