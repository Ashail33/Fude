/**
 * あそび: games for a break from studying. Nothing to memorise here, just
 * fun (and a few spirit shards to bring back to the journey).
 */
import { Link } from 'react-router-dom'
import { raidDue } from '../engine/hamlet'
import { usePlayer } from '../engine/store'
import './Arcade.css'

export default function Arcade() {
  const p = usePlayer()
  const raid = p.hamlet && raidDue(p.hamlet)
  return (
    <main className="ar-page">
      <h1>
        <span lang="ja">あそび</span> Games
      </h1>
      <p className="muted">A break from studying. Earn spirit shards ✦ to bring back to your journey.</p>
      <div className="ar-list">
        <Link to="/hamlet" className="card ar-game">
          <span className="ar-icon">🏯</span>
          <span>
            <b>
              <span lang="ja">かくれざと</span> The Hidden Village
            </b>
            <small>Build your own village. Its dojo, forge and shrine make your mage stronger in every battle; defend it from yokai raids.</small>
            {raid && <small className="ar-alert">⚔️ Your village is under attack!</small>}
          </span>
        </Link>
        <Link to="/stick-ninja" className="card ar-game">
          <span className="ar-icon">🥷</span>
          <span>
            <b>
              <span lang="ja">ぼうにんじゃ</span> Stick Ninja
            </b>
            <small>A sword-fighting adventure: cut through five worlds of foes, level up, buy legendary swords and defeat the five bosses.</small>
            {p.ninja && (
              <small>
                ⚔️ Lv {p.ninja.level} · {p.ninja.cleared}/25 stages
              </small>
            )}
          </span>
        </Link>
        <Link to="/bamboo-bridge" className="card ar-game">
          <span className="ar-icon">🎋</span>
          <span>
            <b>
              <span lang="ja">ぼうわたり</span> Bamboo Bridge
            </b>
            <small>Hold to stretch the pole, let go to cross. Hit the red centre for a bonus; flip under the pole for shards.</small>
            {(p.arcade?.stick ?? 0) > 0 && <small>🏆 Best: {p.arcade!.stick}</small>}
          </span>
        </Link>
      </div>
      <Link to="/" className="btn">
        ← Back to the journey
      </Link>
    </main>
  )
}
