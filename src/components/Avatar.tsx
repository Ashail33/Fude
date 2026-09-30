import { OUTFITS } from '../engine/rewards'

/** The player's mage, drawn in SVG and dressed in the equipped outfit. */
export function Avatar({ outfit, size = 96, className }: { outfit: string; size?: number; className?: string }) {
  const o = OUTFITS.find((x) => x.id === outfit) ?? OUTFITS[0]
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={o.name}>
      <defs>
        <radialGradient id={`aura-${o.id}`} cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor={o.trim} stopOpacity="0.45" />
          <stop offset="100%" stopColor={o.trim} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="58" r="46" fill={`url(#aura-${o.id})`} />
      {/* robe */}
      <path d="M50 44 L22 94 Q50 100 78 94 Z" fill={o.robe} stroke={o.trim} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 46 L50 96" stroke={o.trim} strokeWidth="2" />
      <path d="M36 70 Q50 76 64 70" stroke={o.trim} strokeWidth="2.5" fill="none" />
      {/* sleeves + staff */}
      <path d="M30 70 L18 62" stroke={o.robe} strokeWidth="7" strokeLinecap="round" />
      <path d="M16 40 L20 94" stroke="#b07a3c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="15.5" cy="37" r="5" fill={o.trim} opacity="0.95" />
      {/* face */}
      <circle cx="50" cy="38" r="13" fill="#ffe0c2" />
      <circle cx="45.5" cy="38" r="1.8" fill="#2a2a3a" />
      <circle cx="54.5" cy="38" r="1.8" fill="#2a2a3a" />
      <path d="M46 44 Q50 47 54 44" stroke="#c46a5a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="42" r="2" fill="#ff9aa8" opacity="0.6" />
      <circle cx="58" cy="42" r="2" fill="#ff9aa8" opacity="0.6" />
      {/* hair */}
      <path d="M37 36 Q40 22 50 23 Q61 22 63 36 Q58 29 50 30 Q42 29 37 36 Z" fill="#2b2352" />
      <text x="50" y="22" textAnchor="middle" fontSize="18">
        {o.hat}
      </text>
    </svg>
  )
}
