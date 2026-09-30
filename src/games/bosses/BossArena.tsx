import { useEffect, type CSSProperties, type ReactNode } from 'react'
import type { Activity } from '../types'
import { GameFrame, Hearts, Intro, T } from '../../components/ui'
import { PixelSprite, spriteSize, type SpriteId } from '../../art'
import { BOSS_HD, useHdLoaded } from '../../art/hd'
import { LivingArt } from '../../anim/LivingArt'
import { voices } from '../../engine/voice'
import { TileStrip, type StripCell } from '../pixel'
import { useHitFlash, useWide } from '../pixelHooks'
import { useLatest, useNumberKeys, type Battle } from './battle'
import './BossArena.css'

// ─── Arena frame ─────────────────────────────────────────────────────────

export interface Bilingual {
  en: string
  jp: string
}

export function BossArena({
  battle,
  activity,
  onExit,
  name,
  spriteId,
  spriteFilter,
  sprite,
  floor,
  aura,
  phaseNames,
  introLines,
  taunt,
  victory,
  overlay,
  className,
  children,
}: {
  battle: Battle
  activity: Activity
  onExit: () => void
  name: Bilingual
  /** The boss's pixel sprite (see src/story/scenes.ts portraits). */
  spriteId: SpriteId
  /** CSS filter over the sprite (phase tints, elemental skins). */
  spriteFilter?: string
  /** Decorations drawn around the sprite (orbiting kana, books, shields…). */
  sprite?: ReactNode
  /** Tile rows drawn along the bottom of the stage (the boss's home ground). */
  floor?: StripCell[][]
  /** Aura colour (CSS colour). */
  aura: string
  /** One banner per phase ([0] is unused; phase 1 is the opening). */
  phaseNames: Bilingual[]
  introLines: string[]
  /** Speech bubble line under the boss. */
  taunt?: Bilingual | null
  victory?: Bilingual
  /** Extra absolutely positioned content inside the stage (e.g. weak points). */
  overlay?: ReactNode
  className?: string
  children: ReactNode
}) {
  const b = battle
  // The boss's signature cry: on its intro, when it changes form (deeper), and a last cry when beaten.
  useEffect(() => {
    if (b.status === 'intro' || b.status === 'fight' || b.status === 'lost') return
    voices.cry(spriteId, { pitch: b.status === 'phase' ? 0.85 : b.status === 'won' ? 1.25 : 1 })
  }, [b.status, spriteId])
  useEffect(() => {
    voices.cry(spriteId)
  }, [spriteId])
  const flash = useHitFlash(b.anim.kind === 'hit' ? b.anim.n : 0, 180)
  const wide = useWide()
  const big = spriteSize(spriteId).w > 32
  const scale = big ? (wide ? 3 : 2) : wide ? 5 : 4
  // Illustrated boss art (Higgsfield) when available; pixel sprite otherwise.
  const hdId = BOSS_HD[activity.game]
  const hd = useHdLoaded(hdId)
  // Living art reacts through the mesh (hit recoil, lunge, dissolve) instead of CSS keyframes.
  const hdCue = b.status === 'won' ? 'defeat' : b.status === 'fight' && b.anim.kind ? `${b.anim.kind} #${b.anim.n}` : null
  const art = (
    <>
      {hd ? (
        <LivingArt src={hd} id={hdId} imgClassName={`ba-hd ${flash ? 'ba-hd-flash' : ''} ${big ? 'ba-hd-big' : ''}`} cue={hdCue} cueK={b.status === 'won' ? 2.4 : 1} edge={/^#[0-9a-f]{6}$/i.test(aura) ? aura : undefined} />
      ) : (
        <PixelSprite id={spriteId} scale={scale} animate flash={flash} className="ba-pixel" />
      )}
      {sprite && <div className="ba-deco">{sprite}</div>}
    </>
  )
  const right = (
    <span className="ba-hud">
      <Hearts value={b.hearts} max={b.maxHearts} />
    </span>
  )
  if (b.status === 'intro') {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro title={activity.title} jp={activity.jp} lines={introLines} onStart={b.start}>
          <div className="ba-intro-boss" style={{ '--ba-aura': aura, '--ba-filter': spriteFilter ?? 'none' } as CSSProperties}>
            <div className="ba-sprite">{art}</div>
          </div>
          <p className="muted center">
            {b.maxHearts} ❤ · <T en={`${b.phases} phases`} jp={`${b.phases}つのけいたい`} />
          </p>
        </Intro>
      </GameFrame>
    )
  }
  const phaseLabel = phaseNames[b.phase] ?? { en: `Phase ${b.phase + 1}`, jp: `第${b.phase + 1}形態` }
  const bossCls = [
    'ba-boss',
    b.status === 'won' ? 'ba-dissolve' : '',
    b.status === 'phase' ? 'ba-transform' : '',
    b.anim.kind && b.status === 'fight' ? `ba-anim-${b.anim.kind}` : '',
    hd ? 'ba-living' : '',
  ].join(' ')
  const nextPhase = phaseNames[b.phase + 1] ?? { en: `Phase ${b.phase + 2}`, jp: `第${b.phase + 2}形態` }
  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className={`ba-game ${className ?? ''}`}>
      <div className={`ba-arena ${b.shaking ? 'ba-shake' : ''} ${b.status === 'lost' ? 'ba-lost' : ''}`} style={{ '--ba-aura': aura, '--ba-filter': spriteFilter ?? 'none' } as CSSProperties}>
        <div className="ba-top card">
          <div className="ba-name">
            <span lang="ja" className="ba-name-jp">
              {name.jp}
            </span>
            <span className="ba-name-en">{name.en}</span>
            <span className="ba-phase-pips" aria-label={`Phase ${b.phase + 1} of ${b.phases}`}>
              {Array.from({ length: b.phases }, (_, i) => (
                <span key={i} className={i <= b.phase ? 'on' : ''} />
              ))}
            </span>
          </div>
          <div className="ba-hp" role="progressbar" aria-valuenow={b.hp} aria-valuemax={b.maxHp} aria-label="Boss HP">
            <div className="ba-hp-fill" style={{ width: `${(b.hp / b.maxHp) * 100}%` }} />
            <div className="ba-hp-ghost" style={{ width: `${(b.hp / b.maxHp) * 100}%` }} />
            <span className="ba-hp-text">
              {b.hp} / {b.maxHp}
            </span>
          </div>
        </div>

        <div className={`ba-stage ${floor ? 'has-floor' : ''}`}>
          {floor && <TileStrip rows={floor} scale={wide ? 3 : 2} className="ba-ground" />}
          <div className="ba-floor" />
          <div className={bossCls} key={hd ? 'living' : `${b.anim.n}-${b.status}`}>
            <div className="ba-aura" />
            <div className="ba-sprite">{art}</div>
          </div>
          {taunt && b.status === 'fight' && (
            <div className="ba-taunt" key={taunt.jp}>
              <span lang="ja">{taunt.jp}</span>
              <small>{taunt.en}</small>
            </div>
          )}
          {overlay}
          <div className="ba-pops" aria-hidden>
            {b.pops.map((p) => (
              <span key={p.id} className={`ba-pop ba-pop-${p.kind}`}>
                {p.text}
              </span>
            ))}
          </div>
          {b.burst}
          {b.status === 'phase' && (
            <div className="ba-banner" role="status">
              <span className="ba-banner-small">
                <T en="The boss transforms!" jp="ボスが へんしんした！" />
              </span>
              <span lang="ja" className="ba-banner-jp">
                {nextPhase.jp}
              </span>
              <span className="ba-banner-en">{nextPhase.en}</span>
            </div>
          )}
          {b.status === 'won' && (
            <div className="ba-end ba-end-win" role="status">
              <span lang="ja" className="ba-end-jp">
                {victory?.jp ?? 'かった！'}
              </span>
              <span className="ba-end-en">{victory?.en ?? 'Victory!'}</span>
            </div>
          )}
          {b.status === 'lost' && (
            <div className="ba-end ba-end-lose" role="status">
              <span lang="ja" className="ba-end-jp">
                まけた…
              </span>
              <span className="ba-end-en">You fell. Train and return stronger.</span>
            </div>
          )}
        </div>

        <div className="ba-phase-label muted">
          <span lang="ja">{phaseLabel.jp}</span> · {phaseLabel.en}
        </div>
        <div className="ba-panel">{b.status === 'fight' ? children : <div className="ba-panel-wait" />}</div>
      </div>
    </GameFrame>
  )
}

// ─── Shared answer widgets ───────────────────────────────────────────────

export interface ChoiceReveal {
  picked: string | null
  accepted: string[]
}

export function ChoiceGrid({
  options,
  onPick,
  disabled,
  reveal,
  jp,
  render,
  className,
  keys = true,
}: {
  options: string[]
  onPick: (o: string) => void
  disabled?: boolean
  reveal?: ChoiceReveal | null
  jp?: boolean
  render?: (o: string) => ReactNode
  className?: string
  keys?: boolean
}) {
  useNumberKeys(options.length, (i) => onPick(options[i]), keys && !disabled && !reveal)
  return (
    <div className={`choices ba-choices ${className ?? ''}`}>
      {options.map((o, i) => {
        let cls = 'choice ba-choice'
        if (reveal) {
          if (reveal.accepted.includes(o)) cls += ' correct'
          else if (reveal.picked === o) cls += ' wrong'
          else cls += ' ba-dim'
        }
        if (jp) cls += ' choice-jp'
        return (
          <button key={o} type="button" className={cls} disabled={disabled || !!reveal} onClick={() => onPick(o)} lang={jp ? 'ja' : undefined}>
            <span className="ba-key" aria-hidden>
              {i + 1}
            </span>
            {render ? render(o) : o}
          </button>
        )
      })}
    </div>
  )
}

/** Visual countdown bar; calls onTimeout after `ms` unless `active` turns false or `id` changes. */
export function TimerBar({ ms, active, id, onTimeout }: { ms: number; active: boolean; id: string | number; onTimeout: () => void }) {
  const cb = useLatest(onTimeout)
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => cb.current(), ms)
    return () => clearTimeout(t)
  }, [active, id, ms, cb])
  return (
    <div className="ba-timer" aria-hidden>
      <div key={`${id}-${active}`} className={`ba-timer-fill ${active ? 'run' : 'stop'}`} style={{ animationDuration: `${ms}ms` }} />
    </div>
  )
}

/** Feedback line under a question. */
export function Feedback({ ok, children }: { ok: boolean | null; children?: ReactNode }) {
  if (ok === null) return <div className="feedback ba-feedback" />
  return <div className={`feedback ba-feedback ${ok ? 'good' : 'bad'} pop`}>{children}</div>
}

