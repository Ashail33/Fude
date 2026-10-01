/**
 * 3D magic and edges of the world:
 *  - exit curtains: a soft light across every way out of a map, warm and
 *    inviting when open, a violet rune barrier while it's locked;
 *  - the magic circle (warp-circle) and the swirling portal;
 *  - the outskirts: the terrain carries on past the map's edge and outdoor
 *    maps sit inside a ring of trees that thins into the distance.
 * Shaders run off the shared prop clock, so no textures are needed.
 */
import * as THREE from 'three'
import type { TileId } from '../art/tiles'
import type { Exit, GameMap } from '../world/types'
import { rnd } from './models/kit'
import { NATURAL, propAsset, propTime } from './models/propglb'

const NOISE = `
  float fxh(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float fxn(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(fxh(i), fxh(i + vec2(1.0, 0.0)), f.x), mix(fxh(i + vec2(0.0, 1.0)), fxh(i + vec2(1.0, 1.0)), f.x), f.y); }
`

// ─── exit curtains ────────────────────────────────────────────────
function curtainMaterial(locked: { value: number }): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: propTime, uLocked: locked },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv; varying vec3 vW;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform float uTime; uniform float uLocked;
      varying vec2 vUv; varying vec3 vW;
      ${NOISE}
      void main() {
        float along = vW.x + vW.z;
        float y = vUv.y;
        // fade out at the ends of the opening and towards the top
        float ends = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        // open: warm light rising off the ground, drifting motes
        float rise = fxn(vec2(along * 3.0, y * 3.0 - uTime * 0.6)) * 0.6 + fxn(vec2(along * 7.0, y * 6.0 - uTime * 1.1)) * 0.4;
        float open = pow(1.0 - y, 2.2) * (0.35 + 0.65 * rise);
        vec2 mc = vec2(along * 9.0, y * 9.0 - uTime * 0.8);
        float mote = step(0.93, fxh(floor(mc))) * smoothstep(0.35, 0.0, length(fract(mc) - 0.5)) * (1.0 - y);
        vec3 warm = vec3(1.0, 0.82, 0.5) * open * 0.55 + vec3(1.0, 0.95, 0.75) * mote * 0.9;
        // locked: a violet barrier with a fine diagonal rune lattice that pulses
        vec2 d = vec2(along + y, along - y) * 3.2;
        vec2 dc = abs(fract(d) - 0.5);
        float lattice = smoothstep(0.035, 0.0, abs(min(dc.x, dc.y)));
        float node = smoothstep(0.12, 0.0, length(dc - 0.5)) ;
        float rune = step(0.8, fxh(floor(d) + floor(uTime * 0.6))) * smoothstep(0.22, 0.05, length(fract(d) - 0.5));
        float pulse = 0.6 + 0.4 * sin(uTime * 2.4 + along * 1.7 - y * 2.0);
        float wave = smoothstep(0.1, 0.0, abs(fract(y * 0.9 - uTime * 0.3) - 0.5) - 0.4);
        float body = (0.12 + 0.12 * fxn(vec2(along * 2.0, y * 2.0 + uTime * 0.4))) * smoothstep(1.0, 0.5, y);
        float fadeUp = smoothstep(1.0, 0.45, y);
        vec3 bar = (vec3(0.55, 0.32, 1.0) * (body + (lattice * 0.5 + node * 0.6) * pulse * fadeUp + wave * 0.18) + vec3(0.9, 0.75, 1.0) * rune * 0.7 * fadeUp);
        vec3 col = mix(warm, bar, uLocked) * ends;
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
}

export interface Curtain {
  mesh: THREE.Mesh
  cells: Exit[]
  locked: { value: number }
}

/** Exit tiles that are a building's own doorway or stairs need no curtain. */
const DOORWAY = new Set<TileId>(['door', 'noren', 'stairs-up', 'stairs-down', 'cave', 'wall', 'wall-window'])

/** A light curtain across each way out of the map (grouped per opening). */
export function buildCurtains(m: GameMap): Curtain[] {
  const W = m.w
  const H = m.h
  const cells = [...m.exits.values()].filter((e) => !DOORWAY.has(m.obj[e.y * W + e.x] as TileId))
  const used = new Set<number>()
  const out: Curtain[] = []
  for (const e of cells) {
    const k = e.y * W + e.x
    if (used.has(k)) continue
    // which edge it leaves by (inner exits face south)
    const dW = e.x
    const dE = W - 1 - e.x
    const dN = e.y
    const dS = H - 1 - e.y
    const near = Math.min(dW, dE, dN, dS)
    const side = near > 2 ? 'S' : near === dS ? 'S' : near === dN ? 'N' : near === dW ? 'W' : 'E'
    const horiz = side === 'N' || side === 'S'
    // the run of exit cells to the same place along that edge
    const run = [e]
    used.add(k)
    const step = horiz ? [1, 0] : [0, 1]
    for (const dir of [-1, 1]) {
      let x = e.x + step[0] * dir
      let y = e.y + step[1] * dir
      for (;;) {
        const n = cells.find((c) => c.x === x && c.y === y && c.to === e.to)
        if (!n) break
        used.add(y * W + x)
        run.push(n)
        x += step[0] * dir
        y += step[1] * dir
      }
    }
    const xs = run.map((c) => c.x)
    const ys = run.map((c) => c.y)
    const a0 = horiz ? Math.min(...xs) : Math.min(...ys)
    const a1 = (horiz ? Math.max(...xs) : Math.max(...ys)) + 1
    const len = a1 - a0 + 0.6
    // a curtain facing the camera stays low so it doesn't hide the view
    const h = side === 'S' ? 1.3 : 2.0
    const g = new THREE.PlaneGeometry(len, h)
    g.translate(0, h / 2, 0)
    const locked = { value: 0 }
    const mesh = new THREE.Mesh(g, curtainMaterial(locked))
    mesh.renderOrder = 5
    // stand it on the edge of the exit cells
    const mid = (a0 + a1) / 2
    if (horiz) mesh.position.set(mid, 0, side === 'N' ? e.y + 0.2 : e.y + 0.85)
    else {
      mesh.position.set(side === 'W' ? e.x + 0.2 : e.x + 0.8, 0, mid)
      mesh.rotation.y = Math.PI / 2
    }
    out.push({ mesh, cells: run, locked })
  }
  return out
}

// ─── magic circle and portal ─────────────────────────────────────
let circleMat: THREE.ShaderMaterial | null = null
let portalMat: THREE.ShaderMaterial | null = null
let circleGeo: THREE.BufferGeometry | null = null
let portalGeo: THREE.BufferGeometry | null = null

const flatVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

/** A glowing rune circle on the ground (the warp-circle tile). */
export function magicCircle(): { geometry: THREE.BufferGeometry; material: THREE.Material } {
  circleGeo ??= new THREE.PlaneGeometry(1.25, 1.25).rotateX(-Math.PI / 2).translate(0, 0.03, 0)
  circleMat ??= new THREE.ShaderMaterial({
    uniforms: { uTime: propTime },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: flatVert,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float a = atan(p.y, p.x);
        float ring = smoothstep(0.03, 0.0, abs(r - 0.92)) + smoothstep(0.02, 0.0, abs(r - 0.78)) + smoothstep(0.015, 0.0, abs(r - 0.42));
        // runes between the rings turn slowly
        float ra = a + uTime * 0.35;
        float runes = step(0.55, fxh(vec2(floor(ra * 24.0 / 6.2832), 3.0))) * smoothstep(0.05, 0.0, abs(r - 0.85)) * step(0.3, fract(ra * 24.0 / 6.2832));
        // a six-pointed star counter-rotating inside
        float sa = a - uTime * 0.25;
        float star = smoothstep(0.02, 0.0, abs(r * cos(mod(sa, 1.0472) - 0.5236) - 0.39)) * step(r, 0.78);
        float glow = smoothstep(1.0, 0.0, r) * 0.18;
        float pulse = 0.75 + 0.25 * sin(uTime * 2.0);
        float fill = smoothstep(0.95, 0.2, r) * (0.10 + 0.06 * fxn(p * 4.0 + uTime * 0.3));
        vec3 col = vec3(0.5, 0.9, 1.0) * (ring + runes * 0.9 + star * 0.8) * pulse * 2.2 + vec3(0.3, 0.6, 1.0) * (glow + fill);
        gl_FragColor = vec4(col * step(r, 1.0), 1.0);
      }`,
  })
  return { geometry: circleGeo, material: circleMat }
}

/** A standing swirl of light in a glowing rim (the portal tile). */
export function portalSwirl(): { geometry: THREE.BufferGeometry; material: THREE.Material } {
  portalGeo ??= new THREE.PlaneGeometry(1.15, 1.6).translate(0, 0.85, 0)
  portalMat ??= new THREE.ShaderMaterial({
    uniforms: { uTime: propTime },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: flatVert,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 p = (vUv * 2.0 - 1.0) * vec2(1.0, 1.0);
        float r = length(p);
        float a = atan(p.y, p.x);
        float sw = a + r * 5.0 - uTime * 2.2;
        float arms = 0.5 + 0.5 * sin(sw * 3.0);
        float n = fxn(vec2(sw * 1.5, r * 6.0 - uTime));
        float inner = smoothstep(0.95, 0.1, r) * (0.35 + 0.65 * arms * n);
        float rim = smoothstep(0.08, 0.0, abs(r - 0.92)) * (0.8 + 0.2 * sin(a * 8.0 + uTime * 3.0));
        float core = smoothstep(0.35, 0.0, r);
        vec3 col = vec3(0.55, 0.3, 1.0) * inner + vec3(0.85, 0.65, 1.0) * rim + vec3(1.0, 0.9, 1.0) * core * 0.6;
        gl_FragColor = vec4(col * step(r, 1.0), 1.0);
      }`,
  })
  return { geometry: portalGeo, material: portalMat }
}

/** The 3D effect for a magic tile, if it has one. */
export function magicFx(id: TileId): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  return id === 'warp-circle' ? magicCircle() : id === 'portal' ? portalSwirl() : null
}

// ─── outskirts ───────────────────────────────────────────────────
/** How far the world carries on past the map's edge (tiles). */
export const MARGIN = 12

/**
 * A ring of the map's own trees around an outdoor map, densest at the edge
 * and thinning outwards, with a clear way out in front of each exit.
 */
export function buildOutskirts(m: GameMap): THREE.InstancedMesh[] {
  if (m.spec.interior) return []
  const W = m.w
  const H = m.h
  // the map's own scenery, most common first
  const tally = new Map<TileId, number>()
  for (const id of m.obj) if (id && NATURAL.has(id) && id !== 'stump' && id !== 'rock' && propAsset(id)) tally.set(id, (tally.get(id) ?? 0) + 1)
  const kinds = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  if (!kinds.length) return []
  const trees = kinds.filter((k) => k !== 'bush').slice(0, 2)
  const pick = trees.length ? trees : kinds.slice(0, 1)
  const fill: TileId[] = propAsset('bush') ? [...pick, 'bush'] : pick
  // keep a corridor clear in front of every exit on the edge
  const exits = [...m.exits.values()]
  const blocked = (x: number, y: number) =>
    exits.some((e) => {
      if (e.x === 0 && x < 0) return Math.abs(y - e.y - 0.5) < 2.2
      if (e.x === W - 1 && x > W) return Math.abs(y - e.y - 0.5) < 2.2
      if (e.y === 0 && y < 0) return Math.abs(x - e.x - 0.5) < 2.2
      if (e.y === H - 1 && y > H) return Math.abs(x - e.x - 0.5) < 2.2
      return false
    })
  const placed = new Map<string, THREE.Matrix4[]>()
  const q = new THREE.Quaternion()
  const yAxis = new THREE.Vector3(0, 1, 0)
  const STEP = 1.25
  for (let gy = -MARGIN; gy < H + MARGIN; gy += STEP)
    for (let gx = -MARGIN; gx < W + MARGIN; gx += STEP) {
      const ix = Math.round(gx * 4)
      const iy = Math.round(gy * 4)
      const x = gx + (rnd(ix, iy, 1) - 0.5) * 0.9
      const y = gy + (rnd(iy, ix, 2) - 0.5) * 0.9
      const out = Math.max(-x, x - W, -y, y - H)
      if (out < 0.4) continue
      // dense at the edge, thinning into the distance
      if (rnd(ix, iy, 3) > 0.95 - out * 0.035) continue
      if (blocked(x, y)) continue
      const id = out < 1.8 && rnd(ix, iy, 4) < 0.3 ? fill[fill.length - 1] : pick[Math.floor(rnd(ix, iy, 5) * pick.length)]
      const s = (id === 'bush' ? 0.9 : 1.0) * (0.85 + rnd(ix, iy, 6) * 0.35)
      const ck = `${id}|${Math.floor((x + MARGIN) / 10)},${Math.floor((y + MARGIN) / 10)}`
      let list = placed.get(ck)
      if (!list) placed.set(ck, (list = []))
      q.setFromAxisAngle(yAxis, rnd(ix, iy, 7) * Math.PI * 2)
      list.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, y), q, new THREE.Vector3(s, s, s)))
    }
  const meshes: THREE.InstancedMesh[] = []
  for (const [ck, list] of placed) {
    const pa = propAsset(ck.slice(0, ck.indexOf('|')) as TileId)!
    const mesh = new THREE.InstancedMesh(pa.geometry, pa.material, list.length)
    list.forEach((mx, i) => mesh.setMatrixAt(i, mx))
    mesh.computeBoundingSphere()
    mesh.receiveShadow = true
    mesh.userData.shared = true
    mesh.userData.scenery = true
    meshes.push(mesh)
  }
  return meshes
}
