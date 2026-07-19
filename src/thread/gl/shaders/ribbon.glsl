// Shared by every line: turns a polyline point into one side of a screen-space ribbon.
// Width is in pixels (with a floor, so far lines stay visible and just dim), the quad is wide
// enough for the glow, and the fragment shader draws core and glow from the distance across.

uniform mat4 uViewProj;
uniform vec2 uResolution;   // render target, px
uniform float uPx;          // device px per CSS px, times render scale
uniform float uProjScale;   // px per world unit at distance 1
uniform vec4 uCursor;       // xy: pointer (px, y up), z: pull strength, w: radius (px)
uniform vec2 uFog;          // start distance, density

out float vDist;
out float vCore;
out float vSigma;
out vec4 vColor;

vec2 toScreen(vec4 c) {
  return (c.xy / c.w * 0.5 + 0.5) * uResolution;
}

// The thread leans towards the pointer, like a string near a magnet.
vec2 bend(vec2 s) {
  vec2 d = uCursor.xy - s;
  float f = exp(-dot(d, d) / (uCursor.w * uCursor.w));
  return s + d * f * uCursor.z;
}

vec4 ribbon(vec3 pPrev, vec3 p, vec3 pNext, float side, float worldWidth, float haloPx, vec4 color) {
  vec4 c = uViewProj * vec4(p, 1.0);
  if (c.w < 0.15) {
    vDist = 0.0;
    vCore = 1.0;
    vSigma = 1.0;
    vColor = vec4(0.0);
    return vec4(0.0, 0.0, 2.0, 1.0);
  }
  vec4 cp = uViewProj * vec4(pPrev, 1.0);
  vec4 cn = uViewProj * vec4(pNext, 1.0);
  if (cp.w < 0.15) cp = c;
  if (cn.w < 0.15) cn = c;

  vec2 s = bend(toScreen(c));
  vec2 sp = bend(toScreen(cp));
  vec2 sn = bend(toScreen(cn));
  vec2 d1 = s - sp;
  vec2 d2 = sn - s;
  float l1 = length(d1);
  float l2 = length(d2);
  vec2 t1 = l1 > 1e-3 ? d1 / l1 : vec2(0.0);
  vec2 t2 = l2 > 1e-3 ? d2 / l2 : vec2(0.0);
  // Gentle bends get a mitred join; sharp turns and reversals (pen strokes that double back)
  // just follow the outgoing segment, so the glow never shoots out into spikes.
  float turn = (l1 > 1e-3 && l2 > 1e-3) ? dot(t1, t2) : 1.0;
  vec2 t = t1 + t2;
  float tl = length(t);
  t = tl > 1e-3 ? t / tl : (l2 > 1e-3 ? t2 : (l1 > 1e-3 ? t1 : vec2(1.0, 0.0)));
  float miter = 1.0;
  if (turn < 0.5) {
    t = l2 > 1e-3 ? t2 : t1;
  } else {
    vec2 ref = l1 > 1e-3 ? t1 : t2;
    miter = 1.0 / max(abs(dot(vec2(-t.y, t.x), vec2(-ref.y, ref.x))), 0.75);
  }
  vec2 n = vec2(-t.y, t.x);

  float rawCore = 0.5 * worldWidth * uProjScale / c.w;
  float minCore = 0.5 * uPx;
  float core = clamp(rawCore, minCore, 2.6 * uPx);
  float thin = clamp(rawCore / minCore, 0.2, 1.0);
  // Far lines sink into the dark; lines brushing past the lens fade so they don't smear.
  float fog = exp(-max(c.w - uFog.x, 0.0) * uFog.y) * smoothstep(0.6, 3.5, c.w);
  float sigma = haloPx * uPx * mix(0.55, 1.0, thin);
  float halfWidth = core + sigma * 2.6 + uPx;

  // A line seen end-on stacks hundreds of its segments onto the same pixels, and additive light
  // would pile up to solid white. Dim each point by how foreshortened it is on screen, so a line
  // keeps the same brightness per pixel however it's turned.
  float worldStep = length(pNext - pPrev) * 0.5;
  float expected = worldStep * uProjScale / c.w;
  float facing = expected > 1e-3 ? clamp(length(sn - sp) * 0.5 / expected, 0.0, 1.0) : 1.0;
  float foreshorten = clamp(facing * 1.4, 0.04, 1.0);

  vDist = side * halfWidth;
  vCore = core;
  vSigma = sigma;
  vColor = vec4(color.rgb, color.a * thin * fog * foreshorten);

  vec2 pos = s + n * side * halfWidth * miter;
  vec2 ndc = pos / uResolution * 2.0 - 1.0;
  return vec4(ndc * c.w, 0.0, c.w);
}
