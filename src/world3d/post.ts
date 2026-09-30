/**
 * Post-processing for the 3D overworld: bloom, tilt-shift depth of field
 * focused on the mage's row, then the per-map colour grade (lift / gamma /
 * gain, saturation, contrast, low-sun glow, light shafts, vignette, grain)
 * from src/fx/grades.ts, so the 3D view keeps each region's mood.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { Grade } from '../fx/grades'

const TILT = {
  uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() }, uFocus: { value: 0.4 }, uBand: { value: 0.12 }, uAmount: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uDir; uniform float uFocus; uniform float uBand; uniform float uAmount;
    varying vec2 vUv;
    void main() {
      float d = vUv.y - uFocus;
      // stronger toward the top (distance) than the bottom (foreground)
      float k = smoothstep(uBand, uBand + 0.35, abs(d)) * (d > 0.0 ? 1.0 : 0.65) * uAmount;
      vec2 o = uDir * k;
      vec4 c = texture2D(tDiffuse, vUv) * 0.227027;
      c += texture2D(tDiffuse, vUv + o * 1.384615) * 0.316216;
      c += texture2D(tDiffuse, vUv - o * 1.384615) * 0.316216;
      c += texture2D(tDiffuse, vUv + o * 3.230769) * 0.070270;
      c += texture2D(tDiffuse, vUv - o * 3.230769) * 0.070270;
      gl_FragColor = c;
    }`,
}

const GRADE = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uLift: { value: new THREE.Vector3() },
    uGamma: { value: new THREE.Vector3(1, 1, 1) },
    uGain: { value: new THREE.Vector3(1, 1, 1) },
    uSatCon: { value: new THREE.Vector2(1, 1) },
    uSun: { value: new THREE.Vector4() },
    uRay: { value: new THREE.Vector4() },
    uRayAngle: { value: 0.5 },
    uPost: { value: new THREE.Vector3() }, // vignette, grain, fade
    uCam: { value: new THREE.Vector2() },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes;
    uniform vec3 uLift, uGamma, uGain; uniform vec2 uSatCon; uniform vec4 uSun, uRay; uniform float uRayAngle;
    uniform vec3 uPost; uniform vec2 uCam;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    vec3 shoulder(vec3 x) { vec3 over = max(x - 0.8, 0.0); return min(x, vec3(0.8)) + 0.2 * (1.0 - exp(-over / 0.2)); }
    void main() {
      vec3 col = toSRGB(texture2D(tDiffuse, vUv).rgb);
      vec2 pix = vec2(vUv.x, 1.0 - vUv.y) * uRes;
      if (uRay.a > 0.0) {
        vec2 q = pix / uRes.y * 240.0 + uCam * 4.0;
        float s = q.x * cos(uRayAngle) - q.y * sin(uRayAngle);
        float n1 = 0.5 + 0.5 * sin(s * 0.052 + uTime * 0.21);
        float n2 = 0.5 + 0.5 * sin(s * 0.023 - uTime * 0.13 + 2.0);
        float n3 = 0.5 + 0.5 * sin(s * 0.011 + uTime * 0.07 + 4.0);
        float r = smoothstep(0.55, 0.95, 0.5 * n1 + 0.3 * n2 + 0.2 * n3);
        float fall = 0.35 + 0.65 * (1.0 - smoothstep(0.0, 1.1, pix.y / uRes.y));
        col += uRay.rgb * (r * fall * uRay.a) * (0.55 + col);
      }
      if (uSun.a > 0.0) {
        float sd = length(pix / max(uRes.x, uRes.y) - vec2(-0.1, -0.2) * uRes / max(uRes.x, uRes.y));
        col += uSun.rgb * (exp(-sd * 2.4) * uSun.a) * (0.45 + col);
      }
      col = shoulder(col);
      col = col * uGain + uLift * (1.0 - col);
      col = pow(max(col, vec3(0.0)), 1.0 / uGamma);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l), col, uSatCon.x);
      col = (col - 0.5) * uSatCon.y + 0.5;
      vec2 vq = (vUv - 0.5) * vec2(1.0, 0.92);
      float v = smoothstep(0.3, 0.8, length(vq)) * uPost.x;
      col = mix(col, col * vec3(0.42, 0.34, 0.52), v);
      col += (hash(gl_FragCoord.xy + fract(uTime * 7.13) * 97.0) - 0.5) * uPost.y;
      col = mix(clamp(col, 0.0, 1.0), vec3(0.02, 0.016, 0.047), uPost.z);
      gl_FragColor = vec4(col, 1.0);
    }`,
}

export class Post {
  composer: EffectComposer
  bloom: UnrealBloomPass
  tiltH: ShaderPass
  tiltV: ShaderPass
  grade: ShaderPass
  private w = 1
  private h = 1

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, samples: number) {
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples })
    this.composer = new EffectComposer(renderer, rt)
    this.composer.addPass(new RenderPass(scene, camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.55, 0.85)
    this.composer.addPass(this.bloom)
    this.tiltH = new ShaderPass(TILT)
    this.tiltV = new ShaderPass(TILT)
    this.composer.addPass(this.tiltH)
    this.composer.addPass(this.tiltV)
    this.grade = new ShaderPass(GRADE)
    this.composer.addPass(this.grade)
  }

  setSize(w: number, h: number, pr: number) {
    this.w = w * pr
    this.h = h * pr
    this.composer.setPixelRatio(pr)
    this.composer.setSize(w, h)
    // bloom at reduced resolution is plenty (and much cheaper)
    this.bloom.setSize(Math.max(1, Math.round((w * pr) / 2)), Math.max(1, Math.round((h * pr) / 2)))
    ;(this.grade.uniforms.uRes.value as THREE.Vector2).set(this.w, this.h)
  }

  setGrade(g: Grade, level: number) {
    const u = this.grade.uniforms
    ;(u.uLift.value as THREE.Vector3).set(...g.lift)
    ;(u.uGamma.value as THREE.Vector3).set(...g.gamma)
    ;(u.uGain.value as THREE.Vector3).set(...g.gain)
    ;(u.uSatCon.value as THREE.Vector2).set(g.saturation, g.contrast)
    ;(u.uSun.value as THREE.Vector4).set(g.sun[0], g.sun[1], g.sun[2], g.sunStrength * 0.8)
    ;(u.uRay.value as THREE.Vector4).set(g.rays[0], g.rays[1], g.rays[2], g.rayStrength * 0.8)
    u.uRayAngle.value = g.rayAngle
    ;(u.uPost.value as THREE.Vector3).set(g.vignette, level >= 3 ? g.grain * 0.6 : 0, 0)
    this.bloom.strength = g.bloom * 0.55
    this.bloom.threshold = g.bloomThreshold * 0.95
    this.bloom.radius = 0.6
    const dof = level >= 3 && g.dof > 0
    this.tiltH.enabled = dof
    this.tiltV.enabled = dof
    this.tiltH.uniforms.uAmount.value = g.dof
    this.tiltV.uniforms.uAmount.value = g.dof
  }

  render(now: number, focusV: number, camX: number, camY: number) {
    const px = 1.6
    ;(this.tiltH.uniforms.uDir.value as THREE.Vector2).set(px / this.w, 0)
    ;(this.tiltV.uniforms.uDir.value as THREE.Vector2).set(0, px / this.h)
    this.tiltH.uniforms.uFocus.value = focusV
    this.tiltV.uniforms.uFocus.value = focusV
    this.grade.uniforms.uTime.value = now / 1000
    ;(this.grade.uniforms.uCam.value as THREE.Vector2).set(camX, camY)
    this.composer.render()
  }

  dispose() {
    this.composer.renderTarget1.dispose()
    this.composer.renderTarget2.dispose()
    this.bloom.dispose()
  }
}
