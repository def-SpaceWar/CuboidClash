#version 300 es
precision highp float;

in vec2 v_texcoord;

// TINT
uniform vec4 u_color;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  vec4 newColor = texture(u_texture, v_texcoord);

  newColor.x *= u_color.x;
  newColor.y *= u_color.y;
  newColor.z *= u_color.z;
  newColor.w *= u_color.w;

  outColor = newColor;
}
