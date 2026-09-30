import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { KanaInput, SpeakButton } from '../components/ui'
import { NPCS, NPC_BY_ID, type Npc } from '../data/npcs'
import { WORD_BY_ID, type Word } from '../data/vocab'
import {
  askClaude,
  buildSystemPrompt,
  EchoError,
  greetingFor,
  knownWordIds,
  offlineReply,
  toApiMessages,
  type ChatTurn,
  type EchoReply,
  type PolitenessTag,
} from '../engine/echoSoul'
import { sfx } from '../engine/sfx'
import { canListen, listen, speak } from '../engine/speech'
import { adjustTrust, level, usePlayer } from '../engine/store'
import './Tavern.css'

const TAVERN_NPCS = NPCS.filter((n) => n.id !== 'jailer')

const SUGGESTIONS = ['こんにちは！', 'わたしは〜です。', '水をください。', 'げんきですか？', 'なにが すきですか？', 'ありがとうございます。']

const TONE: Record<PolitenessTag, { icon: string; label: string }> = {
  polite: { icon: '🙇', label: 'polite' },
  casual: { icon: '😎', label: 'casual' },
  rude: { icon: '😠', label: 'rude' },
}

interface Msg extends ChatTurn {
  id: number
  offline?: boolean
}

let nextId = 1
const NO_MESSAGES: Msg[] = []

function startChat(npc: Npc): Msg[] {
  const g = greetingFor(npc)
  return [{ id: nextId++, role: 'npc', text: g.reply_jp, reply: g, offline: true }]
}

export default function Tavern() {
  const p = usePlayer()
  const apiKey = p.settings.apiKey.trim()
  const model = p.settings.aiModel
  const online = apiKey.length > 0
  const [npcId, setNpcId] = useState('innkeeper')
  const npc = NPC_BY_ID.get(npcId) ?? TAVERN_NPCS[0]
  const [chats, setChats] = useState<Record<string, Msg[]>>(() => ({ [npc.id]: startChat(npc) }))
  const [draft, setDraft] = useState('')
  const [ime, setIme] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ message: string; kind: string } | null>(null)
  const [listening, setListening] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const logRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const cancelListen = useRef<(() => void) | null>(null)
  const inputWrap = useRef<HTMLDivElement>(null)
  const offlineTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const messages = chats[npc.id] ?? NO_MESSAGES

  const knownWords = useMemo(
    () =>
      knownWordIds(Object.keys(p.srs))
        .map((id) => WORD_BY_ID.get(id))
        .filter((w): w is Word => !!w),
    [p.srs],
  )

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, busy])

  useEffect(
    () => () => {
      abortRef.current?.abort()
      cancelListen.current?.()
      clearTimeout(offlineTimer.current)
    },
    [],
  )

  const selectNpc = (n: Npc) => {
    if (n.id === npc.id) return
    abortRef.current?.abort()
    sfx.click()
    setNpcId(n.id)
    setError(null)
    setBusy(false)
    setChats((c) => (c[n.id] ? c : { ...c, [n.id]: startChat(n) }))
  }

  const resetChat = () => {
    abortRef.current?.abort()
    setBusy(false)
    setError(null)
    setChats((c) => ({ ...c, [npc.id]: startChat(npc) }))
  }

  const deliver = useCallback(
    (forNpc: Npc, reply: EchoReply, offline: boolean) => {
      setChats((c) => ({ ...c, [forNpc.id]: [...(c[forNpc.id] ?? []), { id: nextId++, role: 'npc', text: reply.reply_jp, reply, offline }] }))
      if (reply.politeness === 'rude') adjustTrust(forNpc.id, -1)
      else if (forNpc.politeness === 'formal' && reply.politeness === 'casual') adjustTrust(forNpc.id, -1)
      if (reply.understood) sfx.correct()
      else sfx.wrong()
      void speak(reply.reply_kana || reply.reply_jp)
    },
    [],
  )

  const send = useCallback(
    async (textIn: string) => {
      const text = textIn.trim()
      if (!text || busy) return
      const talkingTo = npc
      const player: Msg = { id: nextId++, role: 'player', text }
      const history = [...messages, player]
      setChats((c) => ({ ...c, [talkingTo.id]: history }))
      setDraft('')
      setError(null)
      if (!online) {
        setBusy(true)
        // A short pause so the NPC feels like it is thinking.
        offlineTimer.current = setTimeout(() => {
          setBusy(false)
          deliver(talkingTo, offlineReply(talkingTo, text, { playerName: p.name }), true)
        }, 450)
        return
      }
      setBusy(true)
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const system = buildSystemPrompt({ npc: talkingTo, knownWords, playerLevel: level(p), playerName: p.name })
        const reply = await askClaude({ apiKey, model, system, messages: toApiMessages(history) }, { signal: ctrl.signal })
        if (ctrl.signal.aborted) return
        deliver(talkingTo, reply, false)
      } catch (e) {
        if (ctrl.signal.aborted) return
        const err = e instanceof EchoError ? e : new EchoError('network', e instanceof Error ? e.message : 'Unknown error')
        setError({ message: err.message, kind: err.kind })
        // Keep the conversation going with the offline NPC.
        deliver(talkingTo, offlineReply(talkingTo, text, { playerName: p.name }), true)
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null
        if (!ctrl.signal.aborted) setBusy(false)
      }
    },
    [busy, npc, messages, online, deliver, p, knownWords, apiKey, model],
  )

  const startVoice = () => {
    if (listening) return
    setListening(true)
    setError(null)
    const { promise, cancel } = listen()
    cancelListen.current = cancel
    promise
      .then((alts) => {
        const heard = alts[0]?.transcript ?? ''
        if (heard) setDraft(heard)
        inputWrap.current?.querySelector('input')?.focus()
      })
      .catch((e: Error) => setError({ kind: 'voice', message: e.message === 'no-speech' ? 'I heard nothing — try again.' : `Voice input failed (${e.message}).` }))
      .finally(() => {
        setListening(false)
        cancelListen.current = null
      })
  }

  const toggleEn = (id: number) =>
    setRevealed((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const trust = p.npcTrust[npc.id] ?? 0

  return (
    <div className="tav">
      <header className="tav-header">
        <Link to="/" className="btn-icon" aria-label="Back to map" title="Back">
          ←
        </Link>
        <h1 className="tav-title">
          <span lang="ja">さかば</span> <small>The Echo-Soul Tavern</small>
        </h1>
      </header>

      <div className={`tav-mode ${online ? 'on' : 'off'}`}>
        {online ? (
          <>
            ✨ <b>Echo-Soul AI</b> <span className="muted">· {model || 'claude-opus-5-5'}</span>
          </>
        ) : (
          <>
            🌙 <b>Offline NPC</b> — understands greetings, わたしは〜です, 〜をください, simple questions and thanks.{' '}
            <Link to="/settings">Add an Anthropic API key in Settings</Link> for free AI conversation.
          </>
        )}
      </div>

      <div className="tav-npcs" role="tablist" aria-label="Choose who to talk to">
        {TAVERN_NPCS.map((n) => (
          <button
            key={n.id}
            type="button"
            role="tab"
            aria-selected={n.id === npc.id}
            className={`tav-npc ${n.id === npc.id ? 'active' : ''}`}
            style={{ ['--npc' as string]: n.color }}
            onClick={() => selectNpc(n)}
            title={n.name}
          >
            <span className="tav-npc-emoji" aria-hidden>
              {n.emoji}
            </span>
            <span className="tav-npc-name" lang="ja">
              {n.jp}
            </span>
          </button>
        ))}
      </div>

      <div className="tav-panel card" style={{ ['--npc' as string]: npc.color }}>
        <div className="tav-panel-head">
          <span className="tav-portrait" aria-hidden>
            {npc.emoji}
          </span>
          <div className="tav-panel-info">
            <b>{npc.name}</b>
            <small className="muted">{npc.personality}</small>
          </div>
          <div className="tav-trust" title="Trust (reputation)">
            {npc.politeness === 'formal' ? '👑' : '💛'} {trust}
          </div>
          <button type="button" className="btn btn-sm" onClick={resetChat} title="Start a new conversation">
            ↺
          </button>
        </div>

        <div className="tav-log" ref={logRef} aria-live="polite">
          {messages.map((m, i) =>
            m.role === 'player' ? (
              <div key={m.id} className="tav-msg tav-me">
                <div className="tav-bubble" lang="ja">
                  {m.text}
                </div>
              </div>
            ) : (
              <NpcMessage key={m.id} msg={m} npc={npc} showEn={revealed.has(m.id)} onToggle={() => toggleEn(m.id)} isGreeting={i === 0} />
            ),
          )}
          {busy && (
            <div className="tav-msg tav-them">
              <span className="tav-mini" aria-hidden>
                {npc.emoji}
              </span>
              <div className="tav-bubble tav-typing" aria-label="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="tav-error" role="alert">
            ⚠️ {error.message}
            {(error.kind === 'auth' || error.kind === 'model' || error.kind === 'permission') && (
              <>
                {' '}
                <Link to="/settings">Open Settings</Link>
              </>
            )}
            {error.kind !== 'voice' && <div className="muted">The offline NPC answered instead.</div>}
          </div>
        )}

        <div className="tav-suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="tav-chip" lang="ja" onClick={() => setDraft(s.replace('〜', p.name || ''))}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="tav-compose"
          onSubmit={(e) => {
            e.preventDefault()
            void send(draft)
          }}
        >
          <div className="tav-input" ref={inputWrap}>
            {ime ? (
              <input type="text" lang="ja" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="日本語で…" autoComplete="off" aria-label="Your message" />
            ) : (
              <KanaInput value={draft} onChange={setDraft} onSubmit={(v) => void send(v)} placeholder="romaji → かな…" />
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy || !draft.trim()}>
            Send
          </button>
          {canListen() && (
            <button type="button" className={`btn ${listening ? 'tav-listening' : ''}`} onClick={startVoice} disabled={listening} aria-label="Speak">
              🎤
            </button>
          )}
        </form>
        <label className="tav-ime">
          <input type="checkbox" checked={ime} onChange={(e) => setIme(e.target.checked)} /> Use my keyboard’s Japanese IME (no romaji conversion)
        </label>
      </div>
    </div>
  )
}

function NpcMessage({ msg, npc, showEn, onToggle, isGreeting }: { msg: Msg; npc: Npc; showEn: boolean; onToggle: () => void; isGreeting: boolean }) {
  const r = msg.reply
  if (!r) return null
  const tone = TONE[r.politeness]
  // The greeting has no player message to judge; otherwise always show the register for AI replies.
  const showTone = !isGreeting && (r.politeness !== 'polite' || msg.offline === false)
  return (
    <div className="tav-msg tav-them">
      <span className="tav-mini" aria-hidden>
        {npc.emoji}
      </span>
      <div className="tav-col">
        <div className={`tav-bubble ${r.understood ? '' : 'tav-confused'}`}>
          <div className="tav-jp" lang="ja">
            {r.reply_jp}
          </div>
          {r.reply_kana && r.reply_kana !== r.reply_jp && (
            <div className="tav-kana" lang="ja">
              {r.reply_kana}
            </div>
          )}
          <div className="tav-tools">
            <SpeakButton text={r.reply_kana || r.reply_jp} />
            {r.reply_en && (
              <button type="button" className="tav-en-btn" onClick={onToggle} aria-expanded={showEn}>
                {showEn ? r.reply_en : 'Tap for English'}
              </button>
            )}
          </div>
        </div>
        {(r.correction || !r.understood || showTone) && (
          <div className="tav-meta">
            {!r.understood && <span className="tav-tag">❓ not understood</span>}
            {showTone && (
              <span className={`tav-tag tav-tone-${r.politeness}`}>
                {tone.icon} you sounded {tone.label}
              </span>
            )}
            {r.correction && <div className="tav-correction">✏️ {r.correction}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
