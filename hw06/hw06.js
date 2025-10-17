/* hw06.js */
import { Shader, readShaderFile } from './shader.js';
import { SquarePyramid } from './squarePyramid.js';
import { Axes } from './util.js'; // 좌표축 표시를 위해 util.js 임포트

// --- 기본 설정 ---
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let pyramid;
let axes;
let texture;

// --- 행렬 및 카메라 ---
const viewMatrix = mat4.create();
const projMatrix = mat4.create();
const modelMatrix = mat4.create(); // 아크볼 회전이 적용될 모델 행렬

// --- 아크볼(Arcball) 제어 변수 ---
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let currentRotation = quat.create();

// --- 메인 함수 ---
async function main() {
    if (!initWebGL()) return;
    
    shader = await setupShaders();
    pyramid = new SquarePyramid(gl); // 2) 피라미드 크기와 위치는 HW05와 동일 [cite: 27]
    axes = new Axes(gl);
    texture = await setupTexture('sunrise.jpg');

    setupMatrices();
    setupEventListeners();

    requestAnimationFrame(render);
}

// --- 초기화 함수들 ---
function initWebGL() {
    if (!gl) {
        console.error("WebGL 2를 지원하지 않습니다.");
        return false;
    }
    gl.clearColor(0.1, 0.15, 0.2, 1.0); // 어두운 파란색 배경
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return true;
}

async function setupShaders() {
    const vsSource = await readShaderFile('shVert.glsl');
    const fsSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vsSource, fsSource);
}

function setupMatrices() {
    mat4.perspective(projMatrix, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    mat4.lookAt(viewMatrix, [0, 1, 5], [0, 0.5, 0], [0, 1, 0]); // 카메라 위치 설정
}

async function setupTexture(url) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255])); // 임시 픽셀

    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            resolve(tex);
        };
        image.src = url;
    });
}

// --- 렌더링 함수 ---
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 아크볼 회전을 모델 행렬에 적용
    mat4.fromQuat(modelMatrix, currentRotation);

    // 셰이더 활성화 및 행렬, 텍스처 전달
    shader.use();
    shader.setMat4('u_projection', projMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_model', modelMatrix);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    shader.setInt('u_texture', 0);
    
    // 피라미드와 좌표축 그리기
    pyramid.draw();
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

// --- 아크볼 이벤트 리스너 설정 ---
function setupEventListeners() {
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMousePos = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseout', () => { isDragging = false; });
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const newMousePos = { x: e.clientX, y: e.clientY };
        const delta = { x: newMousePos.x - lastMousePos.x, y: newMousePos.y - lastMousePos.y };
        
        // 회전축과 각도 계산
        const rotationSpeed = 0.5;
        const angle = Math.sqrt(delta.x * delta.x + delta.y * delta.y) * rotationSpeed;
        const axis = vec3.fromValues(delta.y, delta.x, 0); // y움직임은 x축 회전, x움직임은 y축 회전
        vec3.normalize(axis, axis);
        
        // 회전 쿼터니언 생성 및 누적
        const rotationDelta = quat.create();
        quat.setAxisAngle(rotationDelta, axis, glMatrix.toRadian(angle));
        quat.multiply(currentRotation, rotationDelta, currentRotation);
        quat.normalize(currentRotation, currentRotation);

        lastMousePos = newMousePos;
    });
}

// --- 프로그램 시작 ---
document.addEventListener('DOMContentLoaded', main);