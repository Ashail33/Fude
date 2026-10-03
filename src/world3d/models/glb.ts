/**
 * Generated 3D characters (Higgsfield image-to-3D GLBs, fetched at build
 * time into public/models/). Each is normalised to stand on y = 0, facing
 * +Z, at the character's height, re-shaded with the game's toon look, and
 * animated procedurally (walk bob and waddle, run lean, idle breathing),
 * since the generated meshes have no skeleton. Characters without a GLB
 * keep their built-in toy model.
 */
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { Model } from './chars'

/** Per-character fit: height in tiles, extra yaw (radians) if the mesh faces the wrong way. */
const FIT: Record<string, { h: number; yaw?: number; float?: boolean; quad?: boolean }> = {
  // (the mage mesh is turned to face +Z at build time: art-src/models.json "turn")
  mage: { h: 1.55 },
  fude: { h: 0.85, float: true },
  elder: { h: 1.4 },
  merchant: { h: 1.45 },
  guard: { h: 1.6 },
  priest: { h: 1.5 },
  king: { h: 1.6 },
  innkeeper: { h: 1.45 },
  jailer: { h: 1.55 },
  'villager-a': { h: 1.45 },
  'villager-b': { h: 1.45 },
  child: { h: 1.1 },
  oni: { h: 2.1 },
  tanuki: { h: 1.0 },
  golem: { h: 1.6 },
  treant: { h: 1.9 },
  dragon: { h: 2.4 },
  wisp: { h: 0.8, float: true },
  // four-legged: a trotting rock instead of a waddle
  kitsune: { h: 0.95, quad: true },
  cat: { h: 0.55, quad: true },
  dog: { h: 0.7, quad: true },
  fox: { h: 0.65, quad: true },
  // region packs (rigged: Meshy auto-rig, posed by the bone animation below)
  fisher: { h: 1.45 },
  sailor: { h: 1.55 },
  okami: { h: 1.45 },
  samurai: { h: 1.55 },
  lady: { h: 1.45 },
  monk: { h: 1.35 },
  snowchild: { h: 1.0 },
  tennin: { h: 1.5 },
  scholar: { h: 1.5 },
  yamanba: { h: 1.7 },
  karakuri: { h: 1.4 },
  nurarihyon: { h: 1.6 },
  'yuki-onna': { h: 1.8 },
  raijin: { h: 2.0 },
  // Stick Ninja's hero (rigged; posed by arcade/ninja/fighters3d)
  ninja: { h: 1.6 },
}

let available: Set<string> | null = null
let listing: Promise<void> | null = null
const templates = new Map<string, THREE.Group | null>()
const loading = new Map<string, Promise<void>>()
let loader: GLTFLoader | null = null

function base(): string {
  return import.meta.env?.BASE_URL ?? '/'
}

function list(): Promise<void> {
  listing ??= fetch(`${base()}models/available.json`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : []))
    .then((ids: unknown) => {
      available = new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [])
    })
    .catch(() => {
      available = new Set()
    })
  return listing
}

let gradient: THREE.DataTexture | null = null
function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient
  gradient = new THREE.DataTexture(new Uint8Array([165, 165, 170, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat)
  gradient.magFilter = gradient.minFilter = THREE.NearestFilter
  gradient.needsUpdate = true
  return gradient
}

/** Swap PBR materials for toon ones (same textures) so models match the world. */
function toon(src: THREE.Material): THREE.Material {
  const s = src as THREE.MeshStandardMaterial
  const m = new THREE.MeshToonMaterial({ color: s.color ?? new THREE.Color(1, 1, 1), map: s.map ?? null, gradientMap: toonGradient(), transparent: s.transparent, alphaTest: s.alphaTest || 0 })
  // a soft fill so shadowed sides don't go muddy
  m.emissive = new THREE.Color(0.16, 0.16, 0.16)
  if (s.map) m.emissiveMap = s.map
  m.side = s.side
  return m
}

function prepare(id: string, scene: THREE.Group): THREE.Group {
  const fit = FIT[id] ?? { h: 1.4 }
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    mesh.receiveShadow = false
    // some generators (SAM 3D) ship positions and UVs only: lighting needs normals
    if (!mesh.geometry.getAttribute('normal')) mesh.geometry.computeVertexNormals()
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(toon) : toon(mesh.material)
  })
  scene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(scene)
  const size = box.getSize(new THREE.Vector3())
  const k = fit.h / Math.max(1e-6, size.y)
  const inner = new THREE.Group()
  inner.add(scene)
  scene.scale.setScalar(k)
  const c = box.getCenter(new THREE.Vector3())
  scene.position.set(-c.x * k, -box.min.y * k, -c.z * k)
  scene.rotation.y = fit.yaw ?? 0
  const out = new THREE.Group()
  out.add(inner)
  out.userData.height = fit.h
  out.userData.width = Math.max(size.x, size.z) * k
  return out
}

/** Start loading a character's GLB if one is available (call freely; cached). */
export function requestGlb(id: string): void {
  if (templates.has(id) || loading.has(id)) return
  const p = list().then(async () => {
    if (!available?.has(id)) {
      templates.set(id, null)
      return
    }
    if (!loader) {
      loader = new GLTFLoader()
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      loader.setDRACOLoader(draco)
    }
    try {
      const gltf = await loader.loadAsync(`${base()}models/${id}.glb`)
      templates.set(id, prepare(id, gltf.scene))
    } catch (err) {
      console.warn('[models] failed to load', id, err)
      templates.set(id, null)
    }
  })
  loading.set(id, p)
}

/** Whether a loaded GLB template is ready for this character. */
export function glbReady(id: string): boolean {
  requestGlb(id)
  return !!templates.get(id)
}

/** A loaded character's template height (tiles), or 0 when not loaded. */
export const glbHeight = (id: string) => (templates.get(id)?.userData.height as number | undefined) ?? 0

/** A fresh posable instance of a rigged GLB character: null if not loaded or not rigged. */
export function glbRigged(id: string): { root: THREE.Group; inner: THREE.Group; rig: Rig; height: number } | null {
  const tpl = templates.get(id)
  if (!tpl) return null
  const root = new THREE.Group()
  const body = cloneSkinned(tpl) as THREE.Group
  root.add(body)
  const inner = body.children[0] as THREE.Group
  const rig = makeRig(inner)
  if (!rig) return null
  return { root, inner, rig, height: tpl.userData.height as number }
}

/** A fresh animated instance of a loaded GLB character (null if not ready). */
export function glbModel(id: string): Model | null {
  const tpl = templates.get(id)
  if (!tpl) return null
  const root = new THREE.Group()
  const body = cloneSkinned(tpl) as THREE.Group
  root.add(body)
  const inner = body.children[0] as THREE.Group
  const h = tpl.userData.height as number
  const float = !!FIT[id]?.float
  const quad = !!FIT[id]?.quad
  const rig = makeRig(inner)
  return {
    root,
    shadow: Math.min(1.1, (tpl.userData.width as number) * 0.9),
    height: h,
    update(phase, moving, run, t, talking = false) {
      if (rig) {
        rig.pose(phase, moving, run, t, talking)
        const s = Math.sin(phase * Math.PI)
        inner.position.y = moving ? Math.abs(s) * (run ? 0.04 : 0.025) : 0
        return
      }
      if (float) {
        inner.position.y = Math.sin(t * 2) * 0.05
        inner.rotation.z = Math.sin(t * 1.6) * 0.06
        inner.rotation.x = moving ? 0.2 : 0
        return
      }
      const s = Math.sin(phase * Math.PI)
      if (quad) {
        // trotting: a quick bob with a nose-to-tail rock
        inner.position.y = moving ? Math.abs(Math.sin(phase * Math.PI * 2)) * (run ? 0.06 : 0.03) : 0
        inner.rotation.x = moving ? Math.sin(phase * Math.PI * 2) * (run ? 0.1 : 0.06) : 0
        inner.rotation.z = 0
        const br = moving ? 0 : Math.sin(t * 3) * 0.015
        inner.scale.set(1 + br * 0.4, 1 + br, 1 + br * 0.4)
        return
      }
      // walking: a hop per step, a side-to-side waddle, and a forward lean when running
      inner.position.y = moving ? Math.abs(s) * (run ? 0.07 : 0.045) : 0
      inner.rotation.z = moving ? s * (run ? 0.07 : 0.09) : 0
      inner.rotation.x = moving ? (run ? 0.18 : 0.07) : 0
      const br = moving ? 0 : Math.sin(t * 2.4) * 0.012
      inner.scale.set(1 - br * 0.5, 1 + br, 1 - br * 0.5)
    },
    dispose() {
      // geometry and textures are shared with the cached template
    },
  }
}

// ─── skeleton animation ──────────────────────────────────────────
/** Bone name patterns (Meshy / Mixamo-style rigs, with or without prefixes). */
const BONES = {
  hips: /hips|pelvis/i,
  spine: /spine(?!.*[12])|spine$/i,
  chest: /spine0?2$|spine0?1$|chest/i,
  neck: /neck/i,
  head: /(^|[:_|])head$/i,
  lUp: /left.?up.?leg|l.?thigh|leftupleg/i,
  rUp: /right.?up.?leg|r.?thigh|rightupleg/i,
  lLeg: /left.?leg(?!.*up)|l.?calf|leftleg/i,
  rLeg: /right.?leg(?!.*up)|r.?calf|rightleg/i,
  lArm: /left.?arm(?!.*fore)|l.?upperarm|leftarm/i,
  rArm: /right.?arm(?!.*fore)|r.?upperarm|rightarm/i,
  lFore: /left.?fore.?arm|l.?forearm/i,
  rFore: /right.?fore.?arm|r.?forearm/i,
  lHand: /left.?hand$/i,
  rHand: /right.?hand$/i,
} as const

interface Joint {
  bone: THREE.Bone
  rest: THREE.Quaternion
  /** Parent's rest rotation in model space (to turn model-space axes into bone space). */
  parentQ: THREE.Quaternion
}

const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)
const qa = new THREE.Quaternion()
const qb = new THREE.Quaternion()
/** How far from straight down the lowered arms hang (radians). */
const ARM_HANG = 0.15

export type BoneKey = keyof typeof BONES
export type Rig = NonNullable<ReturnType<typeof makeRig>>

/** Find the named joints of a skinned model; null when it has no usable skeleton. */
export function makeRig(model: THREE.Object3D) {
  const bones: THREE.Bone[] = []
  model.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone)
  })
  if (bones.length < 8) return null
  model.updateMatrixWorld(true)
  const modelInv = new THREE.Quaternion()
  model.getWorldQuaternion(modelInv).invert()
  const joints: Partial<Record<BoneKey, Joint>> = {}
  for (const k of Object.keys(BONES) as BoneKey[]) {
    const b = bones.find((x) => BONES[k].test(x.name) && !Object.values(joints).some((j) => j?.bone === x))
    if (!b) continue
    const parentQ = new THREE.Quaternion()
    if (b.parent) b.parent.getWorldQuaternion(parentQ)
    parentQ.premultiply(modelInv)
    joints[k] = { bone: b, rest: b.quaternion.clone(), parentQ }
  }
  if (!joints.lUp || !joints.rUp) return null
  /**
   * How far to lower an arm from its rest pose so it hangs at the side: rigs
   * rest in anything from a T-pose to arms already down, so measure it.
   */
  const drop = (arm: BoneKey, fore: BoneKey) => {
    const a = joints[arm]?.bone
    const f = joints[fore]?.bone ?? (a?.children.find((c) => (c as THREE.Bone).isBone) as THREE.Bone | undefined)
    if (!a || !f) return 0
    const pa = model.worldToLocal(a.getWorldPosition(new THREE.Vector3()))
    const pf = model.worldToLocal(f.getWorldPosition(new THREE.Vector3()))
    const fromDown = Math.atan2(Math.abs(pf.x - pa.x), pa.y - pf.y)
    return Math.max(0, fromDown - ARM_HANG)
  }
  const lDrop = drop('lArm', 'lFore')
  const rDrop = drop('rArm', 'rFore')
  /** Rotate a joint by `angle` about a model-space axis, relative to its rest pose. */
  const turn = (k: BoneKey, axis: THREE.Vector3, angle: number, add = false) => {
    const j = joints[k]
    if (!j) return
    // L' = P⁻¹ · R(axis, angle) · P · L
    qa.setFromAxisAngle(axis, angle)
    qb.copy(j.parentQ).invert().multiply(qa).multiply(j.parentQ)
    if (add) j.bone.quaternion.premultiply(qb)
    else j.bone.quaternion.copy(qb).multiply(j.rest)
  }
  return {
    turn,
    joint: (k: BoneKey) => joints[k]?.bone,
    lDrop,
    rDrop,
    /** Put every named joint back to its rest pose. */
    reset() {
      for (const j of Object.values(joints)) j?.bone.quaternion.copy(j.rest)
    },
    pose(phase: number, moving: boolean, run: boolean, t: number, talking: boolean) {
      const s = Math.sin(phase * Math.PI)
      const c = Math.cos(phase * Math.PI)
      const amp = moving ? (run ? 0.75 : 0.5) : 0
      // legs swing about the side axis; the back knee bends
      turn('lUp', X, -s * amp)
      turn('rUp', X, s * amp)
      turn('lLeg', X, moving ? Math.max(0, s) * amp * 1.2 : 0)
      turn('rLeg', X, moving ? Math.max(0, -s) * amp * 1.2 : 0)
      // arms: relaxed down at the sides, swinging opposite to the legs
      const idle = Math.sin(t * 2.4)
      const talk = talking ? Math.sin(t * 5.5) : 0
      // rigs rest in an A/T-pose: bring the arms down to the sides first
      turn('lArm', Z, -lDrop)
      turn('rArm', Z, rDrop)
      turn('lArm', X, s * amp * 0.6 + (talking ? 0 : idle * 0.03), true)
      turn('rArm', X, -s * amp * 0.6 - (talking ? 0.55 + talk * 0.25 : 0), true)
      turn('rFore', X, talking ? -0.6 - talk * 0.2 : moving ? -0.25 : -0.08)
      turn('lFore', X, moving ? -0.25 : -0.08)
      // hands keep their rest angle, so held staffs, canes and scrolls stay upright
      turn('lHand', Z, lDrop)
      turn('rHand', Z, -rDrop)
      // body: lean into a run, a little twist with each stride, breathing when idle
      turn('spine', X, moving ? (run ? 0.18 : 0.05) : 0)
      turn('spine', Y, moving ? s * 0.12 : 0, true)
      turn('chest', X, moving ? 0 : idle * 0.02)
      turn('hips', Y, moving ? -s * 0.08 : 0)
      // head: bob with the steps, nod while talking, glance around when idle
      turn('head', X, moving ? c * 0.04 : talking ? Math.sin(t * 3.1) * 0.12 : 0)
      turn('head', Y, moving || talking ? 0 : Math.sin(t * 0.37) * 0.3, true)
      turn('neck', Z, talking ? Math.sin(t * 2.2) * 0.06 : 0)
    },
  }
}
