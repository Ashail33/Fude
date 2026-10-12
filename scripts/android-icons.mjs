/**
 * Render the Android launcher icons and splash screens from the game's
 * 言 mark (public/favicon.svg). Run after changing the icon:
 *   node scripts/android-icons.mjs
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const RES = 'android/app/src/main/res'
const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
const FONT = "'IPAGothic','Noto Sans CJK JP','Hiragino Sans',sans-serif"
const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b2a7a"/><stop offset="1" stop-color="#1b4d7a"/></linearGradient></defs>`
const glyph = (cx, cy, size) => `<text x="${cx}" y="${cy + size * 0.36}" text-anchor="middle" font-size="${size}" font-family="${FONT}" font-weight="bold" fill="#ffd166">言</text>`

const legacy = (s, round) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64">${grad}${round ? '<circle cx="32" cy="32" r="32" fill="url(#g)"/>' : '<rect width="64" height="64" rx="14" fill="url(#g)"/>'}${glyph(32, 32, 38)}</svg>`
// adaptive foreground: 108dp canvas, art inside the 66dp safe zone
const fore = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 108 108">${glyph(54, 54, 52)}</svg>`
const back = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 108 108">${grad}<rect width="108" height="108" fill="url(#g)"/></svg>`
const splash = (w, h) => {
  const m = Math.min(w, h)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#0f1024"/><g transform="translate(${w / 2 - m * 0.14} ${h / 2 - m * 0.14}) scale(${(m * 0.28) / 64})">${grad}<rect width="64" height="64" rx="14" fill="url(#g)"/>${glyph(32, 32, 38)}</g></svg>`
}

const png = (svg, out) => sharp(Buffer.from(svg)).png().toFile(out)

for (const [d, k] of Object.entries(DENS)) {
  const dir = path.join(RES, `mipmap-${d}`)
  await png(legacy(Math.round(48 * k), false), path.join(dir, 'ic_launcher.png'))
  await png(legacy(Math.round(48 * k), true), path.join(dir, 'ic_launcher_round.png'))
  await png(fore(Math.round(108 * k)), path.join(dir, 'ic_launcher_foreground.png'))
  await png(back(Math.round(108 * k)), path.join(dir, 'ic_launcher_background.png'))
}
for (const dir of fs.readdirSync(RES).filter((d) => d.startsWith('drawable'))) {
  const f = path.join(RES, dir, 'splash.png')
  if (!fs.existsSync(f)) continue
  const { width, height } = await sharp(f).metadata()
  await png(splash(width, height), f)
}
console.log('icons and splash screens written')
