// Points of light: the dust that hangs along the path (lit up as the pen passes) and the sparks
// that fall off the pen's tip. Soft round sprites, blended additively.

// @vertex
uniform mat4 uViewProj;
uniform float uPx;
uniform float uSize;      // world size → px
uniform float uTime;
uniform float uDrift;     // how much the motes wander
uniform vec3 uPen;
uniform float uPenLight;  // how strongly the pen lights nearby motes
uniform vec2 uFog;
uniform float uGain;

in vec4 aPos;   // xyz, w = seed
in vec4 aCol;   // rgb, a = brightness

out vec4 vColor;

void main() {
  float s = aPos.w;
  vec3 p = aPos.xyz + uDrift * 0.4 * vec3(
    sin(uTime * 0.13 + s * 6.3),
    sin(uTime * 0.11 + s * 4.1),
    cos(uTime * 0.09 + s * 5.7)
  );
  vec4 c = uViewProj * vec4(p, 1.0);
  float lit = uPenLight * exp(-length(p - uPen) / 4.5);
  float twinkle = mix(1.0, 0.55 + 0.45 * sin(uTime * (0.8 + s * 2.2) + s * 40.0), uDrift);
  float fog = exp(-max(c.w - uFog.x, 0.0) * uFog.y) * smoothstep(0.4, 2.5, c.w);
  float size = clamp(uSize / max(c.w, 0.1), 1.2, 14.0) * uPx;
  gl_PointSize = size * 3.0;
  vColor = vec4(aCol.rgb, (aCol.a * twinkle + lit) * fog * uGain);
  gl_Position = c.w > 0.1 ? c : vec4(0.0, 0.0, 2.0, 1.0);
}

// @fragment
in vec4 vColor;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = dot(q, q);
  float a = exp(-r * 9.0) + 0.25 * exp(-r * 2.5);
  o = vec4(vColor.rgb * vColor.a * a, 1.0);
}
