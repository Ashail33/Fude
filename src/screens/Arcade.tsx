/**
 * あそび: games for a break from studying. Each belongs to someone you meet
 * on the journey (see arcade/story.ts); until then its card says where to
 * find them. They pay back into the journey: spirit shards, Master Sumi's
 * blessing and the Hidden Village's buildings make the mage stronger.
 */
import { Link } from 'react-router-dom'
import { echoesBeaten, gameOpen, WHERE, type GameId } from '../arcade/story'
import { raidDue } from '../engine/hamlet'
import { usePlayer, type PlayerState } from '../engine/store'
import './Arcade.css'

interface Card {
  game: GameId
  to: string
  icon: string
  jp: string
  en: string
  keeper: string
  blurb: string
  status?: (p: PlayerState) => string | null
}

const CARDS: Card[] = [
  {
    game: 'dojo',
    to: '/stick-ninja',
    icon: '🥷',
    jp: 'すみの どうじょう',
    en: 'The Ink Dojo · Stick Ninja',
    keeper: 'Master Sumi, the bamboo grove',
    blurb: 'Step into Master Sumi’s scroll and cut down the Quiet’s ink warriors. Level up, buy legendary swords, defeat five ink echoes; each one earns a keepsake and more attack in your real battles.',
    status: (p) => (p.ninja ? `⚔️ Lv ${p.ninja.level} · ${p.ninja.cleared}/25 stages · ${echoesBeaten(p)}/5 echoes` : null),
  },
  {
    game: 'valley',
    to: '/hamlet',
    icon: '🏯',
    jp: 'かくれざと',
    en: 'The Hidden Village',
    keeper: 'Granny Tane, Windmill Hill',
    blurb: 'Rebuild the valley the Quiet emptied. Its dojo, forge and shrine make your mage stronger in every battle; defend it from yokai raids.',
    status: (p) => (p.hamlet && raidDue(p.hamlet) ? '⚔️ Your village is under attack!' : null),
  },
  {
    game: 'bridge',
    to: '/bamboo-bridge',
    icon: '🎋',
    jp: 'ぼうわたり',
    en: 'Bamboo Bridge',
    keeper: 'Hayato, Mushroom Hollow',
    blurb: 'Hayato’s crossing drill: hold to stretch the pole, let go to cross. Hit the red centre for a bonus; flip under the pole for shards.',
    status: (p) => ((p.arcade?.stick ?? 0) > 0 ? `🏆 Best: ${p.arcade!.stick}` : null),
  },
]

export default function Arcade() {
  const p = usePlayer()
  return (
    <main className="ar-page">
      <h1>
        <span lang="ja">あそび</span> Games
      </h1>
      <p className="muted">Games from people you meet on your journey. What you win comes back with you: spirit shards ✦, blessings and stronger battles.</p>
      <div className="ar-list">
        {CARDS.map((c) => {
          const open = gameOpen(p, c.game)
          const status = open ? c.status?.(p) : null
          const body = (
            <>
              <span className="ar-icon">{open ? c.icon : '🔒'}</span>
              <span>
                <b>
                  <span lang="ja">{c.jp}</span> {c.en}
                </b>
                {open ? <small>{c.blurb}</small> : <small>{WHERE[c.game].en}</small>}
                {open ? <small className="muted">👤 {c.keeper}</small> : <small lang="ja">{WHERE[c.game].jp}</small>}
                {status && <small className={status.includes('attack') ? 'ar-alert' : ''}>{status}</small>}
              </span>
            </>
          )
          return open ? (
            <Link key={c.game} to={c.to} className="card ar-game">
              {body}
            </Link>
          ) : (
            <div key={c.game} className="card ar-game ar-locked" aria-disabled>
              {body}
            </div>
          )
        })}
      </div>
      <Link to="/" className="btn">
        ← Back to the journey
      </Link>
    </main>
  )
}
