/**
 * Shared GLB slimming for the build-time model and prop fetches: weld,
 * simplify to a triangle budget and re-encode textures as small JPEGs.
 *
 * Generated meshes are full of UV seams, which stop the regular simplifier
 * well short of its target; when that happens a seam-blind ("sloppy") pass
 * finishes the job. Only the index buffers change, so skinning survives.
 */
export async function slimToBudget(buf, budget, { texture = 512 } = {}) {
  const { NodeIO } = await import('@gltf-transform/core')
  const { dedup, prune, simplify, weld, textureCompress } = await import('@gltf-transform/functions')
  const { MeshoptSimplifier } = await import('meshoptimizer')
  const { default: sharp } = await import('sharp')
  await MeshoptSimplifier.ready
  const io = new NodeIO()
  const doc = await io.readBinary(new Uint8Array(buf))
  const prims = () => doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())
  const tris = () => prims().reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0)
  await doc.transform(dedup(), weld())
  const start = tris()
  if (start > budget) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: budget / start, error: 1 }))
  const mid = tris()
  if (mid > budget * 1.15) {
    for (const p of prims()) {
      const idx = p.getIndices()
      if (!idx) continue
      const ia = new Uint32Array(idx.getArray())
      const pos = new Float32Array(p.getAttribute('POSITION').getArray())
      const want = Math.max(36, Math.floor(((ia.length / 3) * budget) / mid) * 3)
      const [out] = MeshoptSimplifier.simplifySloppy(ia, pos, 3, null, want, 1)
      idx.setArray(new Uint32Array(out))
    }
  }
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [texture, texture], quality: 85 }), prune())
  return { glb: Buffer.from(await io.writeBinary(doc)), from: start, to: tris() }
}
