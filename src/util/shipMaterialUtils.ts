import * as THREE from 'three';

const DEBUG = false;

/**
 * Utility functions for ship material management
 */

/**
 * Creates a glassy blue material for cockpit windows
 * @returns {THREE.Material} Glassy blue material
 */
export function createGlassyCockpitMaterial(): THREE.Material {
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
export function createShipBodyMaterial(color?: THREE.Color | number | string | null): THREE.Material {
  // Generate random color if none provided
  if (!color) {
    const randomHue = Math.random() * 360; // Random hue from 0-360
    const saturation = 0.9;  // Very high saturation for vibrant colors
    const lightness = 0.5;   // Medium lightness for good visibility
    color = new THREE.Color().setHSL(randomHue / 360, saturation, lightness);
  }

  // Create emissive color that's 30% of the base color for enhanced glow
  const baseColor = color instanceof THREE.Color ? color : new THREE.Color(color);
  const emissiveColor = baseColor.clone().multiplyScalar(0.3);

  return new THREE.MeshStandardMaterial({
    color: baseColor,       // Random or provided color
    metalness: 0.2,         // Lower metalness to show more base color
    roughness: 0.6,         // Higher roughness to show less environment reflection
    emissive: emissiveColor, // Subtle glow matching the base color
    emissiveIntensity: 0.3, // Increased glow intensity
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide
  });
}

/**
 * Creates a shiny metallic material for cannon parts
 * @returns {THREE.Material} Shiny metallic material
 */
export function createCannonMaterial(): THREE.Material {
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
export function createEngineMaterial(): THREE.Material {
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
export function replaceCockpitMaterials(model: THREE.Object3D): void {
  // Generate a unique random color for this ship with increased vibrancy
  const randomHue = Math.random() * 360; // Random hue from 0-360
  const saturation = 0.9;  // Very high saturation for vibrant colors
  const lightness = 0.5;   // Medium lightness for good visibility
  const shipColor = new THREE.Color().setHSL(randomHue / 360, saturation, lightness);

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Handle array of materials
      if (Array.isArray(child.material)) {
        child.material.forEach((material, index) => {
          if (DEBUG) console.log(`Found material: "${material.name}" at index ${index}`);

          if (material.name === 'Cockpit') {
            child.material[index] = createGlassyCockpitMaterial();
            if (DEBUG) console.log(`Replaced Cockpit material at index ${index} with glassy blue material`);
          } else if (material.name === 'Shipbody') {
            child.material[index] = createShipBodyMaterial(shipColor);
            if (DEBUG) console.log(`Replaced Shipbody material at index ${index} with random color material`);
          } else if (material.name === 'Cannon') {
            child.material[index] = createCannonMaterial();
            if (DEBUG) console.log(`Replaced Cannon material at index ${index} with shiny metallic material`);
          } else if (material.name === 'Engine') {
            child.material[index] = createEngineMaterial();
            if (DEBUG) console.log(`Replaced Engine material at index ${index} with dark metallic material`);
          }
        });
      }
      // Handle single material
      else if (child.material) {
        if (DEBUG) console.log(`Found single material: "${(child.material as THREE.Material).name}"`);

        if ((child.material as THREE.Material).name === 'Cockpit') {
          child.material = createGlassyCockpitMaterial();
          if (DEBUG) console.log('Replaced single Cockpit material with glassy blue material');
        } else if ((child.material as THREE.Material).name === 'Shipbody') {
          child.material = createShipBodyMaterial(shipColor);
          if (DEBUG) console.log('Replaced single Shipbody material with random color material');
        } else if ((child.material as THREE.Material).name === 'Cannon') {
          child.material = createCannonMaterial();
          if (DEBUG) console.log('Replaced single Cannon material with shiny metallic material');
        } else if ((child.material as THREE.Material).name === 'Engine') {
          child.material = createEngineMaterial();
          if (DEBUG) console.log('Replaced single Engine material with dark metallic material');
        }
      }
    }
  });
}
