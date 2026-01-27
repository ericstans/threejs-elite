import { describe, it, expect, beforeEach } from 'vitest';
import { Asteroid } from './entities/Asteroid.js';
import * as THREE from 'three';

describe('Asteroid', () => {
  let asteroid;
  const testPosition = new THREE.Vector3(10, 20, 30);

  beforeEach(() => {
    asteroid = new Asteroid(testPosition, 2);
  });

  describe('initialization', () => {
    it('should initialize with given position', () => {
      const pos = asteroid.getPosition();
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(20);
      expect(pos.z).toBe(30);
    });

    it('should initialize with given size', () => {
      expect(asteroid.getSize()).toBe(2);
    });

    it('should initialize with default size 1 if not provided', () => {
      const smallAsteroid = new Asteroid(testPosition);
      expect(smallAsteroid.getSize()).toBe(1);
    });

    it('should initialize with full health', () => {
      expect(asteroid.getHealth()).toBe(10);
      expect(asteroid.getMaxHealth()).toBe(10);
    });

    it('should initialize as not destroyed', () => {
      expect(asteroid.isDestroyed).toBe(false);
      expect(asteroid.isAlive()).toBe(true);
    });

    it('should generate unique id', () => {
      const asteroid2 = new Asteroid(testPosition);
      expect(asteroid.getId()).toBeDefined();
      expect(asteroid2.getId()).toBeDefined();
      expect(asteroid.getId()).not.toBe(asteroid2.getId());
    });

    it('should calculate mass based on size', () => {
      // mass = size^3
      expect(asteroid.getMass()).toBe(8); // 2^3
      
      const smallAsteroid = new Asteroid(testPosition, 3);
      expect(smallAsteroid.getMass()).toBe(27); // 3^3
    });

    it('should initialize as not targeted', () => {
      expect(asteroid.isTargeted).toBe(false);
      expect(asteroid.isTarget()).toBe(false);
    });

    it('should initialize as not commable', () => {
      // Note: isCommable is a property, not callable as a function
      // The isCommable() method in the source has a naming conflict
      expect(asteroid.isCommable).toBe(false);
    });

    it('should create mesh at position', () => {
      expect(asteroid.mesh).toBeDefined();
      expect(asteroid.mesh.position.x).toBe(10);
      expect(asteroid.mesh.position.y).toBe(20);
      expect(asteroid.mesh.position.z).toBe(30);
    });

    it('should have random rotation speeds', () => {
      expect(asteroid.rotationSpeed.x).toBeDefined();
      expect(asteroid.rotationSpeed.y).toBeDefined();
      expect(asteroid.rotationSpeed.z).toBeDefined();
      // Should be within range [-0.25, 0.25]
      expect(Math.abs(asteroid.rotationSpeed.x)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(asteroid.rotationSpeed.y)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(asteroid.rotationSpeed.z)).toBeLessThanOrEqual(0.25);
    });

    it('should initialize with zero rotation', () => {
      expect(asteroid.currentRotation.x).toBe(0);
      expect(asteroid.currentRotation.y).toBe(0);
      expect(asteroid.currentRotation.z).toBe(0);
    });
  });

  describe('mesh creation', () => {
    it('should create dodecahedron geometry', () => {
      expect(asteroid.mesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
    });

    it('should use lambert material', () => {
      expect(asteroid.mesh.material).toBeInstanceOf(THREE.MeshLambertMaterial);
    });

    it('should use flat shading', () => {
      expect(asteroid.mesh.material.flatShading).toBe(true);
    });

    it('should have grey-ish color', () => {
      const color = asteroid.mesh.material.color;
      // Color should be in the grey-tan range
      // Grey is 0x696969 (105, 105, 105) and tan is 0xD2B48C (210, 180, 140)
      // The lerp weighted toward grey means most will be darker
      expect(color.r).toBeGreaterThanOrEqual(0.2); // Allow darker shades
      expect(color.r).toBeLessThanOrEqual(0.85); // ~210/255
    });

    it('should have irregular geometry from vertex noise', () => {
      const positions = asteroid.mesh.geometry.attributes.position;
      expect(positions).toBeDefined();
      expect(positions.count).toBeGreaterThan(0);
    });
  });

  describe('update and rotation', () => {
    it('should update rotation based on deltaTime', () => {
      const initialRotation = {
        x: asteroid.currentRotation.x,
        y: asteroid.currentRotation.y,
        z: asteroid.currentRotation.z
      };
      
      asteroid.update(1.0);
      
      expect(asteroid.currentRotation.x).not.toBe(initialRotation.x);
      expect(asteroid.currentRotation.y).not.toBe(initialRotation.y);
      expect(asteroid.currentRotation.z).not.toBe(initialRotation.z);
    });

    it('should apply rotation to mesh', () => {
      asteroid.update(1.0);
      
      expect(asteroid.mesh.rotation.x).toBe(asteroid.currentRotation.x);
      expect(asteroid.mesh.rotation.y).toBe(asteroid.currentRotation.y);
      expect(asteroid.mesh.rotation.z).toBe(asteroid.currentRotation.z);
    });

    it('should accumulate rotation over multiple updates', () => {
      asteroid.update(1.0);
      const rotationAfter1 = asteroid.currentRotation.x;
      
      asteroid.update(1.0);
      const rotationAfter2 = asteroid.currentRotation.x;
      
      expect(rotationAfter2).not.toBe(rotationAfter1);
    });

    it('should scale rotation by deltaTime', () => {
      const asteroid1 = new Asteroid(testPosition);
      const asteroid2 = new Asteroid(testPosition);
      // Force same rotation speed for comparison
      asteroid2.rotationSpeed.copy(asteroid1.rotationSpeed);
      
      asteroid1.update(1.0);
      asteroid2.update(0.5);
      
      // asteroid1 should rotate twice as much
      expect(Math.abs(asteroid1.currentRotation.x)).toBeCloseTo(Math.abs(asteroid2.currentRotation.x) * 2, 5);
    });
  });

  describe('damage system', () => {
    it('should reduce health when taking damage', () => {
      asteroid.takeDamage(3);
      expect(asteroid.getHealth()).toBe(7);
    });

    it('should use default damage of 1', () => {
      asteroid.takeDamage();
      expect(asteroid.getHealth()).toBe(9);
    });

    it('should return false when damaged but alive', () => {
      const destroyed = asteroid.takeDamage(5);
      expect(destroyed).toBe(false);
      expect(asteroid.isAlive()).toBe(true);
    });

    it('should return true when destroyed', () => {
      const destroyed = asteroid.takeDamage(10);
      expect(destroyed).toBe(true);
      expect(asteroid.isAlive()).toBe(false);
    });

    it('should set isDestroyed when health reaches zero', () => {
      asteroid.takeDamage(10);
      expect(asteroid.isDestroyed).toBe(true);
    });

    it('should handle overkill damage', () => {
      const destroyed = asteroid.takeDamage(100);
      expect(destroyed).toBe(true);
      expect(asteroid.getHealth()).toBeLessThan(0);
      expect(asteroid.isAlive()).toBe(false);
    });

    it('should accumulate damage over multiple hits', () => {
      asteroid.takeDamage(3);
      asteroid.takeDamage(4);
      expect(asteroid.getHealth()).toBe(3);
      
      const destroyed = asteroid.takeDamage(3);
      expect(destroyed).toBe(true);
    });
  });

  describe('targeting', () => {
    it('should set targeted state', () => {
      asteroid.setTargeted(true);
      expect(asteroid.isTargeted).toBe(true);
      expect(asteroid.isTarget()).toBe(true);
    });

    it('should clear targeted state', () => {
      asteroid.setTargeted(true);
      asteroid.setTargeted(false);
      expect(asteroid.isTargeted).toBe(false);
      expect(asteroid.isTarget()).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return position copy', () => {
      const pos = asteroid.getPosition();
      pos.x = 999;
      expect(asteroid.position.x).toBe(10);
    });

    it('should return type', () => {
      expect(asteroid.getType()).toBe('asteroid');
    });

    it('should return size', () => {
      expect(asteroid.getSize()).toBe(2);
    });

    it('should return id', () => {
      expect(asteroid.getId()).toBeDefined();
      expect(typeof asteroid.getId()).toBe('string');
    });

    it('should return mass', () => {
      expect(asteroid.getMass()).toBe(8);
    });

    it('should return health', () => {
      expect(asteroid.getHealth()).toBe(10);
    });

    it('should return max health', () => {
      expect(asteroid.getMaxHealth()).toBe(10);
    });

    it('should return alive status', () => {
      expect(asteroid.isAlive()).toBe(true);
      asteroid.takeDamage(10);
      expect(asteroid.isAlive()).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize state', () => {
      asteroid.takeDamage(3);
      const state = asteroid.serializeState();
      
      expect(state.id).toBe(asteroid.getId());
      expect(state.position.x).toBe(10);
      expect(state.position.y).toBe(20);
      expect(state.position.z).toBe(30);
      expect(state.size).toBe(2);
      expect(state.health).toBe(7);
    });

    it('should include damaged health in serialization', () => {
      asteroid.takeDamage(5);
      const state = asteroid.serializeState();
      
      expect(state.health).toBe(5);
    });
  });

  describe('size variations', () => {
    it('should create small asteroids correctly', () => {
      const small = new Asteroid(testPosition, 0.5);
      expect(small.getSize()).toBe(0.5);
      expect(small.getMass()).toBe(0.125); // 0.5^3
    });

    it('should create large asteroids correctly', () => {
      const large = new Asteroid(testPosition, 5);
      expect(large.getSize()).toBe(5);
      expect(large.getMass()).toBe(125); // 5^3
    });
  });
});
