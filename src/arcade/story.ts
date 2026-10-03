/**
 * How the Games tab fits the journey. Each game belongs to someone in the
 * world, and opens once you have met them (see story/tales/minigames.ts):
 *
 *  - The Ink Dojo (Stick Ninja): Master Sumi in the Village's bamboo grove.
 *    The Quiet's shadows seep into his practice scroll as ink warriors; Fude
 *    carries you into the scroll to cut them down. Its worlds open as the
 *    journey goes on, and each "ink echo" beaten earns a keepsake and Sumi's
 *    blessing (more attack in every real battle).
 *  - The Hidden Village: Granny Tane on Windmill Hill hands you the deed to a
 *    valley the Quiet emptied, and asks you to bring it back to life.
 *  - Bamboo Bridge: Hayato, a ninja in training, practises crossing the
 *    river gorge in Mushroom Hollow.
 *
 * Saves that already played a game keep it open.
 */
import { JOURNEY } from '../data/journey'
import { REGIONS } from '../data/regions'
import type { HamletBonus } from '../engine/hamlet'
import { flagOf, hasKeyItem, regionUnlocked, setState, type PlayerState } from '../engine/store'
import { FIRST_WORLDS, freshNinja, gearName, giveGear, isSword, STAGE_COUNT, STAGES_PER_WORLD, type CacheLoot, type GearId } from './ninja/data'

export type GameId = 'dojo' | 'valley' | 'bridge'

export const MET_FLAG: Record<GameId, string> = { dojo: 'mg.dojo', valley: 'mg.valley', bridge: 'mg.bridge' }

export function gameOpen(s: PlayerState, g: GameId): boolean {
  if (flagOf(s, MET_FLAG[g]) > 0) return true
  if (g === 'dojo') return !!s.ninja
  if (g === 'valley') return !!s.hamlet || hasKeyItem(s, 'valley-deed')
  return (s.arcade?.stick ?? 0) > 0
}

/** Where to find each game's keeper, for the locked card. */
export const WHERE: Record<GameId, { jp: string; en: string }> = {
  dojo: { jp: 'むらの たけやぶに いる スミ せんせいに あおう', en: 'Meet Master Sumi in the bamboo grove beside the Village (west gate).' },
  valley: { jp: 'かざぐるまの おかに いる タネ ばあちゃんに あおう', en: 'Meet Granny Tane on Windmill Hill, north of the Elemental Fields.' },
  bridge: { jp: 'きのこの くぼちで ハヤトに あおう', en: 'Meet Hayato by the river in Mushroom Hollow, off the Forest of Sentences.' },
}

// ─── The Ink Dojo's worlds follow the journey ──────────────────────────

/**
 * Place on the road (0-based) a Stick Ninja world needs: Village, Fields,
 * Shrine, Hot springs, Snow temple; then the later worlds with the Castle
 * town, Snow temple, Cloud capital and the Tower. (The Ink Abyss follows the
 * stages themselves.)
 */
const WORLD_NEEDS = [0, 1, 3, 5, 7, 6, 7, 8, 9, 9]

export function ninjaWorldOpen(s: PlayerState, world: number): boolean {
  const need = JOURNEY[Math.min(WORLD_NEEDS[Math.min(world, WORLD_NEEDS.length - 1)] ?? 0, JOURNEY.length - 1)]
  return world === 0 || regionUnlocked(s, need)
}

/** The region whose arrival opens a world (for the locked card). */
export function ninjaWorldGate(world: number) {
  const id = JOURNEY[Math.min(WORLD_NEEDS[world] ?? 0, JOURNEY.length - 1)]
  return REGIONS.find((r) => r.id === id)
}

/** A stage is playable when the save has reached it and the story has opened its world. */
export function ninjaStageOpen(s: PlayerState, index: number): boolean {
  // The Ink Abyss opens with the original campaign's last world.
  if (index >= STAGE_COUNT) return ninjaWorldOpen(s, FIRST_WORLDS - 1)
  return ninjaWorldOpen(s, Math.floor(index / STAGES_PER_WORLD))
}

// ─── Keepsakes and blessings ───────────────────────────────────────────

/** One keepsake per ink echo, given by Master Sumi when you tell him. */
export const KEEPSAKES = ['ronin-hat', 'oni-horn', 'tengu-feather', 'shadow-mask', 'dragon-scale'] as const

/** Ink echoes beaten in the scroll (bosses cleared). */
export function echoesBeaten(s: PlayerState): number {
  return Math.floor((s.ninja?.cleared ?? 0) / STAGES_PER_WORLD)
}

/** Master Sumi's blessing on the mage: +2 attack per keepsake, +2 HP more with the Ink Blade. */
export function dojoBlessing(s: PlayerState): HamletBonus {
  const k = KEEPSAKES.filter((id) => hasKeyItem(s, id)).length
  const blade = hasKeyItem(s, 'ink-blade')
  return { hp: blade ? 10 : 0, mp: 0, atk: k * 2 + (blade ? 4 : 0), magic: 0 }
}

export const addBonus = (a: HamletBonus, b: HamletBonus): HamletBonus => ({ hp: a.hp + b.hp, mp: a.mp + b.mp, atk: a.atk + b.atk, magic: a.magic + b.magic })

// ─── Secret caches on the journey (see story/tales/ninjaCaches.ts) ──────

/** Bank what a secret cache held into the Stick Ninja save, and say what it was. */
export function claimCache(loot: CacheLoot): { jp: string; en: string } {
  if ('scroll' in loot) {
    setState((s) => {
      const n = s.ninja ?? freshNinja()
      return { ...s, ninja: { ...n, scrolls: (n.scrolls ?? 0) + 1 } }
    })
    return { jp: '📜 ひでんの まきもの！ ぼうにんじゃの「すみの わざ」が ひとつ ふえた。', en: '📜 A secret Ink Scroll! One more Ink Arts point for Stick Ninja.' }
  }
  const g = loot.gear as GearId
  setState((s) => ({ ...s, ninja: giveGear(s.ninja ?? freshNinja(), g) }))
  return { jp: `${isSword(g) ? '🗡️' : '🛡️'} ぼうにんじゃの そうび「${gearName(g)}」を みつけた！`, en: `${isSword(g) ? '🗡️' : '🛡️'} Stick Ninja gear: the ${gearName(g)}! Wear it in the dojo’s Armoury.` }
}
