const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error("WebGL 2 is not supported.");
}

// 초기 크기 설정 (문제 조건: 500 x 500)
canvas.width = 500;
canvas.height = 500;
gl.viewport(0, 0, canvas.width, canvas.height);

// Scissor Test 켜기
gl.enable(gl.SCISSOR_TEST);

// 렌더링 함수
function render() {
    const w = canvas.width;
    const h = canvas.height;
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    // 왼쪽 아래 (파랑)
    gl.scissor(0, 0, halfW, halfH);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 오른쪽 아래 (노랑)
    gl.scissor(halfW, 0, halfW, halfH);
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 왼쪽 위 (초록)
    gl.scissor(0, halfH, halfW, halfH);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 오른쪽 위 (빨강)
    gl.scissor(halfW, halfH, halfW, halfH);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// 윈도우 리사이즈 시 canvas 크기와 비율 유지
function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight); // 정사각형 유지
    canvas.width = size;
    canvas.height = size;
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
}

// 초기 렌더링
render();

// 리사이즈 이벤트 등록
window.addEventListener('resize', resizeCanvas);
