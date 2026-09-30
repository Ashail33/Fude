import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { setState, type ImmersionLevel } from '../engine/store'

const STORY = [
  {
    jp: 'ことばは、まほうです。',
    en: 'In the land of Kotoba, words are magic.',
    art: '📜',
  },
  {
    jp: '火と言えば、火がもえる。',
    en: 'Speak the word for fire, and fire burns. Speak the word for water, and rivers flow.',
    art: '🔥💧🌳',
  },
  {
    jp: 'でも、ことばがきえています…',
    en: 'But the old words are fading. Bridges grow transparent, forests fall silent, and demons made of scrambled letters roam the roads.',
    art: '👹',
  },
  {
    jp: 'あなたは、あたらしいまどうしです。',
    en: 'You are a new mage. Learn the words, master their magic, and restore the world, one spell at a time.',
    art: '🧙',
  },
]

export default function Onboarding() {
  const [page, setPage] = useState(0)
  const [name, setName] = useState('')
  const [lvl, setLvl] = useState<'auto' | ImmersionLevel>('auto')
  const story = page < STORY.length ? STORY[page] : null

  const finish = () => {
    sfx.win()
    setState((s) => ({ ...s, name: name.trim() || 'Mage', onboarded: true, settings: { ...s.settings, immersion: lvl } }))
  }

  return (
    <div className="onboard">
      <div className="onboard-card card pop" key={page}>
        {story ? (
          <>
            <div className="onboard-art float">{story.art}</div>
            <p className="onboard-jp" lang="ja">
              {story.jp}
            </p>
            <p className="onboard-en">{story.en}</p>
            <div className="row onboard-actions">
              <button type="button" className="btn-icon" aria-label="Listen" onClick={() => void speak(story.jp, { force: true })}>
                🔊
              </button>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                autoFocus
                onClick={() => {
                  sfx.click()
                  setPage(page + 1)
                }}
              >
                {page === 0 ? 'Begin the journey' : 'Continue'} →
              </button>
            </div>
            <div className="onboard-dots">
              {STORY.map((_, i) => (
                <span key={i} className={i === page ? 'on' : ''} />
              ))}
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              finish()
            }}
          >
            <Avatar outfit="apprentice" size={120} className="float" />
            <h2>
              <span lang="ja">おなまえは？</span>
              <br />
              <small className="muted">What is your name, young mage?</small>
            </h2>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={24} autoFocus aria-label="Your name" />
            <h3 className="onboard-sub">How much Japanese should the world speak?</h3>
            <div className="onboard-levels">
              {(
                [
                  ['auto', 'Grow with me', 'Starts in English and shifts to Japanese as you level up (recommended)'],
                  [0, 'English', 'Menus in English'],
                  [1, 'Mixed', 'Japanese with English beneath'],
                  [3, 'Japanese', 'Full immersion'],
                ] as const
              ).map(([v, label, desc]) => (
                <label key={String(v)} className={`onboard-level ${lvl === v ? 'on' : ''}`}>
                  <input type="radio" name="imm" checked={lvl === v} onChange={() => setLvl(v)} />
                  <strong>{label}</strong>
                  <span className="muted">{desc}</span>
                </label>
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-lg">
              <span lang="ja">しゅっぱつ！</span> Set out
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
