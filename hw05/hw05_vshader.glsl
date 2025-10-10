attribute vec4 a_Position;
attribute vec4 a_Color;
uniform mat4 u_mvpMatrix;
varying vec4 v_Color;

void main() {
  // Transform vertex position using the Model-View-Projection matrix
  gl_Position = u_mvpMatrix * a_Position;
  // Pass the color to the fragment shader
  v_Color = a_Color;
}