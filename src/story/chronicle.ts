/**
 * The Chronicle: Fude's memories, unlocked page by page.
 *
 * Core pages come with the main road (each region's boss) and keep asking
 * questions: who was the girl, why is the dragon nameless, what did she
 * write with? Bonus pages come from the folklore side tales: once two of a
 * region's spirits have signed the Spirit Scroll, they remember her too,
 * and those pages hold the answers. Each page also needs the one before it
 * on the main road, so the story is always told in order.
 */
import { bossOf, REGIONS } from '../data/regions'
import { isPassed, type PlayerState } from '../engine/store'
import { CONTENT } from './tales/content'
import type { Yokai } from './tales/types'

export const YOKAI: Yokai[] = CONTENT.flatMap((c) => c.yokai ?? [])
export const YOKAI_BY_ID = new Map(YOKAI.map((y) => [y.id, y]))

/** Seals a region's spirits must give before they share their memory. */
export const SEALS_FOR_PAGE = 2

export function sealed(s: PlayerState, id: string): boolean {
  return (s.flags?.[`seal.${id}`] ?? 0) > 0
}
export function sealCount(s: PlayerState, region?: number): number {
  return YOKAI.filter((y) => (region === undefined || y.region === region) && sealed(s, y.id)).length
}

export interface Page {
  n: number
  scene: string
  title: string
  jp: string
  region: number
  /** core: the region's boss; bonus: its spirits' seals. */
  kind: 'core' | 'bonus'
}

export const PAGES: Page[] = [
  { n: 1, scene: 'memory-1', region: 1, kind: 'core', title: 'A Name in the Rain', jp: 'あめの なかの なまえ' },
  { n: 2, scene: 'memory-2', region: 1, kind: 'bonus', title: 'The Hundred Friends', jp: 'ひゃくの ともだち' },
  { n: 3, scene: 'memory-3', region: 2, kind: 'core', title: 'The Thing Between Words', jp: 'ことばの あいだ' },
  { n: 4, scene: 'memory-4', region: 2, kind: 'bonus', title: 'Footsteps in the Mist', jp: 'きりの なかの あしおと' },
  { n: 5, scene: 'memory-5', region: 3, kind: 'core', title: 'The Hungry Quiet', jp: 'はらぺこの しずけさ' },
  { n: 6, scene: 'memory-6', region: 3, kind: 'bonus', title: 'Kotone’s Promise', jp: 'ことねの やくそく' },
  { n: 7, scene: 'memory-7', region: 4, kind: 'core', title: 'The Night of the Dragon', jp: 'りゅうの よる' },
  { n: 8, scene: 'memory-8', region: 4, kind: 'bonus', title: 'Ink of the Heart', jp: 'こころの すみ' },
  { n: 9, scene: 'memory-9', region: 5, kind: 'core', title: 'The Last Line', jp: 'さいごの ぎょう' },
  { n: 10, scene: 'memory-10', region: 5, kind: 'bonus', title: 'The Gentlest Name', jp: 'いちばん やさしい なまえ' },
]

const REGION_NAMES = REGIONS.map((r) => ({ en: r.name.replace(/^The /, 'the '), jp: r.jp }))

const seen = (s: PlayerState, scene: string) => s.seenScenes.includes(scene)
const corePage = (region: number) => PAGES.find((p) => p.kind === 'core' && p.region === region)!

/** Whether the page's own condition is met (boss beaten / enough seals). */
function earned(s: PlayerState, p: Page): boolean {
  return p.kind === 'core' ? isPassed(s, bossOf(p.region).id) : sealCount(s, p.region) >= Math.min(SEALS_FOR_PAGE, YOKAI.filter((y) => y.region === p.region).length || SEALS_FOR_PAGE)
}

/** Unlocked: earned, and the main-road page before it has been read. */
export function pageUnlocked(s: PlayerState, p: Page): boolean {
  if (!earned(s, p)) return false
  if (p.kind === 'bonus') return seen(s, corePage(p.region).scene)
  return p.region === 1 || seen(s, corePage(p.region - 1).scene)
}

export function pageSeen(s: PlayerState, p: Page): boolean {
  return seen(s, p.scene)
}

export function allPagesSeen(s: PlayerState): boolean {
  return PAGES.every((p) => seen(s, p.scene))
}

/** Memory scenes ready to play, in story order (the true ending last). */
export function owedMemories(s: PlayerState): string[] {
  const out = PAGES.filter((p) => pageUnlocked(s, p) && !pageSeen(s, p)).map((p) => p.scene)
  if (!out.length && allPagesSeen(s) && isPassed(s, 'r5-dragon') && s.seenScenes.includes('ending') && !seen(s, 'true-ending')) out.push('true-ending')
  return out
}

/** What still stands between the player and a locked page. */
export function pageHint(s: PlayerState, p: Page): { en: string; jp: string } {
  const boss = bossOf(p.region)
  if (p.kind === 'core') return { en: `Defeat ${boss.title}`, jp: `${boss.jp}に かつ` }
  const need = SEALS_FOR_PAGE
  const have = Math.min(need, sealCount(s, p.region))
  const land = REGION_NAMES[p.region - 1]
  const after = seen(s, corePage(p.region).scene) ? null : p.n - 1
  return {
    en: `Help spirits in ${land.en} sign your Spirit Scroll (${have}/${need})${after ? ` · after page ${after}` : ''}`,
    jp: `${land.jp}の ようかいを たすけよう（${have}/${need}）${after ? `・${after}ページの あと` : ''}`,
  }
}

/** The page that a newly placed seal just unlocked, if any. */
export function pageUnlockedBySeal(before: PlayerState, after: PlayerState): Page | undefined {
  return PAGES.find((p) => p.kind === 'bonus' && !pageUnlocked(before, p) && pageUnlocked(after, p) && !pageSeen(after, p))
}
