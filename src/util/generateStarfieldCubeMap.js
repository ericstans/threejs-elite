// Generates a procedural starfield cubemap (six canvas images with white dots on black)
// Usage: import and call generateStarfieldCubeMap(renderer, size, starCount)
import * as THREE from 'three';
import { generateStarfieldTexture } from './generateStarfieldTexture.js';

export function generateStarfieldCubeMap(renderer, size = 1024, starCount = 2000) {
  // Use generateStarfieldTexture to create each face as a CanvasTexture
  const faces = [];
  for (let i = 0; i < 6; i++) {
    faces.push(generateStarfieldTexture(renderer, size, starCount));
  }
  // Extract the .image (canvas) from each CanvasTexture for CubeTexture
  const cubeTexture = new THREE.CubeTexture(faces.map(tex => tex.image));
  cubeTexture.needsUpdate = true;
  cubeTexture.minFilter = THREE.LinearFilter;
  cubeTexture.magFilter = THREE.NearestFilter;
  return cubeTexture;
}
