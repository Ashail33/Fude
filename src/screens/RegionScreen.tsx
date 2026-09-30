import { Link, Navigate, useParams } from 'react-router-dom'
import { Stars, T } from '../components/ui'
import { activitiesFor, REGIONS, STAGE_LABEL, STAGE_ORDER } from '../data/regions'
import { VOCAB } from '../data/vocab'
import { item } from '../engine/items'
import { masteryTier } from '../engine/srs'
import { activityUnlocked, regionMastered, regionUnlocked, usePlayer } from '../engine/store'
import { GAME_META } from '../games/registry'

export default function RegionScreen() {
  const { id } = useParams()
  const p = usePlayer()
  const region = REGIONS.find((r) => String(r.id) === id)
  if (!region || !regionUnlocked(p, region.id)) return <Navigate to="/" replace />

  const acts = activitiesFor(region.id)
  const words = VOCAB.filter((w) => w.region === region.id)
  const learned = words.filter((w) => masteryTier(p.srs[item.word(w.id)]) >= 2).length
  const mastered = regionMastered(p, region.id)

  return (
    <main className="region" style={{ ['--region' as string]: region.color }}>
      <Link to="/" className="back-link">
        ← <T en="World map" jp="ちず" />
      </Link>
      <header className="region-head card">
        <div className="region-emoji float">{region.emoji}</div>
        <div>
          <h1>
            <span lang="ja" className="region-jp">
              {region.jp}
            </span>
            <br />
            {region.name}
          </h1>
          <p className="muted">{region.tagline}</p>
          <div className="row">
            {region.teaches.map((t) => (
              <span className="chip" key={t}>
                {t}
              </span>
            ))}
            <span className="chip">
              📖 {learned}/{words.length} <T en="words learned" jp="おぼえた" />
            </span>
            {mastered && <span className="chip mastered">👑 <T en="Mastered" jp="しゅうとく" /></span>}
          </div>
        </div>
      </header>

      <div className="stages">
        {STAGE_ORDER.map((stage) => {
          const list = acts.filter((a) => a.stage === stage)
          if (!list.length) return null
          return (
            <section key={stage} className={`stage stage-${stage}`}>
              <h2 className="stage-title">
                <T en={STAGE_LABEL[stage].en} jp={STAGE_LABEL[stage].jp} />
              </h2>
              <div className="stage-list">
                {list.map((a) => {
                  const open = activityUnlocked(p, a)
                  const prog = p.progress[a.id]
                  const meta = GAME_META[a.game]
                  const inner = (
                    <>
                      <span className="act-icon">{open ? meta.icon : '🔒'}</span>
                      <span className="act-body">
                        <strong>{a.title}</strong>
                        <span className="act-jp" lang="ja">
                          {a.jp}
                        </span>
                        <span className="muted small">{a.description}</span>
                        <span className="act-meta">
                          <span className="tag">{meta.skill}</span>
                          {prog && <span className="muted small">best {prog.best}%</span>}
                        </span>
                      </span>
                      <Stars n={prog?.stars ?? 0} />
                    </>
                  )
                  return open ? (
                    <Link key={a.id} to={`/play/${a.id}`} className={`act card ${prog?.stars ? 'cleared' : ''} ${stage === 'boss' ? 'act-boss' : ''}`}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={a.id} className="act card locked" title="Clear the previous trial to unlock">
                      {inner}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
