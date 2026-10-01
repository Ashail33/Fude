/**
 * Generated 3D props (trees, lanterns, wells, chests…) loaded from
 * public/props. Each GLB becomes one merged, normalised geometry (bottom
 * centre at the origin, sized to its tile) and a toon material, so the
 * diorama can stamp hundreds of trees as instanced meshes. Tiles without a
 * generated model keep the built-in smooth prop.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { TileId } from '../../art/tiles'

/** Size limits in tiles: tallest point and widest footprint. */
const FIT: Partial<Record<TileId, { h: number; w: number; sway?: number }>> = {
  tree: { h: 1.75, w: 1.45, sway: 0.035 },
  pine: { h: 2.0, w: 1.3, sway: 0.025 },
  sakura: { h: 1.75, w: 1.55, sway: 0.035 },
  bamboo: { h: 1.9, w: 0.95, sway: 0.05 },
  bush: { h: 0.75, w: 1.0, sway: 0.03 },
  rock: { h: 0.45, w: 0.7 },
  boulder: { h: 0.95, w: 1.1 },
  stump: { h: 0.5, w: 0.8 },
  lantern: { h: 1.1, w: 0.6 },
  sign: { h: 1.0, w: 0.9 },
  well: { h: 1.45, w: 1.1 },
  torii: { h: 1.7, w: 1.4 },
  statue: { h: 1.05, w: 0.8 },
  stall: { h: 0.85, w: 1.2 },
  barrel: { h: 0.7, w: 0.6 },
  crate: { h: 0.6, w: 0.7 },
  pot: { h: 0.6, w: 0.55 },
  chest: { h: 0.6, w: 0.8 },
  'chest-open': { h: 0.75, w: 0.8 },
  campfire: { h: 0.7, w: 0.8 },
  anvil: { h: 0.7, w: 0.8 },
  tablet: { h: 1.2, w: 0.8 },
  altar: { h: 0.9, w: 1.1 },
  throne: { h: 1.7, w: 1.2 },
  'shrine-bell': { h: 1.6, w: 0.9 },
}
/** Scenery that gets a random turn and size per cell, so forests don't look stamped. */
export const NATURAL = new Set<TileId>(['tree', 'pine', 'sakura', 'bamboo', 'bush', 'rock', 'boulder', 'stump'])

export interface PropAsset {
  geometry: THREE.BufferGeometry
  material: THREE.Material
}

/** Shared clock for prop sway (the renderer advances it each frame). */
export const propTime = { value: 0 }

let available: Set<string> | null = null
let listing: Promise<void> | null = null
const assets = new Map<string, PropAsset | null>()
const loading = new Map<string, Promise<void>>()
let loader: GLTFLoader | null = null

const base = () => import.meta.env?.BASE_URL ?? '/'

function list(): Promise<void> {
  listing ??= fetch(`${base()}props/available.json`, { cache: 'no-cache' })
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

function material(map: THREE.Texture | null, sway: number): THREE.Material {
  const m = new THREE.MeshToonMaterial({ map, gradientMap: toonGradient() })
  // the same soft fill as the characters, so shadowed sides don't go muddy
  m.emissive = new THREE.Color(0.16, 0.16, 0.16)
  if (map) m.emissiveMap = map
  if (sway > 0) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = propTime
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          vec4 swW = modelMatrix * vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            swW = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
          #endif
          float k = ${sway.toFixed(3)} * transformed.y * transformed.y;
          transformed.x += (sin(uTime * 1.3 + swW.x * 0.7 + swW.z * 0.45) * 0.8 + sin(uTime * 2.9 + swW.x * 1.9) * 0.25) * k;
          transformed.z += sin(uTime * 1.1 + swW.x * 0.5) * k * 0.3;
        }`,
      )
    }
    m.customProgramCacheKey = () => `prop-sway-${sway}`
  }
  return m
}

/** Merge a loaded scene into one geometry, sized and seated for its tile. */
function prepare(id: TileId, scene: THREE.Object3D): PropAsset | null {
  const fit = FIT[id] ?? { h: 1, w: 1 }
  scene.updateMatrixWorld(true)
  const geos: THREE.BufferGeometry[] = []
  let map: THREE.Texture | null = null
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const g = mesh.geometry.clone()
    g.applyMatrix4(mesh.matrixWorld)
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k)
    if (!g.getAttribute('normal')) g.computeVertexNormals()
    geos.push(g.index ? g : g.toNonIndexed())
    const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
    map ??= mat.map ?? null
  })
  if (!geos.length) return null
  const geometry = geos.length === 1 ? geos[0] : mergeGeometries(geos)
  if (!geometry) return null
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const size = box.getSize(new THREE.Vector3())
  const k = Math.min(fit.h / Math.max(1e-6, size.y), fit.w / Math.max(1e-6, size.x, size.z))
  const c = box.getCenter(new THREE.Vector3())
  geometry.translate(-c.x, -box.min.y, -c.z)
  geometry.scale(k, k, k)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return { geometry, material: material(map, fit.sway ?? 0) }
}

/** Start loading generated models for these tiles; resolves when all have settled. */
export function requestProps(ids: Iterable<TileId>): Promise<void> {
  const want = [...new Set(ids)].filter((id) => FIT[id])
  return list().then(() =>
    Promise.all(
      want.map((id) => {
        if (assets.has(id)) return
        if (!available?.has(id)) {
          assets.set(id, null)
          return
        }
        let p = loading.get(id)
        if (!p) {
          loader ??= new GLTFLoader()
          p = loader
            .loadAsync(`${base()}props/${id}.glb`)
            .then((gltf) => void assets.set(id, prepare(id, gltf.scene)))
            .catch((err) => {
              console.warn('[props] failed to load', id, err)
              assets.set(id, null)
            })
          loading.set(id, p)
        }
        return p
      }),
    ).then(() => undefined),
  )
}

/** The loaded generated model for a tile, or null (use the built-in prop). */
export function propAsset(id: TileId): PropAsset | null {
  return assets.get(id) ?? null
}
