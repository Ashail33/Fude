/**
 * New game: the intro cutscene (once), then Fude asks your name and how
 * much Japanese the world should speak — in pixel windows.
 */
import { useState } from 'react'
import { PixelSprite } from '../art'
import { CommandMenu } from '../components/CommandMenu'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { setState, usePlayer, type ImmersionLevel } from '../engine/store'
import { Cutscene } from '../story/Cutscene'
import { SceneBackdrop } from '../story/Backdrop'

type Imm = 'auto' | ImmersionLevel

const LEVELS: [Imm, string, string, string][] = [
  ['auto', 'おまかせ', 'Grow with me', 'Starts in English and shifts to Japanese as you level up (recommended)'],
  [0, 'えいご', 'English', 'Menus in English'],
  [1, 'まぜる', 'Mixed', 'Japanese with English beneath'],
  [3, 'にほんご', 'Japanese', 'Full immersion'],
]

export default function Onboarding({ onDone }: { onDone?: () => void } = {}) {
  const p = usePlayer()
  const [phase, setPhase] = useState<'intro' | 'name' | 'lang'>(p.seenScenes.includes('intro') ? 'name' : 'intro')
  const [name, setName] = useState(p.name)
  const [lvl, setLvl] = useState<Imm>('auto')
  const [hl, setHl] = useState<Imm>('auto')

  if (phase === 'intro') return <Cutscene id="intro" onDone={() => setPhase('name')} />

  const finish = (imm: Imm) => {
    sfx.win()
    setState((s) => ({ ...s, name: name.trim() || 'Mage', onboarded: true, settings: { ...s.settings, immersion: imm } }))
    onDone?.()
  }

  const shownName = name.trim() || 'Mage'
  const desc = LEVELS.find((l) => l[0] === hl)

  return (
    <div className="onboard">
      <SceneBackdrop bg="night-hill" className="onboard-bg" />
      <div className="onboard-cast" aria-hidden>
        <PixelSprite id="mage" outfit="apprentice" dir="right" scale={4} animate anim="idle" />
        <PixelSprite id="fude" dir="left" scale={4} animate anim="idle" />
      </div>

      <div className="onboard-windows">
        {phase === 'name' ? (
          <form
            key="name"
            className="card onboard-card pop"
            onSubmit={(e) => {
              e.preventDefault()
              sfx.click()
              setPhase('lang')
            }}
          >
            <span className="win-title">フデ</span>
            <p className="onboard-line">
              <span lang="ja">あなたの なまえは？</span>
              <small>What’s your name, young mage?</small>
            </p>
            <label className="onboard-name">
              <span className="onboard-cursor">▶</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={12} autoFocus aria-label="Your name" enterKeyHint="done" />
            </label>
            <div className="row onboard-actions">
              <button type="submit" className="btn btn-primary">
                <span lang="ja">けってい</span> OK
              </button>
            </div>
          </form>
        ) : (
          <div key="lang" className="card onboard-card pop">
            <span className="win-title">フデ</span>
            <p className="onboard-line">
              <span lang="ja">{shownName}さん！ よろしく！</span>
              <small>Nice to meet you, {shownName}! How much Japanese should the world speak?</small>
            </p>
            <CommandMenu
              items={LEVELS.map(([v, jp, en]) => ({
                id: String(v),
                label: (
                  <span className="bi">
                    <span lang="ja">{jp}</span>
                    <small>{en}</small>
                  </span>
                ),
                hint: lvl === v ? '✔' : undefined,
              }))}
              onHighlight={(id) => setHl(id === 'auto' ? 'auto' : (Number(id) as ImmersionLevel))}
              onSelect={(id) => {
                const v: Imm = id === 'auto' ? 'auto' : (Number(id) as ImmersionLevel)
                setLvl(v)
                void speak('しゅっぱつ！')
                finish(v)
              }}
              onCancel={() => setPhase('name')}
              label="Language level"
            />
            {desc && <p className="muted small onboard-desc">{desc[3]}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
