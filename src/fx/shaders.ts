/**
 * GLSL ES 1.00 sources (run unchanged on WebGL1 and WebGL2 contexts).
 * Texture convention: uploaded with FLIP_Y, so uv (0,0) is the bottom-left
 * everywhere; "pix" is native-pixel screen space with y pointing down.
 */
const PREC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`

export const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

/** Sum of point lights at native resolution; stored ×0.5 so RGBA8 holds up to 2. */
export const LIGHT = `${PREC}
varying vec2 v_uv;
uniform vec2 u_view;
uniform vec4 u_lp[24];
uniform vec4 u_lc[24];
uniform int u_n;
void main() {
  vec2 pix = vec2(v_uv.x, 1.0 - v_uv.y) * u_view;
  vec3 s = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    if (i >= u_n) break;
    vec2 d = (pix - u_lp[i].xy) * vec2(1.0, 1.3);
    float a = clamp(1.0 - length(d) / u_lp[i].z, 0.0, 1.0);
    s += u_lc[i].rgb * (a * a * (0.45 + 0.55 * a));
  }
  // Soft saturation so clusters (a ring of warp circles) glow instead of blowing out.
  s = 1.6 * (1.0 - exp(-s / 1.6));
  gl_FragColor = vec4(s * 0.5, 1.0);
}`

/** Lit scene → soft-knee threshold (downsampled with a 4-tap box). */
export const BRIGHT = `${PREC}
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_light;
uniform vec2 u_texel;
uniform vec3 u_amb;
uniform float u_thr;
void main() {
  vec2 o = u_texel * 0.5;
  vec3 c = texture2D(u_scene, v_uv + vec2(-o.x, -o.y)).rgb + texture2D(u_scene, v_uv + vec2(o.x, -o.y)).rgb
         + texture2D(u_scene, v_uv + vec2(-o.x, o.y)).rgb + texture2D(u_scene, v_uv + vec2(o.x, o.y)).rgb;
  c *= 0.25;
  vec3 P = texture2D(u_light, v_uv).rgb * 2.0;
  vec3 lit = c * (u_amb + P);
  float l = max(dot(lit, vec3(0.3, 0.55, 0.15)), max(lit.r, max(lit.g, lit.b)) * 0.7);
  float knee = 0.18;
  float soft = clamp(l - u_thr + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  float w = max(soft, l - u_thr) / max(l, 1e-4);
  gl_FragColor = vec4(lit * w, 1.0);
}`

/** Separable 9-tap gaussian using bilinear taps. */
export const BLUR = `${PREC}
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_dir;
void main() {
  vec3 c = texture2D(u_tex, v_uv).rgb * 0.227027;
  vec2 o1 = u_dir * 1.384615;
  vec2 o2 = u_dir * 3.230769;
  c += texture2D(u_tex, v_uv + o1).rgb * 0.316216;
  c += texture2D(u_tex, v_uv - o1).rgb * 0.316216;
  c += texture2D(u_tex, v_uv + o2).rgb * 0.070270;
  c += texture2D(u_tex, v_uv - o2).rgb * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}`

export const COMPOSITE = `${PREC}
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_dof;
uniform sampler2D u_bloom;
uniform sampler2D u_light;
uniform vec2 u_view;
uniform vec2 u_cam;
uniform float u_time;
uniform vec3 u_dofP;   // focusY, sharp half-band, ramp
uniform float u_dofMax;
uniform vec3 u_amb;
uniform float u_haze;
uniform float u_bloomK;
uniform vec3 u_lift;
uniform vec3 u_gamma;
uniform vec3 u_gain;
uniform vec2 u_satCon;
uniform vec4 u_ray;    // rgb, strength
uniform float u_rayAngle;
uniform vec4 u_sun;    // rgb, strength — low sun glow from the top-left
uniform vec3 u_post;   // vignette, grain, fade
uniform float u_water;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
bool isWater(vec3 c) {
  return c.b > 0.34 && c.b > c.r + 0.2 && c.b > c.g + 0.06;
}
vec3 shoulder(vec3 x) {
  vec3 over = max(x - 0.8, 0.0);
  return min(x, vec3(0.8)) + 0.2 * (1.0 - exp(-over / 0.2));
}
vec2 cellUv(vec2 cell) {
  return vec2((cell.x + 0.5) / u_view.x, 1.0 - (cell.y + 0.5) / u_view.y);
}

void main() {
  vec2 pix = vec2(v_uv.x, 1.0 - v_uv.y) * u_view;
  vec2 cell = floor(pix);
  vec3 base = texture2D(u_scene, cellUv(cell)).rgb;

  // Water: world-anchored shimmer + sparse twinkling glints (pixel-exact).
  if (u_water > 0.5 && isWater(base)) {
    vec3 a = texture2D(u_scene, cellUv(cell + vec2(3.0, 0.0))).rgb;
    vec3 b = texture2D(u_scene, cellUv(cell - vec2(3.0, 0.0))).rgb;
    vec3 c = texture2D(u_scene, cellUv(cell + vec2(0.0, 3.0))).rgb;
    vec3 d = texture2D(u_scene, cellUv(cell - vec2(0.0, 3.0))).rgb;
    if (isWater(a) && isWater(b) && isWater(c) && isWater(d)) {
      vec2 w = cell + u_cam;
      float sh = sin(w.x * 0.31 + w.y * 0.83 - u_time * 1.5) * sin(w.y * 0.47 - w.x * 0.12 + u_time * 0.8);
      base += vec3(0.05, 0.08, 0.1) * smoothstep(0.55, 1.0, sh);
      float h = hash(w);
      if (h > 0.985) {
        float tw = sin(u_time * (1.2 + h * 30.0) + h * 91.0);
        base = mix(base, vec3(0.95, 0.98, 1.0), smoothstep(0.55, 1.0, tw) * 0.9);
      }
    }
  }

  // Tilt-shift: crisp band around the player's row, blur toward top/bottom.
  float dy = pix.y - u_dofP.x;
  float k = smoothstep(u_dofP.y, u_dofP.y + u_dofP.z, abs(dy)) * (dy < 0.0 ? 1.0 : 0.7) * u_dofMax;
  if (k > 0.002) base = mix(base, texture2D(u_dof, v_uv).rgb, k);

  vec3 P = texture2D(u_light, v_uv).rgb * 2.0;
  // Under strong light the surface colour gives way to the light's colour (warm pools, not green grass).
  float pl = clamp((P.r + P.g + P.b) * 0.22, 0.0, 0.55);
  vec3 lb = mix(base, vec3(dot(base, vec3(0.3, 0.55, 0.15))) * 1.1, pl);
  vec3 col = lb * (u_amb + P * 0.85) + P * u_haze * (0.6 + 0.4 * dot(base, vec3(0.33)));
  col += texture2D(u_bloom, v_uv).rgb * u_bloomK;

  // Light shafts (screen-space, slow drift, slight parallax).
  if (u_ray.a > 0.0) {
    vec2 q = pix + u_cam * 0.25;
    float s = q.x * cos(u_rayAngle) - q.y * sin(u_rayAngle);
    float n1 = 0.5 + 0.5 * sin(s * 0.052 + u_time * 0.21);
    float n2 = 0.5 + 0.5 * sin(s * 0.023 - u_time * 0.13 + 2.0);
    float n3 = 0.5 + 0.5 * sin(s * 0.011 + u_time * 0.07 + 4.0);
    float r = smoothstep(0.55, 0.95, 0.5 * n1 + 0.3 * n2 + 0.2 * n3);
    float fall = 0.35 + 0.65 * (1.0 - smoothstep(0.0, u_view.y * 1.1, pix.y));
    vec3 shaft = u_ray.rgb * (r * fall * u_ray.a);
    col += shaft * (0.55 + col);
  }

  if (u_sun.a > 0.0) {
    float sd = length(pix - vec2(-0.1, -0.2) * u_view) / max(u_view.x, u_view.y);
    col += u_sun.rgb * (exp(-sd * 2.4) * u_sun.a) * (0.45 + col);
  }

  col = shoulder(col);
  // Grade: lift / gamma / gain, saturation, contrast.
  col = col * u_gain + u_lift * (1.0 - col);
  col = pow(max(col, vec3(0.0)), 1.0 / u_gamma);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, u_satCon.x);
  col = (col - 0.5) * u_satCon.y + 0.5;

  // Vignette (tinted toward dusk purple), grain, fade.
  vec2 vq = (v_uv - 0.5) * vec2(1.0, 0.92);
  float v = smoothstep(0.28, 0.78, length(vq)) * u_post.x;
  col = mix(col, col * vec3(0.42, 0.34, 0.52), v);
  col += (hash(gl_FragCoord.xy + fract(u_time * 7.13) * 97.0) - 0.5) * u_post.y;
  col = mix(clamp(col, 0.0, 1.0), vec3(0.02, 0.016, 0.047), u_post.z);
  gl_FragColor = vec4(col, 1.0);
}`
