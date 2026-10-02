/**
 * The Spirit Scroll and Fude's Memories, side by side in the pause menu.
 * Locked entries stay visible as silhouettes and hints: the point is to
 * show how much story is still out there.
 */
import { T } from '../components/ui'
import { REGIONS } from '../data/regions'
import { WORD_BY_ID } from '../data/vocab'
import { usePlayer } from '../engine/store'
import { PAGES, pageHint, pageSeen, pageUnlocked, sealCount, sealed, YOKAI } from '../story/chronicle'

export function ChroniclePanel({ onReplay }: { onReplay?: (scene: string) => void }) {
  const p = usePlayer()
  const read = PAGES.filter((pg) => pageSeen(p, pg)).length
  return (
    <div className="gm-chronicle">
      <section className="card">
        <span className="win-title">
          <T en={`Fude’s Memories ${read}/${PAGES.length}`} jp={`フデの きおく ${read}/${PAGES.length}`} />
        </span>
        <ol className="gm-pages">
          {PAGES.map((pg) => {
            const seen = pageSeen(p, pg)
            const ready = !seen && pageUnlocked(p, pg)
            const hint = pageHint(p, pg)
            return (
              <li key={pg.n} className={seen ? 'seen' : ready ? 'ready' : 'locked'}>
                <span className="gm-page-n">{pg.kind === 'core' ? '📖' : '🌸'}</span>
                <span className="gm-page-body">
                  {seen ? (
                    <span className="bi">
                      <span lang="ja">{pg.jp}</span>
                      <small>{pg.title}</small>
                    </span>
                  ) : (
                    <span className="muted">
                      <T en={`Page ${pg.n} — ???`} jp={`${pg.n}ページ ── ？？？`} />
                    </span>
                  )}
                  {!seen && (
                    <small className="gm-page-hint">
                      {ready ? <T en="Ready! Return to the world to remember." jp="じゅんび OK！ せかいに もどろう。" /> : <T en={hint.en} jp={hint.jp} />}
                    </small>
                  )}
                </span>
                {seen && onReplay && (
                  <button type="button" className="btn btn-sm" onClick={() => onReplay(pg.scene)} aria-label={`Replay ${pg.title}`}>
                    ▶
                  </button>
                )}
              </li>
            )
          })}
        </ol>
        <p className="muted small">
          <T en="📖 pages come with the main road. 🌸 pages come from the spirits you help — they remember her too." jp="📖 は ボスを たおすと、🌸 は ようかいを たすけると ひらく。" />
        </p>
      </section>

      <section className="card">
        <span className="win-title">
          <T en={`Spirit Scroll ${sealCount(p)}/${YOKAI.length}`} jp={`ひゃっきの まきもの ${sealCount(p)}/${YOKAI.length}`} />
        </span>
        {REGIONS.map((r) => {
          const list = YOKAI.filter((y) => y.region === r.id)
          if (!list.length) return null
          return (
            <div key={r.id} className="gm-scroll-region">
              <h4>
                <span lang="ja">{r.jp}</span> <small className="muted">{r.name} · {sealCount(p, r.id)}/{list.length}</small>
              </h4>
              <ul className="gm-yokai">
                {list.map((y) =>
                  sealed(p, y.id) ? (
                    <li key={y.id} className="sealed">
                      <span className="gm-yokai-emoji" aria-hidden>
                        {y.emoji}
                      </span>
                      <span>
                        <span className="bi">
                          <span lang="ja">{y.jp}</span>
                          <small>
                            {y.name} ({y.kana})
                          </small>
                        </span>
                        <small className="gm-yokai-lore">{y.lore}</small>
                        {y.words?.length ? (
                          <small className="gm-yokai-words" lang="ja">
                            {y.words
                              .map((w) => WORD_BY_ID.get(w))
                              .filter(Boolean)
                              .map((w) => `${w!.jp}（${w!.en}）`)
                              .join('・')}
                          </small>
                        ) : null}
                      </span>
                    </li>
                  ) : (
                    <li key={y.id} className="locked">
                      <span className="gm-yokai-emoji silhouette" aria-hidden>
                        {y.emoji}
                      </span>
                      <span>
                        <span className="muted">？？？</span>
                        <small className="gm-yokai-lore">{y.hint}</small>
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )
        })}
      </section>
    </div>
  )
}
