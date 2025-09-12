import * as THREE from 'three';

/**
 * Utility functions for ship material management
 */

/**
 * Creates a glassy blue material for cockpit windows
 * @returns {THREE.Material} Glassy blue material
 */
export function createGlassyCockpitMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x4444ff,        // Blue tint
    metalness: 0.1,         // Slight metallic look
    roughness: 0.1,         // Very smooth/glossy
    transmission: 0.8,      // High transparency
    opacity: 0.8,           // Semi-transparent
    transparent: true,
    clearcoat: 1.0,         // Clear coat for extra shine
    clearcoatRoughness: 0.0, // Perfectly smooth clear coat
    ior: 1.5,               // Index of refraction for glass
    reflectivity: 0.9,      // High reflectivity
    envMapIntensity: 1.0,   // Full environment map reflection
    side: THREE.DoubleSide   // Render both sides
  });
}

/**
 * Creates a standard opaque material for ship body parts
 * @returns {THREE.Material} Standard ship material
 */
export function createShipBodyMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xcccccc,        // Light gray
    metalness: 0.3,         // Moderate metallic look
    roughness: 0.4,         // Moderate roughness
    emissive: 0x111111,     // Slight glow
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide
  });
}

/**
 * Replaces materials named "Cockpit" with glassy blue material and "Shipbody" with standard material
 * @param {THREE.Object3D} model - The 3D model to process
 */
export function replaceCockpitMaterials(model) {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Handle array of materials
      if (Array.isArray(child.material)) {
        child.material.forEach((material, index) => {
          if (material.name === 'Cockpit') {
            child.material[index] = createGlassyCockpitMaterial();
            console.log(`Replaced Cockpit material at index ${index} with glassy blue material`);
          } else if (material.name === 'Shipbody') {
            child.material[index] = createShipBodyMaterial();
            console.log(`Replaced Shipbody material at index ${index} with standard material`);
          }
        });
      } 
      // Handle single material
      else if (child.material) {
        if (child.material.name === 'Cockpit') {
          child.material = createGlassyCockpitMaterial();
          console.log('Replaced single Cockpit material with glassy blue material');
        } else if (child.material.name === 'Shipbody') {
          child.material = createShipBodyMaterial();
          console.log('Replaced single Shipbody material with standard material');
        }
      }
    }
  });
}
