# Region 8 notes

No core changes are needed. Things to check when packs are merged:

- **Id collisions with other packs.** The ids below were checked against the
  core and r6, but not against r7, r9 or r10, which were written at the same
  time. Generic ids that another pack might also use: words `mae`, `ushiro`,
  `niwa`, `au`, `oshieru`, `omiyage`, `kimono`, `machi`, `mon`; grammar
  `ga-suki`, `ga-hoshii`, `masen-ka`, `mashou-ka`, `o-kudasai`; NPC ids
  `kiku`, `ochiyo`, `tadashi`.
- **Extra files.** Besides the fixed pack files there are `bossData.ts` (the
  boss's turns) and `r8.test.ts` (checks on the boss data).
- **Lines from earlier regions.** Some lines use r6 and r7 language, which
  comes earlier on the road: the counter in ひとつ, plus a few て-forms
  (まっすぐ いって, まって ください). Word ids from earlier packs are never
  referenced, so the pack still passes the tests when it is the only live pack.
- **The lord** in the keep (`ck-lord`) uses the core `king` sprite.
