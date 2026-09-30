# Raw Higgsfield art

Put downloaded images here, named exactly by asset id (see `src/art/hd/manifest.ts`
or the art brief), e.g. `art-src/bosses/kana-oni.png`, `art-src/backdrops/battle-forest.jpg`.

Then run `npm run art:process`. It removes the flat green/magenta background from
cut-out art, trims, resizes, converts to WebP in `public/art/hd/`, and updates
`public/art/hd/available.json`. Anything not yet provided falls back to pixel art.
