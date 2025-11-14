// hw09.js
// This program fulfills the requirements for Homework 09
// (Final version - Uses MeshBasicMaterial, NO lighting required, Sun bug fixed)

import * as THREE from 'three';
// Import necessary add-ons
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let scene, renderer, perspectiveCamera, orthographicCamera, currentCamera;
let stats, orbitControls, gui;
const planets = []; // To store planet objects for animation

// Store planet speeds in an object for GUI control
const planetParams = {
    Mercury: { rotationSpeed: 0.02, orbitSpeed: 0.02 },
    Venus: { rotationSpeed: 0.015, orbitSpeed: 0.015 },
    Earth: { rotationSpeed: 0.01, orbitSpeed: 0.01 },
    Mars: { rotationSpeed: 0.008, orbitSpeed: 0.008 }
};

// --- Function Definitions ---

function init() {
    // === Basic Scene Setup ===
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000); // Black background
    document.body.appendChild(renderer.domElement);

    // === Cameras (Requirement 8) ===
    const aspect = window.innerWidth / window.innerHeight;
    
    // Perspective Camera
    perspectiveCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    perspectiveCamera.position.set(0, 100, 150);
    perspectiveCamera.lookAt(0, 0, 0);

    // Orthographic Camera
    const frustumSize = 150;
    orthographicCamera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        2000
    );
    orthographicCamera.position.set(0, 100, 0); // Top-down view
    orthographicCamera.lookAt(0, 0, 0);

    currentCamera = perspectiveCamera; // Start with perspective

    // === Stats and OrbitControls (Requirement 9) ===
    stats = new Stats();
    document.body.appendChild(stats.dom);

    orbitControls = new OrbitControls(currentCamera, renderer.domElement);
    orbitControls.enableDamping = true;

    // === Lighting (Now Optional) ===
    const pointLight = new THREE.PointLight(0xffffff, 3, 0);
    scene.add(pointLight);
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // === Texture Loader ===
    const textureLoader = new THREE.TextureLoader();

    // === Create Celestial Bodies ===

    // 1) Sun
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32); // radius: 10
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    //
    // ▼▼▼ BUG FIX ▼▼▼
    // 'material' -> 'sunMaterial'
    //
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial); 
    scene.add(sunMesh);

    // 2-5) Planets
    createPlanet('Mercury', 1.5, 20, textureLoader.load('Mercury.jpg'), planetParams.Mercury);
    createPlanet('Venus', 3, 35, textureLoader.load('Venus.jpg'), planetParams.Venus);
    createPlanet('Earth', 3.5, 50, textureLoader.load('Earth.jpg'), planetParams.Earth);
    createPlanet('Mars', 2.5, 65, textureLoader.load('Mars.jpg'), planetParams.Mars);

    // === Setup GUI (Requirements 7, 8) ===
    setupGUI();

    // === Window Resize Handler ===
    window.addEventListener('resize', onWindowResize);
}

/**
 * Helper function to create a planet with its orbit pivot.
 */
function createPlanet(name, radius, distance, texture, params) {
    // 1. Create the planet's geometry and material
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({ map: texture }); 
    const mesh = new THREE.Mesh(geometry, material);

    // 2. Position the planet mesh *away* from its orbit center
    mesh.position.x = distance;

    // 3. Create an invisible pivot object at the center (0,0,0)
    const pivot = new THREE.Object3D();
    
    // 4. Add the planet mesh to the pivot
    pivot.add(mesh);

    // 5. Add the pivot to the scene
    scene.add(pivot);

    // 6. Store the mesh and pivot for animation
    planets.push({
        name: name,
        mesh: mesh,     // The planet itself (for self-rotation)
        pivot: pivot,   // The orbit pivot (for orbiting)
        params: params  // The GUI-controlled parameters
    });
}

/**
 * Sets up the lil-gui controls
 */
function setupGUI() {
    gui = new GUI();

    // 8) Camera UI Folder
    const cameraFolder = gui.addFolder('Camera');
    const cameraControl = { type: 'Perspective' };
    cameraFolder.add(cameraControl, 'type', ['Perspective', 'Orthographic'])
        .name('Switch Camera type')
        .onChange((value) => {
            if (value === 'Perspective') {
                currentCamera = perspectiveCamera;
            } else {
                currentCamera = orthographicCamera;
            }
            // IMPORTANT: Update OrbitControls to use the new camera
            orbitControls.object = currentCamera;
            orbitControls.update();
        });

    // 7) Planet UI Folders
    for (const planetName in planetParams) {
        const folder = gui.addFolder(planetName);
        const params = planetParams[planetName];
        
        // Add sliders for rotation and orbit speed
        folder.add(params, 'rotationSpeed', 0, 0.1, 0.001).name('Rotation Speed');
        folder.add(params, 'orbitSpeed', 0, 0.1, 0.001).name('Orbit Speed');
    }
}

/**
 * Handles window resize events.
 */
function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    // Update Perspective Camera
    perspectiveCamera.aspect = aspect;
    perspectiveCamera.updateProjectionMatrix();

    // Update Orthographic Camera
    const frustumSize = 150;
    orthographicCamera.left = frustumSize * aspect / -2;
    orthographicCamera.right = frustumSize * aspect / 2;
    orthographicCamera.top = frustumSize / 2;
    orthographicCamera.bottom = frustumSize / -2;
    orthographicCamera.updateProjectionMatrix();

    // Update Renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * The main animation loop.
 */
function animate() {
    requestAnimationFrame(animate);

    // Animate all planets
    planets.forEach(planet => {
        // 1. Self-rotation (rotate the mesh itself)
        planet.mesh.rotation.y += planet.params.rotationSpeed;
        
        // 2. Orbit (rotate the pivot object)
        planet.pivot.rotation.y += planet.params.orbitSpeed;
    });

    // Update controls and stats
    orbitControls.update();
    stats.update();

    // Render the scene with the currently active camera
    renderer.render(scene, currentCamera);
}

// --- Program Execution ---
// Start the program after all functions are defined.
init();
animate();
