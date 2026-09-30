/**
 * HD-2D post-processing for the overworld: the 2D map canvas (native pixel
 * resolution) is uploaded as a texture each frame and composited on a WebGL
 * canvas with tilt-shift depth of field, bloom, point lights, colour grading,
 * light shafts, water glints, vignette and grain.
 *
 * Plain WebGL2 (WebGL1 fallback, same GLSL 1.00 shaders). If anything fails,
 * `render()` returns false and the caller keeps showing its plain 2D canvas.
 */
import { GRADES, type Grade } from './grades'
import { MAX_LIGHTS, packLights, type Light } from './lights'
import { fxQuality, onFxQuality, QualityGovernor, startLevel, type FxLevel } from './quality'
import { BLUR, BRIGHT, COMPOSITE, LIGHT, VERT } from './shaders'

type GL = WebGLRenderingContext | WebGL2RenderingContext

interface Target {
  tex: WebGLTexture
  fb: WebGLFramebuffer
  w: number
  h: number
}

interface Prog {
  p: WebGLProgram
  u: Record<string, WebGLUniformLocation | null>
}

export interface FxFrame {
  /** Camera (world native px of the screen's top-left). */
  cam: { x: number; y: number }
  /** Player's feet row on screen (native px from the top). */
  focusY: number
  /** performance.now() ms. */
  now: number
  /** 0 clear … 1 black. */
  fade: number
}

/** Output pixel budget per level (the GL canvas is CSS-scaled with pixelated sampling). */
const BUDGET: Record<FxLevel, number> = { 0: 0, 1: 450_000, 2: 450_000, 3: 1_150_000 }

/** Largest divisor of `scale` whose output fits the pixel budget (keeps native pixels evenly sized). */
export function outputFactor(scale: number, vw: number, vh: number, budget: number): number {
  for (let k = scale; k >= 1; k--) if (scale % k === 0 && vw * k * vh * k <= budget) return k
  return 1
}

export class PostFX {
  canvas: HTMLCanvasElement
  gl: GL | null = null
  webgl2 = false
  level: FxLevel
  governor: QualityGovernor
  grade: Grade = GRADES.golden
  private lights: readonly Light[] = []
  private dead = false
  private visible = false
  private vw = 0
  private vh = 0
  private scale = 1
  private dpr = 1
  private k = 1
  private last = 0
  private lastFrame: FxFrame | null = null
  private lastSrc: HTMLCanvasElement | null = null
  private progs: Record<'light' | 'bright' | 'blur' | 'comp', Prog> | null = null
  private scene: WebGLTexture | null = null
  private t: Record<'light' | 'dofA' | 'dofB' | 'bloomA' | 'bloomB', Target> | null = null
  private vbo: WebGLBuffer | null = null
  private unsub: () => void
  private frameMs = 16.7

  constructor(parent: HTMLElement, after?: Element | null) {
    const c = document.createElement('canvas')
    c.className = 'ow-canvas ow-fx'
    c.setAttribute('aria-hidden', 'true')
    c.style.visibility = 'hidden'
    if (after && after.parentElement === parent) after.after(c)
    else parent.appendChild(c)
    this.canvas = c
    this.level = startLevel(fxQuality())
    // `?fxlock` in the URL disables the auto step-down (screenshots on software GL).
    const lock = typeof location !== 'undefined' && /[?&]fxlock\b/.test(location.search)
    this.governor = new QualityGovernor(this.level, lock ? { threshold: Infinity } : {})
    c.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.dropGL()
    })
    c.addEventListener('webglcontextrestored', () => this.resize(this.vw, this.vh, this.scale, this.dpr))
    this.unsub = onFxQuality((q) => {
      this.level = startLevel(q)
      this.governor.reset(this.level)
      this.dead = false
      this.resize(this.vw, this.vh, this.scale, this.dpr)
    })
    if (import.meta.env?.DEV) (window as unknown as { __fx: PostFX }).__fx = this
  }

  /** True while the WebGL path should be used (else draw the plain 2D canvas). */
  get active(): boolean {
    return !this.dead && this.level > 0
  }

  setGrade(g: Grade) {
    this.grade = g
  }

  /** World-space lights for the current frame. */
  setLights(lights: readonly Light[]) {
    this.lights = lights
  }

  setVisible(v: boolean) {
    if (v === this.visible) return
    this.visible = v
    this.canvas.style.visibility = v ? 'visible' : 'hidden'
  }

  info() {
    return { level: this.level, webgl2: this.webgl2, dead: this.dead, out: [this.canvas.width, this.canvas.height], native: [this.vw, this.vh], frameMs: +this.frameMs.toFixed(1), grade: this.grade.name }
  }

  resize(vw: number, vh: number, scale: number, dpr: number) {
    this.vw = vw
    this.vh = vh
    this.scale = scale
    this.dpr = dpr
    if (!vw || !vh || !this.active) return
    try {
      if (!this.gl && !this.initGL()) return this.fail('webgl unavailable')
      this.k = outputFactor(scale, vw, vh, BUDGET[this.level])
      this.canvas.width = vw * this.k
      this.canvas.height = vh * this.k
      // Same CSS box as the 2D canvas' drawn area (native px × scale / dpr).
      this.canvas.style.width = `${(vw * scale) / dpr}px`
      this.canvas.style.height = `${(vh * scale) / dpr}px`
      this.allocTargets()
    } catch (err) {
      this.fail(err)
    }
  }

  /** Composite one frame from `src` (the native-resolution 2D buffer). Returns false → draw 2D instead. */
  render(src: HTMLCanvasElement, f: FxFrame): boolean {
    if (this.last) {
      const ms = f.now - this.last
      if (ms > 0 && ms < 250) this.frameMs = this.frameMs * 0.95 + ms * 0.05
      const nl = this.governor.push(ms)
      if (nl !== null) {
        console.info(`[fx] frame time high — quality level ${nl}`)
        this.level = nl
        this.resize(this.vw, this.vh, this.scale, this.dpr)
      }
    }
    this.last = f.now
    if (!this.active || !this.gl || !this.t) {
      this.setVisible(false)
      return false
    }
    try {
      this.draw(src, f)
      this.lastFrame = f
      this.lastSrc = src
      this.setVisible(true)
      return true
    } catch (err) {
      this.fail(err)
      return false
    }
  }

  /** Copy the current FX frame into a 2D context (for the battle-start snapshot). */
  drawTo(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
    if (!this.visible || !this.lastFrame || !this.lastSrc) return false
    try {
      this.draw(this.lastSrc, this.lastFrame)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(this.canvas, 0, 0, w, h)
      return true
    } catch {
      return false
    }
  }

  dispose() {
    this.unsub()
    this.dropGL()
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext()
    this.canvas.remove()
  }

  // ─── GL plumbing ────────────────────────────────────────────────
  private fail(err: unknown) {
    if (!this.dead) console.warn('[fx] disabled, using plain 2D:', err)
    this.dead = true
    this.setVisible(false)
  }

  private dropGL() {
    this.progs = null
    this.t = null
    this.scene = null
    this.vbo = null
    this.setVisible(false)
  }

  private initGL(): boolean {
    const opts: WebGLContextAttributes = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'default' }
    let gl: GL | null = null
    try {
      gl = this.canvas.getContext('webgl2', opts) as WebGL2RenderingContext | null
      this.webgl2 = !!gl
      if (!gl) gl = (this.canvas.getContext('webgl', opts) ?? this.canvas.getContext('experimental-webgl', opts)) as WebGLRenderingContext | null
    } catch {
      gl = null
    }
    if (!gl) return false
    this.gl = gl
    return this.initResources()
  }

  private initResources(): boolean {
    const gl = this.gl!
    if (gl.isContextLost()) return false
    const mk = (fs: string, names: string[]): Prog => {
      const p = gl.createProgram()!
      for (const [type, src] of [
        [gl.VERTEX_SHADER, VERT],
        [gl.FRAGMENT_SHADER, fs],
      ] as const) {
        const s = gl.createShader(type)!
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s))
        gl.attachShader(p, s)
      }
      gl.bindAttribLocation(p, 0, 'a_pos')
      gl.linkProgram(p)
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p))
      const u: Prog['u'] = {}
      for (const n of names) u[n] = gl.getUniformLocation(p, n)
      return { p, u }
    }
    this.progs = {
      light: mk(LIGHT, ['u_view', 'u_lp', 'u_lc', 'u_n']),
      bright: mk(BRIGHT, ['u_scene', 'u_light', 'u_texel', 'u_amb', 'u_thr']),
      blur: mk(BLUR, ['u_tex', 'u_dir']),
      comp: mk(COMPOSITE, ['u_scene', 'u_dof', 'u_bloom', 'u_light', 'u_view', 'u_cam', 'u_time', 'u_dofP', 'u_dofMax', 'u_amb', 'u_haze', 'u_bloomK', 'u_lift', 'u_gamma', 'u_gain', 'u_satCon', 'u_ray', 'u_rayAngle', 'u_sun', 'u_post', 'u_water']),
    }
    this.vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    this.scene = this.texture(1, 1)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    return true
  }

  private texture(w: number, h: number): WebGLTexture {
    const gl = this.gl!
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    return t
  }

  private target(w: number, h: number): Target {
    const gl = this.gl!
    w = Math.max(1, Math.round(w))
    h = Math.max(1, Math.round(h))
    const tex = this.texture(w, h)
    const fb = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incomplete')
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { tex, fb, w, h }
  }

  private allocTargets() {
    const gl = this.gl!
    if (!this.progs && !this.initResources()) throw new Error('context lost')
    if (this.t) for (const t of Object.values(this.t)) {
      gl.deleteTexture(t.tex)
      gl.deleteFramebuffer(t.fb)
    }
    const full = this.level >= 3
    const { vw, vh } = this
    const d = full ? 1 : 2
    this.t = {
      light: this.target(vw / d, vh / d),
      dofA: this.target(vw / d, vh / d),
      dofB: this.target(vw / d, vh / d),
      bloomA: this.target(vw / (2 * d), vh / (2 * d)),
      bloomB: this.target(vw / (2 * d), vh / (2 * d)),
    }
  }

  private pass(prog: Prog, out: Target | null, tex: [string, WebGLTexture][]) {
    const gl = this.gl!
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fb : null)
    gl.viewport(0, 0, out ? out.w : this.canvas.width, out ? out.h : this.canvas.height)
    gl.useProgram(prog.p)
    tex.forEach(([name, t], i) => {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.uniform1i(prog.u[name], i)
    })
  }

  private blur(src: Target, tmp: Target, spread: number) {
    const gl = this.gl!
    const b = this.progs!.blur
    this.pass(b, tmp, [['u_tex', src.tex]])
    gl.uniform2f(b.u.u_dir, spread / src.w, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    this.pass(b, src, [['u_tex', tmp.tex]])
    gl.uniform2f(b.u.u_dir, 0, spread / src.h)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  private draw(src: HTMLCanvasElement, f: FxFrame) {
    const gl = this.gl!
    const P = this.progs!
    const T = this.t!
    const g = this.grade
    const { vw, vh } = this
    const time = (f.now / 1000) % 3600

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // Scene upload (flipped so every texture is bottom-up).
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.scene)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    const scene = this.scene!

    // 1. Light map.
    const L = packLights(this.lights, f.cam, vw, vh, time, g.lights, MAX_LIGHTS)
    this.pass(P.light, T.light, [])
    gl.uniform2f(P.light.u.u_view, vw, vh)
    gl.uniform4fv(P.light.u.u_lp, L.pos)
    gl.uniform4fv(P.light.u.u_lc, L.col)
    gl.uniform1i(P.light.u.u_n, L.n)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    // 2. Depth-of-field source: blurred scene.
    const dof = this.level >= 2 && g.dof > 0
    if (dof) {
      this.pass(P.blur, T.dofA, [['u_tex', scene]])
      gl.uniform2f(P.blur.u.u_dir, 1.4 / vw, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      this.pass(P.blur, T.dofB, [['u_tex', T.dofA.tex]])
      gl.uniform2f(P.blur.u.u_dir, 0, 1.4 / vh)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    // 3. Bloom: threshold the lit scene, blur twice (wide + soft).
    this.pass(P.bright, T.bloomA, [
      ['u_scene', scene],
      ['u_light', T.light.tex],
    ])
    gl.uniform2f(P.bright.u.u_texel, 1 / vw, 1 / vh)
    gl.uniform3f(P.bright.u.u_amb, g.ambient[0], g.ambient[1], g.ambient[2])
    gl.uniform1f(P.bright.u.u_thr, g.bloomThreshold)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    this.blur(T.bloomA, T.bloomB, 1.0)
    this.blur(T.bloomA, T.bloomB, 2.0)

    // 4. Composite to screen.
    const C = P.comp
    this.pass(C, null, [
      ['u_scene', scene],
      ['u_dof', dof ? T.dofB.tex : scene],
      ['u_bloom', T.bloomA.tex],
      ['u_light', T.light.tex],
    ])
    const u = C.u
    gl.uniform2f(u.u_view, vw, vh)
    gl.uniform2f(u.u_cam, f.cam.x, f.cam.y)
    gl.uniform1f(u.u_time, time)
    // Sharp band ≈ ±3 tiles around the feet (a bit more on tall screens), then a long ramp.
    const band = Math.max(44, vh * 0.2)
    gl.uniform3f(u.u_dofP, f.focusY, band, Math.max(80, vh * 0.45))
    gl.uniform1f(u.u_dofMax, dof ? g.dof : 0)
    gl.uniform3f(u.u_amb, g.ambient[0], g.ambient[1], g.ambient[2])
    gl.uniform1f(u.u_haze, g.haze)
    gl.uniform1f(u.u_bloomK, g.bloom)
    gl.uniform3f(u.u_lift, g.lift[0], g.lift[1], g.lift[2])
    gl.uniform3f(u.u_gamma, g.gamma[0], g.gamma[1], g.gamma[2])
    gl.uniform3f(u.u_gain, g.gain[0], g.gain[1], g.gain[2])
    gl.uniform2f(u.u_satCon, g.saturation, g.contrast)
    gl.uniform4f(u.u_ray, g.rays[0], g.rays[1], g.rays[2], g.rayStrength)
    gl.uniform1f(u.u_rayAngle, g.rayAngle)
    gl.uniform4f(u.u_sun, g.sun[0], g.sun[1], g.sun[2], g.sunStrength)
    gl.uniform3f(u.u_post, g.vignette, this.level >= 3 ? g.grain : 0, Math.min(1, Math.max(0, f.fade)))
    gl.uniform1f(u.u_water, this.level >= 3 ? g.water : 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}
