import { useState } from 'react'
import type { GameProps } from '../types'
import type { ForgeSentence } from '../../data/sentences'
import type { Word } from '../../data/vocab'
import { item } from '../../engine/items'
import { speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sfx } from '../../engine/sfx'
import { pick as pickOne } from '../../engine/random'
import { T, useAnswerTimer } from '../../components/ui'
import { CHIMERA_TURNS, type ChimeraTurn, type DragonForm } from './bossData'
import { BossArena, ChoiceGrid, Feedback, TimerBar } from './BossArena'
import { useBossBattle, useKey, useNumberKeys } from './battle'
import {
  castQuestion,
  checkOrder,
  chimeraQuestion,
  createDeck,
  DRAGON_FORMS,
  dragonKanjiPool,
  isAccepted,
  joinTokens,
  kanjiWordQuestion,
  orderPool,
  orderQuestion,
  type CastQ,
  type ChimeraQ,
  type KanjiWordQ,
  type OrderQ,
} from './bossLogic'
import './bosses.css'

type AdjQ = ChimeraQ & { options: string[]; answer: string }
type Q = { kind: 'kanji'; q: KanjiWordQ } | { kind: 'order'; q: OrderQ } | { kind: 'cast'; q: CastQ } | { kind: 'adj'; q: AdjQ }

const KANJI_MS = 5000
const w = (id: string) => weakness(getState().srs[id])

function adjQuestion(turn: ChimeraTurn): AdjQ {
  const c = chimeraQuestion(turn)
  const wrap = (a: string) => (turn.frame ? turn.frame.replace('＿', a) : `${a}${c.nounAnswer}`)
  return { ...c, options: c.adjOptions.map(wrap), answer: wrap(c.adjAnswer) }
}

export default function VoidDragon({ activity, onFinish, onExit }: GameProps<'boss-dragon'>) {
  const [decks] = useState(() => ({
    kanji: createDeck<Word>(dragonKanjiPool(), (x) => w(item.word(x.id))),
    order: createDeck<ForgeSentence>(orderPool(), (s) => w(item.sentence(s.id))),
    adj: createDeck<ChimeraTurn>(CHIMERA_TURNS, (t) => w(item.adjective(t.adj))),
  }))
  const [q, setQ] = useState<Q | null>(null)
  const [form, setForm] = useState<DragonForm | null>(null)
  const [placed, setPlaced] = useState<number[]>([])
  const [reveal, setReveal] = useState<{ picked: string | null; ok: boolean } | null>(null)
  const [castCount, setCastCount] = useState(0)

  const battle = useBossBattle({
    maxHp: 15,
    hearts: 3,
    phaseAt: [10, 5],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setPlaced([])
      if (ph === 0) setQ({ kind: 'kanji', q: kanjiWordQuestion(decks.kanji.next()) })
      else if (ph === 1) setQ({ kind: 'order', q: orderQuestion(decks.order.next()) })
      else {
        setCastCount((n) => n + 1)
        // Alternate: incantation (shifting weakness) and adjective conjugation.
        if (castCount % 2 === 0) {
          const f = pickOne(DRAGON_FORMS.filter((x) => x.id !== form?.id))
          setForm(f)
          setQ({ kind: 'cast', q: castQuestion(f) })
        } else setQ({ kind: 'adj', q: adjQuestion(decks.adj.next()) })
      }
    },
  })
  const elapsed = useAnswerTimer(battle.turn)
  const active = !!q && !reveal && !battle.busy

  function resolve(ok: boolean, picked: string | null, itemId: string, speakText: string, delay?: number) {
    const ms = elapsed()
    setReveal({ picked, ok })
    if (ok) void speak(speakText)
    battle.resolve(ok, [{ itemId, correct: ok, ms }], { heroic: [itemId], delay: delay ?? (ok ? 900 : 2600) })
  }

  function choose(o: string | null) {
    if (!q || !active) return
    if (q.kind === 'kanji') {
      const ok = o !== null && isAccepted(q.q, o)
      if (!ok) decks.kanji.requeue(q.q.word)
      resolve(ok, o, q.q.itemId, q.q.word.kana, ok ? 700 : 2200)
    } else if (q.kind === 'cast') {
      sfx.cast()
      resolve(o !== null && isAccepted(q.q, o), o, q.q.itemId, q.q.accepted[0])
    } else if (q.kind === 'adj') {
      const ok = o === q.q.answer
      if (!ok) decks.adj.requeue(q.q.turn)
      resolve(ok, o, q.q.itemId, q.q.answer, ok ? 1100 : 3200)
    }
  }

  function place(i: number) {
    if (!q || q.kind !== 'order' || !active || placed.includes(i) || i >= q.q.tiles.length) return
    sfx.click()
    setPlaced((p) => [...p, i])
  }
  function unplace(pos: number) {
    if (!active) return
    setPlaced((p) => p.filter((_, j) => j !== pos))
  }
  function submitOrder() {
    if (!q || q.kind !== 'order' || !active || placed.length !== q.q.tiles.length) return
    const picked = placed.map((i) => q.q.tiles[i])
    const ok = checkOrder(q.q.sentence, picked)
    sfx.cast()
    if (!ok) decks.order.requeue(q.q.sentence)
    resolve(ok, joinTokens(picked), q.q.itemId, joinTokens(q.q.sentence.tokens), ok ? 1100 : 3000)
  }
  useNumberKeys(q?.kind === 'order' ? q.q.tiles.length : 0, place, active && q?.kind === 'order')
  useKey('Enter', submitOrder, active && q?.kind === 'order' && placed.length === q.q.tiles.length)
  useKey('Backspace', () => setPlaced((p) => p.slice(0, -1)), active && q?.kind === 'order' && placed.length > 0)

  const phase = battle.phase
  const aura = phase === 2 && form ? form.color : phase === 1 ? '#ff3d6b' : '#8a6bff'
  const sprite = (
    <div className={`bd-dragon bd-p${phase}`}>
      <span className="bd-body">🐉</span>
      {phase === 2 && form && (
        <span className="bd-form" key={form.id}>
          {form.emoji}
        </span>
      )}
    </div>
  )
  const taunt =
    phase === 0
      ? { jp: 'よめなければ しぬ。', en: 'Read, or perish.' }
      : phase === 1
        ? { jp: 'ことばを ならべてみよ！', en: 'Put your words in order!' }
        : form && q?.kind === 'cast'
          ? { jp: form.jp, en: form.en }
          : { jp: 'わがちからを えがけるか？', en: 'Can you even describe my power?' }

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'The Void Dragon', jp: 'こくうのりゅう' }}
      sprite={sprite}
      aura={aura}
      className="bd-final"
      phaseNames={[
        { en: 'Storm of Kanji', jp: 'かんじのあらし' },
        { en: 'Broken Sentences', jp: 'くだけたぶん' },
        { en: 'The Final Incantation', jp: 'さいごのじゅもん' },
      ]}
      introLines={[
        'The final guardian. Everything you have learned is your weapon.',
        'Phase 1: read kanji words — fast (5 s each).',
        'Phase 2: rebuild its broken sentences, tile by tile.',
        'Phase 3: its weakness shifts — chant the right incantation, and describe your magic precisely.',
        'Only 3 hearts. No brute force.',
      ]}
      taunt={taunt}
      victory={{ jp: '世界を守った！', en: 'The world is saved!' }}
    >
      {q?.kind === 'kanji' && (
        <>
          <TimerBar ms={KANJI_MS} active={active} id={battle.turn} onTimeout={() => choose(null)} />
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="A kanji storm! What does it mean?" jp="このかんじの いみは？" />
            </div>
            <div className="ba-prompt-big" lang="ja" key={battle.turn}>
              {q.q.word.jp}
            </div>
          </div>
          <ChoiceGrid options={q.q.options} onPick={choose} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {reveal.picked === null && 'Too slow! '}
                {q.q.word.emoji} {q.q.word.jp} ({q.q.word.kana}) = {q.q.word.en}
              </>
            )}
          </Feedback>
        </>
      )}
      {q?.kind === 'order' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="Rebuild the sentence:" jp="ぶんを つくろう：" />
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
          <button type="button" className="btn btn-primary btn-lg" disabled={!active || placed.length !== q.q.tiles.length} onClick={submitOrder}>
            ⚔️ <T en="Strike!" jp="うつ！" />
          </button>
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {joinTokens(q.q.sentence.tokens)}
                <small>{q.q.sentence.hint}</small>
              </>
            )}
          </Feedback>
        </>
      )}
      {q?.kind === 'cast' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en={`It becomes the ${q.q.form.en}!`} jp={`${q.q.form.jp}に なった！`} />
            </div>
            <div className="bd-hint">{q.q.form.hint}</div>
            <div className="muted bd-sub">
              <T en={q.q.pattern === 'no' ? 'Chant: "magic of …"' : 'Chant: "I use …"'} jp={q.q.pattern === 'no' ? '「〜のまほう」' : '「〜を使います」'} />
            </div>
          </div>
          <ChoiceGrid options={q.q.options} jp onPick={choose} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal &&
              (reveal.ok ? (
                <>
                  {q.q.spell.emoji} {q.q.accepted[0]}！
                </>
              ) : (
                <>{(reveal.picked && q.q.why[reveal.picked]) ?? ''}</>
              ))}
          </Feedback>
        </>
      )}
      {q?.kind === 'adj' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">{q.q.turn.situation}</div>
            <div className="bd-hint">{q.q.turn.instruction}</div>
          </div>
          <ChoiceGrid className="ba-choices-1" options={q.q.options} jp onPick={choose} reveal={reveal && { picked: reveal.picked, accepted: [q.q.answer] }} />
          <Feedback ok={reveal?.ok ?? null}>{reveal && <>{reveal.ok ? `${q.q.answer}！` : q.q.rule}</>}</Feedback>
        </>
      )}
    </BossArena>
  )
}
