import { ENEMY_SPRITES } from '../art'
import type { Entity, GameMap } from './types'

const ENEMIES = new Set<string>(ENEMY_SPRITES)

/** Fresh live entities for a map (optionally filtered, e.g. defeated bosses removed). */
export function makeEntities(m: GameMap, keep: (id: string) => boolean = () => true): Entity[] {
  return m.entitySpecs
    .filter((s) => keep(s.id))
    .map((s) => ({
      spec: s,
      x: s.x,
      y: s.y,
      hx: s.x,
      hy: s.y,
      px: s.x,
      py: s.y,
      t: 1,
      dir: s.dir ?? 'down',
      nextMove: 1500 + Math.random() * 3000,
      big: !!s.sprite && ENEMIES.has(s.sprite),
    }))
}
