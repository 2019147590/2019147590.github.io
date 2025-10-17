#version 300 es
precision mediump float;

in vec2 v_texCoord; // 정점 셰이더에서 받은 텍스처 좌표

uniform sampler2D u_texture; // 텍스처 샘플러

out vec4 fragColor;

void main() {
    // 텍스처 좌표를 이용해 텍스처의 색상 값을 가져옴
    fragColor = texture(u_texture, v_texCoord);
}