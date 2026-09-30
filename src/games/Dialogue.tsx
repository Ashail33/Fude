import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as wanakana from 'wanakana'
import type { GameProps, GameResult } from './types'
import { GameFrame, Hearts, HpBar, Intro, KanaInput, SpeakButton, useAnswerTimer, useBurst, useFlash } from '../components/ui'
import { NPC_BY_ID, SCENARIO_BY_ID, type DialogueOption, type Line, type Scenario } from '../data/npcs'
import {
  advance,
  choose,
  currentNode,
  fill,
  scoreOf,
  startDialogue,
  submitText,
  submitVerdict,
  takeHint,
  visibleOptions,
  type AnswerResult,
  type DialogueState,
} from '../engine/dialogue'
import { shuffle } from '../engine/random'
import { sfx } from '../engine/sfx'
import { canListen, listen, matchUtterance, speak } from '../engine/speech'
import { adjustTrust, grantSpell, usePlayer } from '../engine/store'
import './Dialogue.css'

const SPELL_ICON: Record<string, string> = { 火: '🔥', 水: '💧', 木: '🌳' }

interface Feedback {
  /** Node where the answer was given (kept on screen while feedback shows). */
  nodeId: string
  correct: boolean
  said?: { jp: string; en: string }
  reply?: Line
  note?: string
  model?: string
  spell?: string
  jailed?: boolean
  heard?: string
  /** Voice mismatch: no penalty was applied. */
  soft?: boolean
}

/** Typewriter reveal of `text`; returns [shown, done, skip]. */
function useTypewriter(text: string, speedMs = 45): [string, boolean, () => void] {
  const [n, setN] = useState(0)
  const [prev, setPrev] = useState(text)
  if (prev !== text) {
    setPrev(text)
    setN(0)
  }
  useEffect(() => {
    if (n >= text.length) return
    const id = setTimeout(() => setN((x) => x + 1), speedMs)
    return () => clearTimeout(id)
  }, [n, text, speedMs])
  const skip = useCallback(() => setN(text.length), [text])
  return [text.slice(0, n), n >= text.length, skip]
}

export default function Dialogue({ activity, params, onFinish, onExit }: GameProps<'dialogue'>) {
  const scenario = SCENARIO_BY_ID.get(params.scenarioId)
  if (!scenario) {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit}>
        <div className="card center">
          <p>Unknown scenario “{params.scenarioId}”.</p>
          <button type="button" className="btn" onClick={onExit}>
            Back
          </button>
        </div>
      </GameFrame>
    )
  }
  return <DialogueGame key={scenario.id} scenario={scenario} activity={activity} onFinish={onFinish} onExit={onExit} />
}

function DialogueGame({
  scenario: sc,
  activity,
  onFinish,
  onExit,
}: {
  scenario: Scenario
  activity: GameProps<'dialogue'>['activity']
  onFinish: (r: GameResult) => void
  onExit: () => void
}) {
  const p = usePlayer()
  const vars = useMemo(() => ({ name: p.name.trim() || 'ユウ' }), [p.name])
  const [started, setStarted] = useState(false)
  const [st, setSt] = useState<DialogueState>(() => startDialogue(sc))
  const [visit, setVisit] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [chosen, setChosen] = useState<DialogueOption | null>(null)
  const [hinted, setHinted] = useState<Set<string>>(new Set())
  const [typed, setTyped] = useState('')
  const [listening, setListening] = useState(false)
  const [burst, fire] = useBurst()
  const [flashCls, flash] = useFlash()
  const finished = useRef(false)
  const cancelListen = useRef<(() => void) | null>(null)
  const elapsed = useAnswerTimer(`${st.nodeId}:${visit}`)

  const node = currentNode(sc, st)
  const shownNode = feedback ? sc.nodes[feedback.nodeId] ?? node : node
  const speaker = NPC_BY_ID.get(shownNode.speaker ?? sc.npcId) ?? NPC_BY_ID.get(sc.npcId)!
  const mainNpc = NPC_BY_ID.get(sc.npcId)!
  const goalSpells = useMemo(() => Object.values(sc.nodes).find((n) => n.exitWhen)?.exitWhen?.spells ?? [], [sc])
  const hintMode = sc.translations === 'hint'
  const showEn = !hintMode || hinted.has(node.id)

  // What the NPC is currently saying: their reaction after an answer, else the node line.
  const bubble: Line = feedback?.reply ?? shownNode.line
  const bubbleJp = fill(bubble.jp, vars)
  const lineSpeech = fill(shownNode.kana ?? shownNode.line.jp, vars)
  const speechText = feedback ? (feedback.reply?.jp ?? (feedback.correct ? feedback.said?.jp : undefined) ?? lineSpeech) : lineSpeech
  const [shown, typedOut, skipType] = useTypewriter(started ? bubbleJp : '')

  // Options for this visit: all correct ones + decoys, max 4, shuffled once per visit.
  const options = useMemo(() => {
    const vis = visibleOptions(node, st)
    const right = vis.filter((o) => o.correct)
    const wrong = shuffle(vis.filter((o) => !o.correct))
    return shuffle([...right, ...wrong].slice(0, 4))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, visit])

  const finish = useCallback(
    (s: DialogueState) => {
      if (finished.current) return
      finished.current = true
      const { score, maxScore } = scoreOf(s)
      const notes: string[] = []
      if (s.spells.length) notes.push(`Spells obtained: ${s.spells.map((x) => `${SPELL_ICON[x] ?? ''}${x}`).join(' ')}`)
      if (s.jailed) notes.push(`Thrown in the dungeon ${s.jailed}× — apologies learned!`)
      if (s.hintsUsed) notes.push(`Hints used: ${s.hintsUsed}`)
      notes.push(`${mainNpc.jp}: trust ${s.trust}/${sc.trustMax}`)
      onFinish({ score, maxScore, reviews: s.reviews, passed: s.outcome === 'win' && score / maxScore >= 0.6, notes })
    },
    [onFinish, mainNpc, sc.trustMax],
  )

  // Speak each new NPC line (and correct answers).
  useEffect(() => {
    if (!started || !speechText) return
    void speak(speechText)
  }, [started, speechText, visit])

  // Auto-finish shortly after the final line has been typed out.
  useEffect(() => {
    if (!started || !st.outcome || feedback) return
    if (!typedOut && st.outcome === 'win') return
    const id = setTimeout(() => finish(st), st.outcome === 'win' ? 1500 : 900)
    return () => clearTimeout(id)
  }, [started, st, feedback, typedOut, finish])

  useEffect(() => () => cancelListen.current?.(), [])

  const applyResult = useCallback(
    (r: AnswerResult, said?: DialogueOption) => {
      if (r.grantSpell) grantSpell(r.grantSpell)
      if (r.trustDelta) adjustTrust(sc.npcId, r.trustDelta)
      if (r.correct) {
        sfx.correct()
        fire(50, 30, r.grantSpell ? 20 : 12)
        flash('good')
        if (r.grantSpell) sfx.cast()
      } else {
        sfx.wrong()
        flash('bad')
        if (r.state.outcome === 'lose') sfx.lose()
      }
      setFeedback({
        nodeId: st.nodeId,
        correct: r.correct,
        said: said && { jp: fill(said.jp, vars), en: fill(said.en, vars) },
        reply: r.reply && { jp: fill(r.reply.jp, vars), en: fill(r.reply.en, vars) },
        note: r.note && fill(r.note, vars),
        model: r.model && fill(r.model, vars),
        spell: r.grantSpell,
        jailed: r.jailed,
      })
      setSt(r.state)
    },
    [sc.npcId, fire, flash, vars, st.nodeId],
  )

  const pickOption = useCallback(
    (o: DialogueOption) => {
      if (feedback || st.outcome) return
      if (!typedOut) skipType()
      setChosen(o)
      applyResult(choose(sc, st, o, elapsed()), o)
    },
    [feedback, st, sc, typedOut, skipType, applyResult, elapsed],
  )

  const submitTyped = useCallback(
    (text: string) => {
      if (feedback || st.outcome || !node.input || !text.trim()) return
      applyResult(submitText(sc, st, text, elapsed()), { jp: text, en: '', correct: false })
      setTyped('')
    },
    [feedback, st, node, sc, applyResult, elapsed],
  )

  const startVoice = useCallback(() => {
    if (!node.input || listening || feedback) return
    setListening(true)
    const { promise, cancel } = listen()
    cancelListen.current = cancel
    promise
      .then((alts) => {
        const inp = node.input!
        const score = matchUtterance(alts, inp.accepted)
        const heard = alts[0]?.transcript ?? ''
        if (score >= 0.85) {
          applyResult(submitVerdict(sc, st, true, elapsed()), { jp: heard, en: '', correct: true })
        } else {
          // Recognition is imperfect: no heart lost, but the guard refuses.
          sfx.wrong()
          flash('bad')
          setFeedback({ nodeId: st.nodeId, correct: false, soft: true, heard, reply: inp.wrongReply, note: inp.wrongNote })
        }
      })
      .catch((e: Error) => {
        setFeedback({ nodeId: st.nodeId, correct: false, soft: true, heard: '', reply: node.input!.wrongReply, note: e.message === 'no-speech' ? 'I heard nothing — try again, or type it.' : `Microphone unavailable (${e.message}). Type your answer instead.` })
      })
      .finally(() => {
        setListening(false)
        cancelListen.current = null
      })
  }, [node, listening, feedback, sc, st, applyResult, elapsed, flash])

  const next = useCallback(() => {
    if (st.outcome === 'lose') return finish(st)
    if (feedback) {
      setFeedback(null)
      setChosen(null)
      setVisit((v) => v + 1)
      return
    }
    if (!typedOut) return skipType()
    if (!node.options?.length && !node.input && !node.end) {
      setSt(advance(sc, st))
      setVisit((v) => v + 1)
    }
  }, [st, feedback, typedOut, skipType, node, sc, finish])

  const buyHint = useCallback(() => {
    if (hinted.has(node.id)) return
    sfx.click()
    setHinted((h) => new Set(h).add(node.id))
    setSt((s) => takeHint(s))
  }, [hinted, node.id])

  // Keyboard: 1–4 choose, Enter continues.
  useEffect(() => {
    if (!started) return
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return
      if (e.key === 'Enter' || e.key === ' ') {
        if (tgt?.tagName === 'BUTTON') return
        e.preventDefault()
        next()
        return
      }
      const i = Number(e.key) - 1
      if (i >= 0 && i < options.length && !feedback && node.options?.length) pickOption(options[i])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, next, options, feedback, node, pickOption])

  const trustLow = st.trust <= (sc.jail?.threshold ?? -1) + 1
  const right = <Hearts value={st.hearts} max={sc.hearts} />

  if (!started) {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro
          title={activity.title}
          jp={activity.jp}
          lines={sc.intro}
          onStart={() => {
            sfx.click()
            setStarted(true)
          }}
        >
          <div className="dlg-intro-portrait" style={{ ['--npc' as string]: mainNpc.color }}>
            <span aria-hidden>{mainNpc.emoji}</span>
            <small lang="ja">{mainNpc.jp}</small>
          </div>
        </Intro>
      </GameFrame>
    )
  }

  const canContinue = !!feedback || (!node.options?.length && !node.input && !node.end)
  const showRomaji = p.settings.showRomaji && sc.region <= 2

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
      <div className={`dlg-scene dlg-r${sc.region} ${node.jail ? 'dlg-jail' : ''} ${flashCls}`}>
        {burst}
        <div className="dlg-top">
          <div
            className={`dlg-portrait ${feedback ? (feedback.correct ? 'dlg-happy' : 'dlg-upset') : ''}`}
            style={{ ['--npc' as string]: speaker.color }}
            key={`${speaker.id}-${visit}`}
            aria-label={speaker.name}
          >
            <span className="dlg-emoji" aria-hidden>
              {speaker.emoji}
            </span>
            <span className="dlg-name" lang="ja">
              {speaker.jp}
            </span>
          </div>
          <div className="dlg-meters">
            <HpBar
              value={st.trust}
              max={sc.trustMax}
              color={trustLow ? 'var(--bad)' : mainNpc.color}
              label={
                <span>
                  {sc.jail ? '👑' : '💛'} <span lang="ja">しんらい</span> <small className="muted">trust</small>
                </span>
              }
            />
            {goalSpells.length > 0 && (
              <div className="dlg-spells" aria-label="Spells obtained">
                {goalSpells.map((sp) => (
                  <span key={sp} className={`dlg-spell ${st.spells.includes(sp) ? 'on pop' : ''}`} title={sp}>
                    <span aria-hidden>{SPELL_ICON[sp] ?? '✨'}</span>
                    <b lang="ja">{sp}</b>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dlg-bubble" onClick={skipType} role="status" aria-live="polite" style={{ ['--npc' as string]: speaker.color }}>
          <div className="dlg-bubble-jp" lang="ja">
            {shown}
            {!typedOut && <span className="dlg-caret">▍</span>}
          </div>
          {typedOut && (showEn || feedback) && <div className="dlg-bubble-en">{fill(bubble.en, vars)}</div>}
          <div className="dlg-bubble-tools">
            <SpeakButton text={feedback?.reply ? feedback.reply.jp : lineSpeech} />
            {hintMode && !feedback && !node.end && (node.options?.length || node.input) && (
              <button type="button" className="btn btn-sm dlg-hint" onClick={buyHint} disabled={hinted.has(node.id)} title="Show English (lowers your score)">
                💡 {hinted.has(node.id) ? 'Hint shown' : 'Hint'}
              </button>
            )}
          </div>
          {hintMode && hinted.has(node.id) && node.hint && !feedback && <div className="dlg-hint-text">💡 {fill(node.hint, vars)}</div>}
          {!hintMode && node.hint && !feedback && typedOut && <div className="dlg-hint-text">💡 {fill(node.hint, vars)}</div>}
        </div>

        {feedback && (
          <div className={`dlg-feedback card ${feedback.correct ? 'good' : 'bad'} pop`}>
            {feedback.said && feedback.said.jp && (
              <div className="dlg-said">
                <span className="muted">You said:</span> <b lang="ja">{feedback.said.jp}</b>
                {feedback.said.en && <span className="muted"> — “{feedback.said.en}”</span>}
              </div>
            )}
            {feedback.soft && feedback.heard !== undefined && feedback.heard !== '' && (
              <div className="dlg-said">
                <span className="muted">🎤 Heard:</span> <b lang="ja">{feedback.heard}</b>
              </div>
            )}
            <div className="dlg-verdict">
              {feedback.correct ? '✨ ' + (feedback.spell ? `You obtained the ${SPELL_ICON[feedback.spell] ?? ''} ${feedback.spell} spell!` : 'Well said!') : feedback.soft ? '🎤 Not quite — try again (no ❤️ lost).' : '💔 Not quite.'}
            </div>
            {feedback.note && <p className="dlg-note">{feedback.note}</p>}
            {feedback.model && (
              <p className="dlg-model">
                ✅ <span lang="ja">{feedback.model}</span> <SpeakButton text={feedback.model} />
              </p>
            )}
            {feedback.jailed && <p className="dlg-note">⛓️ The King’s trust hit zero. To the dungeon!</p>}
          </div>
        )}

        {!feedback && !st.outcome && node.options && node.options.length > 0 && (
          <div className="dlg-options" role="group" aria-label="Your reply">
            {options.map((o, i) => {
              const jp = fill(o.jp, vars)
              const kana = o.kana ? fill(o.kana, vars) : undefined
              return (
                <button key={o.jp} type="button" className={`choice dlg-option ${chosen === o ? (o.correct ? 'correct' : 'wrong') : ''}`} onClick={() => pickOption(o)}>
                  <span className="dlg-key">{i + 1}</span>
                  <span className="dlg-option-text">
                    <span className="dlg-option-jp" lang="ja">
                      {jp}
                    </span>
                    {kana && kana !== jp && (
                      <small className="dlg-option-kana" lang="ja">
                        {kana}
                      </small>
                    )}
                    {showRomaji && <small className="dlg-option-romaji">{wanakana.toRomaji(kana ?? jp)}</small>}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {!feedback && !st.outcome && node.input && (
          <div className="dlg-input card">
            <label className="prompt-label" htmlFor="dlg-typed">
              ✍️ Type it (romaji → かな) or speak it
            </label>
            <div className="dlg-input-row">
              <KanaInput value={typed} onChange={setTyped} onSubmit={submitTyped} autoFocus placeholder="hashi o watarimasu…" />
              <button type="button" className="btn btn-primary" onClick={() => submitTyped(typed)} disabled={!typed.trim()}>
                Say
              </button>
              {canListen() && (
                <button type="button" className={`btn ${listening ? 'dlg-listening' : ''}`} onClick={startVoice} disabled={listening} aria-label="Speak your answer">
                  🎤{listening ? '…' : ''}
                </button>
              )}
            </div>
          </div>
        )}

        {canContinue && !(st.outcome === 'win' && !feedback) && (
          <button type="button" className="btn btn-primary btn-lg dlg-continue" onClick={next} autoFocus>
            {st.outcome === 'lose' ? 'The conversation is over…' : 'Continue ▶'}
          </button>
        )}
        {st.outcome === 'win' && !feedback && (
          <button type="button" className="btn btn-lg dlg-continue" onClick={() => finish(st)}>
            ✨ Farewell
          </button>
        )}
      </div>
    </GameFrame>
  )
}
