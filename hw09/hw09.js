// hw09.js
[cite_start]// This program fulfills the requirements for Homework 09 [cite: 1]

import * as THREE from 'three';
// Import necessary add-ons
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; [cite_start]// [cite: 11]
import Stats from 'three/addons/libs/stats.module.js'; [cite_start]// [cite: 11]
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'; [cite_start]// [cite: 9, 10]

let scene, renderer, perspectiveCamera, orthographicCamera, currentCamera;
let stats, orbitControls, gui;
const planets = []; // To store planet objects for animation

[cite_start]// Store planet speeds in an object for GUI control [cite: 4, 5, 6, 7]
const planetParams = {
    Mercury: { rotationSpeed: 0.02, orbitSpeed: 0.02 },
    Venus: { rotationSpeed: 0.015, orbitSpeed: 0.015 },
    Earth: { rotationSpeed: 0.01, orbitSpeed: 0.01 },
    Mars: { rotationSpeed: 0.008, orbitSpeed: 0.008 }
};

// Initialize and animate
init();
animate();

function init() {
    // === Basic Scene Setup ===
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000); // Black background
    document.body.appendChild(renderer.domElement);

    [cite_start]// === Cameras (Requirement 8) === [cite: 10]
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

    [cite_start]// === Stats and OrbitControls (Requirement 9) === [cite: 11]
    stats = new Stats();
    document.body.appendChild(stats.dom);

    orbitControls = new OrbitControls(currentCamera, renderer.domElement);
    orbitControls.enableDamping = true;

    // === Lighting ===
    // Use a PointLight at the center to act as the sun's light
    const pointLight = new THREE.PointLight(0xffffff, 3, 0);
    scene.add(pointLight);
    // Add a dim ambient light to see the "dark side" of planets
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // === Texture Loader ===
    const textureLoader = new THREE.TextureLoader();

    // === Create Celestial Bodies ===

    [cite_start]// 1) Sun [cite: 3]
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32); // radius: 10
    // Use MeshBasicMaterial for the sun so it's bright yellow and unaffected by light
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    [cite_start]// 2-5) Planets [cite: 4, 5, 6, 7, 8]
    // We pass the params object by reference to link it with the GUI
    createPlanet('Mercury', 1.5, 20, textureLoader.load('Mercury.jpg'), planetParams.Mercury);
    createPlanet('Venus', 3, 35, textureLoader.load('Venus.jpg'), planetParams.Venus);
    createPlanet('Earth', 3.5, 50, textureLoader.load('Earth.jpg'), planetParams.Earth);
    createPlanet('Mars', 2.5, 65, textureLoader.load('Mars.jpg'), planetParams.Mars);

    [cite_start]// === Setup GUI (Requirements 7, 8) === [cite: 9, 10]
    setupGUI();

    // === Window Resize Handler ===
    window.addEventListener('resize', onWindowResize);
}

/**
 * Helper function to create a planet with its orbit pivot.
 * Uses the "scene graph" parenting technique from 18-scene-graph.js
 */
function createPlanet(name, radius, distance, texture, params) {
    // 1. Create the planet's geometry and material
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ map: texture }); [cite_start]// [cite: 8]
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
 * [cite_start]Sets up the lil-gui controls [cite: 9, 10]
 */
function setupGUI() {
    gui = new GUI();

    [cite_start]// 8) Camera UI Folder [cite: 10]
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

    [cite_start]// 7) Planet UI Folders [cite: 9]
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
    orbitControls.update(); [cite_start]// [cite: 11]
    stats.update();         [cite_start]// [cite: 11]

    // Render the scene with the currently active camera
    renderer.render(scene, currentCamera);
}