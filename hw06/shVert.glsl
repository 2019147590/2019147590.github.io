#version 300 es

// layout location은 squarePyramid.js에서 설정한 값과 일치해야 함
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec2 a_texCoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;

out vec2 v_texCoord; // 프래그먼트 셰이더로 텍스처 좌표 전달

void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    v_texCoord = a_texCoord;
}