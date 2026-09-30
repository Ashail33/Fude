import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { GhostRecall } from '../components/GhostRecall'
import { ContinueWindow, QuestBoard, ReviewWindow, StatusWindow, TodayWindow } from '../components/Journal'
import { Stars, T } from '../components/ui'
import { activitiesFor, REGIONS } from '../data/regions'
import { featuredToday, FEATURED_MULTIPLIER } from '../engine/quests'
import { regionMastered, regionUnlocked, usePlayer } from '../engine/store'
import { GAME_META } from '../games/registry'

/**
 * The Journal (ぼうけんのしょ): the mage's adventure log. Status, today's
 * progress, the next trial, review, Chronos quests, the featured rotation
 * and the list of regions. The pause menu (ui/GameMenu) shows the same
 * pieces in compact form.
 */
export default function Home() {
  const p = usePlayer()
  const featured = useMemo(() => featuredToday(p), [p])

  return (
    <main className="home journal">
      <h1 className="journal-title">
        <span lang="ja">ぼうけんのしょ</span>
        <small>Adventure Log · {p.name}</small>
      </h1>
      <section className="journal-top">
        <StatusWindow />
        <div className="journal-col">
          <ContinueWindow />
          <TodayWindow />
        </div>
      </section>

      <section className="grid grid-2 home-daily">
        <ReviewWindow />
        <GhostRecall />
      </section>

      <h2 className="section-title">
        <T en="Chronos Quests" jp="クロノスのクエスト" />
        <span className="muted small">
          <T en="New stories every day, woven from the words you find hardest" jp="まいにちあたらしい" />
        </span>
      </h2>
      <QuestBoard />

      {featured.length > 0 && (
        <>
          <h2 className="section-title">
            <T en="Today's rotation" jp="きょうのゲーム" />
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
        <T en="The World of Kotoba" jp="コトバのせかい" />
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
