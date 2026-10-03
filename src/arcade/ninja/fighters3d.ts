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
import type { ArmorDef, ArmorId, FoeKind } from './data'
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
  // The hero's model is his alone: no foe borrows it.
  hero: { id: 'ninja', weapon: 'sword' },
  thrower: { id: 'sailor', tint: '#9aa77a', weapon: 'sword', steel: '#cfd8dc' },
  assassin: { id: 'karakuri', tint: '#c9a0e6', weapon: 'sword', steel: '#e0e0e0' },
  // Kage and his shadow clones: Nurarihyon's model in deep violet (the clones see-through)
  kage: { id: 'nurarihyon', tint: '#7a5aa8', glow: '#2a1240', weapon: 'sword', steel: '#e0d4ff' },
  shade: { id: 'nurarihyon', tint: '#9a6be0', glow: '#4a2a80', opacity: 0.65, weapon: 'sword', steel: '#c9b6ff' },
  // the Quiet: the mountain witch's model, drained to ink
  quiet: { id: 'yamanba', tint: '#3a3048', glow: '#4b2d7a', weapon: 'sword', steel: '#b388ff' },
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

// ─── The hero's armour, worn on the 3D model ─────────────────────────────

type Piece = 'chest' | 'pauldrons' | 'bigPauldrons' | 'skirt' | 'shell' | 'cape' | 'robe' | 'scarf'

/** What each armour adds to the model (pieces in its colour) and how it tints the cloth. */
const ARMOUR_LOOK: Record<ArmorId, { pieces: Piece[]; tint?: string; color?: string; scarf?: string }> = {
  gi: { pieces: [] },
  kusari: { pieces: [], tint: '#2a2f36' },
  lacquer: { pieces: ['chest', 'pauldrons'] },
  oyoroi: { pieces: ['chest', 'bigPauldrons', 'skirt'] },
  'monk-robe': { pieces: ['robe'], tint: '#3a3428' },
  'oni-hide': { pieces: ['chest', 'pauldrons'], tint: '#2a0806' },
  'tengu-cloak': { pieces: ['cape'], color: '#1b1f1c' },
  'kage-garb': { pieces: ['scarf'], tint: '#1c0e2e', scarf: '#7c4dbd' },
  'kappa-shell': { pieces: ['shell'] },
  'frost-mail': { pieces: ['chest', 'bigPauldrons', 'skirt', 'scarf'], tint: '#14222c', scarf: '#ffffff' },
  'tennin-robe': { pieces: ['robe', 'scarf'], tint: '#2e2430', scarf: '#f8bbd0' },
  'dragon-armour': { pieces: ['chest', 'bigPauldrons', 'skirt'], tint: '#2a1e04' },
}

interface Worn {
  piece: Piece
  mesh: THREE.Object3D
}

function armourMeshes(a: ArmorDef): Worn[] {
  const look = ARMOUR_LOOK[a.id] ?? { pieces: [] }
  const color = look.color ?? a.color
  const mat = (c: string, opts: Partial<THREE.MeshToonMaterialParameters> = {}) => new THREE.MeshToonMaterial({ color: c, emissive: new THREE.Color(c).multiplyScalar(0.18), ...opts })
  const out: Worn[] = []
  for (const piece of look.pieces) {
    let mesh: THREE.Object3D
    if (piece === 'chest') mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(color))
    else if (piece === 'pauldrons' || piece === 'bigPauldrons') {
      const g = new THREE.Group()
      for (const side of [-1, 1]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(color))
        m.userData.side = side
        g.add(m)
      }
      mesh = g
    } else if (piece === 'skirt') mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 1, 8, 1, true), mat(new THREE.Color(color).multiplyScalar(0.8).getStyle(), { side: THREE.DoubleSide }))
    else if (piece === 'shell') mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), mat('#2e6b46'))
    else if (piece === 'cape') mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 4), mat(color, { side: THREE.DoubleSide }))
    else if (piece === 'robe') mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1, 10, 1, true), mat(color, { side: THREE.DoubleSide }))
    else mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(look.scarf ?? '#ffffff'))
    out.push({ piece, mesh })
  }
  return out
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
  /** The hero's armour pieces (placed from the bones each frame). */
  worn: Worn[]
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
  /** One model per fighter object (never by id: ids restart every fight). (public for dev checks) */
  readonly insts = new Map<Fighter, Inst>()
  /** Models that loaded without a usable skeleton (they stay stick figures). */
  private rigless = new Set<string>()
  /** Fighters drawn in 3D this frame (draw.ts skips their stick bodies). */
  readonly drawn = new Set<Fighter>()

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

  private make(s: Sim, f: Fighter, cast: Cast): Inst | null {
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
        // the hero's cloth takes on his armour's colour
        const at = f.kind === 'hero' ? ARMOUR_LOOK[s.armor.id]?.tint : undefined
        if (at) c.emissive.add(new THREE.Color(at))
        mats.push({ m: c, emissive: c.emissive.clone() })
        return c
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material)
      mesh.frustumCulled = false
    })
    const w = weaponMesh(cast.weapon, cast.steel ?? '#dfe6ee')
    if (w) this.scene.add(w.g)
    this.scene.add(g.root)
    const worn = f.kind === 'hero' ? armourMeshes(s.armor) : []
    for (const p of worn) this.scene.add(p.mesh)
    return { fighter: f, root: g.root, inner: g.inner, rig: g.rig, height: g.height, mats, weapon: w?.g ?? null, blade: w?.blade ?? null, cast, worn }
  }

  private drop(f: Fighter) {
    const i = this.insts.get(f)
    if (!i) return
    this.scene.remove(i.root)
    if (i.weapon) this.scene.remove(i.weapon)
    for (const p of i.worn) this.scene.remove(p.mesh)
    for (const { m } of i.mats) m.dispose()
    this.insts.delete(f)
  }

  /**
   * Pose and render every 3D fighter. `toScreen` maps sim x/y to logical
   * canvas coordinates; `poseOf` is draw.ts's pose for a fighter.
   */
  render(s: Sim, cam: number, vw: number, vh: number, gy: number, pxW: number, pxH: number, poseOf: (f: Fighter) => Pose, sky: string, enabled: boolean): HTMLCanvasElement | null {
    this.drawn.clear()
    const r = this.renderer
    if (!r || !enabled) return null
    const live = new Set<Fighter>()
    const all = [...s.foes, s.hero]
    for (const f of all) {
      const cast = CAST3D[f.kind]
      if (!cast) continue
      let inst = this.insts.get(f)
      if (!inst) {
        const made = this.make(s, f, cast)
        if (!made) continue
        inst = made
        this.insts.set(f, inst)
      }
      live.add(f)
      this.drawn.add(f)
      this.poseOne(s, inst, poseOf(f), cam, vh, gy)
    }
    // (fighters gone from the fight, or from a fight that's over)
    for (const f of [...this.insts.keys()]) if (!live.has(f)) this.drop(f)
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

    // Legs: a fighting stance, a run cycle, a tuck in the air, a crouch.
    if (f.crouch && !air) {
      rig.turn('lUp', X, -1.35)
      rig.turn('lLeg', X, 2.0)
      rig.turn('rUp', X, -0.15)
      rig.turn('rLeg', X, 1.75)
      inner.position.y = -0.42
    } else if (air) {
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
    rig.turn('spine', X, p.lean * 0.9 + (moving ? 0.2 : 0) + (f.crouch ? 0.15 : 0))
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
    } else {
      root.rotation.z = 0
      for (const { m } of i.mats) {
        m.transparent = i.cast.opacity !== undefined
        m.opacity = i.cast.opacity ?? 1
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

    if (i.worn.length) this.wear(i)
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

  /** Put the hero's armour pieces on his body: from the bones, along his spine, facing his way. */
  private wear(i: Inst) {
    const f = i.fighter
    const { rig, root } = i
    root.updateMatrixWorld(true)
    const H = FIG_H * f.scale
    const at = (k: Parameters<Rig['joint']>[0], fallback: THREE.Vector3) => {
      const b = rig.joint(k)
      return b ? b.getWorldPosition(new THREE.Vector3()) : fallback
    }
    const base = root.position.clone()
    const hip = at('hips', base.clone().add(new THREE.Vector3(0, H * 0.5, 0)))
    const neck = at('neck', at('head', hip.clone().add(new THREE.Vector3(0, H * 0.35, 0))))
    const up = neck.clone().sub(hip)
    const len = Math.max(1, up.length())
    up.divideScalar(len)
    const yaw = root.rotation.y
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
    const right = new THREE.Vector3().crossVectors(up, fwd).normalize()
    const fw = new THREE.Vector3().crossVectors(right, up).normalize()
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fw))
    const along = (u: number, f2 = 0, r = 0) => hip.clone().addScaledVector(up, len * u).addScaledVector(fw, H * f2).addScaledVector(right, H * r)
    const t = f.age
    for (const { piece, mesh } of i.worn) {
      mesh.visible = root.visible && !(f.dead && f.deadT > 0.6)
      mesh.quaternion.copy(q)
      mesh.position.set(0, 0, 0)
      mesh.scale.setScalar(1)
      if (piece === 'chest') {
        mesh.position.copy(along(0.62, 0.035))
        mesh.scale.set(H * 0.24, len * 0.62, H * 0.15)
      } else if (piece === 'pauldrons' || piece === 'bigPauldrons') {
        const big = piece === 'bigPauldrons' ? 1.35 : 1
        for (const c of mesh.children) {
          const side = c.userData.side as number
          const arm = at(side < 0 ? 'lArm' : 'rArm', along(0.92, 0, side * 0.14))
          // children are placed in world terms: undo the group's own transform
          c.position.copy(arm.addScaledVector(up, H * 0.015)).sub(mesh.position)
          c.position.applyQuaternion(q.clone().invert())
          c.scale.set(H * 0.13 * big, H * 0.045 * big, H * 0.13 * big)
        }
      } else if (piece === 'skirt') {
        mesh.position.copy(along(-0.05))
        mesh.scale.set(H * 0.28, H * 0.13, H * 0.2)
      } else if (piece === 'shell') {
        mesh.position.copy(along(0.55, -0.1))
        mesh.scale.set(H * 0.3, len * 0.95, H * 0.12)
      } else if (piece === 'cape') {
        mesh.position.copy(along(0.35, -0.1))
        mesh.scale.set(H * 0.28, len * 1.2, 1)
        mesh.rotateX(-0.25 - Math.min(1, Math.abs(f.vx) / 250) * 0.5 - Math.sin(t * 6) * 0.05)
      } else if (piece === 'robe') {
        mesh.position.copy(along(-0.1))
        mesh.scale.set(H * 0.3, H * 0.38, H * 0.24)
      } else if (piece === 'scarf') {
        mesh.position.copy(along(1.0, -0.12))
        mesh.scale.set(H * 0.035, H * 0.035, H * 0.32)
        mesh.rotateX(0.35 + Math.sin(t * 9) * 0.15)
      }
    }
  }

  /** Forget every model (a new fight is starting). */
  clear() {
    for (const f of [...this.insts.keys()]) this.drop(f)
  }

  dispose() {
    for (const f of [...this.insts.keys()]) this.drop(f)
    this.renderer?.dispose()
  }
}

/** Kinds that have a 3D cast entry (for tests and the dojo toggle). */
export const kindsIn3D = () => Object.keys(CAST3D) as (FoeKind | 'hero')[]
