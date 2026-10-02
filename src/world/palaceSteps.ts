/**
 * Talking to a memory-palace place in the world: after whatever the place
 * usually says, offer to recall (or just look at) the memories stored here.
 * Recall questions show the place's image with the answer hidden and ask
 * which kana / word / grammar lives in it; answers count as reviews.
 */
import { cueOf, episodeCue, fadingIn, placedIn, recallQuestion, type Locus, type Memory } from '../engine/palace'
import { getState, grantRewards, recordReviews } from '../engine/store'
import type { Step } from './Dialog'

const MAX_RECALL = 5

function reveal(m: Memory, ok: boolean | null): Step {
  const q = recallQuestion(getState(), m)
  const a = q?.answer
  const mark = ok === null ? '' : ok ? '⭕ ' : '❌ '
  return {
    kind: 'say',
    line: { jp: `${mark}${a?.front ?? ''}${a?.reading && a.reading !== a.front ? `（${a.reading}）` : ''}`, en: `${a?.meaning && a.kind !== 'kana' ? `${a.meaning}: ` : ''}${m.story}` },
  }
}

function recallChain(l: Locus, list: Memory[], i: number, right: number): Step[] {
  if (i >= list.length) {
    if (right) grantRewards(right * 3, right)
    const all = right === list.length
    return [
      {
        kind: 'say',
        speaker: { jp: 'フデ', en: 'Fude' },
        portrait: 'fude',
        line: all
          ? { jp: `ぜんぶ おもいだせた！ ${l.name.jp}の きおくが また ひかってる。`, en: `You remembered them all! The memories at ${l.name.en} are shining again.` }
          : { jp: `${right}/${list.length}。また ここに きて、おもいだそうね。`, en: `${right} of ${list.length}. Let’s come back here and walk past them again soon.` },
      },
    ]
  }
  const q = recallQuestion(getState(), list[i])
  if (!q) return recallChain(l, list, i + 1, right)
  const kana = q.answer.kind === 'kana'
  return [
    {
      kind: 'choice',
      prompt: { jp: `${l.name.jp}に いるのは？`, en: `${l.emoji} ${[episodeCue(getState(), q.memory.item), cueOf(q.memory)].filter(Boolean).join(' ')}` },
      // meanings stay hidden: the image is the cue
      options: q.options.map((o) => ({ id: o.id, label: { jp: o.front, en: kana ? '' : o.reading && o.reading !== o.front ? o.reading : '' } })),
      onPick: (id) => {
        const ok = id === q.answer.id
        recordReviews([{ itemId: q.answer.id, correct: ok }])
        return [reveal(q.memory, ok), ...recallChain(l, list, i + 1, right + (ok ? 1 : 0))]
      },
    },
  ]
}

/** Extra steps for a place that holds memories (empty if nothing is placed yet). */
export function palaceSteps(l: Locus): Step[] {
  const s = getState()
  const here = placedIn(s, l)
  if (!here.length) return []
  const fade = fadingIn(s, l)
  const waiting = l.memories.length - here.length
  const order = [...fade, ...here.filter((m) => !fade.includes(m))].slice(0, MAX_RECALL)
  return [
    {
      kind: 'say',
      voice: false,
      line: {
        jp: `🏯 きおくの ばしょ「${l.name.jp}」── ${here.length}この きおく${fade.length ? `（${fade.length}こ うすれている）` : ''}`,
        en: `🏯 Memory spot: ${l.name.en}. ${here.length} ${here.length === 1 ? 'memory lives' : 'memories live'} here${fade.length ? `, ${fade.length} fading` : ''}${waiting ? ` (${waiting} still to be placed)` : ''}.`,
      },
    },
    {
      kind: 'choice',
      prompt: { jp: 'どうする？', en: 'Walk through them?' },
      options: [
        { id: 'recall', label: { jp: 'おもいだす', en: 'Recall them' } },
        { id: 'look', label: { jp: 'ながめる', en: 'Look at them' } },
        { id: 'later', label: { jp: 'あとで', en: 'Later' } },
      ],
      onPick: (id) => {
        if (id === 'recall') return recallChain(l, order, 0, 0)
        if (id === 'look') return here.map((m) => reveal(m, null))
      },
    },
  ]
}
