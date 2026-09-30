/** Img → canvas conversion (the only DOM-touching part of the art pipeline). */
import { hexToRgb, type Img } from './raster'

const rgbCache = new Map<string, [number, number, number]>()

function rgb(c: string) {
  let v = rgbCache.get(c)
  if (!v) {
    v = hexToRgb(c)
    rgbCache.set(c, v)
  }
  return v
}

/** Write an Img into ImageData-compatible RGBA bytes. */
export function imgToRgba(img: Img): Uint8ClampedArray {
  const out = new Uint8ClampedArray(img.w * img.h * 4)
  for (let i = 0; i < img.px.length; i++) {
    const c = img.px[i]
    if (!c) continue
    const [r, g, b] = rgb(c)
    out[i * 4] = r
    out[i * 4 + 1] = g
    out[i * 4 + 2] = b
    out[i * 4 + 3] = 255
  }
  return out
}

export function imgToCanvas(img: Img): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = img.w
  c.height = img.h
  const ctx = c.getContext('2d')!
  const data = ctx.createImageData(img.w, img.h)
  data.data.set(imgToRgba(img))
  ctx.putImageData(data, 0, 0)
  return c
}
