import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SpeakButton, T } from '../components/ui'
import { HIRAGANA, KATAKANA, KANA_ROWS, type Kana } from '../data/kana'
import { RECIPES } from '../data/kanji'
import { REGIONS } from '../data/regions'
import { VOCAB } from '../data/vocab'
import { describeItem, item } from '../engine/items'
import { dueItems } from '../engine/quests'
import { masteryTier, strength, TIER_LABEL } from '../engine/srs'
import { regionUnlocked, usePlayer } from '../engine/store'

type Tab = 'words' | 'kana' | 'kanji' | 'stats'

const TIER_COLOR = ['#3a3d6b', '#8a6bd6', '#3da5ff', '#4cd07d', '#ffd166']

export default function Grimoire() {
  const p = usePlayer()
  const [tab, setTab] = useState<Tab>('words')
  const [query, setQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState(0)
  const due = dueItems(p, 999).length
  const now = Date.now()

  const words = useMemo(() => {
    const q = query.trim().toLowerCase()
    return VOCAB.filter((w) => (regionFilter ? w.region === regionFilter : true)).filter(
      (w) => !q || w.en.toLowerCase().includes(q) || w.jp.includes(q) || w.kana.includes(q) || w.romaji.includes(q),
    )
  }, [query, regionFilter])

  return (
    <main className="grimoire">
      <header className="row grimoire-head">
        <h1>
          <T en="Grimoire" jp="まどうしょ" />
        </h1>
        <span className="spacer" />
        <Link to="/play/review" className={`btn btn-primary ${due ? '' : 'disabled'}`} aria-disabled={!due} onClick={(e) => !due && e.preventDefault()}>
          <T en={`Review ${due}`} jp={`ふくしゅう ${due}`} />
        </Link>
      </header>
      <div className="tabs" role="tablist">
        {(
          [
            ['words', 'Words', 'ことば'],
            ['kana', 'Kana', 'かな'],
            ['kanji', 'Kanji', 'かんじ'],
            ['stats', 'Stats', 'きろく'],
          ] as const
        ).map(([k, en, jp]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            <T en={en} jp={jp} />
          </button>
        ))}
      </div>

      {tab === 'words' && (
        <>
          <div className="row grimoire-filters">
            <input type="text" placeholder="Search: water, みず, mizu…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search words" />
            <select value={regionFilter} onChange={(e) => setRegionFilter(Number(e.target.value))} aria-label="Region">
              <option value={0}>All regions</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}. {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="legend row">
            {TIER_LABEL.map((l, i) => (
              <span key={l} className="legend-item">
                <span className="dot" style={{ background: TIER_COLOR[i] }} /> {l}
              </span>
            ))}
          </div>
          <div className="word-grid">
            {words.map((w) => {
              const card = p.srs[item.word(w.id)]
              const tier = masteryTier(card)
              const str = strength(card, now)
              const locked = !regionUnlocked(p, w.region)
              const fading = card && card.seen > 0 && str < 0.5
              const hero = p.heroic[item.word(w.id)]
              if (locked && !card)
                return (
                  <div key={w.id} className="word-tile locked" title="Unlock this region to learn">
                    <span className="word-emoji">❔</span>
                    <span className="muted small">Region {w.region}</span>
                  </div>
                )
              return (
                <div key={w.id} className={`word-tile ${fading ? 'fading' : ''}`} style={{ borderColor: TIER_COLOR[tier] }}>
                  <span className="word-emoji">{w.emoji}</span>
                  <span className={`word-jp ${fading ? 'ghost' : ''}`} lang="ja">
                    {w.jp}
                  </span>
                  <span className="muted small" lang="ja">
                    {w.kana}
                  </span>
                  <span className="word-en">{w.en}</span>
                  <span className="word-meta">
                    <span className="tier" style={{ color: TIER_COLOR[tier] }}>
                      {TIER_LABEL[tier]}
                    </span>
                    {card && card.seen > 0 && (
                      <span className="muted small" title="Recall strength">
                        {Math.round(str * 100)}%
                      </span>
                    )}
                  </span>
                  {hero && (
                    <span className="hero-badge" title={`Used to defeat ${hero.title}`}>
                      ⚔️
                    </span>
                  )}
                  <SpeakButton text={w.kana} className="word-speak" />
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'kana' && (
        <div className="grid grid-2">
          <KanaChart title="ひらがな Hiragana" list={HIRAGANA} />
          <KanaChart title="カタカナ Katakana" list={KATAKANA} />
        </div>
      )}

      {tab === 'kanji' && (
        <>
          <p className="muted">
            <T en="Kanji you have forged in the Elemental Fields. Combine radicals in Magic Crafting to discover more." jp="れんきんでみつけたかんじ" />
          </p>
          <div className="kanji-grid">
            {RECIPES.map((r) => {
              const found = p.discoveredKanji.includes(r.result)
              return (
                <div key={r.result} className={`kanji-tile card ${found ? '' : 'locked'}`}>
                  <span className="kanji-char" lang="ja">
                    {found ? r.result : '？'}
                  </span>
                  {found ? (
                    <>
                      <span className="kanji-recipe" lang="ja">
                        {r.parts.join(' + ')}
                      </span>
                      <span className="small">
                        {r.emoji} {r.meaning} · <span lang="ja">{r.reading}</span>
                      </span>
                      <span className="muted small">{r.story}</span>
                    </>
                  ) : (
                    <span className="muted small">{r.parts.length} parts</span>
                  )}
                </div>
              )
            })}
          </div>
          <h3 className="section-title">
            <T en="Elemental spells" jp="げんそのまほう" />
          </h3>
          <div className="row">
            {p.spells.length ? (
              p.spells.map((s) => (
                <span key={s} className="chip spell-chip" lang="ja">
                  {s}
                </span>
              ))
            ) : (
              <span className="muted">
                <T en="Ask the Spell Merchant in the Village for your first spells." jp="むらのまほうやへ" />
              </span>
            )}
          </div>
        </>
      )}

      {tab === 'stats' && <Stats />}
    </main>
  )
}

function KanaChart({ title, list }: { title: string; list: Kana[] }) {
  const p = usePlayer()
  return (
    <section className="card">
      <span className="win-title" lang="ja">
        {title}
      </span>
      <div className="kana-chart">
        {KANA_ROWS.map((row) => (
          <div key={row} className="kana-row">
            {list
              .filter((k) => k.row === row)
              .map((k) => {
                const tier = masteryTier(p.srs[item.kana(k.char)])
                return (
                  <div key={k.id} className="kana-cell" style={{ borderColor: TIER_COLOR[tier], background: tier ? `${TIER_COLOR[tier]}22` : undefined }} title={TIER_LABEL[tier]}>
                    <span lang="ja">{k.char}</span>
                    <small>{k.romaji}</small>
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </section>
  )
}

function Stats() {
  const p = usePlayer()
  const cards = Object.values(p.srs)
  const seen = cards.filter((c) => c.seen > 0)
  const total = seen.reduce((s, c) => s + c.seen, 0)
  const correct = seen.reduce((s, c) => s + c.correct, 0)
  const timed = seen.filter((c) => c.avgMs > 0)
  const avgMs = timed.length ? timed.reduce((s, c) => s + c.avgMs, 0) / timed.length : 0
  const tiers = [0, 1, 2, 3, 4].map((t) => seen.filter((c) => masteryTier(c) === t).length)
  const troublesome = [...seen].filter((c) => c.wrong > 0).sort((a, b) => b.wrong / b.seen - a.wrong / a.seen).slice(0, 8)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { key, label: d.getDate(), data: p.daily[key] }
  })
  const maxXp = Math.max(1, ...days.map((d) => d.data?.xp ?? 0))
  const wordsLearned = seen.filter((c) => c.id.startsWith('w:') && masteryTier(c) >= 2).length

  return (
    <div className="grid grid-2">
      <section className="card">
        <span className="win-title">
          <T en="Overview" jp="まとめ" />
        </span>
        <div className="stat-grid">
          <div>
            <strong>{wordsLearned}</strong>
            <span className="muted small">words learned (goal: 1500)</span>
          </div>
          <div>
            <strong>{total ? Math.round((correct / total) * 100) : 0}%</strong>
            <span className="muted small">accuracy</span>
          </div>
          <div>
            <strong>{(avgMs / 1000).toFixed(1)}s</strong>
            <span className="muted small">avg. answer time</span>
          </div>
          <div>
            <strong>{p.discoveredKanji.length}</strong>
            <span className="muted small">kanji forged</span>
          </div>
        </div>
        <h4>Mastery</h4>
        <div className="tier-bars">
          {tiers.map((n, i) => (
            <div key={i} className="tier-bar">
              <span className="small">{TIER_LABEL[i]}</span>
              <span className="tier-track">
                <span style={{ width: `${(n / Math.max(1, seen.length)) * 100}%`, background: TIER_COLOR[i] }} />
              </span>
              <span className="small">{n}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <span className="win-title">
          <T en="Last 14 days" jp="2しゅうかん" />
        </span>
        <div className="xp-chart" role="img" aria-label="XP earned per day over the last 14 days">
          {days.map((d) => (
            <div key={d.key} className="xp-col" title={`${d.key}: ${d.data?.xp ?? 0} XP, ${Math.round((d.data?.ms ?? 0) / 60000)} min`}>
              <span className="xp-fill" style={{ height: `${((d.data?.xp ?? 0) / maxXp) * 100}%` }} />
              <small>{d.label}</small>
            </div>
          ))}
        </div>
        <h4>
          <T en="Most troublesome" jp="にがてなもの" />
        </h4>
        {troublesome.length ? (
          <ul className="trouble-list">
            {troublesome.map((c) => (
              <li key={c.id}>
                <span lang="ja">{describeItem(c.id)?.front ?? c.id}</span>
                <span className="small">{describeItem(c.id)?.meaning}</span>
                <span className="muted small">
                  {c.wrong} ✗ / {c.seen}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">No mistakes recorded yet.</p>
        )}
      </section>
    </div>
  )
}
