import { useRef, useState } from 'react'
import { T } from '../components/ui'
import { getMusicVolume, setMusicVolume } from '../engine/music'
import { fxQuality, setFxQuality, type FxQuality } from '../fx/quality'
import { canListen, canSpeak, hasJapaneseVoice, speak } from '../engine/speech'
import { exportSave, immersionOf, importSave, resetProgress, setState, updateSettings, usePlayer, type Settings as S } from '../engine/store'

const IMMERSION: [S['immersion'], string, string][] = [
  ['auto', 'Grow with me', 'English → Japanese as you level up'],
  [0, 'English', 'Menus in English'],
  [1, 'Mixed', 'Japanese with English beneath'],
  [2, 'Mostly Japanese', 'English on hover only'],
  [3, 'Fully Japanese', 'Complete immersion'],
]

export default function Settings() {
  const p = usePlayer()
  const s = p.settings
  const [msg, setMsg] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [musicVol, setMusicVol] = useState(() => getMusicVolume())
  const [fx, setFx] = useState<FxQuality>(() => fxQuality())
  const fileRef = useRef<HTMLInputElement>(null)

  const download = () => {
    const blob = new Blob([exportSave()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kotoba-save-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <main className="settings">
      <h1>
        <T en="Settings" jp="せってい" />
      </h1>

      <section className="card settings-section">
        <span className="win-title">
          <T en="Mage" jp="まどうし" />
        </span>
        <label className="field">
          <span>Name</span>
          <input type="text" value={p.name} maxLength={24} onChange={(e) => setState((st) => ({ ...st, name: e.target.value }))} />
        </label>
      </section>

      <section className="card settings-section">
        <span className="win-title">
          <T en="Language immersion" jp="ことばのレベル" />
        </span>
        <p className="muted small">
          The game moves from English → mixed → mostly Japanese → fully Japanese. Currently: level {immersionOf(p)}.
        </p>
        <div className="radio-list">
          {IMMERSION.map(([v, label, desc]) => (
            <label key={String(v)} className={`radio ${s.immersion === v ? 'on' : ''}`}>
              <input type="radio" name="immersion" checked={s.immersion === v} onChange={() => updateSettings({ immersion: v })} />
              <strong>{label}</strong>
              <span className="muted small">{desc}</span>
            </label>
          ))}
        </div>
        <label className="toggle">
          <input type="checkbox" checked={s.showRomaji} onChange={(e) => updateSettings({ showRomaji: e.target.checked })} />
          <span>Show romaji hints under Japanese</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.weave !== false} onChange={(e) => updateSettings({ weave: e.target.checked })} />
          <span>Blend the Japanese words I’ve learned into instructions, a few at a time (tap one to hear it)</span>
        </label>
      </section>

      <section className="card settings-section">
        <span className="win-title">
          <T en="Sound & voice" jp="おと" />
        </span>
        <label className="toggle">
          <input type="checkbox" checked={s.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
          <span>Sound effects &amp; music</span>
        </label>
        <label className="field">
          <span>
            <T en="Music volume" jp="おんがく" />: {Math.round(musicVol * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={musicVol}
            onChange={(e) => {
              const v = Number(e.target.value)
              setMusicVol(v)
              setMusicVolume(v)
            }}
            aria-label="Music volume"
          />
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.voice} onChange={(e) => updateSettings({ voice: e.target.checked })} />
          <span>Speak Japanese aloud (text-to-speech)</span>
        </label>
        <label className="field">
          <span>Speech speed: {s.speechRate.toFixed(2)}×</span>
          <input type="range" min={0.5} max={1.3} step={0.05} value={s.speechRate} onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })} />
        </label>
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={() => void speak('こんにちは。ことばのまほうへ、ようこそ。', { force: true })}>
            Test voice 🔊
          </button>
          <span className="muted small">
            {canSpeak() ? (hasJapaneseVoice() ? 'Japanese voice found ✔' : 'No Japanese voice installed; your browser may use a default voice.') : 'Text-to-speech not supported in this browser.'}
            {' · '}
            {canListen() ? 'Voice spells supported 🎤' : 'Voice spells need Chrome, Edge or Safari.'}
          </span>
        </div>
      </section>

      <section className="card settings-section">
        <span className="win-title">
          <T en="Graphics" jp="グラフィック" />
        </span>
        <p className="muted small">How the world is drawn. Lower it if an older phone feels slow; the game also steps down automatically.</p>
        <div className="radio-list">
          {(
            [
              ['high', '3D HD', 'Full 3D world: sun shadows, lantern light, glow and depth of field'],
              ['low', '3D Lite', '3D world at lower resolution with lighter effects'],
              ['classic', 'Classic 2D', 'The flat pixel-art view with lighting and glow'],
              ['off', 'Off', 'Plain pixel art, lightest on battery'],
            ] as const
          ).map(([v, label, desc]) => (
            <label key={v} className={`radio ${fx === v ? 'on' : ''}`}>
              <input
                type="radio"
                name="fx"
                id={`fx-${v}`}
                checked={fx === v}
                onChange={() => {
                  setFx(v)
                  setFxQuality(v)
                }}
              />
              <strong>{label}</strong>
              <span className="muted small">{desc}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="card settings-section">
        <span className="win-title">
          <T en="Echo-Soul AI (optional)" jp="エコーソウル" />
        </span>
        <p className="muted small">
          Add an Anthropic API key to let Tavern NPCs hold free conversations with you in Japanese. The key is stored only in this browser and sent only to api.anthropic.com. Without a key, NPCs use a simpler offline brain.
        </p>
        <label className="field">
          <span>API key</span>
          <div className="row">
            <input
              type={showKey ? 'text' : 'password'}
              value={s.apiKey}
              placeholder="sk-ant-…"
              autoComplete="off"
              onChange={(e) => updateSettings({ apiKey: e.target.value.trim() })}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-sm" onClick={() => setShowKey(!showKey)}>
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <label className="field">
          <span>Model</span>
          <select value={s.aiModel} onChange={(e) => updateSettings({ aiModel: e.target.value })}>
            <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (fast, cheapest)</option>
            <option value="claude-sonnet-5-5">Claude Sonnet 5.5 (balanced)</option>
            <option value="claude-opus-5-5">Claude Opus 5.5 (most capable)</option>
          </select>
        </label>
      </section>

      <section className="card settings-section">
        <span className="win-title">
          <T en="Save data" jp="セーブ" />
        </span>
        <p className="muted small">Progress is saved automatically in this browser. Export it to move between devices.</p>
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={download}>
            ⬇️ Export save
          </button>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            ⬆️ Import save
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              try {
                importSave(await f.text())
                setMsg('Save imported ✔')
              } catch (err) {
                setMsg(`Import failed: ${(err as Error).message}`)
              }
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (confirm('Erase all progress? This cannot be undone.')) {
                resetProgress()
                setMsg('Progress reset.')
              }
            }}
          >
            🗑️ Reset progress
          </button>
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>

      <p className="muted small center">
        Kotoba no Mahō · 言葉の魔法 — stroke data from{' '}
        <a href="http://kanjivg.tagaini.net" target="_blank" rel="noreferrer">
          KanjiVG
        </a>{' '}
        (CC BY-SA 3.0).
      </p>
    </main>
  )
}
