import { useState } from 'react'
import type { GameProps } from '../types'
import { RECIPES, type KanjiRecipe } from '../../data/kanji'
import { item } from '../../engine/items'
import { speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sfx } from '../../engine/sfx'
import { T, useAnswerTimer } from '../../components/ui'
import { BossArena, ChoiceGrid, Feedback } from './BossArena'
import { useBossBattle, useKey, useNumberKeys } from './battle'
import { checkSplit, createDeck, fuseQuestion, isAccepted, meaningQuestion, radicalLabel, splitQuestion, type FuseQ, type MeaningQ, type SplitQ } from './bossLogic'
import './bosses.css'

type Q = { kind: 'split'; q: SplitQ } | { kind: 'fuse'; q: FuseQ } | { kind: 'meaning'; q: MeaningQ }

const AURAS = ['#c8955a', '#4cd07d', '#ffd166']
const TAUNTS = [
  { jp: 'わたしを わってみろ！', en: 'Try to split me!' },
  { jp: 'ぶしゅを あわせる…', en: 'I fuse the radicals…' },
  { jp: 'いみを しっているか？', en: 'Do you know what it means?' },
]

function RadicalTile({ c }: { c: string }) {
  const r = radicalLabel(c)
  return (
    <span className="bg-tile-inner">
      <span className="bg-tile-char" lang="ja">
        {r.char}
        {r.form && <small>{r.form}</small>}
      </span>
      <span className="bg-tile-meaning">{r.meaning}</span>
    </span>
  )
}

export default function RadicalGolem({ activity, onFinish, onExit }: GameProps<'boss-radical'>) {
  const [deck] = useState(() => createDeck<KanjiRecipe>(RECIPES, (r) => weakness(getState().srs[item.kanji(r.result)])))
  const [q, setQ] = useState<Q | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [reveal, setReveal] = useState<{ picked: string | null; ok: boolean } | null>(null)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 5,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setSelected([])
      const r = deck.next()
      setQ(ph === 0 ? { kind: 'split', q: splitQuestion(r) } : ph === 1 ? { kind: 'fuse', q: fuseQuestion(r) } : { kind: 'meaning', q: meaningQuestion(r) })
    },
  })
  const elapsed = useAnswerTimer(battle.turn)

  function finishAnswer(ok: boolean, picked: string | null, recipe: KanjiRecipe) {
    const ms = elapsed()
    setReveal({ picked, ok })
    if (ok) void speak(recipe.reading)
    else deck.requeue(recipe)
    const id = item.kanji(recipe.result)
    battle.resolve(ok, [{ itemId: id, correct: ok, ms }], { heroic: [id], delay: ok ? 1300 : 2600 })
  }

  function toggle(i: number) {
    if (reveal || battle.busy) return
    sfx.click()
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : s.length >= 3 ? s : [...s, i]))
  }

  function split() {
    if (!q || q.kind !== 'split' || reveal || selected.length < 2) return
    const picked = selected.map((i) => q.q.tiles[i])
    finishAnswer(checkSplit(q.q.recipe, picked), picked.join('+'), q.q.recipe)
  }

  const splitActive = q?.kind === 'split' && !reveal && !battle.busy
  useNumberKeys(8, toggle, splitActive)
  useKey('Enter', split, splitActive && selected.length >= 2)

  const recipe = q?.q.recipe
  const core = !q ? '?' : q.kind === 'split' ? q.q.kanji : reveal ? q.q.recipe.result : '?'
  const sprite = (
    <div className={`bg-golem ${reveal?.ok ? 'bg-cracked' : ''}`}>
      <span className="bg-body">🗿</span>
      <span className="bg-core" lang="ja">
        {core}
      </span>
    </div>
  )

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Radical Golem', jp: 'ぶしゅのゴーレム' }}
      sprite={sprite}
      aura={AURAS[battle.phase]}
      phaseNames={[
        { en: 'Fused Body', jp: 'ゆうごうのからだ' },
        { en: 'Forge of Radicals', jp: 'ぶしゅのかじば' },
        { en: 'Heart of Meaning', jp: 'いみのかく' },
      ]}
      introLines={[
        'The golem is built from fused radicals (kanji parts).',
        'Phase 1: pick the 2–3 parts of the kanji on its core, then Split!',
        'Phase 2: parts are given — which kanji do they make?',
        'Phase 3: only the meaning is left. Find its kanji.',
      ]}
      taunt={TAUNTS[battle.phase]}
      victory={{ jp: 'ゴーレムが くずれた！', en: 'The golem crumbles!' }}
    >
      {q?.kind === 'split' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="Split this kanji into its parts" jp="このかんじを わけよう" />
            </div>
            <div className="bg-split-row">
              <span className="ba-prompt-big" lang="ja">
                {q.q.kanji}
              </span>
              <span className="bg-eq">=</span>
              <span className="bg-slots">
                {[0, 1, 2].map((i) => {
                  const t = selected[i]
                  return (
                    <span key={i} className={`bg-slot ${t !== undefined ? 'full' : ''}`} lang="ja">
                      {t !== undefined ? q.q.tiles[t] : ''}
                    </span>
                  )
                })}
              </span>
            </div>
          </div>
          <div className="bg-tiles">
            {q.q.tiles.map((c, i) => {
              const isSel = selected.includes(i)
              let cls = 'bg-tile'
              if (isSel) cls += ' sel'
              if (reveal) cls += q.q.recipe.parts.includes(c) ? ' part' : ' ba-dim'
              return (
                <button key={i} type="button" className={cls} onClick={() => toggle(i)} disabled={!!reveal} aria-pressed={isSel}>
                  <span className="ba-key" aria-hidden>
                    {i + 1}
                  </span>
                  <RadicalTile c={c} />
                </button>
              )
            })}
          </div>
          <button type="button" className="btn btn-primary btn-lg" disabled={selected.length < 2 || !!reveal} onClick={split}>
            ⚒️ <T en="Split!" jp="わる！" />
          </button>
        </>
      )}
      {q?.kind === 'fuse' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="The golem fuses these parts — into which kanji?" jp="あわせると どのかんじ？" />
            </div>
            <div className="bg-parts" lang="ja">
              {q.q.parts.map((p, i) => (
                <span key={i} className="bg-part">
                  {i > 0 && <span className="bg-plus">+</span>}
                  <RadicalTile c={p} />
                </span>
              ))}
            </div>
          </div>
          <ChoiceGrid options={q.q.options} jp onPick={(o) => !reveal && finishAnswer(isAccepted(q.q, o), o, q.q.recipe)} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
        </>
      )}
      {q?.kind === 'meaning' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="Its core pulses with a meaning. Which kanji?" jp="このいみの かんじは？" />
            </div>
            <div className="ba-prompt-main bg-meaning">“{q.q.meaning}”</div>
          </div>
          <ChoiceGrid options={q.q.options} jp onPick={(o) => !reveal && finishAnswer(isAccepted(q.q, o), o, q.q.recipe)} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
        </>
      )}
      {recipe && (
        <Feedback ok={reveal?.ok ?? null}>
          {reveal && (
            <>
              {recipe.emoji} <span lang="ja">{recipe.result}</span> ({recipe.reading}) = <span lang="ja">{recipe.parts.join(' + ')}</span> · {recipe.meaning}
              <small>{recipe.story}</small>
            </>
          )}
        </Feedback>
      )}
    </BossArena>
  )
}
