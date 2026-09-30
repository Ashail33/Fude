/**
 * Dev helpers: render a track offline (same synth as the live player) and
 * export it as WAV. Not imported by the game, so it is tree-shaken away.
 *
 *   const { renderTrackToWav } = await import('/src/engine/audio/render.ts')
 *   const blob = await renderTrackToWav('village')
 */

import { TrackPlayer } from './player'
import { compileTrack, trackSeconds } from './sequence'
import { TRACKS, type TrackId } from './tracks'

/** Music bus gain at full volume (matches music.ts busGain(1) × master 0.9). */
export const FULL_VOLUME_GAIN = 1.2 * 0.9

export async function renderTrack(id: TrackId, opts: { seconds?: number; sampleRate?: number; gain?: number } = {}): Promise<AudioBuffer> {
  const t = compileTrack(TRACKS[id])
  const sampleRate = opts.sampleRate ?? 44100
  const seconds = opts.seconds ?? trackSeconds(t) + 2
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate)
  const bus = ctx.createGain()
  bus.gain.value = opts.gain ?? FULL_VOLUME_GAIN
  bus.connect(ctx.destination)
  const p = new TrackPlayer(ctx, bus, t, 0)
  p.schedule(seconds)
  return ctx.startRendering()
}

export function analyse(buf: AudioBuffer): { peak: number; rms: number; silentSeconds: number } {
  let peak = 0
  let sum = 0
  let n = 0
  // Longest run of near-silence (0.25 s windows), to catch dead gaps.
  const win = Math.floor(buf.sampleRate / 4)
  let run = 0
  let longest = 0
  const chans = Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i))
  for (let start = 0; start + win <= buf.length; start += win) {
    let wpeak = 0
    for (const d of chans)
      for (let i = start; i < start + win; i++) {
        const a = Math.abs(d[i])
        if (a > wpeak) wpeak = a
        sum += d[i] * d[i]
        n++
      }
    if (wpeak > peak) peak = wpeak
    run = wpeak < 0.003 ? run + 1 : 0
    if (run > longest) longest = run
  }
  return { peak, rms: Math.sqrt(sum / Math.max(1, n)), silentSeconds: longest / 4 }
}

export function bufferToWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels
  const len = buf.length * ch * 2
  const view = new DataView(new ArrayBuffer(44 + len))
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  view.setUint32(4, 36 + len, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, ch, true)
  view.setUint32(24, buf.sampleRate, true)
  view.setUint32(28, buf.sampleRate * ch * 2, true)
  view.setUint16(32, ch * 2, true)
  view.setUint16(34, 16, true)
  str(36, 'data')
  view.setUint32(40, len, true)
  const data = Array.from({ length: ch }, (_, i) => buf.getChannelData(i))
  let o = 44
  for (let i = 0; i < buf.length; i++)
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]))
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      o += 2
    }
  return new Blob([view], { type: 'audio/wav' })
}

export async function renderTrackToWav(id: TrackId, seconds?: number): Promise<Blob> {
  return bufferToWav(await renderTrack(id, { seconds }))
}
