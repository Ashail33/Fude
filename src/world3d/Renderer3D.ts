/**
 * HD 3D overworld renderer (three.js). The map becomes a lit diorama: a
 * perspective camera tilted over the ground, extruded buildings, standing
 * pixel-art cards with real sun shadows, lantern point lights, bloom,
 * tilt-shift and the per-map colour grade. All art is the game's own pixel
 * art, upscaled 4× with Scale2x and rendered at device resolution.
 *
 * It extends the 2D Renderer so the world logic, sprite animation state,
 * footfall effects and camera springs are shared; small 2D effects (puffs,
 * quest markers, prompts, particles, the battle transition) are drawn on
 * the 2D canvas, now a transparent overlay, at positions projected through
 * the 3D camera.
 */
import * as THREE from 'three'
import { spriteSize, type Anim, type SpriteId } from '../art'
import { animAt } from '../art'
import { PAL } from '../art/palette'
import { tileCanvas, tileFrame, tileVariant, type TileId } from '../art/tiles'
import { fxQuality, onFxQuality, QualityGovernor, type FxLevel } from '../fx/quality'
import { DIRS, WALK_SPEED, npcState, springStep, walkFrame, type World } from '../world/engine'
import { Renderer, safeSprite, wpos, type RenderInfo } from '../world/render'
import type { Entity, GameMap, Pt } from '../world/types'
import { Atlas } from './atlas'
import { ANCHOR, animateDyn, buildDiorama, voxDepth, VS, type Diorama } from './build'
import { Post } from './post'
import { voxelGeometry, voxelMaterial } from './voxel'

const FOV = 30
const PITCH = (40 * Math.PI) / 180
/** >1 shows more of the map than the 2D view at the same scale. */
const ZOOM = 1.0
const N_LIGHTS = 8
const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Whether this browser can run the 3D view. */
export function canRender3D(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

interface Card {
  mesh: THREE.Mesh
  /** Current / target yaw (turn toward the facing direction). */
  yaw: number
  blob: THREE.Mesh | null
  seen: number
  ghost: boolean
}

function blobTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31)
  grad.addColorStop(0, 'rgba(20,10,30,0.75)')
  grad.addColorStop(0.6, 'rgba(20,10,30,0.35)')
  grad.addColorStop(1, 'rgba(20,10,30,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export class Renderer3D extends Renderer {
  gl: THREE.WebGLRenderer
  glCanvas: HTMLCanvasElement
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 400)
  level: FxLevel
  private governor: QualityGovernor
  private unsubQ: () => void
  private post: Post | null = null
  private atlas = new Atlas(2, 2048)
  private uTime = { value: 0 }
  private cardMat: THREE.MeshLambertMaterial
  private groundMat: THREE.MeshLambertMaterial
  private skirt: THREE.Mesh
  private dio: Diorama | null = null
  private hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1)
  private sun = new THREE.DirectionalLight(0xffffff, 1)
  private points: THREE.PointLight[] = []
  private cards = new Map<object, Card>()
  private tileKeys = new WeakMap<Entity, object>()
  private voxMat: THREE.MeshLambertMaterial
  private ghostMat: THREE.MeshLambertMaterial
  private blobGeo: THREE.PlaneGeometry
  private blobMat: THREE.MeshBasicMaterial
  private frameNo = 0
  private cssW = 1
  private cssH = 1
  private dist = 20
  /** Visible ground around the camera target: far/near edge offsets and half widths. */
  private foot = { zTop: -8, zBot: 6, halfTop: 10, halfMid: 8 }
  private tgt = new THREE.Vector3()
  private v3 = new THREE.Vector3()
  private ray = new THREE.Raycaster()
  private ndc = new THREE.Vector2()
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private lastT = 0
  private frameDt = 1 / 60

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, false)
    const q = fxQuality()
    this.level = q === 'low' ? 2 : 3
    this.governor = new QualityGovernor(this.level, { threshold: 24 })
    this.unsubQ = onFxQuality((nq) => {
      if (nq === 'high' || nq === 'low') this.applyLevel(nq === 'low' ? 2 : 3)
    })
    this.glCanvas = document.createElement('canvas')
    this.glCanvas.className = 'ow-canvas ow-3d'
    canvas.parentElement?.insertBefore(this.glCanvas, canvas)
    this.gl = new THREE.WebGLRenderer({ canvas: this.glCanvas, antialias: true, powerPreference: 'high-performance' })
    this.gl.shadowMap.enabled = true
    this.gl.shadowMap.type = THREE.PCFShadowMap
    this.gl.outputColorSpace = THREE.SRGBColorSpace

    const uTime = this.uTime
    this.cardMat = new THREE.MeshLambertMaterial({ map: this.atlas.tex, alphaTest: 0.5, side: THREE.DoubleSide })
    this.cardMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aSway;\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vec4 swW = modelMatrix * vec4(transformed, 1.0);
          transformed.x += (sin(uTime * 1.3 + swW.x * 0.7 + swW.z * 0.45) * 0.8 + sin(uTime * 2.9 + swW.x * 1.9) * 0.25) * aSway;`,
        )
    }
    this.groundMat = new THREE.MeshLambertMaterial()
    this.groundMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
      sh.fragmentShader = sh.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vWPos; uniform float uTime;
          float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float wetK = 0.0; vec3 glint = vec3(0.0);`,
        )
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          {
            vec3 sc = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(1.0 / 2.2));
            if (sc.b > 0.34 && sc.b > sc.r + 0.2 && sc.b > sc.g + 0.06) {
              vec2 w = floor(vWPos.xz * 64.0) / 4.0;
              float sh = sin(w.x * 0.31 + w.y * 0.83 - uTime * 1.5) * sin(w.y * 0.47 - w.x * 0.12 + uTime * 0.8);
              diffuseColor.rgb += vec3(0.03, 0.05, 0.07) * smoothstep(0.5, 1.0, sh);
              float h = h21(floor(w));
              if (h > 0.985) glint = vec3(0.9, 0.95, 1.0) * smoothstep(0.6, 1.0, sin(uTime * (1.2 + h * 30.0) + h * 91.0)) * 0.8;
            }
          }`,
        )
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += glint;')
    }

    const skirtMat = new THREE.MeshLambertMaterial({ color: 0x1e3a2a })
    this.skirt = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), skirtMat)
    this.skirt.position.y = -0.03
    this.skirt.receiveShadow = true
    this.scene.add(this.skirt)

    this.voxMat = voxelMaterial(uTime)
    this.ghostMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, opacity: 0.4 })
    this.blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
    this.blobMat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.55 })

    this.scene.add(this.hemi)
    this.sun.castShadow = true
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.03
    this.sun.shadow.radius = 3
    this.scene.add(this.sun, this.sun.target)
    for (let i = 0; i < N_LIGHTS; i++) {
      const p = new THREE.PointLight(0xffc080, 0, 4, 1.6)
      this.points.push(p)
      this.scene.add(p)
    }
    this.particleLift = 22
    this.applyLevel(this.level, true)
  }

  private applyLevel(l: FxLevel, init = false) {
    const lv = Math.max(1, l) as FxLevel
    this.level = lv
    if (!init) this.governor.reset(lv)
    const size = lv >= 3 ? 2048 : 1024
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.mapSize.set(size, size)
      this.sun.shadow.map?.dispose()
      this.sun.shadow.map = null as unknown as THREE.WebGLRenderTarget
    }
    this.sun.castShadow = lv >= 2
    if (lv >= 2 && !this.post) this.post = new Post(this.gl, this.scene, this.camera, lv >= 3 ? 4 : 0)
    if (lv < 2 && this.post) {
      this.post.dispose()
      this.post = null
    }
    this.post?.setGrade(this.grade, lv)
    if (!init) this.resize3D()
  }

  private pixelRatio(): number {
    return this.level >= 3 ? Math.min(this.dpr, 2) : this.level === 2 ? Math.min(this.dpr, 1.25) : 1
  }

  override dispose() {
    super.dispose()
    this.unsubQ()
    this.dio?.dispose()
    this.post?.dispose()
    this.atlas.dispose()
    this.gl.dispose()
    this.glCanvas.remove()
  }

  override resize(cssW: number, cssH: number, dpr: number) {
    super.resize(cssW, cssH, dpr)
    this.cssW = cssW
    this.cssH = cssH
    if (this.stage) this.stage.style.transform = ''
    this.resize3D()
  }

  private resize3D() {
    const pr = this.pixelRatio()
    this.gl.setPixelRatio(pr)
    this.gl.setSize(this.cssW, this.cssH, false)
    this.glCanvas.style.width = `${this.cssW}px`
    this.glCanvas.style.height = `${this.cssH}px`
    this.post?.setSize(this.cssW, this.cssH, pr)
    const cam = this.camera
    cam.aspect = this.cssW / Math.max(1, this.cssH)
    // show about as many tiles across as the 2D view (at least 10), fewer inside small rooms
    const inside = this.map?.spec.interior ? 0.82 : 1
    const viewTiles = Math.min(cam.aspect < 0.8 ? 10 : 30, Math.max(10, (this.viewW / 16) * ZOOM)) * inside
    this.dist = viewTiles / 2 / (Math.tan(((FOV / 2) * Math.PI) / 180) * cam.aspect)
    cam.far = this.dist * 4
    cam.updateProjectionMatrix()
    // ground footprint relative to the target
    this.placeCamera(0, 0)
    const hit = (x: number, y: number) => {
      this.ndc.set(x, y)
      this.ray.setFromCamera(this.ndc, cam)
      const p = new THREE.Vector3()
      return this.ray.ray.intersectPlane(this.plane, p) ?? p.set(0, 0, -this.dist)
    }
    const top = hit(0, 1)
    const bot = hit(0, -1)
    this.foot = { zTop: top.z, zBot: bot.z, halfTop: Math.abs(hit(1, 1).x), halfMid: Math.abs(hit(1, 0).x) }
    this.scene.fog = new THREE.Fog(this.fogColor(), this.dist * 0.95, this.dist * 2.4)
    this.snapNext = true
  }

  private fogColor(): THREE.Color {
    const m = this.map
    if (m?.spec.interior) return new THREE.Color(m.spec.bg ?? '#0b0a14')
    const g = this.grade
    return new THREE.Color(g.sun[0] * 0.55 * g.ambient[0], g.sun[1] * 0.6 * g.ambient[1], g.sun[2] * 0.7 * g.ambient[2]).convertSRGBToLinear()
  }

  private placeCamera(x: number, z: number) {
    const d = this.dist
    this.camera.position.set(x, Math.sin(PITCH) * d, z + Math.cos(PITCH) * d)
    this.tgt.set(x, 0, z)
    this.camera.lookAt(this.tgt)
    this.camera.updateMatrixWorld()
  }

  override setMap(m: GameMap) {
    super.setMap(m)
    for (const c of this.cards.values()) this.dropCard(c)
    this.cards.clear()
    if (this.dio) {
      this.scene.remove(this.dio.ground, this.dio.statics, this.dio.dynamic, this.dio.voxels)
      this.dio.dispose()
    }
    const up = Math.max(0, Math.min(2, Math.floor(Math.log2(4096 / (Math.max(m.w, m.h) * 16)))))
    this.dio = buildDiorama(m, this.atlas, this.cardMat, this.groundMat, up, this.voxMat)
    this.scene.add(this.dio.ground, this.dio.statics, this.dio.dynamic, this.dio.voxels)
    this.atlas.flush()
    this.applyGrade()
    this.resize3D()
  }

  /** Lights, fog and sky from the map's grade. */
  private applyGrade() {
    const m = this.map!
    const g = this.grade
    const K = Math.PI
    const amb = new THREE.Color(g.ambient[0], g.ambient[1], g.ambient[2])
    const night = g.night
    const interior = !!m.spec.interior
    this.hemi.color.copy(amb).multiplyScalar(1.0)
    this.hemi.groundColor.copy(amb).multiplyScalar(0.55)
    this.hemi.intensity = (night ? 0.75 : 0.62) * K * 0.45
    const sunCol = interior ? new THREE.Color(1, 0.85, 0.7) : night ? new THREE.Color(0.55, 0.65, 1) : new THREE.Color(g.sun[0], g.sun[1] * 1.05, g.sun[2] * 1.2)
    this.sun.color.copy(sunCol)
    this.sun.intensity = (interior ? 0.35 : night ? 0.45 : 0.95) * K * 0.42 * ((amb.r + amb.g + amb.b) / 3 + 0.25)
    const bg = new THREE.Color(m.spec.bg ?? (interior ? '#0b0a14' : PAL.leafDark))
    ;(this.skirt.material as THREE.MeshLambertMaterial).color.copy(bg)
    this.scene.background = bg.clone().multiplyScalar(0.6)
    this.scene.fog = new THREE.Fog(this.fogColor(), this.dist * 0.95, this.dist * (interior ? 3 : 2.4))
    this.post?.setGrade(g, this.level)
  }

  // ─── camera ──────────────────────────────────────────────────────
  private updateCamera3D(world: World, dt: number) {
    const m = this.map!
    const pl = world.player
    const pp = wpos(pl, this.p0)
    const moving = pl.t < 1
    const d = DIRS[pl.dir]
    const look = REDUCED ? 0 : moving ? (world.vel > WALK_SPEED * 1.35 ? 26 : 14) : 7
    const cs = this.camS
    if (this.snapNext || REDUCED) {
      cs.x = d.x * look
      cs.y = d.y * look * 0.7
      cs.vx = cs.vy = 0
    } else springStep(cs, d.x * look, d.y * look * 0.7, 4.2, 1, dt)
    const fs = this.fudeS
    const fp = wpos(world.fude, this.p1)
    if (this.snapNext || Math.abs(fs.x - fp.x) + Math.abs(fs.y - fp.y) > 56) {
      fs.x = fp.x
      fs.y = fp.y
      fs.vx = fs.vy = 0
    } else {
      const f = world.fude
      const k = f.t < 1 ? world.vel * 16 * ((2 * 0.7) / 10) * 0.65 : 0
      springStep(fs, fp.x + (f.x - f.px) * k, fp.y + (f.y - f.py) * k, 10, 0.7, dt)
    }
    this.snapNext = false
    let tx = (pp.x + 8 + cs.x) / 16
    let tz = (pp.y + 10 + cs.y) / 16
    const F = this.foot
    const half = F.halfMid
    tx = m.w <= half * 2 ? m.w / 2 : Math.max(half, Math.min(m.w - half, tx))
    const span = F.zBot - F.zTop
    // allow a little overscan at the far edge: tall trees fill it
    const lo = -F.zTop - 1.2
    const hi = m.h - F.zBot - 0.4
    tz = m.h + 1.6 <= span || lo > hi ? m.h / 2 + 0.4 : Math.max(lo, Math.min(hi, tz))
    if (this.shake > 0) {
      tx += ((Math.random() - 0.5) * this.shake) / 16
      tz += ((Math.random() - 0.5) * this.shake) / 16
      this.shake = Math.max(0, this.shake - dt * 30)
    }
    this.placeCamera(tx, tz)
    // 2D overlay reference (particle wrapping, tile maths)
    this.camF.x = tx * 16 - this.viewW / 2
    this.camF.y = tz * 16 - this.viewH / 2
    this.cam.x = Math.floor(this.camF.x)
    this.cam.y = Math.floor(this.camF.y)
    // sun + its shadow frustum follow the target, snapped to shadow texels (no shimmer)
    const ext = Math.max(half, -F.zTop) + 3
    const sc = this.sun.shadow.camera
    if (sc.right !== ext) {
      sc.left = -ext
      sc.right = ext
      sc.top = ext
      sc.bottom = -ext
      sc.near = 0.5
      sc.far = 80
      sc.updateProjectionMatrix()
    }
    const texel = (ext * 2) / this.sun.shadow.mapSize.x
    const sx = Math.round(tx / texel) * texel
    const sz = Math.round((tz - 2) / texel) * texel
    this.sun.target.position.set(sx, 0, sz)
    this.sun.position.set(sx - 12, 26, sz + 14)
    this.sun.target.updateMatrixWorld()
  }

  override snap() {
    this.snapNext = true
  }

  // ─── projection helpers ─────────────────────────────────────────
  protected override proj(wx: number, wy: number, h: number, out: Pt): Pt {
    const v = this.v3.set(wx / 16, (h / 16) * VS, wy / 16).project(this.camera)
    const k = this.dpr / this.scale
    out.x = ((v.x + 1) / 2) * this.cssW * k
    out.y = ((1 - v.y) / 2) * this.cssH * k
    return out
  }

  override toScreen(wx: number, wy: number, out: Pt): Pt {
    const v = this.v3.set(wx / 16, 0.4, wy / 16).project(this.camera)
    out.x = ((v.x + 1) / 2) * this.cssW
    out.y = ((1 - v.y) / 2) * this.cssH
    return out
  }

  override playerScreen(world: World, out: Pt): Pt {
    const p = wpos(world.player, this.p1)
    const v = this.v3.set((p.x + 8) / 16, 0.55 * VS, p.y / 16 + ANCHOR).project(this.camera)
    out.x = ((v.x + 1) / 2) * this.cssW
    out.y = ((1 - v.y) / 2) * this.cssH
    return out
  }

  override tileAt(cssX: number, cssY: number): Pt {
    this.ndc.set((cssX / this.cssW) * 2 - 1, -((cssY / this.cssH) * 2 - 1))
    this.ray.setFromCamera(this.ndc, this.camera)
    const p = this.ray.ray.intersectPlane(this.plane, this.v3)
    if (!p) return { x: -1, y: -1 }
    return { x: Math.floor(p.x), y: Math.floor(p.z) }
  }

  // ─── cards (characters and entity tiles) ────────────────────────
  private card(key: object, blob: boolean): Card {
    let c = this.cards.get(key)
    if (!c) {
      const mesh = new THREE.Mesh(undefined, this.voxMat)
      mesh.castShadow = true
      this.scene.add(mesh)
      let b: THREE.Mesh | null = null
      if (blob) {
        b = new THREE.Mesh(this.blobGeo, this.blobMat)
        b.renderOrder = 1
        this.scene.add(b)
      }
      c = { mesh, yaw: 0, blob: b, seen: 0, ghost: false }
      this.cards.set(key, c)
    }
    c.seen = this.frameNo
    return c
  }

  private dropCard(c: Card) {
    this.scene.remove(c.mesh)
    if (c.blob) this.scene.remove(c.blob)
  }

  /** Place the voxel model of a canvas with its bottom-centre at (x, y, z) in tiles. */
  private setCard(c: Card, canvas: HTMLCanvasElement, x: number, y: number, z: number, blobW = 0.62, depth = 8, dir?: string) {
    const g = voxelGeometry(canvas, depth)
    if (c.mesh.geometry !== g) c.mesh.geometry = g
    c.mesh.position.set(x, y, z)
    // side-facing figures turn three-quarters so their depth shows
    const want = dir === 'left' ? -0.5 : dir === 'right' ? 0.5 : 0
    c.yaw += (want - c.yaw) * Math.min(1, this.frameDt * 14)
    c.mesh.rotation.y = c.yaw
    if (c.blob) {
      c.blob.position.set(x, 0.015, z)
      const s = blobW * Math.max(0.35, 1 - y * 0.6)
      c.blob.scale.set(s * (canvas.width / 16), 1, s * 0.6)
    }
  }

  private setGhost(c: Card, ghost: boolean, now: number) {
    if (ghost !== c.ghost) {
      c.ghost = ghost
      c.mesh.material = ghost ? this.ghostMat : this.voxMat
      c.mesh.castShadow = !ghost
    }
    if (ghost) this.ghostMat.opacity = 0.3 + 0.18 * Math.sin(now / 180)
  }

  private player3D(world: World, now: number, info: RenderInfo) {
    const w = world.player
    const st = this.animOf(w, w.dir)
    const p = wpos(w, this.p0)
    const moving = w.t < 1
    const dir = this.shownDir(st, w.dir, now)
    let anim: Anim = 'idle'
    let frame = 0
    let blink = false
    if (moving) {
      anim = world.vel > WALK_SPEED * 1.35 ? 'run' : 'walk'
      frame = walkFrame(w.steps, w.t)
    } else {
      if (st.wasMoving) st.idleSince = now
      ;({ frame, blink } = animAt('idle', now - st.idleSince))
    }
    if (moving && (frame === 0 || frame === 2) && frame !== st.lastFrame) this.footfall(world, w, anim === 'run', now, !st.wasMoving)
    st.lastFrame = moving ? frame : -1
    st.wasMoving = moving
    const cnv = this.frameCanvas(st, 'mage', dir, anim, frame, blink, info.outfit)
    if (cnv) this.setCard(this.card(w, true), cnv, (p.x + 8) / 16, 0, p.y / 16 + ANCHOR, 0.62, 8, dir)
  }

  private fude3D(world: World, now: number) {
    const w = world.fude
    const st = this.animOf(w, w.dir)
    const s = this.fudeS
    const dir = this.shownDir(st, w.dir, now)
    const moving = w.t < 1 || Math.abs(s.vx) + Math.abs(s.vy) > 12
    const { frame, blink } = animAt(moving ? 'run' : 'walk', now, { float: true, seed: 3 })
    const cnv = this.frameCanvas(st, 'fude', dir, 'walk', frame, blink, '')
    const hover = (5 + Math.sin(now / 1100) * 1.2) / 16
    if (cnv) this.setCard(this.card(w, true), cnv, (s.x + 8) / 16, hover * VS, s.y / 16 + ANCHOR - 0.04, 0.5, 8, dir)
  }

  private entity3D(e: Entity, now: number, info: RenderInfo) {
    const ghost = info.ghosts.has(e.spec.id)
    const p = wpos(e, this.p0)
    let tile: TileId | undefined = e.spec.tile
    let hop = 0
    if (e.spec.kind === 'chest') {
      tile = info.opened.has(e.spec.id) ? 'chest-open' : 'chest'
      const ca = this.chestAnim
      if (ca && ca.e === e) {
        const t = now - ca.at
        if (t < 110) tile = 'chest'
        else if (t < 420) hop = Math.sin(((t - 110) / 310) * Math.PI) * 3
        else if (t > 1100) this.chestAnim = null
      }
    }
    if (tile) {
      let key = this.tileKeys.get(e)
      if (!key) this.tileKeys.set(e, (key = {}))
      const c = this.card(key, false)
      const cnv = tileCanvas(tile, tileVariant(tile, e.x, e.y), tileFrame(tile, now, e.x, e.y), 0, tile)
      this.setCard(c, cnv, p.x / 16 + 0.5, (hop / 16) * VS, p.y / 16 + ANCHOR, 0.62, voxDepth(tile))
      this.setGhost(c, ghost, now)
    }
    const sprite = e.spec.sprite as SpriteId | undefined
    if (!sprite) return
    const c = this.card(e, true)
    if (e.big) {
      const cnv = safeSprite(sprite, { frame: Math.floor(now / 450) % 2 })
      const bob = Math.sin(now / 420) / 16
      if (cnv) this.setCard(c, cnv, (p.x + 16) / 16, bob * VS, p.y / 16 + 0.95, 0.8, 10)
      void spriteSize
    } else {
      const st = this.animOf(e, e.dir)
      const moving = e.t < 1
      const dir = this.shownDir(st, e.dir, now)
      let frame = 0
      let blink = false
      const sd = (e.hx * 7 + e.hy * 3) % 11
      if (moving) frame = walkFrame(npcState(e).steps - 1, e.t)
      else ({ frame, blink } = animAt('idle', now, { seed: sd, float: sprite === 'fude' }))
      const cnv = this.frameCanvas(st, sprite, dir, moving ? 'walk' : 'idle', frame, blink, '')
      if (cnv) this.setCard(c, cnv, (p.x + 8) / 16, 0, p.y / 16 + ANCHOR + (tile ? 0.02 : 0), 0.62, 8, dir)
    }
    this.setGhost(c, ghost, now)
  }

  // ─── lights ──────────────────────────────────────────────────────
  private lights3D(world: World, now: number, info: RenderInfo) {
    const list = this.frameLights(world, now, info)
    const g = this.grade
    const tx = this.tgt.x * 16
    const tz = this.tgt.z * 16
    // nearest lights to the view centre (partial selection, no allocation beyond the pool)
    const pick: number[] = []
    const dist: number[] = []
    for (let i = 0; i < list.length; i++) {
      const l = list[i]
      const d = Math.abs(l.x - tx) + Math.abs(l.y - tz) * 1.3
      if (d > 420) continue
      let j = pick.length
      if (j >= N_LIGHTS && d >= dist[N_LIGHTS - 1]) continue
      if (j < N_LIGHTS) {
        pick.push(i)
        dist.push(d)
      } else j = N_LIGHTS - 1
      while (j > 0 && dist[j - 1] > d) {
        pick[j] = pick[j - 1]
        dist[j] = dist[j - 1]
        j--
      }
      pick[j] = i
      dist[j] = d
    }
    const K = this.map?.spec.interior ? 5 : g.night ? 6 : 3.2
    for (let k = 0; k < N_LIGHTS; k++) {
      const pl = this.points[k]
      if (k >= pick.length) {
        pl.intensity = 0
        continue
      }
      const l = list[pick[k]]
      const fl = l.flicker ? 1 - l.flicker * (0.5 + 0.5 * Math.sin(now * 0.017 + l.seed * 7) * Math.sin(now * 0.041 + l.seed)) : 1
      pl.color.setRGB(l.color[0], l.color[1], l.color[2])
      pl.intensity = l.intensity * g.lights * fl * K
      pl.distance = (l.r / 16) * 2.4
      pl.position.set(l.x / 16, 0.9, l.y / 16 + 0.35)
    }
  }

  // ─── battle transition ──────────────────────────────────────────
  override startBattleFx(now: number) {
    this.render3D(now)
    const snap = document.createElement('canvas')
    snap.width = this.canvas.width
    snap.height = this.canvas.height
    const k = this.dpr
    snap.getContext('2d')!.drawImage(this.glCanvas, 0, 0, this.glCanvas.width, this.glCanvas.height, 0, 0, this.cssW * k, this.cssH * k)
    snap.getContext('2d')!.drawImage(this.canvas, 0, 0)
    this.battleFx = { start: now, snap }
    this.glCanvas.style.visibility = 'hidden'
  }

  private render3D(now: number) {
    const pl = this.v3.set(this.tgt.x, 0.5, this.tgt.z).project(this.camera)
    if (this.post) this.post.render(now, (pl.y + 1) / 2 - 0.02, this.tgt.x, this.tgt.z)
    else this.gl.render(this.scene, this.camera)
  }

  // ─── frame ───────────────────────────────────────────────────────
  override draw(world: World, now: number, dt: number, info: RenderInfo) {
    const m = this.map
    if (!m || !this.dio) return
    this.frameNo++
    const ms = this.lastT ? now - this.lastT : 16
    this.lastT = now
    // very slow frames still count (capped), so a struggling GPU steps down too
    const nl = this.governor.push(Math.min(ms, 240))
    if (nl !== null) {
      console.info(`[3d] frame time high — quality level ${nl}`)
      this.applyLevel(nl)
    }
    this.uTime.value = now / 1000
    this.frameDt = dt
    this.updateCamera3D(world, dt)

    if (!this.chestSeen) this.chestSeen = new Set(info.opened)
    else if (info.opened.size !== this.chestSeen.size) {
      for (const e of world.ents)
        if (e.spec.kind === 'chest' && info.opened.has(e.spec.id) && !this.chestSeen.has(e.spec.id)) {
          this.chestAnim = { e, at: now }
          this.puff(e.x * 16 + 8, e.y * 16 + 4, 'spark', now + 110, 0, true)
        }
      this.chestSeen = new Set(info.opened)
    }

    animateDyn(this.dio, this.atlas, now)
    this.atlas.flush()
    for (const e of world.ents) this.entity3D(e, now, info)
    this.fude3D(world, now)
    this.player3D(world, now, info)
    for (const [k, c] of this.cards)
      if (c.seen !== this.frameNo) {
        this.dropCard(c)
        this.cards.delete(k)
      }
    this.lights3D(world, now, info)

    const ctx = this.ctx
    if (this.battleFx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      if (this.battleFx.snap) ctx.drawImage(this.battleFx.snap, 0, 0)
      this.drawBattleFx(now)
      return
    }
    if (this.glCanvas.style.visibility) this.glCanvas.style.visibility = ''
    this.render3D(now)

    // 2D overlay: effects projected through the 3D camera
    const b = this.b
    b.imageSmoothingEnabled = false
    b.clearRect(0, 0, this.vw, this.vh)
    this.drawPuffs(now)
    for (const ex of m.exits.values()) if (info.exitLocked(ex)) this.drawBarrier(ex, now)
    for (const e of world.ents) {
      const mk = info.markers.get(e.spec.id)
      if (mk) this.drawMarker(e, mk, now)
    }
    this.drawPrompt(world, now, info)
    this.drawTap(now)
    this.updateParticles(dt, now)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.drawImage(this.buf, 0, 0, this.vw * this.scale, this.vh * this.scale)
  }

  /** Debug info for the dev console. */
  info() {
    const r = this.gl.info.render
    return { level: this.level, calls: r.calls, tris: r.triangles, pr: this.gl.getPixelRatio(), atlas: this.atlas }
  }
}
