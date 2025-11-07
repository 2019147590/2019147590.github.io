/*--------------------------------------------------------------------------------
hw08.js (20_DirectionalLight.js 기반 수정)

- Toon Shading 구현
- 'a' 키로 카메라/모델 회전 모드 전환 [cite: 11]
- 'r' 키로 arcball 및 toon level 리셋 [cite: 5]
- '1'-'5' 키로 toon shading level 변경 
- Shading mode는 항상 SMOOTH로 고정 
----------------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Arcball } from '../util/arcball.js';
import { Cylinder } from '../util/cylinder.js';
import { loadTexture } from '../util/texture.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let textOverlay2;
let textOverlay3;
let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let arcBallMode = 'CAMERA';     // 'CAMERA' or 'MODEL' [cite: 11]
let toonLevels = 3;             // Toon shading levels (1-5) [cite: 4, 6]

const cylinder = new Cylinder(gl, 32);
const axes = new Axes(gl, 1.5);
const texture = loadTexture(gl, true, '../images/textures/sunrise.jpg');

const cameraPos = vec3.fromValues(0, 0, 3); [cite: 13]
const lightDirection = vec3.fromValues(1.0, 0.25, 0.5); // 
const shininess = 32.0;

const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key == 'a') { [cite: 11]
            if (arcBallMode == 'CAMERA') {
                arcBallMode = 'MODEL';
            }
            else {
                arcBallMode = 'CAMERA';
            }
            updateText(textOverlay2, "arcball mode: " + arcBallMode);
        }
        else if (event.key == 'r') { [cite: 5]
            arcball.reset();
            modelMatrix = mat4.create(); 
            arcBallMode = 'CAMERA';
            toonLevels = 3; // Toon level도 리셋
            updateText(textOverlay2, "arcball mode: " + arcBallMode);
            updateText(textOverlay3, "toon levels: " + toonLevels);
        }
        else if (event.key >= '1' && event.key <= '5') { [cite: 6]
            toonLevels = parseInt(event.key);
            updateText(textOverlay3, "toon levels: " + toonLevels);
        }
        // 's'와 'f' 키 이벤트 제거 (항상 smooth shading) 
    });
}

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700; [cite: 8]
    canvas.height = 700; [cite: 8]
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    // clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    if (arcBallMode == 'CAMERA') {
        viewMatrix = arcball.getViewMatrix();
    }
    else { // arcBallMode == 'MODEL'
        modelMatrix = arcball.getModelRotMatrix();
        viewMatrix = arcball.getViewCamDistanceMatrix();
    }

    // drawing the cylinder
    shader.use();  // using the cylinder's shader
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setVec3('u_viewPos', cameraPos);
    shader.setInt('u_toonLevels', toonLevels); // Toon level uniform 전송
    cylinder.draw(shader);

    // drawing the axes (using the axes's shader: see util.js)
    axes.draw(viewMatrix, projMatrix);

    // call the render function the next time for animation
    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        // View transformation matrix (camera at cameraPos, invariant in the program)
        mat4.lookAt(
            viewMatrix, 
            cameraPos, 
            vec3.fromValues(0, 0, 0), 
            vec3.fromValues(0, 1, 0)
        );

        // Projection transformation matrix (invariant in the program)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            100.0 // far
        );

        // creating shaders
        await initShader();

        shader.use();
        shader.setMat4("u_projection", projMatrix);
        shader.setVec3("light.direction", lightDirection); // 
        shader.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
        shader.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
        shader.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
        shader.setInt("material.diffuse", 0);
        shader.setVec3("material.specular", vec3.fromValues(0.8, 0.8, 0.8));
        shader.setFloat("material.shininess", shininess);
        shader.setVec3("u_viewPos", cameraPos);

        // bind the texture to the shader
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_D, texture);

        // 항상 smooth shading을 사용하도록 설정 
        cylinder.copyVertexNormalsToNormals();
        cylinder.updateNormals();

        // Setup text overlays [cite: 2, 3, 4, 5, 6]
        setupText(canvas, "TOON SHADING", 1); [cite: 2]
        textOverlay2 = setupText(canvas, "arcball mode: " + arcBallMode, 2); [cite: 3]
        textOverlay3 = setupText(canvas, "toon levels: " + toonLevels, 3); [cite: 4]
        setupText(canvas, "press a/r to change/reset arcball mode", 4); [cite: 5]
        setupText(canvas, "press 1-5 toa change toon shading levels", 5); [cite: 6]

        setupKeyboardEvents();

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}