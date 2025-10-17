/**
 * squarePyramid.js
 * 사각뿔의 정점 위치와 텍스처 좌표를 정의하는 클래스 (수정된 최종본)
 */
export class SquarePyramid {
    constructor(gl) {
        this.gl = gl;
        
        const vertices = new Float32Array([
            // --- 옆면 (Side Faces) ---
            // 뒷면 (Back Face)
             0.0, 1.0,  0.0, -0.5, 0.0, -0.5,  0.5, 0.0, -0.5,
            // 오른쪽 면 (Right Face)
             0.0, 1.0,  0.0,  0.5, 0.0, -0.5,  0.5, 0.0,  0.5,
            // 앞면 (Front Face)
             0.0, 1.0,  0.0,  0.5, 0.0,  0.5, -0.5, 0.0,  0.5,
            // 왼쪽 면 (Left Face)
             0.0, 1.0,  0.0, -0.5, 0.0,  0.5, -0.5, 0.0, -0.5,
            // --- 밑면 (Bottom Face) ---
            -0.5, 0.0, -0.5,  0.5, 0.0, -0.5,  0.5, 0.0,  0.5,
            -0.5, 0.0, -0.5,  0.5, 0.0,  0.5, -0.5, 0.0,  0.5
        ]);
        this.vertexCount = 18;

        // 텍스처 좌표 (UV) - 옆면의 V 좌표를 상하 반전시킴
        const texCoords = new Float32Array([
            // 옆면 4개에 걸쳐 이미지 한 장 wrapping
            // 뒷면 (U: 0.0 ~ 0.25)
            0.125, 0.0,  // Apex (이미지 상단, V=0)
            0.0,   1.0,  // Bottom Left (이미지 하단, V=1)
            0.25,  1.0,  // Bottom Right (이미지 하단, V=1)
            // 오른쪽 면 (U: 0.25 ~ 0.5)
            0.375, 0.0,
            0.25,  1.0,
            0.5,   1.0,
            // 앞면 (U: 0.5 ~ 0.75)
            0.625, 0.0,
            0.5,   1.0,
            0.75,  1.0,
            // 왼쪽 면 (U: 0.75 ~ 1.0)
            0.875, 0.0,
            0.75,  1.0,
            1.0,   1.0,
            // 밑면은 이미지 전체 사용 (변경 없음)
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,
            0.0, 0.0,   1.0, 1.0,   0.0, 1.0
        ]);

        // VAO 설정
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // 정점 위치 버퍼 (location = 0)
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        // 텍스처 좌표 버퍼 (location = 1)
        const uvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvbo);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        gl.bindVertexArray(null);
    }

    draw() {
        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);
        this.gl.bindVertexArray(null);
    }
}