import { useState } from 'react'
import type { GameProps } from '../../games/types'
import type { ForgeSentence } from '../../data/sentences'
import { WORD_BY_ID } from '../../data/vocab'
import { item } from '../../engine/items'
import type { Review } from '../../engine/srs'
import { speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sfx } from '../../engine/sfx'
import { T, useAnswerTimer } from '../../components/ui'
import type { StripCell } from '../../games/pixel'
import { tintFilter } from '../../games/pixelHooks'
import { BossArena, ChoiceGrid, Feedback, TimerBar } from '../../games/bosses/BossArena'
import { useBossBattle, useKey, useNumberKeys } from '../../games/bosses/battle'
import { createDeck } from '../../games/bosses/bossLogic'
import { DRUM_CALLS, drumQuestion, FORM_CALL, FORM_GRAMMAR, GALE_SENTENCES, galeCorrect, galeQuestion, GAPS, gapOptions, type DrumQ, type GaleQ, type Gap } from './raijin'
import '../../games/bosses/bosses.css'
import './Boss.css'

/**
 * Raijin of the Thunder Drums. Three phases:
 *  1. Drum Call: Raijin beats a drum and shouts a verb and the form he wants
 *     (ない, potential, 〜たら, 〜ば). Answer before the next beat.
 *  2. Fūjin's Gale: the wind god blows a sentence to pieces (with one stray
 *     word mixed in). Rebuild it tile by tile.
 *  3. Wind and Thunder: both at once. Drum calls come faster, alternating
 *     with storm gaps: fill each sentence's gap with the right grammar.
 */
type Q = { kind: 'drum'; q: DrumQ } | { kind: 'gale'; q: GaleQ } | { kind: 'gap'; q: Gap; options: string[] }

const DRUM_MS = [9000, 9000, 7000]
const w = (id: string) => weakness(getState().srs[id])

const SKY_FLOOR: StripCell[][] = [['cloud', 'cloud', { id: 'lantern', under: 'cloud' }, 'cloud', 'cloud', 'cloud', 'cloud', 'cloud', { id: 'lantern', under: 'cloud' }, 'cloud']]

function drumReviews(q: DrumQ, ok: boolean, ms: number): Review[] {
  const out: Review[] = [{ itemId: item.grammar(FORM_GRAMMAR[q.form]), correct: ok, ms }]
  if (WORD_BY_ID.has(q.verb.id)) out.push({ itemId: item.word(q.verb.id), correct: ok, ms })
  return out
}

export default function Boss({ activity, onFinish, onExit }: GameProps<'boss-raijin'>) {
  const [decks] = useState(() => ({
    drum: createDeck(DRUM_CALLS, (c) => w(item.grammar(FORM_GRAMMAR[c.form])) + w(item.word(c.verb.id)) * 0.5),
    gale: createDeck<ForgeSentence>(GALE_SENTENCES, (s) => w(item.sentence(s.id))),
    gap: createDeck<Gap>(GAPS, (g) => w(item.grammar(g.grammar))),
  }))
  const [q, setQ] = useState<Q | null>(null)
  const [placed, setPlaced] = useState<number[]>([])
  const [reveal, setReveal] = useState<{ picked: string | null; ok: boolean } | null>(null)
  const [beat, setBeat] = useState(0)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 4,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setPlaced([])
      setBeat((b) => b + 1)
      const drum = (): Q => {
        const c = decks.drum.next()
        return { kind: 'drum', q: drumQuestion(c.verb, c.form) }
      }
      if (ph === 0) setQ(drum())
      else if (ph === 1) setQ({ kind: 'gale', q: galeQuestion(decks.gale.next()) })
      else if (beat % 2 === 0) setQ(drum())
      else {
        const g = decks.gap.next()
        setQ({ kind: 'gap', q: g, options: gapOptions(g) })
      }
    },
  })
  const elapsed = useAnswerTimer(battle.turn)
  const active = !!q && !reveal && !battle.busy

  function finishTurn(ok: boolean, picked: string | null, reviews: Review[], speakText: string, delay?: number) {
    setReveal({ picked, ok })
    if (ok) void speak(speakText)
    battle.resolve(ok, reviews, { heroic: reviews.map((r) => r.itemId), delay: delay ?? (ok ? 1000 : 3000) })
  }

  function chooseDrum(o: string | null) {
    if (!q || q.kind !== 'drum' || !active) return
    const ok = o === q.q.answer
    sfx.cast()
    if (!ok) decks.drum.requeue({ verb: q.q.verb, form: q.q.form })
    finishTurn(ok, o, drumReviews(q.q, ok, elapsed()), q.q.answer, ok ? 900 : 3200)
  }

  function chooseGap(o: string) {
    if (!q || q.kind !== 'gap' || !active) return
    const ok = o === q.q.answer
    sfx.cast()
    if (!ok) decks.gap.requeue(q.q)
    finishTurn(ok, o, [{ itemId: item.grammar(q.q.grammar), correct: ok, ms: elapsed() }], q.q.jp.replace('＿', q.q.answer), ok ? 1100 : 3400)
  }

  function place(i: number) {
    if (!q || q.kind !== 'gale' || !active || placed.includes(i) || i >= q.q.tiles.length) return
    sfx.click()
    setPlaced((p) => [...p, i])
  }
  function unplace(pos: number) {
    if (!active) return
    setPlaced((p) => p.filter((_, j) => j !== pos))
  }
  const galeLen = q?.kind === 'gale' ? q.q.sentence.tokens.length : 0
  function submitGale() {
    if (!q || q.kind !== 'gale' || !active || placed.length !== galeLen) return
    const picked = placed.map((i) => q.q.tiles[i])
    const ok = galeCorrect(q.q.sentence, picked)
    sfx.cast()
    if (!ok) decks.gale.requeue(q.q.sentence)
    finishTurn(ok, picked.join(''), [{ itemId: item.sentence(q.q.sentence.id), correct: ok, ms: elapsed() }], q.q.sentence.tokens.join(''), ok ? 1200 : 3400)
  }
  useNumberKeys(q?.kind === 'gale' ? q.q.tiles.length : 0, place, active && q?.kind === 'gale')
  useKey('Enter', submitGale, active && q?.kind === 'gale' && placed.length === galeLen)
  useKey('Backspace', () => setPlaced((p) => p.slice(0, -1)), active && q?.kind === 'gale' && placed.length > 0)

  const phase = battle.phase
  const aura = phase === 0 ? '#ffe066' : phase === 1 ? '#9be7e0' : '#c7a3f0'
  const sprite = (
    <div className={`rj-storm rj-p${phase}`} aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} className="rj-drum" style={{ ['--i' as string]: i }} />
      ))}
      {phase >= 1 && (
        <span className="rj-gust">
          {Array.from({ length: 5 }, (_, i) => (
            <b key={i} style={{ ['--i' as string]: i }} />
          ))}
        </span>
      )}
    </div>
  )
  const taunt =
    q?.kind === 'drum'
      ? { jp: `ドン！「${q.q.verb.kana}」を ${FORM_CALL[q.q.form].jp}`, en: `BOOM! “${q.q.verb.kana}” — ${FORM_CALL[q.q.form].en}` }
      : q?.kind === 'gale'
        ? { jp: 'ふうじん：ひゅうう！ ぶんを ふきとばして やる！', en: 'Fūjin: Whooosh! I’ll blow your sentence away!' }
        : { jp: 'かぜと かみなりの あらしだ！', en: 'A storm of wind and thunder!' }

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Raijin and Fūjin', jp: 'らいじんと ふうじん' }}
      spriteId="raijin"
      spriteFilter={phase === 1 ? tintFilter('#9be7e0', 0.35) : phase === 2 ? tintFilter('#c7a3f0', 0.4) : 'none'}
      sprite={sprite}
      floor={SKY_FLOOR}
      aura={aura}
      phaseNames={[
        { en: 'Drum Call', jp: 'たいこの よびごえ' },
        { en: 'Fūjin’s Gale', jp: 'ふうじんの かぜ' },
        { en: 'Wind and Thunder', jp: 'かぜと かみなり' },
      ]}
      introLines={[
        'Raijin drums every sentence to pieces. Answer each beat in the form he calls for.',
        'Phase 1: he shouts a verb and a form: ない (don’t), potential (can), 〜たら or 〜ば (if). Pick it before the next beat.',
        'Phase 2: Fūjin blows a sentence apart, with one stray word mixed in. Rebuild it.',
        'Phase 3: both gods at once. Faster drums, and gaps to fill with the right grammar.',
      ]}
      taunt={taunt}
      victory={{ jp: 'たいこが しずまった！', en: 'The drums fall quiet!' }}
    >
      {q?.kind === 'drum' && (
        <>
          <TimerBar ms={DRUM_MS[phase] ?? 9000} active={active} id={battle.turn} onTimeout={() => chooseDrum(null)} />
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en={FORM_CALL[q.q.form].en} jp={FORM_CALL[q.q.form].jp} />
            </div>
            <div className="ba-prompt-big rj-verb" lang="ja" key={battle.turn}>
              {q.q.verb.jp !== q.q.verb.kana && <ruby>{q.q.verb.jp}<rt>{q.q.verb.kana}</rt></ruby>}
              {q.q.verb.jp === q.q.verb.kana && q.q.verb.jp}
            </div>
            <div className="muted">“{q.q.verb.en}”</div>
          </div>
          <ChoiceGrid options={q.q.options} jp onPick={chooseDrum} reveal={reveal && { picked: reveal.picked, accepted: [q.q.answer] }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {reveal.picked === null && 'Too slow! '}
                {q.q.verb.kana} → {q.q.answer}
                <small>{q.q.rule}</small>
              </>
            )}
          </Feedback>
        </>
      )}
      {q?.kind === 'gale' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="Rebuild the sentence (one word is a stray):" jp="ぶんを つくりなおそう（ひとつは よけいな ことば）：" />
            </div>
            <div className="bd-en">“{q.q.sentence.en}”</div>
            <div className={`bd-line ${reveal ? (reveal.ok ? 'ok' : 'bad') : ''}`} lang="ja">
              {placed.length === 0 && <span className="muted bd-placeholder">…</span>}
              {placed.map((i, pos) => (
                <button key={pos} type="button" className="bd-placed" onClick={() => unplace(pos)} disabled={!active}>
                  {q.q.tiles[i]}
                </button>
              ))}
            </div>
          </div>
          <div className="bd-tiles">
            {q.q.tiles.map((t, i) => (
              <button key={i} type="button" className="bd-tile choice-jp" lang="ja" disabled={!active || placed.includes(i)} onClick={() => place(i)}>
                <span className="ba-key" aria-hidden>
                  {i + 1}
                </span>
                {t}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-lg" disabled={!active || placed.length !== galeLen} onClick={submitGale}>
            🌪️ <T en="Hold it together!" jp="つなぎとめる！" />
          </button>
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {q.q.sentence.tokens.join('')}
                <small>{q.q.sentence.hint}</small>
              </>
            )}
          </Feedback>
        </>
      )}
      {q?.kind === 'gap' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="Fill the gap the storm tore out:" jp="あらしが ちぎった ところを うめよう：" />
            </div>
            <div className="ba-prompt-main" lang="ja">
              {q.q.jp}
            </div>
            <div className="muted">“{q.q.en}”</div>
          </div>
          <ChoiceGrid options={q.options} jp onPick={chooseGap} reveal={reveal && { picked: reveal.picked, accepted: [q.q.answer] }} />
          <Feedback ok={reveal?.ok ?? null}>{reveal && <>{q.q.jp.replace('＿', q.q.answer)}</>}</Feedback>
        </>
      )}
    </BossArena>
  )
}
