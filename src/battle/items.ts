import type { IconSprite } from '../art'

/** Consumables. Bought from the Spell Merchant (ください) with spirit shards 💠. */
export interface ItemDef {
  id: string
  name: string
  jp: string
  kana: string
  icon: IconSprite
  price: number
  description: string
  /** Battle effect. */
  effect: { kind: 'heal'; amount: number } | { kind: 'mp'; amount: number } | { kind: 'flee' } | { kind: 'shield'; turns: number }
}

export const ITEMS: ItemDef[] = [
  { id: 'herb', name: 'Medicinal Herb', jp: '薬草', kana: 'やくそう', icon: 'herb', price: 8, description: 'Restores 30 HP.', effect: { kind: 'heal', amount: 30 } },
  { id: 'ether', name: 'Ink of Power', jp: '魔法の墨', kana: 'まほうのすみ', icon: 'ether', price: 15, description: 'Restores 12 MP.', effect: { kind: 'mp', amount: 12 } },
  { id: 'smoke', name: 'Smoke Ball', jp: 'けむり玉', kana: 'けむりだま', icon: 'smoke', price: 10, description: 'Escape any normal battle.', effect: { kind: 'flee' } },
  { id: 'charm', name: 'Omamori Charm', jp: 'お守り', kana: 'おまもり', icon: 'charm', price: 25, description: 'Blocks the next 2 enemy attacks.', effect: { kind: 'shield', turns: 2 } },
]

export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]))
