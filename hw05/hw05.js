"use strict";

let gl;
let canvas;
let u_mvpMatrix;
let n; // Number of vertices to draw

// --- Camera and Animation Parameters ---
const RADIUS = 3.0;
let eye;
const at = vec3(0.0, 0.0, 0.0); // Look at the center of the pyramid
const up = vec3(0.0, 1.0, 0.0);

// 5) Speeds for camera movement
const ANGULAR_SPEED_XZ = 90.0; // degrees per second
const OSCILLATION_SPEED_Y = 45.0; // degrees per second

let currentAngleXZ = 0.0;
let currentAngleY = 0.0;
let g_lastTime = 0;

window.onload = function main() {
    canvas = document.getElementById("webgl");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.error("Failed to get the rendering context for WebGL");
        return;
    }

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Get pyramid data from the library file
    const pyramid = squarePyramid();
    n = pyramid.numVertices;

    // --- Set up buffers ---
    initBuffer(gl, pyramid.vertices, 3, gl.FLOAT, "a_Position", program);
    initBuffer(gl, pyramid.colors, 4, gl.FLOAT, "a_Color", program);

    u_mvpMatrix = gl.getUniformLocation(program, "u_mvpMatrix");

    gl.clearColor(0.1, 0.1, 0.1, 1.0); // Dark gray background
    gl.enable(gl.DEPTH_TEST);

    // --- Start Animation ---
    g_lastTime = Date.now();
    requestAnimationFrame(tick);
};

function tick() {
    const currentTime = Date.now();
    const elapsed = currentTime - g_lastTime;
    g_lastTime = currentTime;

    updateAnimation(elapsed);
    render();
    requestAnimationFrame(tick);
}

function updateAnimation(elapsed) {
    // Convert elapsed ms to seconds
    const elapsedSeconds = elapsed / 1000.0;

    // Update angles based on speed and elapsed time
    currentAngleXZ = (currentAngleXZ + ANGULAR_SPEED_XZ * elapsedSeconds) % 360;
    currentAngleY = (currentAngleY + OSCILLATION_SPEED_Y * elapsedSeconds) % 360;

    // 4) Calculate camera position
    // x and z follow a circular path
    const radXZ = radians(currentAngleXZ);
    const camX = RADIUS * Math.cos(radXZ);
    const camZ = RADIUS * Math.sin(radXZ);

    // y oscillates between 0 and 10
    const radY = radians(currentAngleY);
    const camY = 5.0 + 5.0 * Math.sin(radY); // Map sin's [-1, 1] range to [0, 10]

    eye = vec3(camX, camY, camZ);
}

function render() {
    const projMatrix = perspective(45.0, canvas.width / canvas.height, 1.0, 100.0);
    const viewMatrix = lookAt(eye, at, up);
    // 6) Pyramid is fixed, so the model matrix is the identity matrix
    const modelMatrix = mat4();

    const mvMatrix = mult(viewMatrix, modelMatrix);
    const mvpMatrix = mult(projMatrix, mvMatrix);

    gl.uniformMatrix4fv(u_mvpMatrix, false, flatten(mvpMatrix));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initBuffer(gl, data, size, type, attribute, program) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const attribLocation = gl.getAttribLocation(program, attribute);
    gl.vertexAttribPointer(attribLocation, size, type, false, 0, 0);
    gl.enableVertexAttribArray(attribLocation);
}