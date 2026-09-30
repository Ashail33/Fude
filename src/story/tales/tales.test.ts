import { describe, expect, it } from 'vitest'
import { entityAt } from '../../world/engine'
import { tileSolid } from '../../world/mapdef'
import { getMap, MAP_SPECS } from '../../world/maps'
import { CONTENT } from './content'
import { KEY_ITEMS, TALES, toKana } from './engine'

const allIds = new Set(MAP_SPECS.flatMap((s) => getMap(s.id)!.entitySpecs.map((e) => e.id)))

describe('story content', () => {
  it('tale ids and key item ids are unique', () => {
    expect(new Set(TALES.map((t) => t.id)).size).toBe(TALES.length)
    expect(new Set(KEY_ITEMS.map((k) => k.id)).size).toBe(KEY_ITEMS.length)
  })

  it('every giver, target and scripted entity exists on some map', () => {
    for (const t of TALES) {
      if (t.giver) expect(allIds, `${t.id} giver`).toContain(t.giver)
      for (const st of t.stages) for (const id of st.target ?? []) expect(allIds, `${t.id} target ${id}`).toContain(id)
    }
    for (const c of CONTENT) for (const id of [...Object.keys(c.talk), ...Object.keys(c.cast)]) expect(allIds, `script ${id}`).toContain(id)
  })

  it('added entities stand on free, walkable tiles, one per tile', () => {
    for (const c of CONTENT)
      for (const [mapId, list] of Object.entries(c.entities ?? {})) {
        const m = getMap(mapId)
        expect(m, mapId).toBeTruthy()
        for (const e of list) {
          expect(tileSolid(m!, e.x, e.y), `${e.id} on a solid tile`).toBe(false)
          expect(m!.exits.has(e.y * m!.w + e.x), `${e.id} on an exit`).toBe(false)
          const others = m!.entitySpecs.filter((o) => o.id !== e.id).map((o) => ({ ...o, spec: o, big: false }))
          expect(entityAt(others as never, e.x, e.y), `${e.id} overlaps`).toBeUndefined()
        }
      }
  })

  it('key items used by scripts are defined', () => {
    const ids = new Set(KEY_ITEMS.map((k) => k.id))
    for (const c of CONTENT) {
      const src = [...Object.values(c.talk), ...Object.values(c.cast)].map((f) => f.toString()).join('\n')
      for (const m of src.matchAll(/\.(?:give|has|take)\('([\w-]+)'\)/g)) expect(ids, `key item ${m[1]}`).toContain(m[1])
    }
  })

  it('normalises romaji and kana for word magic', () => {
    expect(toKana('sakana')).toBe('さかな')
    expect(toKana(' ひ！')).toBe('ひ')
    expect(toKana('Mizu')).toBe('みず')
  })
})
