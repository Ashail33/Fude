/**
 * Random-encounter battle (CONTRACT). Rendered by the overworld as a full
 * screen overlay (not a route) so the player's position is kept.
 * STUB. The battle implementation replaces it.
 */
import type { EnemySprite } from '../art'

export type BattleOutcome = 'win' | 'lose' | 'flee'

export interface BattleProps {
  /** Region 1–5: picks the enemy pool and the vocabulary used. */
  region: number
  /** Specific enemies (1–3); otherwise chosen from the region pool. */
  enemies?: EnemySprite[]
  onEnd: (outcome: BattleOutcome) => void
}

export default function Battle({ onEnd }: BattleProps) {
  return (
    <div className="card" role="dialog">
      <button type="button" className="btn" onClick={() => onEnd('win')}>
        Win
      </button>
    </div>
  )
}
