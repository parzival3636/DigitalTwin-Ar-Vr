import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#three-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load 3D Models (Airplane + Desert Airport)
const loader = new GLTFLoader();
let airplane, airport;

loader.load('/DIGITWINARVR/assets/airplane.glb', (gltf) => {
  airplane = gltf.scene;
  airplane.position.set(0, 10, 0);
  scene.add(airplane);
});

loader.load('/DIGITWINARVR/assets/desert_airport.glb', (gltf) => {
  airport = gltf.scene;
  airport.position.set(0, 0, 0);
  scene.add(airport);
});

// Light & Environment
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// Camera Position
camera.position.z = 30;

// Weather API Fetch from Flask Backend
async function fetchWeatherData() {
  const response = await fetch('http://localhost:5000/api/weather', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ location: 'Mumbai' })  // Dynamic location can be passed here
  });

  const data = await response.json();
  const weatherCondition = data.weather[0].main;

  // Apply weather effects in 3D scene
  if (weatherCondition === 'Rain') {
    scene.fog = new THREE.Fog(0x111111, 1, 50);
  } else if (weatherCondition === 'Clear') {
    light.intensity = 1.5;
  } else if (weatherCondition === 'Storm') {
    scene.fog = new THREE.Fog(0x000000, 1, 20);
  }
}

fetchWeatherData();

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  if (airplane) airplane.rotation.y += 0.01; // Airplane rotation effect
  renderer.render(scene, camera);
}

animate();
