# Region 9 (Snowbound Temple): notes for the core

Small requests for things outside `src/regions/r9/`. The region works without them.

1. **Falling-snow particles.** `ParticleKind` (`src/world/types.ts`) has no
   `'snow'`, so the outdoor maps use `'sparkles'` (glittering snow) and the
   interiors use `'dust'`. A `'snow'` kind (slow white flakes drifting down
   and sideways) would suit `snowtemple`, `snowtemple-lake` and the cave, and
   the cloud capital could use it too.
2. **Kanji already taught by the Fields' crafting.** 心, 言, 生, 古 and 聞
   are radicals or recipe results in `src/data/kanji.ts`, so this region does
   not teach them as `j:` items. (They would share an SRS id with the
   crafting cards, and `ArcanaDrawing` reads the crafting meaning first.)
   The sixty kanji here avoid every character in `RADICALS` and `RECIPES`.
3. **Readings for the Harbour's words.** Forge tiles 毎日 and 朝 are
   Harbour (r6) words. While r6's `DATA` is `null`, this pack adds their
   readings to `DATA.readings`, so the forge test passes either way.
4. **Monk portraits.** All monks (Kuu, the sweeper, the scribes, the abbot)
   use the `monk` sprite and portrait. Genta has his own HD portrait
   (`genta`), mapped through `speakers` and the `sb-genta` entity. If the
   core ever supports per-entity sprites beyond `ENTITY_HD`, the abbot could
   get an older look.
