import { PixelSprite } from '../art'
import { OUTFITS } from '../engine/rewards'

/**
 * The player's mage as a crisp pixel sprite, dressed in the equipped outfit.
 * `size` is the approximate pixel size; it is snapped to an integer scale.
 */
export function Avatar({ outfit, size = 96, className, animate = true }: { outfit: string; size?: number; className?: string; animate?: boolean }) {
  const o = OUTFITS.find((x) => x.id === outfit) ?? OUTFITS[0]
  const scale = Math.max(1, Math.round(size / 16))
  return (
    <span className={`avatar ${className ?? ''}`} style={{ ['--trim' as string]: o.trim, width: 16 * scale, height: 16 * scale }}>
      <PixelSprite id="mage" outfit={o.id} scale={scale} animate={animate} anim="idle" title={o.name} />
    </span>
  )
}
