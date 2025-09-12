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
 * @param {THREE.Color|number|string} color - Optional color for the material. If not provided, generates a random color.
 * @returns {THREE.Material} Standard ship material
 */
export function createShipBodyMaterial(color = null) {
  // Generate random color if none provided
  if (!color) {
    const randomHue = Math.random() * 360; // Random hue from 0-360
    const saturation = 0.6; // Moderate saturation for good visibility
    const lightness = 0.5;  // Moderate lightness for good contrast
    color = new THREE.Color().setHSL(randomHue / 360, saturation, lightness);
  }
  
  return new THREE.MeshStandardMaterial({
    color: color,           // Random or provided color
    metalness: 0.3,         // Moderate metallic look
    roughness: 0.4,         // Moderate roughness
    emissive: 0x111111,     // Slight glow
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide
  });
}

/**
 * Creates a shiny metallic material for cannon parts
 * @returns {THREE.Material} Shiny metallic material
 */
export function createCannonMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x888888,        // Medium gray
    metalness: 0.9,         // Very metallic
    roughness: 0.1,         // Very smooth/shiny
    emissive: 0x000000,     // No glow
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide,
    envMapIntensity: 1.0    // Full environment map reflection
  });
}

/**
 * Creates a darker metallic material for engine parts
 * @returns {THREE.Material} Dark metallic material
 */
export function createEngineMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x444444,        // Dark gray
    metalness: 0.8,         // High metallic look
    roughness: 0.3,         // Moderate roughness
    emissive: 0x111111,     // Slight glow
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.8    // High environment map reflection
  });
}

/**
 * Replaces materials with custom materials based on their names
 * @param {THREE.Object3D} model - The 3D model to process
 */
export function replaceCockpitMaterials(model) {
  // Generate a unique random color for this ship
  const randomHue = Math.random() * 360; // Random hue from 0-360
  const saturation = 0.6; // Moderate saturation for good visibility
  const lightness = 0.5;  // Moderate lightness for good contrast
  const shipColor = new THREE.Color().setHSL(randomHue / 360, saturation, lightness);
  
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Handle array of materials
      if (Array.isArray(child.material)) {
        child.material.forEach((material, index) => {
          console.log(`Found material: "${material.name}" at index ${index}`);
          
          if (material.name === 'Cockpit') {
            child.material[index] = createGlassyCockpitMaterial();
            console.log(`Replaced Cockpit material at index ${index} with glassy blue material`);
          } else if (material.name === 'Shipbody') {
            child.material[index] = createShipBodyMaterial(shipColor);
            console.log(`Replaced Shipbody material at index ${index} with random color material`);
          } else if (material.name === 'Cannon') {
            child.material[index] = createCannonMaterial();
            console.log(`Replaced Cannon material at index ${index} with shiny metallic material`);
          } else if (material.name === 'Engine') {
            child.material[index] = createEngineMaterial();
            console.log(`Replaced Engine material at index ${index} with dark metallic material`);
          }
        });
      } 
      // Handle single material
      else if (child.material) {
        console.log(`Found single material: "${child.material.name}"`);
        
        if (child.material.name === 'Cockpit') {
          child.material = createGlassyCockpitMaterial();
          console.log('Replaced single Cockpit material with glassy blue material');
        } else if (child.material.name === 'Shipbody') {
          child.material = createShipBodyMaterial(shipColor);
          console.log('Replaced single Shipbody material with random color material');
        } else if (child.material.name === 'Cannon') {
          child.material = createCannonMaterial();
          console.log('Replaced single Cannon material with shiny metallic material');
        } else if (child.material.name === 'Engine') {
          child.material = createEngineMaterial();
          console.log('Replaced single Engine material with dark metallic material');
        }
      }
    }
  });
}
