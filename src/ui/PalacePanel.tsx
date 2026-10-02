/**
 * The memory palace in the pause menu: one room per region, its places in
 * route order, what's been placed at each (and what's fading), the image
 * stories, and a button to walk the room.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../components/ui'
import { REGIONS } from '../data/regions'
import { fading, info, placed, roomLoci } from '../engine/palace'
import { regionUnlocked, usePlayer } from '../engine/store'

export function PalacePanel() {
  const p = usePlayer()
  const nav = useNavigate()
  const rooms = REGIONS.filter((r) => regionUnlocked(p, r.id) && roomLoci(r.id).length)
  const [room, setRoom] = useState(rooms[rooms.length - 1]?.id ?? 1)
  const [open, setOpen] = useState<string | null>(null)
  const loci = roomLoci(room)
  const all = loci.flatMap((l) => l.memories)
  const have = all.filter((m) => placed(p, m)).length
  const fade = all.filter((m) => fading(p, m)).length

  return (
    <section className="card gm-palace">
      <span className="win-title">
        <T en="Memory Palace" jp="きおくの やかた" />
      </span>
      <p className="muted small">
        <T
          en="Every kana, word and grammar point you learn is placed somewhere you’ve walked. Picture the place, see the image, and the Japanese comes back. Places that glow blue in the world have fading memories."
          jp="おぼえた ことばは、せかいの どこかに しまわれる。ばしょを おもいうかべれば、ことばが もどる。"
        />
      </p>
      <div className="gm-palace-rooms" role="tablist">
        {rooms.map((r) => (
          <button key={r.id} type="button" role="tab" aria-selected={r.id === room} className={`btn btn-sm ${r.id === room ? 'btn-primary' : ''}`} onClick={() => setRoom(r.id)}>
            {r.emoji} <span lang="ja">{r.jp}</span>
          </button>
        ))}
      </div>
      <div className="gm-palace-head">
        <span>
          🏯 {have}/{all.length} <T en="placed" jp="しまった" />
          {fade > 0 && (
            <span className="gm-palace-fade">
              {' '}
              · 💧{fade} <T en="fading" jp="うすれている" />
            </span>
          )}
        </span>
        <button type="button" className="btn btn-primary btn-sm" disabled={!have} onClick={() => nav(`/play/palace/${room}`)}>
          <T en="Walk this room ▶" jp="あるく ▶" />
        </button>
      </div>
      <ol className="gm-loci">
        {loci.map((l, n) => {
          const here = l.memories.filter((m) => placed(p, m))
          const fades = l.memories.filter((m) => fading(p, m)).length
          const isOpen = open === l.id
          return (
            <li key={l.id} className={`${here.length ? '' : 'empty'} ${fades ? 'fading' : ''}`}>
              <button type="button" className="gm-locus" onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen}>
                <span className="gm-locus-n">{n + 1}</span>
                <span className="gm-locus-emoji" aria-hidden>
                  {l.emoji}
                </span>
                <span className="gm-locus-name bi">
                  <span lang="ja">{l.name.jp}</span>
                  <small>{l.name.en}</small>
                </span>
                <span className="gm-locus-chips" lang="ja">
                  {l.memories.map((m) => {
                    const d = info(m)
                    return placed(p, m) ? (
                      <span key={m.item} className={fading(p, m) ? 'fading' : ''}>
                        {d?.front}
                      </span>
                    ) : (
                      <span key={m.item} className="slot">
                        ・
                      </span>
                    )
                  })}
                </span>
              </button>
              {isOpen && (
                <ul className="gm-memories">
                  {here.length === 0 && (
                    <li className="muted small">
                      <T en="Nothing placed here yet: keep learning and it will fill up." jp="まだ なにも ない。まなぶと ふえていく。" />
                    </li>
                  )}
                  {here.map((m) => {
                    const d = info(m)
                    return (
                      <li key={m.item}>
                        <span className="gm-memory-front" lang="ja">
                          {d?.front}
                        </span>
                        <span>
                          <small className="gm-memory-gloss">
                            {[d?.reading && d.reading !== d.front ? d.reading : '', d?.kind === 'kana' ? '' : d?.meaning].filter(Boolean).join(' · ')}
                          </small>
                          <span className="gm-memory-story">{m.story}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
