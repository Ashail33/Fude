/**
 * Bits the Games tab screens share: the way back (to the world spot you came
 * from when a keeper sent you, else to the Games tab), and the card shown
 * while a game's keeper has not been met yet.
 */
import { Link, useLocation } from 'react-router-dom'
import type { PlayerState } from '../engine/store'
import { gameOpen, WHERE, type GameId } from './story'

export function fromWorld(search: string) {
  return new URLSearchParams(search).get('from') === 'world'
}

export function BackLink() {
  const loc = useLocation()
  const world = fromWorld(loc.search)
  return (
    <Link to={world ? '/' : '/arcade'} className="btn btn-sm">
      {world ? '← せかいへ' : '← あそび'}
    </Link>
  )
}

/** The game's screen while locked: who to meet, and where. */
export function Locked({ game, title }: { game: GameId; title: React.ReactNode }) {
  const w = WHERE[game]
  return (
    <main className="ar-page">
      <h1>{title}</h1>
      <section className="card ar-locked">
        <p>🔒 Not open yet.</p>
        <p lang="ja">{w.jp}</p>
        <p>{w.en}</p>
      </section>
      <Link to="/arcade" className="btn">
        ← あそび Games
      </Link>
    </main>
  )
}

export const isOpen = (p: PlayerState, g: GameId) => gameOpen(p, g)
