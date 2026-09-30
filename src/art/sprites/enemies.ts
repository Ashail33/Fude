import type { Img, Slots } from '../raster'

export type Anim = 'squash' | 'bob' | 'flicker'

export interface Patch {
  x: number
  y: number
  rows: string[]
  /** Also apply mirrored on the other half (for symmetric sprites). */
  sym?: boolean
}

export interface EnemyDef {
  w?: number
  h?: number
  /** Pixel map; when `sym`, each row is the left half and is mirrored. */
  rows?: string[]
  sym?: boolean
  slots?: Slots
  shade?: string
  patch?: Patch[]
  frame1?: Patch[]
  anim: Anim | Anim[]
  pivot?: number
  /** Procedural base image (used by the dragon). */
  build?: () => Img
}

export const ENEMIES: Record<string, EnemyDef> = {}
