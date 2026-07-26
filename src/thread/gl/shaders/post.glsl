// Full-screen passes: one big triangle, no vertex buffer.

// @vertex
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}

// @down
// Dual-Kawase downsample: five taps, a cheap wide blur.
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
out vec4 o;
void main() {
  vec2 h = uTexel;
  vec4 sum = texture(uTex, vUv) * 4.0;
  sum += texture(uTex, vUv - h);
  sum += texture(uTex, vUv + h);
  sum += texture(uTex, vUv + vec2(h.x, -h.y));
  sum += texture(uTex, vUv - vec2(h.x, -h.y));
  o = sum / 8.0;
}

// @up
// Dual-Kawase upsample, added on top of the level below.
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
out vec4 o;
void main() {
  vec2 h = uTexel;
  vec4 sum = texture(uTex, vUv + vec2(-h.x * 2.0, 0.0));
  sum += texture(uTex, vUv + vec2(-h.x, h.y)) * 2.0;
  sum += texture(uTex, vUv + vec2(0.0, h.y * 2.0));
  sum += texture(uTex, vUv + vec2(h.x, h.y)) * 2.0;
  sum += texture(uTex, vUv + vec2(h.x * 2.0, 0.0));
  sum += texture(uTex, vUv + vec2(h.x, -h.y)) * 2.0;
  sum += texture(uTex, vUv + vec2(0.0, -h.y * 2.0));
  sum += texture(uTex, vUv + vec2(-h.x, -h.y)) * 2.0;
  o = sum / 12.0;
}

// @composite
// Light over ink: a soft shoulder so bright overlaps glow instead of clipping, a touch of lens
// (colour fringing towards the edges, a vignette, fine grain), and dither so dark gradients
// don't band.
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomGain;
uniform float uExposure;
uniform float uFade;
uniform vec3 uBg;
uniform float uFrame;
uniform float uAberration;
uniform float uVignette;
uniform float uGrain;
uniform float uAspect;
out vec4 o;

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 d = vUv - 0.5;
  float r2 = dot(d * vec2(uAspect, 1.0), d * vec2(uAspect, 1.0));
  vec2 off = d * r2 * uAberration;
  vec3 c = vec3(
    texture(uScene, vUv + off).r,
    texture(uScene, vUv).g,
    texture(uScene, vUv - off).b
  );
  c += texture(uBloom, vUv).rgb * uBloomGain;
  c *= uFade;
  vec3 m = 1.0 - exp(-c * uExposure);
  vec3 col = uBg + m * (1.0 - uBg);
  col *= 1.0 - uVignette * smoothstep(0.08, 0.9, r2);
  col += (hash(gl_FragCoord.xy + fract(uFrame * 0.618) * 113.0) - 0.5) * uGrain;
  col += (ign(gl_FragCoord.xy + vec2(uFrame * 5.588, uFrame * 3.17)) - 0.5) / 255.0;
  o = vec4(col, 1.0);
}
