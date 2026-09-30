import { describe, expect, it, vi } from 'vitest'
import { NPC_BY_ID } from '../data/npcs'
import { WORD_BY_ID, type Word } from '../data/vocab'
import {
  askClaude,
  buildRequest,
  buildSystemPrompt,
  classifyPoliteness,
  EchoError,
  greetingFor,
  isNonJapanese,
  knownWordIds,
  modelCaps,
  offlineReply,
  parseEchoReply,
  romajiToKana,
  toApiMessages,
  type ChatTurn,
} from './echoSoul'

const merchant = NPC_BY_ID.get('merchant')!
const king = NPC_BY_ID.get('king')!

describe('offline NPC', () => {
  it('is confused by English', () => {
    const r = offlineReply(merchant, 'Hello, can I buy some water?')
    expect(r.understood).toBe(false)
    expect(r.reply_jp).toMatch(/わかりません/)
    expect(r.correction).toBeTruthy()
    expect(offlineReply(merchant, 'hi').understood).toBe(false)
  })
  it('answers greetings and corrects こんにちわ', () => {
    const r = offlineReply(merchant, 'こんにちは！')
    expect(r.understood).toBe(true)
    expect(r.reply_jp).toMatch(/こんにちは/)
    expect(r.correction).toBeNull()
    expect(offlineReply(merchant, 'こんにちわ').correction).toMatch(/は/)
  })
  it('handles self-introduction', () => {
    const r = offlineReply(merchant, 'わたしは アッシュ です。')
    expect(r.reply_jp).toContain('アッシュさん')
    expect(r.understood).toBe(true)
    expect(offlineReply(merchant, 'わたしをアッシュです').correction).toMatch(/は/)
  })
  it('handles ください requests for known and unknown items', () => {
    const r = offlineReply(merchant, '水をください')
    expect(r.reply_jp).toContain('水')
    expect(r.reply_en).toMatch(/water/)
    expect(r.correction).toBeNull()
    expect(offlineReply(merchant, 'みずはください').correction).toMatch(/を/)
    expect(offlineReply(merchant, 'ドラゴンをください').reply_jp).toMatch(/ありません/)
  })
  it('answers questions ending in か', () => {
    expect(offlineReply(merchant, 'おなまえは なんですか').reply_jp).toMatch(/ミナ/)
    expect(offlineReply(merchant, 'げんきですか？').reply_jp).toMatch(/げんき/)
    expect(offlineReply(merchant, 'なにが すきですか').reply_jp).toMatch(/すき/)
  })
  it('thanks, apologies, goodbyes', () => {
    expect(offlineReply(merchant, 'ありがとう').reply_jp).toMatch(/どういたしまして/)
    expect(offlineReply(merchant, 'すみません').reply_jp).toMatch(/だいじょうぶ/)
    expect(offlineReply(merchant, 'さようなら').reply_jp).toMatch(/さようなら/)
  })
  it('reads romaji and suggests kana', () => {
    const r = offlineReply(merchant, 'arigatou')
    expect(r.reply_jp).toMatch(/どういたしまして/)
    expect(r.correction).toMatch(/kana/)
  })
  it('the King scolds casual speech', () => {
    const r = offlineReply(king, 'ありがとう')
    expect(r.politeness).toBe('casual')
    expect(r.reply_jp).toMatch(/ていねい/)
    expect(offlineReply(king, 'ありがとうございます').politeness).toBe('polite')
    expect(offlineReply(king, 'うるさい').politeness).toBe('rude')
  })
  it('admits confusion for unknown Japanese', () => {
    const r = offlineReply(merchant, 'ぴよぴよぽん')
    expect(r.understood).toBe(false)
  })
  it('greets', () => {
    expect(greetingFor(merchant).reply_jp).toMatch(/ミナ/)
  })
})

describe('language helpers', () => {
  it('detects non-Japanese', () => {
    expect(isNonJapanese('Where is the dragon?')).toBe(true)
    expect(isNonJapanese('りゅうはどこですか')).toBe(false)
    expect(isNonJapanese('konnichiwa')).toBe(false)
  })
  it('romaji → kana', () => {
    expect(romajiToKana('konnichiwa')).toBe('こんにちわ')
    expect(romajiToKana('hello there')).toBeNull()
  })
  it('classifies politeness', () => {
    expect(classifyPoliteness('たべます')).toBe('polite')
    expect(classifyPoliteness('よろしく おねがいします')).toBe('polite')
    expect(classifyPoliteness('たべる')).toBe('casual')
    expect(classifyPoliteness('おまえ だれ')).toBe('rude')
  })
})

describe('JSON parsing', () => {
  const good = { reply_jp: '水です。', reply_kana: 'みずです。', reply_en: "It's water.", correction: null, understood: true, politeness: 'polite' }
  it('parses a clean object', () => {
    expect(parseEchoReply(JSON.stringify(good))).toEqual(good)
  })
  it('tolerates code fences and surrounding text', () => {
    expect(parseEchoReply('Sure!\n```json\n' + JSON.stringify(good) + '\n```')).toEqual(good)
  })
  it('fills defaults and normalises fields', () => {
    const r = parseEchoReply('{"reply_jp":"はい","correction":"","politeness":"weird","understood":"false"}')
    expect(r).toEqual({ reply_jp: 'はい', reply_kana: 'はい', reply_en: '', correction: null, understood: false, politeness: 'polite' })
  })
  it('throws EchoError(parse) on garbage', () => {
    expect(() => parseEchoReply('no json here')).toThrow(EchoError)
    expect(() => parseEchoReply('{"reply_jp": }')).toThrow(/invalid JSON/)
    expect(() => parseEchoReply('{"reply_en":"x"}')).toThrow(/empty/)
  })
})

describe('request building', () => {
  const words = ['mizu', 'hi'].map((id) => WORD_BY_ID.get(id)!) as Word[]
  it('system prompt contains the comprehension filter and known words', () => {
    const sys = buildSystemPrompt({ npc: merchant, knownWords: words, playerLevel: 2, playerName: 'Ash' })
    expect(sys).toMatch(/COMPREHENSION FILTER/)
    expect(sys).toContain('水（みず）= water')
    expect(sys).toContain('Ash')
  })
  it('knownWordIds picks w: keys', () => {
    expect(knownWordIds(['w:mizu', 'k:あ', 'w:hi'])).toEqual(['mizu', 'hi'])
  })
  it('history starts with a user turn and replays NPC JSON', () => {
    const g = greetingFor(merchant)
    const h: ChatTurn[] = [
      { role: 'npc', text: g.reply_jp, reply: g },
      { role: 'player', text: 'こんにちは' },
      { role: 'npc', text: 'x', reply: g },
      { role: 'player', text: '水をください' },
    ]
    const m = toApiMessages(h)
    expect(m[0]).toEqual({ role: 'user', content: 'こんにちは' })
    expect(m.map((x) => x.role)).toEqual(['user', 'assistant', 'user'])
    expect(JSON.parse(m[1].content).reply_jp).toBe(g.reply_jp)
  })
  it('sets browser headers, structured output and fallbacks', () => {
    const { url, init } = buildRequest({ apiKey: ' sk-test ', model: 'claude-sonnet-5-5', system: 's', messages: [{ role: 'user', content: 'hi' }] })
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    const h = init.headers as Record<string, string>
    expect(h['x-api-key']).toBe('sk-test')
    expect(h['anthropic-version']).toBe('2023-06-01')
    expect(h['anthropic-dangerous-direct-browser-access']).toBe('true')
    expect(h['anthropic-beta']).toBe('server-side-fallback-2026-07-01')
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('claude-sonnet-5-5')
    expect(body.output_config.format.type).toBe('json_schema')
    expect(body.output_config.effort).toBe('low')
    expect(body.fallbacks).toBe('default')
    expect(body.thinking).toBeUndefined()
  })
  it('omits unsupported features for other models', () => {
    expect(modelCaps('claude-haiku-4-5')).toEqual({ structured: true, effort: false, fallbacks: false })
    const { init } = buildRequest({ apiKey: 'k', model: 'claude-haiku-4-5', system: 's', messages: [] })
    const body = JSON.parse(init.body as string)
    expect(body.output_config.effort).toBeUndefined()
    expect(body.fallbacks).toBeUndefined()
    expect((init.headers as Record<string, string>)['anthropic-beta']).toBeUndefined()
    expect(JSON.parse(buildRequest({ apiKey: 'k', model: '', system: 's', messages: [] }).init.body as string).model).toBe('claude-opus-5-5')
  })
})

describe('askClaude (mocked fetch — no real API calls)', () => {
  const input = { apiKey: 'k', model: 'claude-sonnet-5-5', system: 's', messages: [{ role: 'user' as const, content: 'こんにちは' }] }
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

  it('returns the parsed reply', async () => {
    const reply = { reply_jp: 'こんにちは！', reply_kana: 'こんにちは！', reply_en: 'Hello!', correction: null, understood: true, politeness: 'polite' }
    const f = vi.fn(async () => json(200, { content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(reply) }], stop_reason: 'end_turn' }))
    await expect(askClaude(input, { fetchImpl: f as unknown as typeof fetch })).resolves.toEqual(reply)
    expect(f).toHaveBeenCalledOnce()
  })
  it('maps HTTP errors', async () => {
    const cases: [number, string][] = [
      [401, 'auth'],
      [404, 'model'],
      [429, 'rate'],
      [529, 'overloaded'],
      [500, 'server'],
      [400, 'bad-request'],
    ]
    for (const [status, kind] of cases) {
      const f = async () => json(status, { type: 'error', error: { type: 'x', message: 'detail' } })
      await expect(askClaude(input, { fetchImpl: f as unknown as typeof fetch })).rejects.toMatchObject({ kind, status })
    }
  })
  it('maps network / CORS failures', async () => {
    const f = async () => {
      throw new TypeError('Failed to fetch')
    }
    await expect(askClaude(input, { fetchImpl: f as unknown as typeof fetch })).rejects.toMatchObject({ kind: 'network' })
  })
  it('handles refusals', async () => {
    const f = async () => json(200, { content: [], stop_reason: 'refusal' })
    await expect(askClaude(input, { fetchImpl: f as unknown as typeof fetch })).rejects.toMatchObject({ kind: 'refusal' })
  })
})
