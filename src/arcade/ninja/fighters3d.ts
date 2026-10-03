/**
 * Stick Ninja's fighters in 3D: rigged GLB characters (Meshy auto-rig, see
 * world3d/models/glb.ts) drawn on a WebGL layer that the 2D canvas
 * composites over the scenery. Each one is posed every frame from the same
 * state the stick figures use (the sim's moves and draw.ts's arm and blade
 * angles), so swings, guards, flinches and falls line up exactly with the
 * fight's hit windows; no canned clips. The sword is a 3D blade placed at
 * the hand bone and aimed along the 2D blade angle, so it reads the same
 * on any rig.
 *
 * Fighters whose model is missing or unrigged stay stick figures. Without
 * WebGL the whole layer simply stays off.
 */
import * as THREE from 'three'
import { glbReady, glbRigged, requestGlb, type Rig } from '../../world3d/models/glb'
import type { FoeKind } from './data'
import type { Pose } from './draw'
import type { Fighter, Sim } from './sim'

interface Cast {
  /** Model id (art-src/models.json). */
  id: string
  /** Multiplies the texture colours (reuse one model for several foes). */
  tint?: string
  /** Glow added on top (eyes, auras). */
  glow?: string
  opacity?: number
  weapon?: 'sword' | 'spear' | 'club' | 'bow' | 'staff' | 'none'
  /** Blade colour for the 3D weapon (the hero's comes from the sword). */
  steel?: string
}

/** Who is played by which model. Kinds not listed stay stick figures. */
export const CAST3D: Partial<Record<Fighter['kind'], Cast>> = {
  hero: { id: 'ninja', weapon: 'sword' },
  thrower: { id: 'ninja', tint: '#7d8fc4', weapon: 'sword', steel: '#cfd8dc' },
  assassin: { id: 'ninja', tint: '#b48ad6', weapon: 'sword', steel: '#e0e0e0' },
  shade: { id: 'ninja', tint: '#9a6be0', glow: '#4a2a80', opacity: 0.72, weapon: 'sword', steel: '#c9b6ff' },
  kage: { id: 'ninja', tint: '#6a4a9a', glow: '#3d1f63', weapon: 'sword', steel: '#e0d4ff' },
  quiet: { id: 'ninja', tint: '#2a2238', glow: '#4b2d7a', weapon: 'sword', steel: '#b388ff' },
  bandit: { id: 'jailer', weapon: 'sword', steel: '#cfd3d6' },
  brute: { id: 'jailer', tint: '#e6a08a', weapon: 'club' },
  spear: { id: 'guard', weapon: 'spear' },
  archer: { id: 'fisher', weapon: 'bow' },
  monk: { id: 'monk', weapon: 'staff' },
  samurai: { id: 'samurai', weapon: 'sword', steel: '#e8edf2' },
  ronin: { id: 'samurai', tint: '#a9a9a9', weapon: 'sword', steel: '#e8edf2' },
  frost: { id: 'samurai', tint: '#b9dcf2', glow: '#1d3d55', weapon: 'sword', steel: '#bfe9ff' },
  shogun: { id: 'samurai', tint: '#f0cf70', glow: '#3d2500', weapon: 'sword', steel: '#ffd27a' },
  oni: { id: 'oni', weapon: 'club' },
  storm: { id: 'raijin', glow: '#3a3000', weapon: 'none' },
  yurei: { id: 'yuki-onna', tint: '#d8f2ff', glow: '#1c3e4e', opacity: 0.6, weapon: 'none' },
  // (their own models carry their weapons: the Kappa King's anchor, the Tengu Lord's fan)
  kappa: { id: 'kappa', tint: '#cfe9d6', weapon: 'none' },
  kappaking: { id: 'kappa', weapon: 'none' },
  tengu: { id: 'tengu', weapon: 'none' },
}

/** Logical height (canvas units) of a stick figure at scale 1, which a model is fitted to. */
const FIG_H = 76

interface Inst {
  fighter: Fighter
  root: THREE.Group
  inner: THREE.Group
  rig: Rig
  height: number
  mats: { m: THREE.MeshToonMaterial; emissive: THREE.Color }[]
  weapon: THREE.Group | null
  blade: THREE.Mesh | null
  cast: Cast
}

const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)
const tmp = new THREE.Vector3()

function weaponMesh(kind: Cast['weapon'], steel: string): { g: THREE.Group; blade: THREE.Mesh | null } | null {
  if (!kind || kind === 'none') return null
  const g = new THREE.Group()
  const mat = (c: string, e = 0) => new THREE.MeshToonMaterial({ color: c, emissive: new THREE.Color(c).multiplyScalar(e) })
  let blade: THREE.Mesh | null = null
  if (kind === 'sword') {
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.11, 0.11), mat('#1b1b1b'))
    hilt.position.x = -0.22
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), mat('#c9a227'))
    guard.rotation.z = Math.PI / 2
    blade = new THREE.Mesh(new THREE.BoxGeometry(1, 0.07, 0.02), mat(steel, 0.35))
    blade.position.x = 0.5
    g.add(hilt, guard, blade)
  } else if (kind === 'spear' || kind === 'staff') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), mat('#6d4c2b'))
    shaft.rotation.z = Math.PI / 2
    shaft.position.x = 0.35
    g.add(shaft)
    if (kind === 'spear') {
      blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), mat('#e3e9ee', 0.3))
      blade.rotation.z = -Math.PI / 2
      blade.position.x = 1.42
      g.add(blade)
    }
  } else if (kind === 'club') {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.06, 1.1, 8), mat('#3b2a1a'))
    c.rotation.z = -Math.PI / 2
    c.position.x = 0.45
    g.add(c)
  } else if (kind === 'bow') {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 4, 16, Math.PI * 0.9), mat('#5d3a1a'))
    arc.rotation.z = Math.PI * 0.55
    g.add(arc)
  }
  return { g, blade }
}

export class Fighters3D {
  private renderer: THREE.WebGLRenderer | null = null
  readonly canvas: HTMLCanvasElement | null = null
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(0, 480, 270, 0, -1000, 1000)
  private hemi = new THREE.HemisphereLight(0xffffff, 0x404858, 1.4)
  private sun = new THREE.DirectionalLight(0xfff2dd, 1.6)
  private rim = new THREE.DirectionalLight(0xbfd8ff, 0.9)
  private insts = new Map<number, Inst>()
  /** Models that loaded without a usable skeleton (they stay stick figures). */
  private rigless = new Set<string>()
  /** Fighters drawn in 3D this frame (draw.ts skips their stick bodies). */
  readonly drawn = new Set<number>()

  constructor() {
    if (typeof document === 'undefined') return
    try {
      const c = document.createElement('canvas')
      const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, premultipliedAlpha: true })
      r.setClearColor(0x000000, 0)
      r.outputColorSpace = THREE.SRGBColorSpace
      this.renderer = r
      ;(this as { canvas: HTMLCanvasElement }).canvas = c
    } catch {
      this.renderer = null
    }
    this.camera.position.z = 500
    this.sun.position.set(-0.6, 1, 0.8)
    this.rim.position.set(0.8, 0.4, -0.6)
    this.scene.add(this.hemi, this.sun, this.rim)
    for (const c of new Set(Object.values(CAST3D).map((x) => x!.id))) requestGlb(c)
  }

  get ok() {
    return !!this.renderer
  }

  private make(f: Fighter, cast: Cast): Inst | null {
    // (cheap checks first: cloning a model just to find it has no skeleton is not)
    if (this.rigless.has(cast.id) || !glbReady(cast.id)) return null
    const g = glbRigged(cast.id)
    if (!g) {
      this.rigless.add(cast.id)
      return null
    }
    const mats: Inst['mats'] = []
    g.root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const clone = (m: THREE.Material) => {
        const c = (m as THREE.MeshToonMaterial).clone()
        if (cast.tint) c.color.multiply(new THREE.Color(cast.tint))
        if (cast.opacity !== undefined) {
          c.transparent = true
          c.opacity = cast.opacity
          c.depthWrite = false
        }
        if (cast.glow) c.emissive.add(new THREE.Color(cast.glow))
        mats.push({ m: c, emissive: c.emissive.clone() })
        return c
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material)
      mesh.frustumCulled = false
    })
    const w = weaponMesh(cast.weapon, cast.steel ?? '#dfe6ee')
    if (w) this.scene.add(w.g)
    this.scene.add(g.root)
    return { fighter: f, root: g.root, inner: g.inner, rig: g.rig, height: g.height, mats, weapon: w?.g ?? null, blade: w?.blade ?? null, cast }
  }

  private drop(uid: number) {
    const i = this.insts.get(uid)
    if (!i) return
    this.scene.remove(i.root)
    if (i.weapon) this.scene.remove(i.weapon)
    for (const { m } of i.mats) m.dispose()
    this.insts.delete(uid)
  }

  /**
   * Pose and render every 3D fighter. `toScreen` maps sim x/y to logical
   * canvas coordinates; `poseOf` is draw.ts's pose for a fighter.
   */
  render(s: Sim, cam: number, vw: number, vh: number, gy: number, pxW: number, pxH: number, poseOf: (f: Fighter) => Pose, sky: string, enabled: boolean): HTMLCanvasElement | null {
    this.drawn.clear()
    const r = this.renderer
    if (!r || !enabled) return null
    const live = new Set<number>()
    const all = [...s.foes, s.hero]
    for (const f of all) {
      const cast = CAST3D[f.kind]
      if (!cast) continue
      let inst = this.insts.get(f.uid)
      if (!inst) {
        const made = this.make(f, cast)
        if (!made) continue
        inst = made
        this.insts.set(f.uid, inst)
      }
      live.add(f.uid)
      this.drawn.add(f.uid)
      this.poseOne(s, inst, poseOf(f), cam, vh, gy)
    }
    for (const uid of [...this.insts.keys()]) if (!live.has(uid)) this.drop(uid)
    if (!this.drawn.size) return null
    if (r.domElement.width !== pxW || r.domElement.height !== pxH) r.setSize(pxW, pxH, false)
    this.camera.left = 0
    this.camera.right = vw
    this.camera.top = vh
    this.camera.bottom = 0
    this.camera.updateProjectionMatrix()
    this.hemi.color.set(sky)
    r.render(this.scene, this.camera)
    return r.domElement
  }

  private poseOne(s: Sim, i: Inst, p: Pose, cam: number, vh: number, gy: number) {
    const f = i.fighter
    const { rig, root, inner } = i
    const k = (FIG_H * f.scale) / Math.max(0.1, i.height)
    const face = f.face
    root.scale.setScalar(k)
    root.position.set(f.x - cam, vh - gy + f.y, f.dead ? -50 : f.kind === 'hero' ? 40 : 0)
    // Turned three-quarters toward the camera, facing the way they fight.
    root.rotation.set(0, face * (Math.PI / 2 - 0.5), 0)
    inner.rotation.set(0, 0, 0)
    inner.position.set(0, 0, 0)

    rig.reset()
    const t = f.age
    const moving = Math.abs(f.vx) > 30 && f.y <= 0 && !f.move
    const air = f.y > 2
    const phase = (f.x / 26) % 2
    const sw = Math.sin(phase * Math.PI)
    // Arms down at the sides first (rigs rest in an A/T pose).
    rig.turn('lArm', Z, -rig.lDrop)
    rig.turn('rArm', Z, rig.rDrop)
    rig.turn('lHand', Z, rig.lDrop)
    rig.turn('rHand', Z, -rig.rDrop)

    // Legs: a fighting stance, a run cycle, a tuck in the air.
    if (air) {
      rig.turn('lUp', X, -1.0)
      rig.turn('rUp', X, -0.35)
      rig.turn('lLeg', X, 1.3)
      rig.turn('rLeg', X, 0.9)
    } else if (moving || f.dashT > 0) {
      const amp = f.dashT > 0 ? 0.3 : 0.85
      rig.turn('lUp', X, -sw * amp)
      rig.turn('rUp', X, sw * amp)
      rig.turn('lLeg', X, Math.max(0, sw) * amp * 1.3)
      rig.turn('rLeg', X, Math.max(0, -sw) * amp * 1.3)
      inner.position.y = Math.abs(sw) * 0.05
    } else {
      // Feet apart, knees bent, weight low; breathing.
      const br = Math.sin(t * 2.4) * 0.03
      rig.turn('lUp', X, -0.45 - br)
      rig.turn('rUp', X, 0.3 + br)
      rig.turn('lLeg', X, 0.55 + br)
      rig.turn('rLeg', X, 0.35)
      rig.turn('lUp', Z, -0.12, true)
      rig.turn('rUp', Z, 0.12, true)
      inner.position.y = -0.06
    }

    // Body lean from the pose (into swings, back when hurt).
    rig.turn('spine', X, p.lean * 0.9 + (moving ? 0.2 : 0))
    rig.turn('chest', Y, p.live ? 0.25 : 0)
    if (f.hurtT > 0 || f.stunT > 0) {
      rig.turn('spine', X, -0.35)
      rig.turn('head', X, -0.3)
    }

    // Sword arm: aim the upper arm along the 2D arm angle (phi above forward).
    const reach = Math.max(0.2, Math.min(1, p.ext))
    rig.turn('rArm', X, -(Math.PI / 2 + p.phi), true)
    rig.turn('rFore', X, -(1 - reach) * 1.2 - 0.15)
    // The off hand joins the grip on big swings, else guards the body.
    if (p.live || f.blockT >= 0) {
      rig.turn('lArm', X, -(Math.PI / 2 + p.phi - 0.25), true)
      rig.turn('lFore', X, -0.5)
    } else {
      rig.turn('lArm', X, moving ? sw * 0.6 : -0.5, true)
      rig.turn('lFore', X, -0.9)
    }
    // Spins turn the whole body.
    if (p.spinning) root.rotation.y += p.psi * 2

    // Falls: tip over backward and fade.
    if (f.dead) {
      const u = Math.min(1, f.deadT * 4)
      inner.rotation.x = 0
      root.rotation.z = face * u * 1.45
      const fade = Math.max(0, 1 - Math.max(0, f.deadT - 0.8) / 0.8)
      for (const { m } of i.mats) {
        m.transparent = true
        m.opacity = (i.cast.opacity ?? 1) * fade
      }
    }

    // Hit flash, frost, the inky shadow of the special.
    const flash = f.flash > 0
    const chill = f.chillT > 0
    for (const { m, emissive } of i.mats) {
      if (flash) m.emissive.setRGB(0.9, 0.9, 0.9)
      else if (chill) m.emissive.setRGB(0.15, 0.3, 0.45)
      else if (f.elite) m.emissive.copy(emissive).add(new THREE.Color(0.25, 0.2, 0.02))
      else m.emissive.copy(emissive)
    }
    // The hero blinks while invulnerable after a hit.
    root.visible = !(f.team === 0 && f.inv > 0 && !f.move && Math.floor(f.inv * 20) % 2 === 0)

    // Weapon: at the hand, along the blade angle (mirrored by facing).
    if (i.weapon) {
      root.updateMatrixWorld(true)
      const hand = rig.joint('rHand') ?? rig.joint('rFore')
      if (hand) hand.getWorldPosition(tmp)
      else tmp.copy(root.position).add(new THREE.Vector3(0, FIG_H * f.scale * 0.55, 0))
      i.weapon.position.set(tmp.x, tmp.y, root.position.z + 30)
      const len = f.kind === 'hero' ? s.sword.reach * 0.66 : 36
      const ang = face > 0 ? p.psi : Math.PI - p.psi
      i.weapon.rotation.set(0, 0, ang)
      i.weapon.scale.setScalar(len * f.scale)
      i.weapon.visible = root.visible && !(f.dead && f.deadT > 0.6)
      if (i.blade && f.kind === 'hero') (i.blade.material as THREE.MeshToonMaterial).color.set(s.sword.color)
    }
    void Y
  }

  dispose() {
    for (const uid of [...this.insts.keys()]) this.drop(uid)
    this.renderer?.dispose()
  }
}

/** Kinds that have a 3D cast entry (for tests and the dojo toggle). */
export const kindsIn3D = () => Object.keys(CAST3D) as (FoeKind | 'hero')[]
