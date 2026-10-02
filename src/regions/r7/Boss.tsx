import { useEffect } from 'react'
import type { GameProps } from '../../games/types'

/** Placeholder until this region's boss is written: wins at once. */
export default function Boss({ onFinish }: GameProps) {
  useEffect(() => onFinish({ score: 1, maxScore: 1, reviews: [], passed: true }), [onFinish])
  return null
}
