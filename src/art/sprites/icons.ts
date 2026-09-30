import type { Slots } from '../raster'

export interface IconDef {
  rows: string[]
  slots?: Slots
  shade?: string
}

export const ICONS: Record<string, IconDef> = {}
