// Secondary lines (subreddit edges, score rings, the git graph, timeline ticks): one instance per
// line, LINE_POINTS points each, drawn up to how far each has been revealed. One texture row per
// line: its points, then its colour and width, then its state (drawn, brightness, point count).

uniform highp sampler2D uLines;
uniform int uK;
uniform float uWidth;
uniform float uHalo;

vec3 linePoint(int line, int k, int last, float head) {
  k = clamp(k, 0, last);
  vec3 a = texelFetch(uLines, ivec2(k, line), 0).xyz;
  // The last drawn point sits exactly where the line's tip is.
  if (k == last && float(last) > head && k > 0) {
    vec3 b = texelFetch(uLines, ivec2(k - 1, line), 0).xyz;
    return mix(b, a, head - float(k - 1));
  }
  return a;
}

void main() {
  int line = gl_InstanceID;
  int j = gl_VertexID >> 1;
  float side = (gl_VertexID & 1) == 0 ? -1.0 : 1.0;
  vec4 col = texelFetch(uLines, ivec2(uK, line), 0);
  vec4 st = texelFetch(uLines, ivec2(uK + 1, line), 0);
  int n = int(st.z + 0.5);
  if (st.y <= 0.001 || st.x <= 0.0 || n < 2) {
    vDist = 0.0;
    vCore = 1.0;
    vSigma = 1.0;
    vColor = vec4(0.0);
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    return;
  }
  float head = st.x * float(n - 1);
  int last = min(int(ceil(head)), n - 1);
  int jj = min(j, last);
  vec3 p = linePoint(line, jj, last, head);
  vec3 pp = linePoint(line, jj - 1, last, head);
  vec3 pn = linePoint(line, jj + 1, last, head);
  gl_Position = ribbon(pp, p, pn, side, uWidth * col.a, uHalo, vec4(col.rgb, st.y));
}
