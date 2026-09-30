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
import type { Model } from './chars'

/** Per-character fit: height in tiles, extra yaw (radians) if the mesh faces the wrong way. */
const FIT: Record<string, { h: number; yaw?: number; float?: boolean }> = {
  mage: { h: 1.55 },
  fude: { h: 0.85, float: true },
  elder: { h: 1.4 },
  merchant: { h: 1.45 },
  guard: { h: 1.6 },
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

/** A fresh animated instance of a loaded GLB character (null if not ready). */
export function glbModel(id: string): Model | null {
  const tpl = templates.get(id)
  if (!tpl) return null
  const root = new THREE.Group()
  const body = tpl.clone(true)
  root.add(body)
  const inner = body.children[0] as THREE.Group
  const h = tpl.userData.height as number
  const float = !!FIT[id]?.float
  return {
    root,
    shadow: Math.min(1.1, (tpl.userData.width as number) * 0.9),
    height: h,
    update(phase, moving, run, t) {
      if (float) {
        inner.position.y = Math.sin(t * 2) * 0.05
        inner.rotation.z = Math.sin(t * 1.6) * 0.06
        inner.rotation.x = moving ? 0.2 : 0
        return
      }
      const s = Math.sin(phase * Math.PI)
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
