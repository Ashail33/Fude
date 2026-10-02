import { describe, expect, it } from 'vitest'
import { describeItem } from '../../engine/items'
import { countQuestion, listenQuestion, readQuestion } from './umibozu'

describe('the Counting Umibōzu', () => {
  it('asks fair questions: four distinct options, one right answer, real items', () => {
    for (const gen of [countQuestion, listenQuestion, readQuestion])
      for (let i = 0; i < 300; i++) {
        const q = gen()
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options).size).toBe(4)
        expect(q.options).toContain(q.answer)
        for (const id of q.itemIds) expect(describeItem(id), id).toBeTruthy()
      }
  })

  it('teaches the sound changes', () => {
    const answers = new Set(Array.from({ length: 2000 }, () => readQuestion().answer))
    for (const a of ['さんびゃくえん', 'ろっぴゃくえん', 'はっぴゃくえん', 'よじ', 'しちじ', 'くじ']) expect(answers.has(a) || answers.has(a + 'はん'), a).toBe(true)
  })
})
