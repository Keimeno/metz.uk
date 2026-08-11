// The Zenarios fan: one instance per simulated future, each a strip of `uSegs` segments.
// Values come from a float texture (one row per future, one column per year), smoothed with
// Catmull-Rom. Futures burst out of the forecast and spread in depth by how well they end,
// then collapse onto the median.

uniform highp sampler2D uFan;
uniform int uYears;        // samples per future (years + 1)
uniform int uForecastRow;  // row of the deterministic forecast
uniform int uMedianRow;    // row of the median
uniform int uSegs;
uniform mat4 uModel;       // station-local → world
uniform vec2 uSize;        // chart width and height, local units
uniform float uReveal;     // burst, 0…1
uniform float uCollapse;   // onto the median, 0…1
uniform float uSpread;     // depth spread, local units
uniform float uAlpha;
uniform float uWidth;
uniform float uHalo;
uniform vec3 uLow;
uniform vec3 uMid;
uniform vec3 uHigh;

in float aPct;    // how well this future ends, 0…1
in float aOrder;  // its place in the stratified order, 0…1 (reveal delay)

float valueAt(int row, float x) {
  float fx = clamp(x, 0.0, float(uYears - 1));
  int i = min(int(floor(fx)), uYears - 2);
  float t = fx - float(i);
  float p0 = texelFetch(uFan, ivec2(max(i - 1, 0), row), 0).r;
  float p1 = texelFetch(uFan, ivec2(i, row), 0).r;
  float p2 = texelFetch(uFan, ivec2(i + 1, row), 0).r;
  float p3 = texelFetch(uFan, ivec2(min(i + 2, uYears - 1), row), 0).r;
  float t2 = t * t;
  float t3 = t2 * t;
  return 0.5 * (2.0 * p1 + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 +
    (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3);
}

vec3 linePoint(float u, float r) {
  float x = u * float(uYears - 1);
  float v = mix(valueAt(uForecastRow, x), valueAt(gl_InstanceID, x), r);
  v = mix(v, valueAt(uMedianRow, x), uCollapse);
  float z = (aPct - 0.5) * uSpread * r * (1.0 - uCollapse);
  return (uModel * vec4((u - 0.5) * uSize.x, (v - 0.5) * uSize.y, z, 1.0)).xyz;
}

void main() {
  int k = gl_VertexID >> 1;
  float side = (gl_VertexID & 1) == 0 ? -1.0 : 1.0;
  float du = 1.0 / float(uSegs);
  float u = float(k) * du;
  float r = clamp((uReveal - aOrder * 0.5) / 0.5, 0.0, 1.0);
  r = r * r * (3.0 - 2.0 * r);
  vec3 p = linePoint(u, r);
  vec3 pp = linePoint(max(u - du, 0.0), r);
  vec3 pn = linePoint(min(u + du, 1.0), r);
  vec3 col = aPct < 0.5 ? mix(uLow, uMid, aPct * 2.0) : mix(uMid, uHigh, aPct * 2.0 - 1.0);
  // Lines fade in along their length from "today", so the burst reads as time unfolding.
  float grow = smoothstep(u - 0.08, u, r * 1.15);
  float c = 1.0 - uCollapse;
  float a = uAlpha * grow * smoothstep(0.0, 0.2, r) * c * c;
  gl_Position = ribbon(pp, p, pn, side, uWidth, uHalo, vec4(col, a));
}
