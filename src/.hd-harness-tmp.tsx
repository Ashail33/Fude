import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import './App.css'
import './world/Overworld.css'
import Battle from './battle/Battle'
import { Cutscene } from './story/Cutscene'
import { Dialog, type Step } from './world/Dialog'

const q = new URLSearchParams(location.search)
const mode = q.get('m')
const steps: Step[] = [
  { kind: 'say', speaker: { jp: 'ちょうろう', en: 'Elder' }, portrait: 'elder', line: { jp: 'よく きたな、わかき まどうしよ。', en: 'Welcome, young mage.' } },
  { kind: 'say', speaker: { jp: 'フデ', en: 'Fude' }, portrait: 'fude', line: { jp: 'こんにちは！', en: 'Hello!' } },
  { kind: 'choice', prompt: { jp: 'どうする？', en: 'What will you do?' }, options: [{ id: 'a', label: { jp: 'はなす', en: 'Talk' } }, { id: 'b', label: { jp: 'やめる', en: 'Leave' } }], onPick: () => {} },
]
function App() {
  if (mode === 'battle') return <Battle region={5} enemies={q.get('e') ? (q.get('e')!.split(',') as never) : ['dragon']} onEnd={() => {}} />
  if (mode === 'scene') return <Cutscene id={q.get('id')!} onDone={() => {}} />
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#2a5a3a' }}>
      <Dialog steps={steps.slice(Number(q.get('from') ?? 0))} onClose={() => {}} onStart={() => {}} />
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<HashRouter><App /></HashRouter>)
