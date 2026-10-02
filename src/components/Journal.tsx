/**
 * Adventure-log building blocks shared by the pause menu (ui/GameMenu) and
 * the Journal page (screens/Home): status, review, Chronos quests, next trial.
 */
import { Link, useNavigate } from 'react-router-dom'
import { playerStats } from '../battle/logic'
import { ACTIVITIES, REGION_BY_ID, STAGE_LABEL } from '../data/regions'
import { dueItems } from '../engine/quests'
import { todayKey } from '../engine/random'
import { titleFor, xpForLevel } from '../engine/rewards'
import { activityUnlocked, isPassed, kanaHold, kanaProgress, level, usePlayer } from '../engine/store'
import { GAME_META } from '../games/registry'
import { Avatar } from './Avatar'
import { T } from './ui'

export const DAILY_GOAL_MIN = 10

/** Segmented stat bar (HP / MP / XP). */
export function StatBar({ label, value, max, kind }: { label: string; value: number; max: number; kind: 'hp' | 'mp' | 'xp' }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div className={`statbar statbar-${kind}`}>
      <span className="statbar-label">{label}</span>
      <span className="pbar">
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className="statbar-num">
        {value}
        <small>/{max}</small>
      </span>
    </div>
  )
}

/** The mage's status window: portrait, title, level, HP/MP/XP. */
export function StatusWindow({ big }: { big?: boolean }) {
  const p = usePlayer()
  const lvl = level(p)
  const [title, titleJp] = titleFor(lvl)
  const cur = xpForLevel(lvl)
  const nxt = xpForLevel(lvl + 1)
  const st = playerStats(lvl)
  const words = Object.keys(p.srs).filter((k) => k.startsWith('w:')).length
  return (
    <section className={`card status-win ${big ? 'big' : ''}`}>
      <span className="win-title">
        <T en="Status" jp="つよさ" />
      </span>
      <div className="status-portrait">
        <Avatar outfit={p.outfit} size={big ? 80 : 64} />
      </div>
      <div className="status-info">
        <div className="status-name">
          <strong>{p.name || 'Mage'}</strong>
          <span className="status-title">
            <T en={title} jp={titleJp} />
          </span>
        </div>
        <div className="status-lv">
          <span className="lv-badge">Lv {lvl}</span>
          <span className="muted small">
            {p.xp - cur}/{nxt - cur} EXP
          </span>
        </div>
        <StatBar label="HP" value={st.maxHp} max={st.maxHp} kind="hp" />
        <StatBar label="MP" value={st.maxMp} max={st.maxMp} kind="mp" />
        <StatBar label="EX" value={p.xp - cur} max={nxt - cur} kind="xp" />
        <KanaMeter />
      </div>
      <dl className="status-stats">
        <div>
          <dt>
            <T en="Attack" jp="こうげき" />
          </dt>
          <dd>{Math.round(st.atk)}</dd>
        </div>
        <div>
          <dt>
            <T en="Magic" jp="まりょく" />
          </dt>
          <dd>{Math.round(st.magic)}</dd>
        </div>
        <div>
          <dt>
            <T en="Words" jp="ことば" />
          </dt>
          <dd>{words}</dd>
        </div>
        <div>
          <dt>
            <T en="Streak" jp="れんぞく" />
          </dt>
          <dd>🔥{p.streak.count}</dd>
        </div>
        <div>
          <dt>
            <T en="Shards" jp="ことだま" />
          </dt>
          <dd>💠{p.shards}</dd>
        </div>
        <div>
          <dt>
            <T en="Kanji" jp="かんじ" />
          </dt>
          <dd>{p.discoveredKanji.length}</dd>
        </div>
      </dl>
    </section>
  )
}

/** Today's study time vs. the daily goal. */
export function TodayWindow() {
  const p = usePlayer()
  const today = p.daily[todayKey()] ?? { xp: 0, ms: 0, games: 0 }
  const minutes = Math.round(today.ms / 60000)
  return (
    <section className="card today-win">
      <span className="win-title">
        <T en="Today" jp="きょう" />
      </span>
      <StatBar label="⏳" value={Math.min(minutes, DAILY_GOAL_MIN)} max={DAILY_GOAL_MIN} kind="xp" />
      <p className="muted small">
        {minutes}/{DAILY_GOAL_MIN} <T en="minutes today" jp="ぷん" /> · +{today.xp} XP · {today.games} <T en="trials" jp="かい" />
      </p>
    </section>
  )
}

/** Spaced-repetition review: how many grimoire entries are fading. */
export function ReviewWindow() {
  const p = usePlayer()
  const nav = useNavigate()
  const due = dueItems(p)
  return (
    <section className="card review-card">
      <span className="win-title">
        <T en="Grimoire review" jp="ふくしゅう" />
      </span>
      <div className="review-count">
        <strong>{due.length}</strong> <T en="fading entries" jp="きえかけのことば" />
      </div>
      <p className="muted small">
        <T en="Spaced repetition brings words back right before you would forget them." jp="わすれるまえに、もういちど。" />
      </p>
      <button type="button" className="btn btn-sm" disabled={!due.length} onClick={() => nav('/play/review')}>
        <T en="Review now" jp="ふくしゅうする" />
      </button>
    </section>
  )
}

/** The next unlocked, uncleared trial. */
export function ContinueWindow() {
  const p = usePlayer()
  const nav = useNavigate()
  const next = ACTIVITIES.find((a) => activityUnlocked(p, a) && !isPassed(p, a.id))
  if (!next)
    return (
      <section className="card continue">
        <div className="continue-title">
          🏆 <T en="You have conquered every region! Keep your grimoire strong." jp="ぜんぶクリア！" />
        </div>
      </section>
    )
  return (
    <button type="button" className="card continue" onClick={() => nav(`/play/${next.id}`)}>
      <span className="win-title">
        <T en="Next trial" jp="つぎのしれん" />
      </span>
      <div className="continue-title">
        <span className="continue-icon">{GAME_META[next.game].icon}</span>
        <span>
          <strong>{next.title}</strong>{' '}
          <span className="muted small" lang="ja">
            {next.jp}
          </span>
          <br />
          <span className="muted small">
            {REGION_BY_ID.get(next.region)?.name} · {STAGE_LABEL[next.stage].en}
          </span>
        </span>
      </div>
      <span className="btn btn-primary btn-sm">
        <T en="Play" jp="あそぶ" />
      </span>
    </button>
  )
}

/** Chronos Quests: three daily stories woven from the player's weakest words. */
export function QuestBoard({ compact }: { compact?: boolean }) {
  const p = usePlayer()
  if (!p.quests.list.length)
    return (
      <p className="muted small">
        <T en="No quests today. Check back tomorrow!" jp="きょうの クエストは ありません。" />
      </p>
    )
  return (
    <div className={compact ? 'quest-list compact' : 'grid grid-3'}>
      {p.quests.list.map((q) => (
        <article key={q.id} className={`card quest ${q.done ? 'done' : ''}`}>
          <div className="quest-jp" lang="ja">
            {q.storyJp}
          </div>
          <h3>{q.title}</h3>
          {!compact && <p className="muted small">{q.story}</p>}
          <div className="row">
            <span className="chip">+{q.xp} XP</span>
            <span className="spacer" />
            {q.done ? (
              <span className="quest-done">
                ✔ <T en="Complete" jp="クリア" />
              </span>
            ) : (
              <Link className="btn btn-sm btn-primary" to={`/play/quest/${q.id}`}>
                <T en="Embark" jp="いく" />
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

/** Hiragana and katakana learned: Japanese takes over only as these fill up. */
export function KanaMeter() {
  const p = usePlayer()
  const { hira, kata } = kanaProgress(p)
  const hold = kanaHold(p)
  return (
    <div className="kana-meter">
      <StatBar label="あ" value={hira.known} max={hira.total} kind="xp" />
      <StatBar label="ア" value={kata.known} max={kata.total} kind="xp" />
      {hold && (
        <p className="muted small kana-hold">
          🔒 <T en={hold.en} jp={hold.jp} />
        </p>
      )}
    </div>
  )
}
