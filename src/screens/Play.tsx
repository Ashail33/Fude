import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { StatBar } from '../components/Journal'
import { useCountUp } from '../components/motion'
import { PixelStar, T, useBurst } from '../components/ui'
import { ACTIVITIES, ACTIVITY_BY_ID, REGIONS } from '../data/regions'
import { dueItems, completeQuest, featuredToday, FEATURED_MULTIPLIER, questActivity } from '../engine/quests'
import { playJingle } from '../engine/music'
import { levelForXp, xpForLevel } from '../engine/rewards'
import { sfx } from '../engine/sfx'
import { activityUnlocked, getState, recordResult, setState, usePlayer, type Outcome } from '../engine/store'
import { gameComponent } from '../games/registry'
import { isChunkError, reloadForNewBuild } from '../engine/staleBuild'
import type { Activity, GameResult } from '../games/types'

function resolveActivity(path: string): { activity?: Activity; questId?: string } {
  const rest = path.replace(/^\/play\/?/, '')
  if (rest === 'review') {
    const ids = dueItems(getState(), 20)
    return {
      activity: {
        id: 'review',
        region: 0,
        stage: 'practice',
        game: 'review',
        title: 'Grimoire Review',
        jp: 'まどうしょのふくしゅう',
        description: 'Re-ink fading words.',
        params: { itemIds: ids },
      },
    }
  }
  if (rest.startsWith('quest/')) {
    const qid = rest.slice(6)
    const q = getState().quests.list.find((x) => x.id === qid)
    return q ? { activity: questActivity(q), questId: qid } : {}
  }
  return { activity: ACTIVITY_BY_ID.get(rest) }
}

class GameErrorBoundary extends Component<{ children: ReactNode; onExit: () => void }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    // an old page after a new deploy: fetch the new version instead of failing
    if (isChunkError(error)) reloadForNewBuild()
  }
  render() {
    if (this.state.error)
      return (
        <div className="card center" style={{ marginTop: 40 }}>
          <div style={{ fontSize: '3rem' }}>💥</div>
          <h2>{isChunkError(this.state.error) ? 'Updating to the newest version…' : 'The spell backfired!'}</h2>
          <p className="muted">{isChunkError(this.state.error) ? 'A new version of the game was released. Reload the page if it doesn’t refresh by itself.' : this.state.error.message}</p>
          <button type="button" className="btn btn-primary" onClick={this.props.onExit}>
            Return
          </button>
        </div>
      )
    return this.props.children
  }
}

export default function Play() {
  const loc = useLocation()
  const nav = useNavigate()
  // Resolve once per route so review/quest params stay stable during play.
  const { activity, questId } = useMemo(() => resolveActivity(loc.pathname), [loc.pathname])
  const [run, setRun] = useState(0)
  const [outcome, setOutcome] = useState<{ o: Outcome; r: GameResult; questXp: number } | null>(null)
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  // Back to the overworld, where the player is standing next to the trial.
  const exitTo = '/'
  const onExit = useCallback(() => nav(exitTo), [nav, exitTo])

  const onFinish = useCallback(
    (r: GameResult) => {
      if (!activity || finished.current) return
      finished.current = true
      const featured = featuredToday(getState()).some((a) => a.id === activity.id)
      const o = recordResult(activity, r, Date.now() - startedAt.current, featured ? FEATURED_MULTIPLIER : 1)
      let questXp = 0
      if (questId && o.stars > 0) {
        const q = getState().quests.list.find((x) => x.id === questId)
        if (q && !q.done) {
          questXp = q.xp
          completeQuest(questId)
          setState((s) => ({ ...s, xp: s.xp + q.xp }))
        }
      }
      if (o.stars > 0) sfx.win()
      else sfx.lose()
      if (o.levelAfter > o.levelBefore) setTimeout(() => sfx.levelUp(), 600)
      setOutcome({ o, r, questXp })
    },
    [activity, questId],
  )

  if (!activity)
    return (
      <div className="card center" style={{ marginTop: 40 }}>
        <p>That trial could not be found.</p>
        <Link className="btn" to="/">
          Back to the world
        </Link>
      </div>
    )

  if (outcome)
    return (
      <Results
        activity={activity}
        outcome={outcome.o}
        result={outcome.r}
        questXp={outcome.questXp}
        onRetry={() => {
          finished.current = false
          startedAt.current = Date.now()
          setOutcome(null)
          setRun(run + 1)
        }}
        onBack={onExit}
      />
    )

  const Game = gameComponent(activity.game)
  return (
    <GameErrorBoundary onExit={onExit}>
      <Suspense fallback={<div className="loading">✨</div>}>
        <Game key={run} activity={activity} params={activity.params} onFinish={onFinish} onExit={onExit} />
      </Suspense>
    </GameErrorBoundary>
  )
}

const STAR_GAP_MS = 380

function Results({
  activity,
  outcome,
  result,
  questXp,
  onRetry,
  onBack,
}: {
  activity: Activity
  outcome: Outcome
  result: GameResult
  questXp: number
  onRetry: () => void
  onBack: () => void
}) {
  const p = usePlayer()
  const nav = useNavigate()
  const [burst, fire] = useBurst()
  const acc = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 100
  const passed = outcome.stars > 0
  const nextAct = ACTIVITIES.find((a) => a.region === activity.region && activityUnlocked(p, a) && !(p.progress[a.id]?.stars ?? 0))
  const correct = result.reviews.filter((r) => r.correct).length
  const isBoss = activity.stage === 'boss' || activity.game.startsWith('boss')
  const gained = outcome.xp + questXp
  const starsDone = 300 + outcome.stars * STAR_GAP_MS

  // XP bar for the current level: fills from where this run started.
  const [xpBar] = useState(() => {
    const now = getState().xp
    const lvl = levelForXp(now)
    const cur = xpForLevel(lvl)
    const span = xpForLevel(lvl + 1) - cur
    const from = outcome.levelAfter > outcome.levelBefore ? 0 : Math.max(0, now - gained - cur)
    return { lvl, span, from, to: now - cur }
  })
  const [xpFill, setXpFill] = useState(xpBar.from)
  const xpShown = useCountUp(gained, starsDone)
  const shardsShown = useCountUp(outcome.shards, starsDone + 200)

  useEffect(() => {
    if (passed) playJingle('victory')
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < outcome.stars; i++)
      timers.push(
        setTimeout(() => {
          sfx.correct()
          fire(50 + (i - 1) * 14, 22, 8)
        }, 300 + i * STAR_GAP_MS),
      )
    timers.push(setTimeout(() => setXpFill(xpBar.to), starsDone))
    if (passed) timers.push(setTimeout(() => fire(50, 40, 22), starsDone + 400))
    return () => timers.forEach(clearTimeout)
  }, [passed, fire, outcome.stars, starsDone, xpBar.to])

  return (
    <div className={`results card ${passed ? 'won' : 'lost'}`}>
      {burst}
      <div className="results-banner" lang="ja">
        {passed ? (isBoss ? 'だいしょうり！' : 'しょうり！') : 'ざんねん…'}
      </div>
      <div className="results-emoji">{passed ? (isBoss ? '🏆' : '✨') : '💫'}</div>
      <h1>{passed ? <T en="Victory!" jp="クリア！" /> : <T en="Not yet…" jp="もういちど！" />}</h1>
      <p className="muted">
        {activity.title} <span lang="ja">{activity.jp}</span>
      </p>
      <div className="results-stars" aria-label={`${outcome.stars} of 3 stars`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`results-star ${i < outcome.stars ? 'on' : ''}`} style={{ animationDelay: `${300 + i * STAR_GAP_MS}ms` }}>
            <PixelStar on={i < outcome.stars} size={52} />
          </span>
        ))}
      </div>
      <div className="results-xp">
        <StatBar label={`Lv ${xpBar.lvl}`} value={xpFill} max={xpBar.span} kind="xp" />
      </div>
      <div className="results-stats">
        <div>
          <strong>{acc}%</strong>
          <span className="muted small">
            <T en="accuracy" jp="せいかくさ" />
          </span>
        </div>
        <div className={xpShown > 0 && xpShown < gained ? 'rolling' : ''}>
          <strong>+{xpShown}</strong>
          <span className="muted small">EXP</span>
        </div>
        <div className={shardsShown > 0 && shardsShown < outcome.shards ? 'rolling' : ''}>
          <strong>+{shardsShown}</strong>
          <span className="muted small">💠</span>
        </div>
        {result.reviews.length > 0 && (
          <div>
            <strong>
              {correct}/{result.reviews.length}
            </strong>
            <span className="muted small">
              <T en="answers" jp="こたえ" />
            </span>
          </div>
        )}
      </div>
      {!passed && (
        <p className="muted">
          <T en="Reach 60% to clear this trial. Every attempt still strengthens your grimoire." jp="60%でクリア。" />
        </p>
      )}
      {result.notes?.map((n) => (
        <p key={n} className="muted small">
          {n}
        </p>
      ))}
      <div className="results-unlocks">
        {outcome.levelAfter > outcome.levelBefore && (
          <div className="unlock glow-text pop">
            ⬆️ <T en={`Level up! You are now level ${outcome.levelAfter}`} jp={`レベルアップ！レベル${outcome.levelAfter}`} />
          </div>
        )}
        {questXp > 0 && <div className="unlock pop">⏳ Quest complete! +{questXp} XP</div>}
        {outcome.unlockedRegion && (
          <div className="unlock glow-text pop">
            🗺️ <T en="New region unlocked:" jp="あたらしいちいき：" /> {REGIONS[outcome.unlockedRegion - 1].name} <span lang="ja">{REGIONS[outcome.unlockedRegion - 1].jp}</span>
          </div>
        )}
        {outcome.unlockedActivities
          .filter((a) => a.region !== outcome.unlockedRegion)
          .map((a) => (
            <div key={a.id} className="unlock pop">
              🔓 {a.title}
            </div>
          ))}
        {outcome.newOutfits.map((o) => (
          <div key={o} className="unlock pop">
            👘 <T en="New outfit:" jp="あたらしいふく：" /> {o}
          </div>
        ))}
        {outcome.newEffects.map((e) => (
          <div key={e} className="unlock pop">
            ✨ <T en="New spell effect:" jp="あたらしいエフェクト：" /> {e}
          </div>
        ))}
      </div>
      <div className="row results-actions">
        <button type="button" className="btn" onClick={onRetry}>
          <T en="Again" jp="もういちど" />
        </button>
        {outcome.unlockedRegion ? (
          <button type="button" className="btn btn-primary" onClick={() => nav(`/region/${outcome.unlockedRegion}`)} autoFocus>
            <T en="Journey onward" jp="すすむ" />
          </button>
        ) : nextAct && nextAct.id !== activity.id ? (
          <button type="button" className="btn btn-primary" onClick={() => nav(`/play/${nextAct.id}`)} autoFocus>
            <T en="Next:" jp="つぎ：" /> {nextAct.title}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onBack} autoFocus>
            <T en="Continue" jp="つづける" />
          </button>
        )}
      </div>
    </div>
  )
}
