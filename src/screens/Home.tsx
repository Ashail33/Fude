import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { GhostRecall } from '../components/GhostRecall'
import { Stars, T } from '../components/ui'
import { ACTIVITIES, activitiesFor, REGIONS, STAGE_LABEL } from '../data/regions'
import { dueItems, featuredToday, FEATURED_MULTIPLIER } from '../engine/quests'
import { titleFor, xpForLevel } from '../engine/rewards'
import { todayKey } from '../engine/random'
import { activityUnlocked, isPassed, level, regionMastered, regionUnlocked, usePlayer } from '../engine/store'
import { GAME_META } from '../games/registry'

const DAILY_GOAL_MIN = 10

export default function Home() {
  const p = usePlayer()
  const nav = useNavigate()
  const lvl = level(p)
  const [title, titleJp] = titleFor(lvl)
  const cur = xpForLevel(lvl)
  const nxt = xpForLevel(lvl + 1)
  const today = p.daily[todayKey()] ?? { xp: 0, ms: 0, games: 0 }
  const minutes = Math.round(today.ms / 60000)
  const due = dueItems(p)
  const featured = useMemo(() => featuredToday(p), [p])
  const next = ACTIVITIES.find((a) => activityUnlocked(p, a) && !isPassed(p, a.id))

  return (
    <main className="home">
      <section className="hero card">
        <Avatar outfit={p.outfit} size={104} className="float" />
        <div className="hero-info">
          <div className="muted" lang="ja">
            おかえり、{p.name}！
          </div>
          <h1>
            <T en={title} jp={titleJp} /> · <T en={`Level ${lvl}`} jp={`レベル${lvl}`} />
          </h1>
          <div className="xpbar" title={`${p.xp - cur} / ${nxt - cur} XP`}>
            <span style={{ width: `${((p.xp - cur) / (nxt - cur)) * 100}%` }} />
          </div>
          <div className="row hero-stats">
            <span className="chip">
              ⏳ {minutes}/{DAILY_GOAL_MIN} <T en="min today" jp="ぷん" />
            </span>
            <span className="chip">
              🔥 {p.streak.count} <T en="day streak" jp="にちれんぞく" />
            </span>
            <span className="chip">
              📖 {Object.keys(p.srs).filter((k) => k.startsWith('w:')).length} <T en="words" jp="ことば" />
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-2 home-daily">
        {next ? (
          <button type="button" className="card continue" onClick={() => nav(`/play/${next.id}`)}>
            <div className="muted">
              <T en="Continue your journey" jp="たびをつづける" />
            </div>
            <div className="continue-title">
              <span className="continue-icon">{GAME_META[next.game].icon}</span>
              <span>
                <strong>{next.title}</strong>
                <span className="muted small" lang="ja">
                  {' '}
                  {next.jp}
                </span>
                <br />
                <span className="muted small">
                  {REGIONS[next.region - 1].name} · {STAGE_LABEL[next.stage].en}
                </span>
              </span>
            </div>
            <span className="btn btn-primary">
              <T en="Play" jp="あそぶ" /> ▶
            </span>
          </button>
        ) : (
          <div className="card continue">
            <div className="continue-title">
              🏆 <T en="You have conquered every region! Keep your grimoire strong." jp="ぜんぶクリア！" />
            </div>
          </div>
        )}
        <div className="card review-card">
          <div className="muted">
            <T en="Grimoire review" jp="まどうしょのふくしゅう" />
          </div>
          <div className="review-count">
            <strong>{due.length}</strong> <T en="fading entries" jp="きえかけのことば" />
          </div>
          <p className="muted small">
            <T en="Spaced repetition brings words back right before you would forget them." jp="わすれるまえに、もういちど。" />
          </p>
          <button type="button" className="btn" disabled={!due.length} onClick={() => nav('/play/review')}>
            🔁 <T en="Review now" jp="ふくしゅうする" />
          </button>
        </div>
      </section>

      <GhostRecall />

      <h2 className="section-title">
        ⏳ <T en="Chronos Quests" jp="クロノスのクエスト" />
        <span className="muted small">
          <T en="New stories every day, woven from the words you find hardest" jp="まいにちあたらしい" />
        </span>
      </h2>
      <div className="grid grid-3">
        {p.quests.list.map((q) => (
            <article key={q.id} className={`card quest ${q.done ? 'done' : ''}`}>
              <div className="quest-jp" lang="ja">
                {q.storyJp}
              </div>
              <h3>{q.title}</h3>
              <p className="muted small">{q.story}</p>
              <div className="row">
                <span className="chip">+{q.xp} XP</span>
                <span className="spacer" />
                {q.done ? (
                  <span className="quest-done">✔ <T en="Complete" jp="クリア" /></span>
                ) : (
                  <Link className="btn btn-sm btn-primary" to={`/play/quest/${q.id}`}>
                    <T en="Embark" jp="いく" />
                  </Link>
                )}
              </div>
            </article>
          ))}
      </div>

      {featured.length > 0 && (
        <>
          <h2 className="section-title">
            🎴 <T en="Today's rotation" jp="きょうのゲーム" />
            <span className="muted small">×{FEATURED_MULTIPLIER} XP</span>
          </h2>
          <div className="grid grid-3">
            {featured.map((a) => (
              <Link key={a.id} to={`/play/${a.id}`} className="card featured">
                <span className="featured-icon">{GAME_META[a.game].icon}</span>
                <span>
                  <strong>{a.title}</strong>
                  <br />
                  <span className="muted small">{GAME_META[a.game].name}</span>
                </span>
                <Stars n={p.progress[a.id]?.stars ?? 0} />
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">
        🗺️ <T en="The World of Kotoba" jp="コトバのせかい" />
      </h2>
      <WorldMap />
    </main>
  )
}

function WorldMap() {
  const p = usePlayer()
  return (
    <div className="worldmap card">
      <svg className="worldmap-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {REGIONS.slice(1).map((r, i) => {
          const a = REGIONS[i].pos
          const open = regionUnlocked(p, r.id)
          return (
            <path
              key={r.id}
              d={`M${a.x} ${a.y} Q${(a.x + r.pos.x) / 2} ${Math.min(a.y, r.pos.y) - 8} ${r.pos.x} ${r.pos.y}`}
              className={open ? 'path-open' : 'path-locked'}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      {REGIONS.map((r) => {
        const open = regionUnlocked(p, r.id)
        const acts = activitiesFor(r.id)
        const stars = acts.reduce((s, a) => s + (p.progress[a.id]?.stars ?? 0), 0)
        const mastered = regionMastered(p, r.id)
        const content = (
          <>
            <span className="node-emoji" style={{ background: open ? r.color : undefined }}>
              {open ? r.emoji : '🔒'}
              {mastered && <span className="node-crown">👑</span>}
            </span>
            <span className="node-label">
              <span lang="ja">{r.jp}</span>
              <small>{r.name}</small>
              {open && (
                <small className="node-stars">
                  ★ {stars}/{acts.length * 3}
                </small>
              )}
            </span>
          </>
        )
        return open ? (
          <Link key={r.id} to={`/region/${r.id}`} className="map-node" style={{ left: `${r.pos.x}%`, top: `${r.pos.y}%` }}>
            {content}
          </Link>
        ) : (
          <div key={r.id} className="map-node locked" style={{ left: `${r.pos.x}%`, top: `${r.pos.y}%` }} title="Defeat the previous region's boss to unlock">
            {content}
          </div>
        )
      })}
    </div>
  )
}
