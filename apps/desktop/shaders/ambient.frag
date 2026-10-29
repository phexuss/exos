#version 460 core
#include <flutter/runtime_effect.glsl>

// The window's living background: four colours taken from the artwork drift
// around as soft light, warped a little, under a dark veil and fine grain.

uniform vec2 uSize;
uniform float uTime;
uniform float uEnergy;
uniform vec4 uC0;
uniform vec4 uC1;
uniform vec4 uC2;
uniform vec4 uC3;
uniform vec4 uBase;

out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float weight(vec2 p, vec2 c, float r) {
  vec2 d = p - c;
  return exp(-dot(d, d) / r);
}

void main() {
  vec2 frag = FlutterFragCoord().xy;
  vec2 uv = frag / uSize;
  float aspect = uSize.x / uSize.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime * (0.05 + 0.07 * uEnergy);

  // A slow warp keeps the light from looking like four circles.
  vec2 q = p + 0.12 * vec2(sin(p.y * 2.6 + t * 2.1), cos(p.x * 2.2 - t * 1.7));

  vec2 b0 = vec2(aspect * (0.22 + 0.14 * sin(t * 1.3)), 0.22 + 0.16 * cos(t * 1.1));
  vec2 b1 = vec2(aspect * (0.80 + 0.10 * cos(t * 0.9)), 0.28 + 0.18 * sin(t * 1.4 + 1.0));
  vec2 b2 = vec2(aspect * (0.62 + 0.18 * sin(t * 0.7 + 2.0)), 0.86 + 0.10 * cos(t * 1.2));
  vec2 b3 = vec2(aspect * (0.14 + 0.10 * cos(t * 1.5 + 3.0)), 0.80 + 0.14 * sin(t * 0.8));

  float r = 0.16 * aspect;
  float w0 = weight(q, b0, r);
  float w1 = weight(q, b1, r * 0.9);
  float w2 = weight(q, b2, r * 1.1);
  float w3 = weight(q, b3, r * 0.8);

  vec3 col = uBase.rgb;
  col = mix(col, uC0.rgb, clamp(w0, 0.0, 1.0));
  col = mix(col, uC1.rgb, clamp(w1, 0.0, 1.0));
  col = mix(col, uC2.rgb, clamp(w2, 0.0, 1.0));
  col = mix(col, uC3.rgb, clamp(w3, 0.0, 1.0));

  // Veil: darker towards the bottom, where the player and long lists sit.
  float veil = mix(0.62, 0.38, smoothstep(0.0, 1.0, uv.y));
  col *= veil;

  float vignette = smoothstep(1.25, 0.25, length((uv - vec2(0.55, 0.35)) * vec2(1.0, 1.2)));
  col *= mix(0.7, 1.0, vignette);

  col += (hash(frag + fract(uTime * 7.0) * 113.0) - 0.5) * 0.03;
  fragColor = vec4(col, 1.0);
}
