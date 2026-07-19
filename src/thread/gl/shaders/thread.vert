// The thread: one triangle strip, two vertices per point. Positions are rewritten every frame
// into a float texture (1024 points per row); colour and width per point live in another.

uniform highp sampler2D uPos;
uniform highp sampler2D uCol;
uniform int uFirst;
uniform int uLast;
uniform float uHead;
uniform float uWidth;
uniform float uHalo;
uniform float uGain;
uniform float uGhost;   // brightness of the path the pen hasn't reached yet
uniform vec2 uTrail;    // points behind the pen where the trail starts / ends dimming
uniform float uTrailMin;
uniform float uTime;
uniform float uGlint;   // a highlight sweeping along the line (point index)

ivec2 texel(int i) {
  return ivec2(i & 1023, i >> 10);
}

void main() {
  int i = gl_VertexID >> 1;
  float side = (gl_VertexID & 1) == 0 ? -1.0 : 1.0;
  vec4 p = texelFetch(uPos, texel(i), 0);
  vec4 pp = texelFetch(uPos, texel(max(i - 1, uFirst)), 0);
  vec4 pn = texelFetch(uPos, texel(min(i + 1, uLast)), 0);
  vec4 col = texelFetch(uCol, texel(i), 0);
  float fi = float(i);
  float behind = uHead - fi;
  float drawn = step(0.0, behind);

  // The pen's tip glows brighter than the line behind it.
  // (max() keeps exp() from overflowing to infinity far ahead of the pen: 0 × inf is NaN.)
  float tip = drawn * exp(-max(behind, 0.0) / 14.0);
  // Ahead of the pen the path is only a faint guide; far behind it the trail dims, so the eye
  // stays on what is being drawn.
  float ahead = mix(1.0, uGhost, smoothstep(0.0, 1.5, -behind));
  float trail = mix(1.0, uTrailMin, smoothstep(uTrail.x, uTrail.y, behind));
  // Light travels along the drawn line towards the pen, so it never looks static.
  float pulse = pow(max(0.0, sin(fi * 0.011 - uTime * 2.4)), 80.0);
  float g = (fi - uGlint) / 55.0;
  float glint = exp(-g * g);
  float intensity = p.w * uGain * (1.0 + 1.6 * tip) * ahead * trail * (1.0 + drawn * (0.8 * pulse + 2.4 * glint));

  gl_Position = ribbon(pp.xyz, p.xyz, pn.xyz, side, uWidth * col.a, uHalo, vec4(col.rgb, intensity));
}
