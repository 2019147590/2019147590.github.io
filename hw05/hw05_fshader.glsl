precision mediump float;
varying vec4 v_Color;

void main() {
  // Set the fragment color to the interpolated color from the vertex shader
  gl_FragColor = v_Color;
}