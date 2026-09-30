import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ADJECTIVES, ELEMENT_SPELLS, ENEMIES, type Enemy } from '../data/sentences'
import { GameFrame, Hearts, HpBar, Intro, Jp, KanaInput, T, useAnswerTimer, useBurst, useFlash } from '../components/ui'
import { item } from '../engine/items'
import { sample, shuffle } from '../engine/random'
import { sfx } from '../engine/sfx'
import { canListen, listen, speak } from '../engine/speech'
import type { Review } from '../engine/srs'
import type { GameProps } from './types'
import { checkIncantation, checkSpoken, ELEMENT_WORD, type CastResult } from './incantation'
import { readingOf } from './forge'
import './SpellCombat.css'

const PLAYER_HP = 5

/** How each enemy betrays its weakness (Japanese hint + visual). */
const ENEMY_HINTS: Record<string, { anim: string; aura: string; jp: string; en: string }> = {
  slime: { anim: 'shiver', aura: '❄️', jp: 'ぶるぶる…さむい！', en: 'Brr… so cold!' },
  imp: { anim: 'blaze', aura: '🔥', jp: 'あつい、あつい！もやすぞ！', en: "Hot, hot! I'll burn you!" },
  golem: { anim: 'heavy', aura: '🪨', jp: 'ねっこが こわい…', en: 'Roots frighten me…' },
  wisp: { anim: 'fade', aura: '🌑', jp: 'ひかりは いやだ…', en: 'I hate the light…' },
  harpy: { anim: 'fly', aura: '🪶', jp: 'じめんは きらい！', en: 'I hate the ground!' },
  treant: { anim: 'sway', aura: '🍂', jp: 'かれた えだは よく もえる…', en: 'Dry branches burn easily…' },
  dragon: { anim: 'void', aura: '🌀', jp: 'かぜが こわい…', en: 'I fear the wind…' },
}

interface Tile {
  text: string
  kind: 'element' | 'particle' | 'word' | 'adj'
}

function tileReading(t: string): string | undefined {
  return ELEMENT_SPELLS.find((e) => e.noun === t)?.kana ?? ADJECTIVES.find((a) => a.base === t && a.base !== a.kana)?.kana ?? readingOf(t)
}

const elementOf = (el: Enemy['weakness']) => ELEMENT_SPELLS.find((e) => e.element === el)!

type Anim = null | 'cast' | 'resisted' | 'fizzle' | 'enemy-attack' | 'defeated'

export default function SpellCombat({ activity, params, onFinish, onExit }: GameProps<'combat'>) {
  const enemies = useMemo(() => params.enemyIds.map((id) => ENEMIES.find((e) => e.id === id)).filter((e): e is Enemy => !!e), [params.enemyIds])
  const choose = params.input === 'choose'

  const [started, setStarted] = useState(false)
  const [ei, setEi] = useState(0)
  const enemy = enemies[ei] as Enemy | undefined
  const [enemyHp, setEnemyHp] = useState(enemies[0]?.hp ?? 1)
  const [hp, setHp] = useState(PLAYER_HP)
  const [anim, setAnim] = useState<Anim>(null)
  const [missile, setMissile] = useState<{ emoji: string; color: string; key: number } | null>(null)
  const [result, setResult] = useState<(CastResult & { heard?: string; voice?: boolean }) | null>(null)
  const [composed, setComposed] = useState<string[]>([])
  const [typed, setTyped] = useState('')
  const [listening, setListening] = useState(false)
  const [micMsg, setMicMsg] = useState('')
  const [fails, setFails] = useState(0)
  const [showEn, setShowEn] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const castsRef = useRef({ ok: 0, total: 0 })

  const reviews = useRef<Review[]>([])
  const finished = useRef(false)
  const timeouts = useRef<number[]>([])
  const cancelListen = useRef<(() => void) | null>(null)
  const missileKey = useRef(0)
  const [burstNode, burst] = useBurst()
  const [flashCls, flash] = useFlash()
  const [turn, setTurn] = useState(0)
  const elapsed = useAnswerTimer(`${turn}-${started}`)
  const busy = anim !== null || listening

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(
    () => () => {
      timeouts.current.forEach(clearTimeout)
      cancelListen.current?.()
    },
    [],
  )

  const voiceOk = useMemo(() => !choose && canListen(), [choose])

  // Tiles for 'choose' mode: all elements, particles, verbs/nouns (with decoys), a few adjectives.
  const tiles = useMemo<Tile[]>(() => {
    const iAdj = ADJECTIVES.filter((a) => a.kind === 'i' && a.base !== '強い')
    const adjs = shuffle([ADJECTIVES.find((a) => a.base === '強い')!, ...sample(iAdj, 2)])
    return [
      ...shuffle(ELEMENT_SPELLS).map((e): Tile => ({ text: e.noun, kind: 'element' })),
      ...['の', 'を', 'は', 'に'].map((p): Tile => ({ text: p, kind: 'particle' })),
      ...shuffle(['まほう', '使います', '食べます']).map((w): Tile => ({ text: w, kind: 'word' })),
      ...adjs.map((a): Tile => ({ text: a.base, kind: 'adj' })),
    ]
    // Re-deal adjectives per enemy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ei])

  const finish = useCallback(
    (won: boolean, heroic?: string[]) => {
      if (finished.current) return
      finished.current = true
      const c = castsRef.current
      onFinish({
        score: c.ok,
        maxScore: Math.max(1, c.total),
        passed: won,
        reviews: reviews.current,
        heroic,
        notes: [won ? `Defeated all ${enemies.length} foes` : `Fell to the ${enemies[ei]?.name ?? 'enemy'}`, `${c.ok} of ${c.total} spells landed`],
      })
    },
    [onFinish, enemies, ei],
  )

  const resolveCast = useCallback(
    (r: CastResult & { heard?: string }, voice: boolean) => {
      if (!enemy || finished.current) return
      const ms = elapsed()
      const weak = elementOf(enemy.weakness)
      // SRS reviews for the parts of the incantation.
      if (r.parts.element) reviews.current.push({ itemId: item.word(r.parts.element), correct: r.success, ms })
      else reviews.current.push({ itemId: item.word(ELEMENT_WORD[enemy.weakness]), correct: false, ms })
      if (r.parts.mahou) reviews.current.push({ itemId: item.word('mahou'), correct: r.valid, ms })
      if (r.parts.tsukau) reviews.current.push({ itemId: item.word('tsukau'), correct: r.valid, ms })

      setResult({ ...r, voice })
      setTurn((t) => t + 1)
      castsRef.current = { ok: castsRef.current.ok + (r.success ? 1 : 0), total: castsRef.current.total + 1 }
      const cast = r.element ? elementOf(r.element) : undefined

      if (r.success) {
        sfx.cast()
        setAnim('cast')
        setMissile({ emoji: cast!.emoji, color: cast!.color, key: missileKey.current++ })
        if (r.canonical) void speak(r.canonical)
        later(() => {
          sfx.hit()
          sfx.correct()
          burst(50, 22, 10 + r.damage * 4)
          const left = Math.max(0, enemyHp - r.damage)
          setEnemyHp(left)
          setMissile(null)
          if (left > 0) {
            setAnim(null)
            return
          }
          setAnim('defeated')
          later(() => {
            const heroic = [item.word(r.parts.element ?? ELEMENT_WORD[weak.element]), ...(r.parts.mahou ? [item.word('mahou')] : []), ...(r.parts.tsukau ? [item.word('tsukau')] : [])]
            if (ei + 1 >= enemies.length) {
              sfx.win()
              finish(true, heroic)
            } else {
              const nx = enemies[ei + 1]
              setEi(ei + 1)
              setEnemyHp(nx.hp)
              setFails(0)
              setShowEn(false)
              setResult(null)
              setComposed([])
              setTyped('')
              setAnim(null)
            }
          }, 1300)
        }, 650)
      } else {
        sfx.wrong()
        setFails((f) => f + 1)
        if (r.error === 'resisted' && cast) {
          setAnim('resisted')
          setMissile({ emoji: cast.emoji, color: cast.color, key: missileKey.current++ })
        } else {
          setAnim('fizzle')
        }
        later(
          () => {
            setMissile(null)
            setAnim('enemy-attack')
            sfx.hurt()
            flash('bad')
            const nhp = hp - 1
            setHp(nhp)
            later(() => {
              if (nhp <= 0) {
                sfx.lose()
                finish(false)
              } else setAnim(null)
            }, 700)
          },
          r.error === 'resisted' ? 650 : 250,
        )
      }
    },
    [enemy, elapsed, later, burst, enemyHp, ei, enemies, finish, flash, hp],
  )

  const castTiles = () => {
    if (composed.length === 0) return
    resolveCast(checkIncantation(composed.join(''), enemy?.weakness), false)
    setComposed([])
  }
  const castTyped = (v: string) => {
    if (!v.trim()) return
    resolveCast(checkIncantation(v, enemy?.weakness), false)
    setTyped('')
  }

  const speakSpell = () => {
    if (busy || !enemy) return
    setMicMsg('')
    setListening(true)
    const l = listen()
    cancelListen.current = l.cancel
    l.promise
      .then((alts) => {
        setListening(false)
        const r = checkSpoken(
          alts.map((a) => a.transcript),
          enemy.weakness,
        )
        setMicMsg(`🎤 「${r.heard}」`)
        // Silence / gibberish costs nothing; a recognised attempt is a real cast.
        if (r.error === 'empty' || r.error === 'no-element') {
          setMicMsg(`🎤 「${r.heard}」 — ${r.feedback}`)
          return
        }
        resolveCast(r, true)
      })
      .catch((e: unknown) => {
        setListening(false)
        const msg = e instanceof Error ? e.message : String(e)
        setMicMsg(msg === 'no-speech' ? "🎤 I didn't hear anything. Try again." : msg === 'not-allowed' ? '🎤 Microphone blocked — allow it or type instead.' : `🎤 ${msg}`)
      })
      .finally(() => {
        cancelListen.current = null
      })
  }

  // Return focus to the incantation box after each exchange.
  useEffect(() => {
    if (started && !choose && anim === null && !listening) document.querySelector<HTMLInputElement>('.sc-type-row .kana-input')?.focus()
  }, [started, choose, anim, listening])

  // Keyboard for tile mode: Enter casts, Backspace removes the last tile.
  useEffect(() => {
    if (!started || !choose) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (!busy) castTiles()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        if (!busy) setComposed((c) => c.slice(0, -1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const right = (
    <span className="sc-hp-head">
      <Hearts value={hp} max={PLAYER_HP} />
    </span>
  )

  if (!started || !enemy) {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro
          title="Spell Creation Combat"
          jp="まほうのたたかい"
          lines={[
            'Cast spells by speaking correct Japanese: 火のまほう (fire magic) or 火を使います (I use fire).',
            'Watch each foe for clues to its weakness — only the right element hurts it.',
            'Add an adjective for extra power: 強い風のまほう, 熱い火を使います.',
            choose
              ? 'Tap tiles to build the incantation, then Cast. A failed spell lets the enemy strike (5 hearts).'
              : `Type it in romaji (hi no mahou → ひのまほう)${voiceOk ? ', or press 🎤 and say it aloud for bonus damage (Voice-to-Magic)' : ''}. A failed spell lets the enemy strike (5 hearts).`,
          ]}
          onStart={() => {
            setStarted(true)
            if (enemies[0]) void speak(enemies[0].taunt[0])
          }}
        />
      </GameFrame>
    )
  }

  const hint = ENEMY_HINTS[enemy.id] ?? { anim: '', aura: '✦', jp: enemy.taunt[0], en: enemy.taunt[1] }
  const weak = elementOf(enemy.weakness)
  const revealWeak = choose || fails >= 2
  const castEl = result?.element ? elementOf(result.element) : undefined

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="sc">
      <div className="sc-foes" aria-label="Enemies">
        {enemies.map((e, i) => (
          <span key={e.id + i} className={`sc-foe-pip ${i < ei ? 'done' : i === ei ? 'now' : ''}`} title={e.name}>
            {i < ei ? '✔' : e.emoji}
          </span>
        ))}
      </div>

      <div className={`sc-arena ${flashCls} ${anim === 'enemy-attack' ? 'hurt' : ''}`}>
        {burstNode}
        <div className="sc-enemy-side">
          <div className="sc-enemy-head">
            <T en={enemy.name} jp={enemy.jp} className="sc-enemy-name" />
            <HpBar value={enemyHp} max={enemy.hp} color="linear-gradient(90deg,#ff5d73,#ff9f43)" />
          </div>
          <div className={`sc-enemy ${hint.anim} ${anim === 'defeated' ? 'defeated' : ''} ${anim === 'enemy-attack' ? 'lunge' : ''}`}>
            <span className="sc-aura" aria-hidden>
              {hint.aura}
            </span>
            <span className="sc-enemy-emoji" role="img" aria-label={enemy.name}>
              {enemy.emoji}
            </span>
            {anim === 'resisted' && <span className="sc-resist">🛡️</span>}
          </div>
          <div className="sc-bubble">
            <Jp text={hint.jp} />
            {choose || showEn ? (
              <div className="sc-bubble-en">{hint.en}</div>
            ) : (
              <button type="button" className="btn btn-sm sc-translate" onClick={() => setShowEn(true)}>
                <T en="Translate" jp="やくす" />
              </button>
            )}
          </div>
          {revealWeak && (
            <div className="sc-weak" style={{ ['--el' as string]: weak.color }}>
              <T en="Weakness" jp="じゃくてん" />: <span className="sc-weak-ico">{weak.emoji}</span>
            </div>
          )}
        </div>

        {missile && (
          <span key={missile.key} className={`sc-missile ${anim === 'resisted' ? 'bounce' : ''}`} style={{ ['--el' as string]: missile.color }} aria-hidden>
            {missile.emoji}
          </span>
        )}

        <div className="sc-player">
          <span className={`sc-mage ${anim === 'cast' ? 'casting' : ''}`} aria-hidden>
            🧙
          </span>
          <HpBar value={hp} max={PLAYER_HP} color="linear-gradient(90deg,#4ade80,#a3e635)" label={<T en="You" jp="あなた" />} />
        </div>
      </div>

      <div className={`feedback sc-feedback ${result ? (result.success ? 'good' : 'bad') : ''}`} role="status">
        {result && (
          <>
            {result.success ? (
              <>
                <span lang="ja" className="sc-cast-text" style={{ color: castEl?.color }}>
                  {result.canonical}
                </span>{' '}
                — {result.damage} dmg{result.adjective ? ' (adjective bonus!)' : ''}
                {result.voice ? ' (Voice-to-Magic!)' : ''}
              </>
            ) : (
              <>
                {result.feedback}
                {!result.element && revealWeak && (
                  <span className="sc-example">
                    {' '}
                    e.g. <span lang="ja">{weak.noun}のまほう</span>
                  </span>
                )}
              </>
            )}
          </>
        )}
      </div>

      {choose ? (
        <div className="sc-input">
          <div className="sc-slot" aria-label="Incantation">
            {composed.length === 0 ? (
              <span className="muted">
                <T en="Build your incantation…" jp="じゅもんをつくろう…" />
              </span>
            ) : (
              composed.map((t, i) => (
                <button key={i} type="button" className="sc-tile placed" disabled={busy} onClick={() => setComposed((c) => c.filter((_, j) => j !== i))}>
                  <Jp text={t} reading={tileReading(t)} />
                </button>
              ))
            )}
          </div>
          <div className="sc-tiles">
            {tiles.map((t, i) => (
              <button
                key={`${t.text}-${i}`}
                type="button"
                className={`sc-tile k-${t.kind}`}
                disabled={busy || composed.length >= 6}
                style={t.kind === 'element' ? { ['--el' as string]: ELEMENT_SPELLS.find((e) => e.noun === t.text)?.color } : undefined}
                onClick={() => {
                  sfx.click()
                  setComposed((c) => [...c, t.text])
                }}
              >
                <Jp text={t.text} reading={tileReading(t.text)} />
              </button>
            ))}
          </div>
          <div className="row sc-actions">
            <button type="button" className="btn" onClick={() => setComposed([])} disabled={busy || composed.length === 0}>
              <T en="Clear" jp="けす" />
            </button>
            <button type="button" className="btn btn-primary btn-lg" onClick={castTiles} disabled={busy || composed.length === 0}>
              ✨ <T en="Cast!" jp="となえる！" />
            </button>
          </div>
        </div>
      ) : (
        <div className="sc-input">
          <div className="sc-type-row">
            <KanaInput value={typed} onChange={setTyped} onSubmit={castTyped} autoFocus disabled={busy} placeholder="hi no mahou → ひのまほう" />
            {voiceOk && (
              <button type="button" className={`btn-icon sc-mic ${listening ? 'on' : ''}`} onClick={speakSpell} disabled={busy && !listening} aria-label="Speak the spell" title="Speak the spell (bonus damage)">
                🎤
              </button>
            )}
          </div>
          {micMsg && <div className="muted center sc-mic-msg">{listening ? '' : micMsg}</div>}
          {listening && (
            <div className="center sc-listening">
              <T en="Listening… speak your spell!" jp="きいているよ…となえて！" />
            </div>
          )}
          <div className="row sc-actions">
            <button type="button" className="btn btn-sm" onClick={() => setShowBook((b) => !b)}>
              📖 <T en="Spellbook" jp="まほうのほん" />
            </button>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => castTyped(typed)} disabled={busy || !typed.trim()}>
              ✨ <T en="Cast!" jp="となえる！" />
            </button>
          </div>
        </div>
      )}

      {(choose || showBook) && (
        <div className="card sc-book">
          <div className="sc-book-patterns">
            <span lang="ja">
              <b>N</b>のまほう
            </span>
            <span lang="ja">
              <b>N</b>を使います
            </span>
            <span lang="ja">
              <b>N</b>を使う
            </span>
          </div>
          <div className="sc-book-els">
            {ELEMENT_SPELLS.map((e) => (
              <span key={e.element} style={{ color: e.color }}>
                {e.emoji} <Jp text={e.noun} reading={e.kana} /> <small className="muted">{e.en}</small>
              </span>
            ))}
          </div>
        </div>
      )}
    </GameFrame>
  )
}
