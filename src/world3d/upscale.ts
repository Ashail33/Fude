/**
 * Scale2x (EPX) pixel-art upscaling: doubles resolution while rounding
 * stair-stepped diagonals, keeping every colour from the original palette.
 * Applied twice (4×) to tile and sprite art for the HD 3D view.
 */

/** Scale2x on packed RGBA (Uint32) pixels. */
export function scale2x(src: Uint32Array, w: number, h: number): Uint32Array {
  const W = w * 2
  const out = new Uint32Array(W * h * 2)
  for (let y = 0; y < h; y++) {
    const ym = y > 0 ? y - 1 : y
    const yp = y < h - 1 ? y + 1 : y
    for (let x = 0; x < w; x++) {
      const xm = x > 0 ? x - 1 : x
      const xp = x < w - 1 ? x + 1 : x
      const P = src[y * w + x]
      const A = src[ym * w + x]
      const B = src[y * w + xp]
      const C = src[y * w + xm]
      const D = src[yp * w + x]
      let e0 = P
      let e1 = P
      let e2 = P
      let e3 = P
      if (A !== D && C !== B) {
        if (C === A) e0 = A
        if (A === B) e1 = B
        if (D === C) e2 = C
        if (B === D) e3 = D
      }
      const o = y * 2 * W + x * 2
      out[o] = e0
      out[o + 1] = e1
      out[o + W] = e2
      out[o + W + 1] = e3
    }
  }
  return out
}

/** A canvas upscaled by `times` rounds of Scale2x (1 round = 2×). */
export function upscaleCanvas(src: HTMLCanvasElement | OffscreenCanvas, times: number): HTMLCanvasElement {
  const w = src.width
  const h = src.height
  const ctx = (src as HTMLCanvasElement).getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  let px = new Uint32Array(ctx.getImageData(0, 0, w, h).data.buffer.slice(0))
  let cw = w
  let ch = h
  for (let i = 0; i < times; i++) {
    px = scale2x(px, cw, ch) as Uint32Array<ArrayBuffer>
    cw *= 2
    ch *= 2
  }
  const out = document.createElement('canvas')
  out.width = cw
  out.height = ch
  out.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(px.buffer), cw, ch), 0, 0)
  return out
}
