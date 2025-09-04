// Generates an equirectangular (sphere map) starfield texture (random white dots on black)
// Usage: import and call generateStarfieldEquirectTexture(size, starCount)
export function generateStarfieldEquirectTexture(size = 2048, starCount = 4000) {
  const canvas = document.createElement('canvas');
  canvas.width = size * 2; // Equirectangular: width = 2 * height
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < starCount; i++) {
    // Uniformly sample points on a sphere and convert to equirectangular
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u; // longitude
    const phi = Math.acos(2 * v - 1); // latitude
    // Equirectangular projection
    const x = Math.floor((theta / (2 * Math.PI)) * canvas.width);
    const y = Math.floor((phi / Math.PI) * canvas.height);
    // Random brightness for dimness (alpha between 0.3 and 1.0)
    const alpha = 0.3 + 0.7 * Math.random();
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    ctx.fillRect(x, y, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
// Generates a simple starfield image (1px white dots on black) for use as a skybox or background
// Usage: import and call generateStarfieldTexture(renderer)
import * as THREE from 'three';

export function generateStarfieldTexture(renderer, size = 1024, starCount = 2000) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'white';
  for (let i = 0; i < starCount; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    ctx.fillRect(x, y, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
