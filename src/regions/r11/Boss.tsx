import { useEffect, useRef, useState } from 'react'
import type { GameProps } from '../../games/types'
import type { Review } from '../../engine/srs'
import { canSpeak, hasJapaneseVoice, speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sfx } from '../../engine/sfx'
import { T, useAnswerTimer } from '../../components/ui'
import type { StripCell } from '../../games/pixel'
import { tintFilter } from '../../games/pixelHooks'
import { BossArena, ChoiceGrid, Feedback, TimerBar } from '../../games/bosses/BossArena'
import { useBossBattle, useKey } from '../../games/bosses/battle'
import { createDeck } from '../../games/bosses/bossLogic'
import { MEANINGS, meaningOptions, pickOptions, POLITE, RATES, REPLAYS, REPLIES, reviewItems, STOLEN, type Heard, type Meaning, type Pick } from './nopperabo'
import '../../games/bosses/bosses.css'
import './Boss.css'

/**
 * Nopperabō of the Last Platform: a listening fight. The faceless yokai
 * speaks, and its words never appear on screen until you have answered.
 *  1. Faceless Voice: hear a casual line, pick what it means.
 *  2. The Right Reply: hear a line, pick the natural reply.
 *  3. Was It Like THIS? (the twist): it talks faster, in the stolen voices
 *     of Tetsu, Mari and Pon, and you may only hear each line twice. Pick
 *     the polite way to say it, and each right answer gives a face back.
 */
type Q = { kind: 'meaning'; q: Meaning; options: string[] } | { kind: 'reply'; q: Pick; options: string[] } | { kind: 'polite'; q: Pick; options: string[]; voice: number }

const POLITE_MS = 20000
const w = (q: Heard) => {
  const ids = reviewItems(q)
  return ids.reduce((sum, id) => sum + weakness(getState().srs[id]), 0) / Math.max(1, ids.length)
}

const PLATFORM: StripCell[][] = [['stone-floor', 'stone-floor', { id: 'lantern', under: 'stone-floor' }, 'stone-floor', 'stone-floor', 'stone-floor', 'stone-floor', 'stone-floor', { id: 'lantern', under: 'stone-floor' }, 'stone-floor']]

function audioAvailable(): boolean {
  return canSpeak() && hasJapaneseVoice()
}

export default function Boss({ activity, onFinish, onExit }: GameProps<'boss-nopperabo'>) {
  const [decks] = useState(() => ({
    meaning: createDeck<Meaning>(MEANINGS, w),
    reply: createDeck<Pick>(REPLIES, w),
    polite: createDeck<Pick>(POLITE, w),
  }))
  const [q, setQ] = useState<Q | null>(null)
  const [reveal, setReveal] = useState<{ picked: string | null; ok: boolean } | null>(null)
  const [replays, setReplays] = useState(0)
  const [talking, setTalking] = useState(false)
  const [reading, setReading] = useState(() => !audioAvailable())
  const [faces, setFaces] = useState(0)
  const voiceTurn = useRef(0)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 4,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setReplays(0)
      if (ph === 0) {
        const m = decks.meaning.next()
        setQ({ kind: 'meaning', q: m, options: meaningOptions(m) })
      } else if (ph === 1) {
        const r = decks.reply.next()
        setQ({ kind: 'reply', q: r, options: pickOptions(r) })
      } else {
        const p = decks.polite.next()
        const voice = voiceTurn.current++ % STOLEN.length
        setQ({ kind: 'polite', q: p, options: pickOptions(p), voice })
      }
    },
  })
  const elapsed = useAnswerTimer(battle.turn)
  const active = !!q && !reveal && !battle.busy
  const phase = battle.phase

  function say(item: Q) {
    const speaker = item.kind === 'polite' ? STOLEN[item.voice].voice : 'nopperabo'
    setTalking(true)
    void speak(item.q.kana, { force: true, speaker, rate: RATES[phase] ?? 1 }).then(() => setTalking(false))
  }

  // the line is spoken as soon as it is asked
  useEffect(() => {
    if (!q || reading) return
    const t = setTimeout(() => {
      setTalking(true)
      void speak(q.q.kana, { force: true, speaker: q.kind === 'polite' ? STOLEN[q.voice].voice : 'nopperabo', rate: RATES[phase] ?? 1 }).then(() => setTalking(false))
    }, 450)
    return () => clearTimeout(t)
  }, [q, reading, phase])

  const canReplay = !reading && active && replays < (REPLAYS[phase] ?? Infinity)
  function replay() {
    if (!q || !canReplay) return
    setReplays((n) => n + 1)
    say(q)
  }
  useKey('r', replay, canReplay)

  function answer(o: string | null) {
    if (!q || !active) return
    const ok = q.kind === 'meaning' ? o === q.q.en : o === q.q.answer
    sfx.cast()
    if (!ok) {
      if (q.kind === 'meaning') decks.meaning.requeue(q.q)
      else if (q.kind === 'reply') decks.reply.requeue(q.q)
      else decks.polite.requeue(q.q)
    }
    if (ok && q.kind === 'polite') setFaces((n) => n + 1)
    setReveal({ picked: o, ok })
    // after answering, hear it once more: the line itself, or the reply that fits it
    if (!reading) void speak(q.kind === 'meaning' ? q.q.kana : q.q.answer, { force: true, speaker: q.kind === 'meaning' ? 'nopperabo' : 'mage' })
    const ms = elapsed()
    const reviews: Review[] = reviewItems(q.q).map((itemId) => ({ itemId, correct: ok, ms }))
    battle.resolve(ok, reviews, { heroic: reviews.map((r) => r.itemId), delay: ok ? 1600 : 3600 })
  }

  const shown = reading || !!reveal
  const stolen = q?.kind === 'polite' ? STOLEN[q.voice] : null
  const aura = phase === 0 ? '#d9cbab' : phase === 1 ? '#9be7e0' : '#c7a3f0'
  const sprite = (
    <div className={`np-veil np-p${phase} ${talking ? 'np-talk' : ''}`} aria-hidden>
      {Array.from({ length: phase >= 2 ? 3 : 0 }, (_, i) => (
        <i key={i} className={`np-mask ${i < faces ? 'np-mask-back' : ''}`} style={{ ['--i' as string]: i }}>
          {i < faces ? STOLEN[i].face : '😶'}
        </i>
      ))}
      {talking && (
        <span className="np-waves">
          {Array.from({ length: 3 }, (_, i) => (
            <b key={i} style={{ ['--i' as string]: i }} />
          ))}
        </span>
      )}
    </div>
  )
  const taunt =
    q?.kind === 'meaning'
      ? { jp: '……（顔の ない 顔が、なにかを つぶやいた）', en: '…(The face with no face murmurs something.)' }
      : q?.kind === 'reply'
        ? { jp: '……（へんじを まって いる）', en: '…(It is waiting for your reply.)' }
        : stolen
          ? { jp: `「…こんな 顔だったか？」（${stolen.name.jp}の こえで）`, en: `“…Was it like THIS?” (in ${stolen.name.en}’s voice)` }
          : null

  const hint =
    q?.kind === 'meaning'
      ? { en: 'What did it say? Pick the meaning:', jp: 'なんと 言った？ いみを えらぼう：' }
      : q?.kind === 'reply'
        ? { en: 'Reply naturally, like a friend:', jp: 'しぜんに へんじを しよう：' }
        : { en: 'Say it politely to give the face back:', jp: 'ていねいに 言いなおして、顔を かえそう：' }

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Nopperabō', jp: 'のっぺらぼう' }}
      spriteId="nopperabo"
      spriteFilter={phase === 1 ? tintFilter('#9be7e0', 0.25) : phase === 2 ? tintFilter('#c7a3f0', 0.35) : 'none'}
      sprite={sprite}
      floor={PLATFORM}
      aura={aura}
      phaseNames={[
        { en: 'Faceless Voice', jp: 'かおの ない こえ' },
        { en: 'The Right Reply', jp: 'ただしい へんじ' },
        { en: 'Was It Like THIS?', jp: 'こんな かおだったか？' },
      ]}
      introLines={[
        'Nopperabō has no face, so its words never appear on screen. Listen!',
        'Phase 1: hear a casual line and pick what it means. Press R (or the speaker button) to hear it again.',
        'Phase 2: hear a line and pick the natural reply: あいづち, greetings, casual answers.',
        'Phase 3: it talks faster, in the stolen voices of the townsfolk, and you can only hear each line twice. Pick the polite way to say it, and win their faces back.',
        'No Japanese voice on this device? The words are shown instead.',
      ]}
      taunt={taunt}
      victory={{ jp: 'のっぺらぼうに、えがおが うかんだ！', en: 'A smile appears on Nopperabō’s blank face!' }}
    >
      {q && (
        <>
          {q.kind === 'polite' && <TimerBar ms={POLITE_MS} active={active} id={battle.turn} onTimeout={() => answer(null)} />}
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en={hint.en} jp={hint.jp} />
            </div>
            <div className={`np-line ${shown ? 'np-shown' : ''}`} lang="ja" key={battle.turn}>
              {shown ? (
                <>
                  <span className="np-jp">{q.q.jp}</span>
                  {q.q.jp !== q.q.kana && <span className="np-kana">{q.q.kana}</span>}
                  {reveal && <span className="muted np-en">“{q.q.en}”</span>}
                </>
              ) : (
                <span className="np-blank" aria-label="hidden line">
                  {talking ? '🔊 …' : '😶 ？？？'}
                </span>
              )}
            </div>
            {!reading && (
              <div className="np-tools">
                <button type="button" className="btn btn-sm" disabled={!canReplay} onClick={replay}>
                  🔊 <T en={REPLAYS[phase] === Infinity ? 'Hear again' : `Hear again (${Math.max(0, (REPLAYS[phase] ?? 0) - replays)} left)`} jp="もう いちど 聞く" />
                </button>
                {!reveal && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setReading(true)}>
                    <T en="Can’t hear? Show the words" jp="聞こえない？ 字を 見る" />
                  </button>
                )}
              </div>
            )}
          </div>
          <ChoiceGrid
            options={q.options}
            jp={q.kind !== 'meaning'}
            onPick={answer}
            disabled={!active}
            reveal={reveal && { picked: reveal.picked, accepted: [q.kind === 'meaning' ? q.q.en : q.q.answer] }}
          />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && q.kind === 'meaning' && (
              <>
                {reveal.picked === null && 'Too slow! '}
                {q.q.jp} = {q.q.en}
              </>
            )}
            {reveal && q.kind !== 'meaning' && (
              <>
                {reveal.picked === null && 'Too slow! '}
                {q.q.answer}
                <small>{q.q.answerEn}</small>
              </>
            )}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}
