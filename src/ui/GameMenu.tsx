/**
 * JRPG pause menu. Command window (つよさ・どうぐ・まどうしょ・クエスト・
 * きがえ・ちず・さかば・せってい・とじる) with a detail pane. Keyboard:
 * arrows/WASD move, Z/Enter choose, X/Esc back/close. Touch: tap.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PixelSprite } from '../art'
import { ITEM_BY_ID, ITEMS } from '../battle/items'
import { CommandMenu } from '../components/CommandMenu'
import { GhostRecall } from '../components/GhostRecall'
import { QuestBoard, ReviewWindow, StatusWindow } from '../components/Journal'
import { T } from '../components/ui'
import { Weave } from '../components/Weave'
import { activitiesFor, regionMap, REGIONS } from '../data/regions'
import { getMap } from '../world/maps'
import { fading, LOCI } from '../engine/palace'
import { dueItems } from '../engine/quests'
import { immersionOf, level, regionMastered, regionUnlocked, usePlayer } from '../engine/store'
import { owedMemories } from '../story/chronicle'
import { KEY_ITEM_BY_ID, taleLog } from '../story/tales/engine'
import { ChroniclePanel } from './ChroniclePanel'
import { PalacePanel } from './PalacePanel'
import { uiSound } from './sound'
import { raidDue } from '../engine/hamlet'
import './GameMenu.css'

export interface GameMenuProps {
  onClose: () => void
  /** Fast travel: teleport the player to a map's entrance. */
  onTravel?: (mapId: string) => void
  /** Replay one of Fude's memories (a cutscene id). */
  onReplay?: (scene: string) => void
}

type Panel = 'status' | 'story' | 'chronicle' | 'palace' | 'items' | 'quests' | 'map'

function Label({ jp, en }: { jp: string; en: string }) {
  const p = usePlayer()
  return (
    <span className="gm-label">
      <span lang="ja">{jp}</span>
      {immersionOf(p) < 3 && <small>{en}</small>}
    </span>
  )
}

export function GameMenu({ onClose, onTravel, onReplay }: GameMenuProps) {
  const p = usePlayer()
  const nav = useNavigate()
  const [panel, setPanel] = useState<Panel>('status')
  const [focus, setFocus] = useState<'cmd' | 'panel'>('cmd')
  const due = dueItems(p).length
  const questsLeft = p.quests.list.filter((q) => !q.done).length
  const bagCount = Object.values(p.bag).reduce((a, b) => a + b, 0) + (p.keyItems?.length ?? 0)
  const activeTales = taleLog(p).filter((t) => !t.done).length
  const palaceFading = LOCI.flatMap((l) => l.memories).filter((m) => fading(p, m)).length

  // Panels without their own list: X/Esc returns to the command window.
  useEffect(() => {
    if (focus !== 'panel' || panel === 'items' || panel === 'map') return
    const onKey = (e: KeyboardEvent) => {
      if (['x', 'X', 'Escape', 'Backspace'].includes(e.key)) {
        e.preventDefault()
        e.stopImmediatePropagation()
        uiSound.cancel()
        setFocus('cmd')
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [focus, panel])

  const choose = (id: string) => {
    switch (id) {
      case 'status':
      case 'story':
      case 'chronicle':
      case 'palace':
      case 'items':
      case 'quests':
      case 'map':
        setPanel(id)
        setFocus('panel')
        return
      case 'grimoire':
        return nav('/grimoire')
      case 'wardrobe':
        return nav('/wardrobe')
      case 'tavern':
        return nav('/tavern')
      case 'arcade':
        return nav('/arcade')
      case 'settings':
        return nav('/settings')
      case 'close':
        return onClose()
    }
  }

  const commands = [
    { id: 'status', label: <Label jp="つよさ" en="Status" /> },
    { id: 'story', label: <Label jp="ものがたり" en="Story" />, hint: activeTales > 0 ? <span className="gm-badge">{activeTales}</span> : undefined },
    { id: 'chronicle', label: <Label jp="きおく" en="Memories" />, hint: owedMemories(p).length ? <span className="gm-badge">!</span> : undefined },
    { id: 'palace', label: <Label jp="やかた" en="Palace" />, hint: palaceFading ? <span className="gm-badge">{palaceFading}</span> : undefined },
    { id: 'items', label: <Label jp="どうぐ" en="Items" />, hint: bagCount || undefined },
    { id: 'grimoire', label: <Label jp="まどうしょ" en="Grimoire" /> },
    { id: 'quests', label: <Label jp="クエスト" en="Quests" />, hint: due + questsLeft > 0 ? <span className="gm-badge">{due + questsLeft}</span> : undefined },
    { id: 'wardrobe', label: <Label jp="きがえ" en="Wardrobe" /> },
    { id: 'map', label: <Label jp="ちず" en="World map" /> },
    { id: 'tavern', label: <Label jp="さかば" en="Tavern" /> },
    { id: 'arcade', label: <Label jp="あそび" en="Games" />, hint: p.hamlet && raidDue(p.hamlet) ? <span className="gm-badge">⚔</span> : undefined },
    { id: 'settings', label: <Label jp="せってい" en="Settings" /> },
    { id: 'close', label: <Label jp="とじる" en="Close" /> },
  ]

  let body: ReactNode
  if (panel === 'status') body = <StatusWindow big />
  else if (panel === 'story') body = <StoryPanel />
  else if (panel === 'chronicle') body = <ChroniclePanel onReplay={onReplay} />
  else if (panel === 'palace') body = <PalacePanel />
  else if (panel === 'items') body = <ItemsPanel active={focus === 'panel'} onBack={() => setFocus('cmd')} />
  else if (panel === 'quests')
    body = (
      <div className="gm-quests">
        <ReviewWindow />
        <section className="card">
          <span className="win-title">
            <T en="Chronos Quests" jp="クロノスのクエスト" />
          </span>
          <QuestBoard compact />
        </section>
        <GhostRecall />
      </div>
    )
  else
    body = (
      <MapPanel
        active={focus === 'panel'}
        onBack={() => setFocus('cmd')}
        onGo={(region) => {
          if (onTravel) {
            onTravel(regionMap(region))
            onClose()
          } else nav(`/region/${region}`)
        }}
      />
    )

  return (
    <div className="gm-backdrop" onClick={onClose}>
      <div className="gm" role="dialog" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
        <div className="gm-side">
          <nav className="card gm-cmds">
            <span className="win-title">
              <T en="Menu" jp="メニュー" />
            </span>
            <CommandMenu items={commands} onSelect={choose} onCancel={onClose} active={focus === 'cmd'} label="Menu" className="gm-cmd-list" />
          </nav>
          <div className="card gm-gold">
            <span>Lv {level(p)}</span>
            <span>💠 {p.shards}</span>
            <span>🔥 {p.streak.count}</span>
          </div>
        </div>
        <div className={`gm-panel ${focus === 'panel' ? 'focused' : ''}`} key={panel}>
          {focus === 'panel' && (
            <button type="button" className="btn btn-sm gm-back" onClick={() => setFocus('cmd')}>
              <T en="Back" jp="もどる" />
            </button>
          )}
          {body}
        </div>
      </div>
    </div>
  )
}

function ItemsPanel({ active, onBack }: { active: boolean; onBack: () => void }) {
  const p = usePlayer()
  const owned = ITEMS.filter((i) => (p.bag[i.id] ?? 0) > 0)
  const [sel, setSel] = useState(owned[0]?.id ?? '')
  const it = ITEM_BY_ID.get(sel)
  return (
    <div className="gm-items">
      <section className="card">
        <span className="win-title">
          <T en="Bag" jp="どうぐぶくろ" />
        </span>
        {owned.length ? (
          <CommandMenu
            items={owned.map((i) => ({
              id: i.id,
              label: (
                <span className="gm-item">
                  <PixelSprite id={i.icon} scale={2} />
                  <span className="bi">
                    <span lang="ja">{i.jp}</span>
                    <small>{i.name}</small>
                  </span>
                </span>
              ),
              hint: `×${p.bag[i.id]}`,
            }))}
            onHighlight={setSel}
            onSelect={setSel}
            onCancel={onBack}
            active={active}
            label="Items"
          />
        ) : (
          <p className="muted">
            <T en="Your bag is empty. Mina the merchant sells herbs for ことだま shards." jp="なにも ありません。" />
          </p>
        )}
      </section>
      {it && (
        <section className="card gm-desc">
          <PixelSprite id={it.icon} scale={3} />
          <div>
            <strong lang="ja">
              {it.jp}（{it.kana}）
            </strong>
            <p>{it.description}</p>
            <p className="muted small">
              <T en="Use it during battle." jp="せんとうちゅうに つかえます。" />
            </p>
          </div>
        </section>
      )}
      <section className="card">
        <span className="win-title">
          <T en="Key items" jp="だいじなもの" />
        </span>
        {(p.keyItems ?? []).length > 0 && (
          <ul className="gm-keyitems">
            {(p.keyItems ?? []).map((id) => {
              const k = KEY_ITEM_BY_ID.get(id)
              if (!k) return null
              return (
                <li key={id}>
                  <span className="gm-key-ico">{k.emoji}</span>
                  <span className="bi">
                    <span lang="ja">{k.jp}</span>
                    <small>
                      {k.name} — {k.desc}
                    </small>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        <div className="row">
          <span className="chip">💠 ことだま ×{p.shards}</span>
          {p.spells.map((s) => (
            <span key={s} className="chip" lang="ja">
              📜 {s}
            </span>
          ))}
          {p.discoveredKanji.length > 0 && <span className="chip">🀄 かんじ ×{p.discoveredKanji.length}</span>}
        </div>
      </section>
    </div>
  )
}

function MapPanel({ active, onBack, onGo }: { active: boolean; onBack: () => void; onGo: (region: number) => void }) {
  const p = usePlayer()
  const here = getMap(p.world.map)?.spec.region
  return (
    <section className="card gm-map">
      <span className="win-title">
        <T en="World map" jp="ちず" />
      </span>
      <CommandMenu
        items={REGIONS.map((r) => {
          const open = regionUnlocked(p, r.id)
          const acts = activitiesFor(r.id)
          const stars = acts.reduce((s, a) => s + (p.progress[a.id]?.stars ?? 0), 0)
          return {
            id: String(r.id),
            disabled: !open,
            label: (
              <span className="gm-region">
                <span className="gm-region-ico">{open ? r.emoji : '🔒'}</span>
                <span className="bi">
                  <span lang="ja">
                    {open ? r.jp : '？？？'}
                    {here === r.id && <span className="gm-here"> ◀ いま</span>}
                  </span>
                  <small>{open ? r.name : 'Defeat the previous guardian'}</small>
                </span>
              </span>
            ),
            hint: open ? (
              <>
                {regionMastered(p, r.id) && '👑 '}★{stars}/{acts.length * 3}
              </>
            ) : undefined,
          }
        })}
        onSelect={(id) => onGo(Number(id))}
        onCancel={onBack}
        active={active}
        label="World map"
      />
      <p className="muted small">
        <T en="Choose a region to travel there." jp="いきたい ところを えらんでください。" />
      </p>
    </section>
  )
}

/** The story log: active tales with their current objective, then finished ones. */
function StoryPanel() {
  const p = usePlayer()
  const rows = taleLog(p)
  return (
    <section className="card gm-story">
      <span className="win-title">
        <T en="Story" jp="ものがたり" />
      </span>
      {rows.length === 0 ? (
        <p className="muted">
          <T en="No tales yet. Look for people with a gold “!” — they need your help." jp="まだ ものがたりは ありません。きんいろの「！」を さがそう。" />
        </p>
      ) : (
        <ul className="gm-tales">
          {rows.map(({ tale, stage, done }) => (
            <li key={tale.id} className={done ? 'done' : ''}>
              <div className="gm-tale-head">
                <span>{done ? '✨' : tale.main ? '📜' : '🔸'}</span>
                <span className="bi">
                  <span lang="ja">{tale.jp}</span>
                  <small>{tale.title}</small>
                </span>
              </div>
              {done ? (
                <p className="muted small">
                  <T en="Complete!" jp="かんりょう！" />
                </p>
              ) : (
                <>
                  <p className="small muted">
                    <Weave text={tale.summary} />
                  </p>
                  <p className="gm-objective">
                    ▶ <span lang="ja">{tale.stages[stage].jp}</span>
                    {immersionOf(p) < 3 && (
                      <small>
                        <Weave text={tale.stages[stage].en} />
                      </small>
                    )}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">
        <T en="Tip: press ✨ (or C) to cast a word at whatever you face — the world reacts to words!" jp="ヒント：✨（C）で ことばを となえよう！" />
      </p>
    </section>
  )
}
