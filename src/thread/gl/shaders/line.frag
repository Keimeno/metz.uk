// Core and glow from the distance across the ribbon, analytically anti-aliased. The core runs
// hot (towards white), the glow carries the tint. Blended additively into a float target.

in float vDist;
in float vCore;
in float vSigma;
in vec4 vColor;

uniform float uCoreGain;
uniform float uHaloGain;

out vec4 outColor;

void main() {
  float d = abs(vDist);
  float core = 1.0 - smoothstep(vCore - 0.75, vCore + 0.75, d);
  float halo = exp(-(d * d) / (vSigma * vSigma));
  vec3 hot = mix(vColor.rgb, vec3(1.0), 0.6);
  vec3 c = (hot * core * uCoreGain + vColor.rgb * halo * uHaloGain) * vColor.a;
  outColor = vec4(c, 1.0);
}
