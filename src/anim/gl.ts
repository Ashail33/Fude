/**
 * Minimal WebGL renderer for one textured grid mesh (one context per
 * <LivingArt>, created once and reused every frame). Premultiplied alpha,
 * mipmapped texture (crisp downscaling), flash / dissolve / tint in the
 * fragment shader.
 */
import { gridIndices, gridUvs, gridVerts } from './deform'

const VS = `
attribute vec2 aPos;
attribute vec2 aUv;
varying vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, 0.0, 1.0);
}`

const FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uFlash;
uniform float uDissolve;
uniform float uAlpha;
uniform float uBias;
uniform vec3 uEdge;
uniform vec3 uTint;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec4 c = texture2D(uTex, vUv, uBias);
  c.rgb *= uTint;
  if (uDissolve > 0.0) {
    float n = 0.5 * vnoise(vUv * 7.0) + 0.3 * vnoise(vUv * 19.0) + 0.2 * vnoise(vUv * 47.0);
    // Burns away from the feet up, with a ragged noisy front.
    n = n * 0.62 + (1.0 - vUv.y) * 0.38;
    float th = mix(-0.08, 1.02, uDissolve);
    float keep = smoothstep(th, th + 0.03, n);
    float edge = 1.0 - smoothstep(0.0, 0.08, n - th);
    c *= keep;
    c.rgb += uEdge * edge * c.a * 1.6;
  }
  c.rgb = mix(c.rgb, vec3(c.a), uFlash);
  gl_FragColor = c * uAlpha;
}`

export interface Uniforms {
  flash: number
  dissolve: number
  alpha: number
  edge: readonly [number, number, number]
  tint: readonly [number, number, number]
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)
  if (!s) throw new Error('shader')
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'compile')
  return s
}

const isPot = (n: number) => (n & (n - 1)) === 0

/** Largest power of two ≤ n (≥ 1). */
export const floorPot = (n: number) => Math.pow(2, Math.floor(Math.log2(Math.max(1, n))))

export class MeshRenderer {
  readonly gl: WebGLRenderingContext
  readonly n: number
  readonly uvs: Float32Array
  readonly pos: Float32Array
  private prog: WebGLProgram
  private posBuf: WebGLBuffer
  private uvBuf: WebGLBuffer
  private idxCount: number
  private tex: WebGLTexture | null = null
  private u: Record<string, WebGLUniformLocation | null> = {}
  texW = 0
  texH = 0

  constructor(canvas: HTMLCanvasElement, n = 24) {
    const attrs: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' }
    const gl = (canvas.getContext('webgl2', attrs) ?? canvas.getContext('webgl', attrs)) as WebGLRenderingContext | null
    if (!gl) throw new Error('no webgl')
    this.gl = gl
    this.n = n
    const prog = gl.createProgram()
    if (!prog) throw new Error('program')
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS))
    gl.bindAttribLocation(prog, 0, 'aPos')
    gl.bindAttribLocation(prog, 1, 'aUv')
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link')
    this.prog = prog
    gl.useProgram(prog)
    for (const k of ['uTex', 'uFlash', 'uDissolve', 'uAlpha', 'uBias', 'uEdge', 'uTint']) this.u[k] = gl.getUniformLocation(prog, k)

    this.uvs = gridUvs(n)
    this.pos = new Float32Array(gridVerts(n) * 2)
    const idx = gridIndices(n)
    this.idxCount = idx.length
    const ib = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
    this.posBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf)
    gl.bufferData(gl.ARRAY_BUFFER, this.pos.byteLength, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    this.uvBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf)
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)

    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniform1i(this.u.uTex, 0)
    gl.uniform3f(this.u.uTint, 1, 1, 1)
  }

  get webgl2() {
    return typeof WebGL2RenderingContext !== 'undefined' && this.gl instanceof WebGL2RenderingContext
  }

  /** Upload an image (premultiplied, mipmapped). WebGL1 NPOT images are resampled to a power of two. */
  setImage(img: HTMLImageElement | ImageBitmap | HTMLCanvasElement) {
    const gl = this.gl
    let src: TexImageSource = img
    const w = 'naturalWidth' in img ? img.naturalWidth : img.width
    const h = 'naturalHeight' in img ? img.naturalHeight : img.height
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
    let tw = w
    let th = h
    if ((!this.webgl2 && (!isPot(w) || !isPot(h))) || w > max || h > max) {
      tw = Math.min(max, this.webgl2 ? w : floorPot(w * 1.2))
      th = Math.min(max, this.webgl2 ? h : floorPot(h * 1.2))
      if (this.webgl2) {
        const k = Math.min(1, max / Math.max(w, h))
        tw = Math.round(w * k)
        th = Math.round(h * k)
      }
      const c = document.createElement('canvas')
      c.width = tw
      c.height = th
      const ctx = c.getContext('2d')!
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img as CanvasImageSource, 0, 0, tw, th)
      src = c
    }
    if (!this.tex) this.tex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.texW = w
    this.texH = h
  }

  /** Resize the drawing buffer (device pixels). */
  resize(w: number, h: number) {
    const c = this.gl.canvas as HTMLCanvasElement
    if (c.width !== w || c.height !== h) {
      c.width = w
      c.height = h
    }
    this.gl.viewport(0, 0, w, h)
  }

  /** Draw with the current `pos` (and `uvs`, when `uvsDirty`). */
  draw(un: Uniforms, uvsDirty = false) {
    const gl = this.gl
    if (!this.tex) return
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.pos)
    if (uvsDirty) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvs)
    }
    gl.uniform1f(this.u.uFlash, un.flash)
    gl.uniform1f(this.u.uDissolve, un.dissolve)
    gl.uniform1f(this.u.uAlpha, un.alpha)
    gl.uniform1f(this.u.uBias, -0.35)
    gl.uniform3f(this.u.uEdge, un.edge[0], un.edge[1], un.edge[2])
    gl.uniform3f(this.u.uTint, un.tint[0], un.tint[1], un.tint[2])
    gl.drawElements(gl.TRIANGLES, this.idxCount, gl.UNSIGNED_SHORT, 0)
  }

  /** Free the GPU context right away (browsers cap live contexts). */
  dispose() {
    const gl = this.gl
    if (this.tex) gl.deleteTexture(this.tex)
    gl.deleteBuffer(this.posBuf)
    gl.deleteBuffer(this.uvBuf)
    gl.deleteProgram(this.prog)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

/** '#rrggbb' → [r,g,b] in 0..1. */
export function hexRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [1, 0.85, 0.5]
  const n = parseInt(m[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
