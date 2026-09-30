import { useEffect, useRef } from 'react'
import { spriteCanvas, type Dir, type SpriteId } from '../art'

/**
 * Crisp scaled sprite for overlays. Like art's PixelSprite, but never throws
 * (a sprite the art library can't build yet simply renders nothing).
 */
export function Sprite({ id, scale = 2, dir = 'down', animate = false, className }: { id: SpriteId; scale?: number; dir?: Dir; animate?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let frame = 0
    let timer = 0
    const draw = () => {
      const el = ref.current
      if (!el) return
      try {
        const src = spriteCanvas(id, { dir, frame })
        el.width = src.width * scale
        el.height = src.height * scale
        const ctx = el.getContext('2d')!
        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, el.width, el.height)
        ctx.drawImage(src, 0, 0, el.width, el.height)
      } catch {
        el.width = 0
        el.height = 0
      }
      frame = (frame + 1) % 2
      if (animate) timer = window.setTimeout(draw, 320)
    }
    draw()
    return () => clearTimeout(timer)
  }, [id, scale, dir, animate])
  return <canvas ref={ref} width={0} height={0} className={`pixel ${className ?? ''}`} style={{ imageRendering: 'pixelated' }} aria-hidden />
}
