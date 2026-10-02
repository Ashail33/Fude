# Region 7 (湯の里): notes for the core

Everything for the Hot-Spring Hollow lives in this folder. Building it turned
up a few things outside the folder that the core may want to change.

## Teaching order

- `mashita`, `masendeshita` and `te-kudasai` are Tower (region 5) grammar
  points, and the Tower is now the last region on the road. The Hollow
  teaches the plain past (た / なかった / だった) and every use of the
  て-form, but its townsfolk naturally say 〜ました and 〜てください, and
  the player meets those before they are formally taught. Consider moving
  those three points to the Forest (region 3) or the Harbour (region 6), next
  to 〜ます / 〜ません.
- `post-boss-r4` still says 「さいごは 創造の塔！」 ("Last stop: the Tower").
  With the region packs live, the next stop after the Shrine is the Harbour
  (or the Hollow, while the Harbour's `DATA` is null).

## Names

- The speaker id `haru` is the inn's proprietress. Region 1 already has
  "Haru the Innkeeper" (NPC `innkeeper`), so she is shown as **Haruko**
  (はるこ) to keep the two apart.
- `jiro` (Haruko's son at the bath-house) uses the `child` sprite. Region 1's
  folklore has a "Grandpa Jiro" (`fk1-jiro`); they are different people.

## Stroke data

`r7-trace` can only use kanji that `src/data/strokes.json` has. These Hollow
kanji are missing and would make good tracing practice: 温 洗 泳 頭 顔 部 猿
滝 谷 座 脱 登 遊 撮 疲 昨 痛 浴 布 団.

## Folklore sprites

The folklore spirits use stand-in sprites on the map (the akaname `child`,
the white heron and the spirit of Yōrō Falls `wisp`) and talk with their
own HD portraits through `ART.entities`. A heron or bird sprite would suit
the heron better if one is ever added.
