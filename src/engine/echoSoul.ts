/**
 * Echo-Soul: free conversation with NPCs.
 *
 * - With an Anthropic API key, the NPC is played by Claude through the
 *   Messages API, called directly from the browser (non-streaming).
 * - Without a key (or when a request fails), a small rule-based offline
 *   NPC answers instead.
 *
 * Both return the same structured `EchoReply`.
 */
import * as wanakana from 'wanakana'
import type { Npc } from '../data/npcs'
import { VOCAB, type Word } from '../data/vocab'

export type PolitenessTag = 'polite' | 'casual' | 'rude'

export interface EchoReply {
  /** The NPC's reply in natural Japanese (kanji only for words the player knows). */
  reply_jp: string
  /** Full reading of reply_jp in kana. */
  reply_kana: string
  /** English translation (hidden behind a tap in the UI). */
  reply_en: string
  /** Gentle correction of the player's Japanese (English + corrected Japanese), or null. */
  correction: string | null
  /** Did the NPC understand the player's message? */
  understood: boolean
  /** Register of the PLAYER's message. */
  politeness: PolitenessTag
}

export interface ChatTurn {
  role: 'player' | 'npc'
  text: string
  reply?: EchoReply
}

// ─── Errors ────────────────────────────────────────────────────────────

export type EchoErrorKind = 'auth' | 'permission' | 'model' | 'rate' | 'overloaded' | 'bad-request' | 'network' | 'timeout' | 'refusal' | 'parse' | 'server'

export class EchoError extends Error {
  kind: EchoErrorKind
  status?: number
  constructor(kind: EchoErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'EchoError'
    this.kind = kind
    this.status = status
  }
}

// ─── Claude API ────────────────────────────────────────────────────────

export const API_URL = 'https://api.anthropic.com/v1/messages'
export const ANTHROPIC_VERSION = '2023-06-01'
/** Used when the settings model is blank. */
export const DEFAULT_MODEL = 'claude-opus-5-5'

/** JSON schema for structured outputs (output_config.format). */
export const ECHO_SCHEMA = {
  type: 'object',
  properties: {
    reply_jp: { type: 'string', description: 'Your in-character reply in simple Japanese.' },
    reply_kana: { type: 'string', description: 'The same reply written entirely in hiragana/katakana (no kanji).' },
    reply_en: { type: 'string', description: 'A natural English translation of reply_jp.' },
    correction: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: "A short, kind English note correcting the player's Japanese, including the corrected Japanese sentence. null if the message was fine.",
    },
    understood: { type: 'boolean', description: "Whether your character understood the player's message." },
    politeness: { type: 'string', enum: ['polite', 'casual', 'rude'], description: "The register of the player's message." },
  },
  required: ['reply_jp', 'reply_kana', 'reply_en', 'correction', 'understood', 'politeness'],
  additionalProperties: false,
} as const

/** What request features a (user-configurable) model id supports. */
export function modelCaps(model: string): { structured: boolean; effort: boolean; fallbacks: boolean } {
  const m = model.toLowerCase()
  const newGen = /(fable|mythos)|opus-5|sonnet-5/.test(m)
  return {
    structured: newGen || /opus-4-[158]|haiku-4-5/.test(m),
    effort: newGen || /opus-4-[5678]|sonnet-4-6/.test(m),
    // Server-side refusal fallback ("default" routing) for the current flagship models.
    fallbacks: /^claude-(opus-5-5|opus-5|sonnet-5-5|fable-5-1)$/.test(m),
  }
}

export interface PromptContext {
  npc: Npc
  knownWords: Word[]
  playerLevel: number
  playerName: string
}

/** Known-word ids from SRS keys (`w:<id>`). */
export function knownWordIds(srsKeys: string[]): string[] {
  return srsKeys.filter((k) => k.startsWith('w:')).map((k) => k.slice(2))
}

export function buildSystemPrompt({ npc, knownWords, playerLevel, playerName }: PromptContext): string {
  const words = knownWords.slice(0, 400).map((w) => `${w.jp}（${w.kana}）= ${w.en}`)
  const beginner = knownWords.length < 15
  return [
    `You are ${npc.name} (${npc.jp}), a character in "Kotoba no Mahō", a bright fantasy RPG where a traveller learns Japanese, and words are magic.`,
    `Personality: ${npc.personality}`,
    `You like to talk about: ${npc.interests.join(', ')}.`,
    npc.politeness === 'formal'
      ? 'You expect polite です/ます speech and humble phrases. If the player speaks casually or rudely, react with offended dignity (in simple Japanese), but keep talking.'
      : npc.politeness === 'casual'
        ? 'You speak in short, casual Japanese yourself, but you understand polite speech.'
        : 'You speak gently in polite です/ます Japanese.',
    `The traveller's name is ${playerName || 'unknown (ask for it!)'}. Their level is ${playerLevel}.`,
    '',
    'COMPREHENSION FILTER — follow these rules strictly:',
    '1. Your character understands ONLY Japanese. If the player writes in English (or any non-Japanese language), act genuinely confused, in character, in simple Japanese (e.g. 「え？すみません、わかりません…」). Set understood=false. Do not answer the English content.',
    '2. Romaji that is clearly Japanese counts as Japanese, but mention in `correction` that it is nicer to write in kana.',
    '3. If the Japanese is broken but you can guess the meaning, understand it, reply in slow, very simple Japanese (short sentences), set understood=true, and put a short, kind correction in `correction` (English explanation + the corrected Japanese).',
    '4. If you cannot understand the Japanese at all, say so kindly in simple Japanese and ask them to say it again slowly. understood=false.',
    '5. Vocabulary: build replies mainly from the words the player has seen (list below) plus basic grammar words (です, ます, particles, これ/それ, はい/いいえ, なに, どこ, だれ, いい, すき, common greetings). Avoid other vocabulary; if you must use a new word, write it in kana.',
    '6. Write kanji only for words in the list; write everything else in hiragana/katakana.',
    `7. Keep reply_jp to ${beginner ? 'one very short sentence (about 15 characters)' : playerLevel < 10 ? '1–2 short sentences' : '1–3 sentences'}. Usually end with a simple question to keep the conversation going.`,
    '8. Never use English inside reply_jp or reply_kana. Stay in character and in the fantasy world at all times.',
    '9. politeness describes the PLAYER\'s last message: "polite" (です/ます, set polite phrases), "casual" (plain forms, うん, じゃあね), or "rude" (insults, おまえ, うるさい).',
    '10. Answer with a single JSON object with exactly these keys: reply_jp, reply_kana, reply_en, correction (string or null), understood (boolean), politeness ("polite" | "casual" | "rude"). No other text.',
    '',
    beginner
      ? 'The player is an absolute beginner and has seen almost no words yet. Use only greetings and the very simplest Japanese.'
      : `Words the player has seen (${knownWords.length}):`,
    ...words,
  ].join('\n')
}

export interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Convert the chat log into Messages API turns (must start with a user turn). */
export function toApiMessages(history: ChatTurn[], maxTurns = 24): ApiMessage[] {
  const out: ApiMessage[] = []
  for (const t of history.slice(-maxTurns)) {
    if (t.role === 'player') out.push({ role: 'user', content: t.text })
    else if (out.length) out.push({ role: 'assistant', content: t.reply ? JSON.stringify(t.reply) : t.text })
  }
  while (out.length && out[0].role !== 'user') out.shift()
  return out
}

export interface RequestInput {
  apiKey: string
  model: string
  system: string
  messages: ApiMessage[]
  /** Structured-output schema (defaults to the NPC reply). */
  schema?: object
  /** Thinking effort (defaults to low: short replies, low latency). */
  effort?: 'low' | 'medium' | 'high'
}

/** Build the fetch() init for a Messages API call (exported for tests). */
export function buildRequest({ apiKey, model, system, messages, schema, effort }: RequestInput): { url: string; init: RequestInit } {
  const m = model.trim() || DEFAULT_MODEL
  const caps = modelCaps(m)
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': apiKey.trim(),
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
  }
  const body: Record<string, unknown> = { model: m, max_tokens: 16000, system, messages }
  const outputConfig: Record<string, unknown> = {}
  if (caps.structured) outputConfig.format = { type: 'json_schema', schema: schema ?? ECHO_SCHEMA }
  // Short conversational replies: low effort keeps latency down.
  if (caps.effort) outputConfig.effort = effort ?? 'low'
  if (Object.keys(outputConfig).length) body.output_config = outputConfig
  if (caps.fallbacks) {
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'
    body.fallbacks = 'default'
  }
  return { url: API_URL, init: { method: 'POST', headers, body: JSON.stringify(body) } }
}

interface ApiResponse {
  content?: { type: string; text?: string }[]
  stop_reason?: string | null
  error?: { type?: string; message?: string }
}

/** Map an HTTP error response to a friendly EchoError. */
export function errorFromResponse(status: number, body: ApiResponse | null, model: string): EchoError {
  const detail = body?.error?.message ?? ''
  switch (status) {
    case 401:
      return new EchoError('auth', 'Your Anthropic API key was rejected. Check the key in Settings.', status)
    case 403:
      return new EchoError('permission', `This API key is not allowed to use the model. ${detail}`.trim(), status)
    case 404:
      return new EchoError('model', `Model “${model}” was not found. Pick another model in Settings.`, status)
    case 413:
      return new EchoError('bad-request', 'The conversation is too long. Start a new chat.', status)
    case 429:
      return new EchoError('rate', 'Rate limit reached (or out of credits). Wait a moment and try again.', status)
    case 529:
      return new EchoError('overloaded', 'Claude is overloaded right now. Try again in a moment.', status)
    default:
      if (status >= 500) return new EchoError('server', `Anthropic API error (${status}). Try again shortly.`, status)
      return new EchoError('bad-request', `Request rejected (${status})${detail ? `: ${detail}` : ''}`, status)
  }
}

/** Robustly parse the model's JSON reply (tolerates code fences / stray text). */
export function parseEchoReply(text: string): EchoReply {
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a < 0 || b <= a) throw new EchoError('parse', 'The NPC’s reply could not be read (no JSON found).')
  t = t.slice(a, b + 1)
  let raw: unknown
  try {
    raw = JSON.parse(t)
  } catch {
    throw new EchoError('parse', 'The NPC’s reply could not be read (invalid JSON).')
  }
  if (!raw || typeof raw !== 'object') throw new EchoError('parse', 'The NPC’s reply could not be read.')
  const o = raw as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const reply_jp = str(o.reply_jp)
  if (!reply_jp) throw new EchoError('parse', 'The NPC’s reply was empty.')
  const pol = str(o.politeness)
  const corr = str(o.correction)
  return {
    reply_jp,
    reply_kana: str(o.reply_kana) || reply_jp,
    reply_en: str(o.reply_en),
    correction: corr && corr.toLowerCase() !== 'null' ? corr : null,
    understood: typeof o.understood === 'boolean' ? o.understood : o.understood !== 'false',
    politeness: pol === 'casual' || pol === 'rude' ? pol : 'polite',
  }
}

/** Call Claude and return the NPC's structured reply. Throws EchoError. */
export async function askClaude(input: RequestInput, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; timeoutMs?: number } = {}): Promise<EchoReply> {
  return parseEchoReply(await requestText(input, opts))
}

/** Call Claude and return the reply text (JSON when a schema is given). Throws EchoError. */
export async function requestText(input: RequestInput, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; timeoutMs?: number } = {}): Promise<string> {
  const { url, init } = buildRequest(input)
  const doFetch = opts.fetchImpl ?? fetch
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 60000)
  const onAbort = () => ctrl.abort()
  opts.signal?.addEventListener('abort', onAbort)
  let res: Response
  try {
    res = await doFetch(url, { ...init, signal: ctrl.signal })
  } catch (e) {
    if (ctrl.signal.aborted && !opts.signal?.aborted) throw new EchoError('timeout', 'Claude took too long to answer. Try again.')
    if (opts.signal?.aborted) throw new EchoError('network', 'Request cancelled.')
    throw new EchoError(
      'network',
      `Could not reach the Anthropic API (${e instanceof Error ? e.message : 'network error'}). Check your connection; browser extensions or network filters can also block the request (CORS).`,
    )
  } finally {
    clearTimeout(timer)
    opts.signal?.removeEventListener('abort', onAbort)
  }
  let body: ApiResponse | null = null
  try {
    body = (await res.json()) as ApiResponse
  } catch {
    body = null
  }
  if (!res.ok) throw errorFromResponse(res.status, body, input.model || DEFAULT_MODEL)
  if (!body) throw new EchoError('parse', 'Empty response from the API.')
  if (body.stop_reason === 'refusal') throw new EchoError('refusal', 'Claude declined to answer that message. Try saying something else.')
  const text = (body.content ?? [])
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('')
  if (!text.trim()) throw new EchoError('parse', 'The NPC gave no reply.')
  return text
}

// ─── Offline, rule-based NPC ───────────────────────────────────────────

const JA_CHAR = /[぀-ヿ㐀-鿿ｦ-ﾟ]/

/** Does the text look like English (or other non-Japanese) rather than Japanese/romaji? */
const ENGLISH_ONLY = new Set(['hi', 'hey', 'yo', 'no', 'so', 'oh', 'ok', 'me', 'to', 'go', 'do', 'i', 'a', 'mine', 'sure', 'bye'])

export function isNonJapanese(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (ENGLISH_ONLY.has(t.toLowerCase().replace(/[^a-z]/g, ''))) return true
  const ja = [...t].filter((c) => JA_CHAR.test(c)).length
  const latin = (t.match(/[a-z]/gi) ?? []).length
  if (ja >= latin) return false
  return !romajiToKana(t)
}

/** If `text` is plausible romaji, convert it to hiragana; else null. */
export function romajiToKana(text: string): string | null {
  const t = text.trim().toLowerCase()
  if (!/^[a-z\s'.,!?-]+$/.test(t)) return null
  const k = wanakana.toHiragana(t.replace(/\s+/g, ''))
  return /[a-z]/.test(k) ? null : k
}

const RUDE = /おまえ|お前|うるさい|ばか|バカ|しね|だまれ|きさま|てめえ/
const POLITE_END = /(です|ます|ました|ません|ましょう|ください|ございます|でしょう|ですか|ますか|ませんか)[かねよ]?[。！？!?、\s]*$/
const POLITE_PHRASES = /こんにちは|こんばんは|おはようございます|はじめまして|よろしくおねがいします|すみません|もうしわけ|しつれいします|ありがとうございます|いただきます|ごちそうさま|おねがいします|さようなら/

/** Classify the register of a Japanese message. */
export function classifyPoliteness(input: string): PolitenessTag {
  const text = input.replace(/\s+/g, '')
  if (RUDE.test(text)) return 'rude'
  if (POLITE_END.test(text) || POLITE_PHRASES.test(text)) return 'polite'
  return 'casual'
}

function r(reply_jp: string, reply_kana: string, reply_en: string, extra: Partial<EchoReply> = {}): EchoReply {
  return { reply_jp, reply_kana, reply_en, correction: null, understood: true, politeness: 'polite', ...extra }
}

function findWord(s: string): Word | undefined {
  const t = s.trim()
  return VOCAB.find((w) => w.jp === t || w.kana === t)
}

const NPC_SHORT: Record<string, { jp: string; kana: string; en: string }> = {
  merchant: { jp: 'ミナ', kana: 'ミナ', en: 'Mina' },
  guard: { jp: 'ゴロー', kana: 'ゴロー', en: 'Goro' },
  priest: { jp: 'かんぬし', kana: 'かんぬし', en: 'the priest' },
  king: { jp: '王', kana: 'おう', en: 'the King' },
  jailer: { jp: 'ろうやばん', kana: 'ろうやばん', en: 'the jailer' },
  innkeeper: { jp: 'ハル', kana: 'ハル', en: 'Haru' },
}

const FAVOURITE: Record<string, Word['id']> = { merchant: 'hi', guard: 'neko', priest: 'hana', king: 'tsurugi', jailer: 'kagi', innkeeper: 'sushi' }

/** Greeting shown when a chat with this NPC starts. */
export function greetingFor(npc: Npc): EchoReply {
  const me = NPC_SHORT[npc.id] ?? { jp: npc.jp, kana: npc.jp, en: npc.name }
  if (npc.id === 'king') return r('よく 来た。わしが 王だ。', 'よく きた。わしが おうだ。', 'You have come. I am the King.')
  if (npc.id === 'guard' || npc.id === 'jailer') return r(`${npc.greeting.jp} おれは ${me.jp}だ。`, `${npc.greeting.jp} おれは ${me.kana}だ。`, `${npc.greeting.en} I'm ${me.en}.`)
  return r(`${npc.greeting.jp} わたしは ${me.jp}です。`, `${npc.greeting.jp} わたしは ${me.kana}です。`, `${npc.greeting.en} I'm ${me.en}.`)
}

/**
 * Rule-based offline reply. Understands greetings, self-introductions,
 * 〜をください requests, simple questions, thanks, apologies and goodbyes.
 */
export function offlineReply(npc: Npc, input: string, ctx: { playerName?: string } = {}): EchoReply {
  const raw = input.trim()
  if (!raw) return r('…？', '…？', '…?', { understood: false })

  if (isNonJapanese(raw)) {
    return r('え？すみません、わかりません…。にほんごで おねがいします。', 'え？すみません、わかりません…。にほんごで おねがいします。', "Huh? Sorry, I don't understand… Japanese, please.", {
      understood: false,
      politeness: 'polite',
      correction: `${NPC_SHORT[npc.id]?.en ?? npc.name} only understands Japanese. Try こんにちは (hello) or わたしは〜です (I am ~).`,
    })
  }

  let correction: string | null = null
  let text = raw
  const fromRomaji = romajiToKana(raw)
  if (fromRomaji) {
    text = fromRomaji
    correction = `I read your romaji as 「${fromRomaji}」. Try writing in kana — type romaji in the kana box and it converts automatically.`
  }
  const t = text.replace(/[\s。、！？!?.,〜~ー]/g, '')
  const politeness = classifyPoliteness(text)
  const formal = npc.politeness === 'formal'
  const me = NPC_SHORT[npc.id] ?? { jp: npc.jp, kana: npc.jp, en: npc.name }
  const name = ctx.playerName?.trim()

  const withManners = (rep: EchoReply): EchoReply => {
    if (politeness === 'rude') {
      return r('なんと ぶれいな！ていねいに はなしなさい。', 'なんと ぶれいな！ていねいに はなしなさい。', 'How rude! Speak politely.', {
        politeness,
        correction: 'That was rude. Use です/ます forms and polite phrases like すみません.',
      })
    }
    if (formal && politeness === 'casual') {
      return {
        ...rep,
        reply_jp: `…ていねいに はなせ。${rep.reply_jp}`,
        reply_kana: `…ていねいに はなせ。${rep.reply_kana}`,
        reply_en: `…Speak politely. ${rep.reply_en}`,
        politeness,
        correction: correction ?? 'The King expects polite speech: use です/ます (e.g. ありがとうございます instead of ありがとう).',
      }
    }
    return { ...rep, politeness, correction: rep.correction ?? correction }
  }

  // Self-introduction: わたしは X です / なまえは X です
  const intro = t.match(/(?:わたし|私|ぼく|僕|おれ|俺)(は|を|が|の(?:なまえ|名前)は)(.+?)(?:です|だ|といいます|ともうします)$/) ?? t.match(/(?:なまえ|名前)は(.+?)(?:です|だ)$/)
  if (intro) {
    const particle = intro.length === 3 ? intro[1] : 'は'
    const who = (intro.length === 3 ? intro[2] : intro[1]) || name || '…'
    const known = findWord(who)
    const rep = known
      ? r(`${known.jp}ですか！いいですね。`, `${known.kana}ですか！いいですね。`, `A ${known.en}? How nice!`)
      : r(`${who}さん、はじめまして！わたしは ${me.jp}です。`, `${who}さん、はじめまして！わたしは ${me.kana}です。`, `${who}, nice to meet you! I'm ${me.en}.`)
    if (particle === 'を' || particle === 'が') rep.correction = `Use は for the topic: わたしは${who}です.`
    return withManners(rep)
  }

  if (/よろしく/.test(t)) return withManners(r('こちらこそ、よろしく おねがいします！', 'こちらこそ、よろしく おねがいします！', 'Likewise, nice to meet you!'))

  // Greetings
  if (/こんにち[はわ]|こんばん[はわ]|おはよう|はじめまして|やあ|ハロー/.test(t)) {
    const wa = /こんにちわ|こんばんわ/.test(t)
    const reply = /はじめまして/.test(t)
      ? r(`はじめまして！わたしは ${me.jp}です。おなまえは？`, `はじめまして！わたしは ${me.kana}です。おなまえは？`, `Nice to meet you! I'm ${me.en}. Your name?`)
      : r('こんにちは！げんきですか？', 'こんにちは！げんきですか？', 'Hello! How are you?')
    if (wa && !fromRomaji) reply.correction = 'こんにちは is written with は (pronounced "wa"), not わ.'
    return withManners(reply)
  }

  // Requests: X をください
  const req = t.match(/^(.+?)(を|は|が)?(?:ください|くださいませ|おねがいします)$/)
  if (req && req[1]) {
    const w = findWord(req[1])
    let rep: EchoReply
    if (w) rep = r(`はい、${w.jp}です。どうぞ！${w.emoji}`, `はい、${w.kana}です。どうぞ！`, `Here you are — ${w.en}!`)
    else rep = r(`${req[1]}…？ごめんなさい、ありません。`, `${req[1]}…？ごめんなさい、ありません。`, `${req[1]}…? Sorry, I don't have that.`)
    if (req[2] && req[2] !== 'を') rep.correction = `The thing you ask for takes を: ${req[1]}をください.`
    else if (!req[2] && /ください$/.test(t)) rep.correction = rep.correction ?? `Nice! Adding を is more natural: ${req[1]}をください.`
    return withManners(rep)
  }

  // Thanks / apologies / goodbyes
  if (/ありがとう|どうも/.test(t)) return withManners(r('どういたしまして！', 'どういたしまして！', "You're welcome!"))
  if (/すみません|ごめん|もうしわけ|申し訳/.test(t)) return withManners(r('だいじょうぶですよ。', 'だいじょうぶですよ。', "It's all right."))
  if (/さようなら|さよなら|じゃあね|またね|バイバイ|しつれいします|おやすみ/.test(t)) return withManners(r('さようなら！また きてね。', 'さようなら！また きてね。', 'Goodbye! Come again.'))

  // Likes: X が すきです
  const like = t.match(/^(.+?)(が|を|は)(?:すき|好き)(?:です|だ)?$/)
  if (like) {
    const w = findWord(like[1])
    const shown = w ? w.jp : like[1]
    const rep = r(`${shown}ですか。わたしも ${shown}が すきです！`, `${w ? w.kana : like[1]}ですか。わたしも ${w ? w.kana : like[1]}が すきです！`, `${w ? w.en : like[1]}, huh? I like ${w ? w.en : 'that'} too!`)
    if (like[2] !== 'が') rep.correction = `好き usually takes が: ${like[1]}が好きです.`
    return withManners(rep)
  }

  // Questions (か / ？)
  if (/[か？?]$/.test(text.trim()) || /(なに|なん|何|どこ|だれ|誰|いつ)/.test(t)) {
    if (/(なまえ|名前)/.test(t)) return withManners(r(`わたしは ${me.jp}です。`, `わたしは ${me.kana}です。`, `I'm ${me.en}.`))
    if (/げんき|元気/.test(t)) return withManners(r(`はい、げんきです！${name ? `${name}さん` : 'あなた'}は？`, `はい、げんきです！${name ? `${name}さん` : 'あなた'}は？`, "Yes, I'm well! And you?"))
    if (/すき|好き/.test(t)) {
      const fav = VOCAB.find((w) => w.id === FAVOURITE[npc.id]) ?? VOCAB[0]
      return withManners(r(`${fav.jp}が すきです！${fav.emoji}`, `${fav.kana}が すきです！`, `I like ${fav.en}! `.trim()))
    }
    if (/どこ/.test(t)) return withManners(r('ここは さかばです。', 'ここは さかばです。', 'This is the tavern.'))
    if (/だれ|誰/.test(t)) return withManners(r(`わたしは ${me.jp}です。`, `わたしは ${me.kana}です。`, `I'm ${me.en}.`))
    return withManners(r('うーん…むずかしい しつもんですね。', 'うーん…むずかしい しつもんですね。', "Hmm… that's a difficult question."))
  }

  if (/^(はい|ええ|うん)/.test(t)) return withManners(r('そうですか！', 'そうですか！', 'I see!'))
  if (/^(いいえ|いや|ううん)/.test(t)) return withManners(r('そうですか…。', 'そうですか…。', 'I see…'))
  if (/げんき|元気/.test(t)) return withManners(r('よかった！', 'よかった！', "That's great!"))

  const w = findWord(t)
  if (w) return withManners(r(`${w.jp}？${w.emoji} いいですね！`, `${w.kana}？いいですね！`, `${w.en}? Nice!`))

  return {
    ...r('ごめんなさい、よく わかりません。ゆっくり、もう いちど おねがいします。', 'ごめんなさい、よく わかりません。ゆっくり、もう いちど おねがいします。', "Sorry, I didn't quite understand. Once more, slowly, please."),
    understood: false,
    politeness,
    correction: correction ?? 'The offline NPC understands greetings, わたしは〜です, 〜をください, simple questions ending in か, thanks and apologies. Add an API key in Settings for free conversation.',
  }
}
