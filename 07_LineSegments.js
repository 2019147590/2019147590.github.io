/*-------------------------------------------------------------------------
07_LineSegments.js  (수정판)
- 1 circle 입력, 1 line segment 입력, intersection 계산/표시
- vertex shader에서 gl_PointSize = 10.0으로 설정(쉐이더 파일 참고)
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '/util.js';
import { Shader, readShaderFile } from '/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;

let shader;
let vao;
let positionBuffer;

let mode = 'circle'; // 'circle' -> 'line' -> 'done'
let isDrawing = false;
let startPoint = null; // vec2 in NDC
let tempPoint = null;  // during dragging

let circle = null; // { center: [x,y], radius: r, vertices: Float32Array }
let lineSegment = null; // [x1,y1,x2,y2]
let intersections = []; // array of [x,y] points

let textOverlay, textOverlay2, textOverlay3;
let axes = new Axes(gl, 0.85);

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    main().then(success => {
        if (!success) {
            console.log('프로그램 초기화 실패');
            return;
        }
        isInitialized = true;
    }).catch(err => console.error(err));
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL2 not supported');
        return false;
    }
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();

        const rect = canvas.getBoundingClientRect();
        const cx = event.clientX - rect.left;
        const cy = event.clientY - rect.top;
        const [glX, glY] = convertToWebGLCoordinates(cx, cy);

        // only left button
        if (event.button !== 0) return;

        if (!isDrawing) {
            startPoint = [glX, glY];
            tempPoint = null;
            isDrawing = true;
        }
    }

    function handleMouseMove(event) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const cx = event.clientX - rect.left;
        const cy = event.clientY - rect.top;
        const [glX, glY] = convertToWebGLCoordinates(cx, cy);
        tempPoint = [glX, glY];
        render();
    }

    function handleMouseUp(event) {
        if (!isDrawing) return;
        isDrawing = false;

        if (!startPoint || !tempPoint) {
            startPoint = null;
            tempPoint = null;
            return;
        }

        if (mode === 'circle') {
            // compute radius (in NDC units)
            const dx = tempPoint[0] - startPoint[0];
            const dy = tempPoint[1] - startPoint[1];
            const r = Math.sqrt(dx*dx + dy*dy);

            // build a triangle fan for the circle (many segments)
            const segments = 128;
            const verts = [];
            verts.push(startPoint[0], startPoint[1]); // center
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                const x = startPoint[0] + Math.cos(theta) * r;
                const y = startPoint[1] + Math.sin(theta) * r;
                verts.push(x, y);
            }
            circle = {
                center: [startPoint[0], startPoint[1]],
                radius: r,
                vertices: new Float32Array(verts)
            };

            updateText(textOverlay,
                "Circle center: (" + circle.center[0].toFixed(2) + ", " + circle.center[1].toFixed(2) + "), r = " + circle.radius.toFixed(2)
            );

            updateText(textOverlay2, "Now draw a line segment (click & drag).");

            // advance to line mode
            mode = 'line';
        }
        else if (mode === 'line') {
            // finalize line segment
            lineSegment = [...startPoint, ...tempPoint]; // [x1,y1,x2,y2]
            updateText(textOverlay2,
                "Line segment: (" + lineSegment[0].toFixed(2) + ", " + lineSegment[1].toFixed(2) + ") ~ (" +
                lineSegment[2].toFixed(2) + ", " + lineSegment[3].toFixed(2) + ")"
            );

            // compute intersections with circle
            intersections = computeCircleSegmentIntersections(circle, lineSegment);
            if (intersections.length === 0) {
                updateText(textOverlay3, "Intersection: 0 points");
            } else {
                let s = "Intersection: " + intersections.length + " point" + (intersections.length>1?'s':'') + " — ";
                s += intersections.map((p,i) => "(" + p[0].toFixed(2) + ", " + p[1].toFixed(2) + ")").join(" , ");
                updateText(textOverlay3, s);
            }

            mode = 'done';
        }

        startPoint = null;
        tempPoint = null;
        render();
    }

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
}

function computeCircleSegmentIntersections(circleObj, seg) {
    if (!circleObj || !seg) return [];
    const cx = circleObj.center[0], cy = circleObj.center[1];
    const r = circleObj.radius;
    const x1 = seg[0], y1 = seg[1], x2 = seg[2], y2 = seg[3];

    // Parametric: P(t) = A + t*(B-A), t in [0,1]
    const dx = x2 - x1;
    const dy = y2 - y1;
    // Solve |P(t) - C|^2 = r^2 -> at^2 + bt + c = 0
    const a = dx*dx + dy*dy;
    const b = 2*(dx*(x1 - cx) + dy*(y1 - cy));
    const c = (x1 - cx)*(x1 - cx) + (y1 - cy)*(y1 - cy) - r*r;

    const eps = 1e-8;
    const discriminant = b*b - 4*a*c;
    let results = [];
    if (discriminant < -eps) {
        return results; // no real roots
    } else if (Math.abs(discriminant) <= eps) {
        // one tangent point (double root)
        const t = -b / (2*a);
        if (t >= 0 - eps && t <= 1 + eps) {
            const px = x1 + t*dx;
            const py = y1 + t*dy;
            results.push([px, py]);
        }
    } else {
        const sqrtD = Math.sqrt(discriminant);
        const t1 = (-b + sqrtD) / (2*a);
        const t2 = (-b - sqrtD) / (2*a);
        [t1, t2].forEach(t => {
            if (t >= 0 - eps && t <= 1 + eps) {
                const px = x1 + t*dx;
                const py = y1 + t*dy;
                // avoid near-duplicates
                if (!results.some(p => Math.hypot(p[0]-px, p[1]-py) < 1e-5)) {
                    results.push([px, py]);
                }
            }
        });
    }
    return results;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.use();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Draw circle (filled triangle fan) if exists
    if (circle) {
        shader.setVec4("u_color", [0.0, 0.6, 0.8, 0.35]); // semi-transparent fill
        gl.bufferData(gl.ARRAY_BUFFER, circle.vertices, gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        // triangle fan: center + circle outline
        gl.drawArrays(gl.TRIANGLE_FAN, 0, circle.vertices.length / 2);
        // draw circle outline (optional): same vertices but as LINE_LOOP
        shader.setVec4("u_color", [0.0, 0.6, 0.8, 1.0]);
        gl.drawArrays(gl.LINE_STRIP, 1, (circle.vertices.length / 2) - 1);
    }

    // Draw finalized line segment
    if (lineSegment) {
        shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]); // red
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineSegment), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // Draw temporary item during drawing
    if (isDrawing && startPoint && tempPoint) {
        if (mode === 'circle') {
            // draw temporary radius circle (outline only)
            const dx = tempPoint[0] - startPoint[0];
            const dy = tempPoint[1] - startPoint[1];
            const r = Math.sqrt(dx*dx + dy*dy);
            const segs = 64;
            const tmpVerts = [];
            for (let i = 0; i <= segs; i++) {
                const theta = (i / segs) * Math.PI * 2;
                tmpVerts.push(startPoint[0] + Math.cos(theta)*r, startPoint[1] + Math.sin(theta)*r);
            }
            shader.setVec4("u_color", [0.7, 0.7, 0.7, 1.0]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmpVerts), gl.DYNAMIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_STRIP, 0, tmpVerts.length / 2);
        } else if (mode === 'line') {
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempPoint]), gl.DYNAMIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }

    // Draw intersections as points
    if (intersections && intersections.length > 0) {
        const pts = [];
        for (let p of intersections) {
            pts.push(p[0], p[1]);
        }
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // yellow points
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, pts.length / 2);
    }

    // draw axes last
    axes.draw(mat4.create(), mat4.create());
}

async function initShader() {
    const vs = await readShaderFile('shVert.glsl');
    const fs = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vs, fs);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        await initShader();
        setupBuffers();
        shader.use();

        // Text overlays
        textOverlay = setupText(canvas, "No circle yet. Click+drag to create circle (center -> drag).", 1);
        textOverlay2 = setupText(canvas, "Then draw a line segment (click+drag).", 2);
        textOverlay3 = setupText(canvas, "Intersection info will appear here.", 3);

        setupMouseEvents();
        render();

        return true;
    } catch (err) {
        console.error(err);
        alert('초기화 실패: ' + err.message);
        return false;
    }
}
