import { afterEach, describe, expect, it, vi } from 'vitest'
import { homeOf, LOCI, storyOf } from './palace'
import { buildStoryPrompt, ensureStories, parseStories, storyKey, validStory } from './palaceAI'
import { freshState, getState, setState, type PlayerState } from './store'

const ka = LOCI.flatMap((l) => l.memories).find((m) => m.item === 'k:か')!
const moved = (over: Partial<PlayerState> = {}): PlayerState => ({
  ...freshState(),
  episodes: { 'k:か': [{ map: 'village', anchor: 'v-teacher', how: 'learned', what: 'First Words II', at: 1 }] },
  ...over,
})
const hook = ka.image.match(/[A-Z][A-Z'’-]*[A-Z]/)![0]
const good = `Teacher Hana chalks a hooked, flexing arm on her slate; it pops off and heaves a rope, cawing "${hook}! ${hook}!" until petals shake loose and the whole class flinches.`

afterEach(() => {
  vi.unstubAllGlobals()
  setState(() => freshState())
})

describe('Claude-written palace stories', () => {
  it('accepts a vivid story that keeps the sound hook, rejects leaks and lost hooks', () => {
    expect(validStory(good, ka)).toBe(true)
    expect(validStory(good.replace('slate', 'slate showing か'), ka)).toBe(false)
    expect(validStory(good.split(hook).join('caw'), ka)).toBe(false)
    expect(validStory('Too short.', ka)).toBe(false)
  })

  it('describes the place and the job without giving the answer away', () => {
    const s = moved()
    const prompt = buildStoryPrompt(s, homeOf(s, 'k:か')!, [ka])
    expect(prompt).toContain('Teacher Hana')
    expect(prompt).toContain(hook)
    expect(prompt).toContain('First Words II')
    expect(prompt).not.toContain('か')
  })

  it('keeps only valid stories from a reply', () => {
    const text = JSON.stringify({ stories: [{ id: '1', story: good }, { id: '2', story: 'nope' }, { id: '9', story: good }] })
    expect(parseStories(text, [ka])).toEqual({ 'k:か': good })
    expect(parseStories('not json', [ka])).toEqual({})
  })

  it('writes the story once with the API key and the palace uses it', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ stories: [{ id: '1', story: good }] }) }], stop_reason: 'end_turn' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const s = moved()
    s.settings = { ...s.settings, apiKey: 'sk-ant-test', aiModel: 'claude-opus-5-5' }
    setState(() => s)
    const place = homeOf(getState(), 'k:か')!
    expect(storyOf(getState(), ka)).not.toBe(good) // template until Claude answers
    await ensureStories([place])
    expect(getState().palaceStories?.[storyKey('k:か', place)]).toBe(good)
    expect(storyOf(getState(), ka)).toBe(good)
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.output_config.format.schema.required).toContain('stories')
    await ensureStories([homeOf(getState(), 'k:か')!])
    expect(fetchMock).toHaveBeenCalledTimes(1) // already written: never asked again
  })

  it('does nothing without a key', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    setState(() => moved())
    await ensureStories([homeOf(getState(), 'k:か')!])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
