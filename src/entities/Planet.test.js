import { describe, it, expect, beforeEach } from 'vitest';
import { Planet } from './entities/Planet.js';
import * as THREE from 'three';

describe('Planet', () => {
  let planet;
  const testPosition = new THREE.Vector3(100, 200, 300);

  beforeEach(() => {
    planet = new Planet(
      10, // radius
      testPosition,
      0x8B4513, // brown color
      'Test Planet',
      'Welcome to Test Planet',
      ['refuel+repair', 'trading']
    );
  });

  describe('initialization', () => {
    it('should initialize with given radius', () => {
      expect(planet.radius).toBe(10);
    });

    it('should initialize with given position', () => {
      const pos = planet.getPosition();
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
      expect(pos.z).toBe(300);
    });

    it('should initialize with given color', () => {
      expect(planet.color).toBe(0x8B4513);
    });

    it('should initialize with given name', () => {
      expect(planet.getName()).toBe('Test Planet');
    });

    it('should initialize with given greeting', () => {
      expect(planet.getGreeting()).toBe('Welcome to Test Planet');
    });

    it('should initialize with given services', () => {
      expect(planet.getServices()).toEqual(['refuel+repair', 'trading']);
    });

    it('should use default values when not provided', () => {
      const defaultPlanet = new Planet();
      expect(defaultPlanet.radius).toBe(1);
      expect(defaultPlanet.getName()).toBe('Planet');
      expect(defaultPlanet.getGreeting()).toBe('Thank you for contacting us.');
      expect(defaultPlanet.getServices()).toEqual(['refuel+repair']);
    });

    it('should initialize rotation values', () => {
      expect(planet.rotationSpeed).toBe(0.1);
      expect(planet.currentRotation).toBe(0);
    });

    it('should generate unique id', () => {
      const planet2 = new Planet();
      expect(planet.getId()).toBeDefined();
      expect(planet2.getId()).toBeDefined();
      expect(planet.getId()).not.toBe(planet2.getId());
    });

    it('should calculate mass based on radius', () => {
      // mass = radius^3 * 1000
      expect(planet.getMass()).toBe(1000000); // 10^3 * 1000

      const smallPlanet = new Planet(5);
      expect(smallPlanet.getMass()).toBe(125000); // 5^3 * 1000
    });

    it('should initialize as not nav targeted', () => {
      expect(planet.isNavTargeted).toBe(false);
      expect(planet.isNavTarget()).toBe(false);
    });

    it('should initialize as commable', () => {
      // Note: isCommable property is shadowed by the method
      // Access via hasOwnProperty to verify the property exists
      expect(Object.getOwnPropertyDescriptor(planet, 'isCommable')).toBeDefined();
      expect(planet.isCommable).toBe(true);
    });

    it('should initialize as dockable', () => {
      expect(planet.dockable).toBe(true);
    });

    it('should initialize with no moon', () => {
      expect(planet.moon).toBeNull();
    });

    it('should create mesh at position', () => {
      expect(planet.mesh).toBeDefined();
      expect(planet.mesh.position.x).toBe(100);
      expect(planet.mesh.position.y).toBe(200);
      expect(planet.mesh.position.z).toBe(300);
    });
  });

  describe('mesh creation', () => {
    it('should create sphere geometry with given radius', () => {
      expect(planet.mesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
      // Sphere geometry should have the specified radius
      const positions = planet.mesh.geometry.attributes.position;
      expect(positions).toBeDefined();
    });

    it('should use lambert material', () => {
      expect(planet.mesh.material).toBeInstanceOf(THREE.MeshLambertMaterial);
    });

    it('should use given color', () => {
      expect(planet.mesh.material.color.getHex()).toBe(0x8B4513);
    });

    it('should use flat shading', () => {
      expect(planet.mesh.material.flatShading).toBe(true);
    });
  });

  describe('mesh delegate methods', () => {
    it('should delegate getId from mesh', () => {
      expect(planet.mesh.getId()).toBe(planet.getId());
    });

    it('should delegate getName from mesh', () => {
      expect(planet.mesh.getName()).toBe('Test Planet');
    });

    it('should delegate getMass from mesh', () => {
      expect(planet.mesh.getMass()).toBe(planet.getMass());
    });

    it('should delegate getPosition from mesh', () => {
      const pos = planet.mesh.getPosition();
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
      expect(pos.z).toBe(300);
    });

    it('should delegate getType from mesh', () => {
      expect(planet.mesh.getType()).toBe('planet');
    });

    it('should delegate setNavTargeted from mesh', () => {
      planet.mesh.setNavTargeted(true);
      expect(planet.isNavTargeted).toBe(true);
    });

    it('should delegate isNavTarget from mesh', () => {
      planet.setNavTargeted(true);
      expect(planet.mesh.isNavTarget()).toBe(true);
    });
  });

  describe('update and rotation', () => {
    it('should update rotation based on deltaTime', () => {
      const initialRotation = planet.currentRotation;

      planet.update(1.0);

      expect(planet.currentRotation).not.toBe(initialRotation);
      expect(planet.currentRotation).toBe(0.1); // rotationSpeed * deltaTime
    });

    it('should apply rotation to mesh', () => {
      planet.update(1.0);

      expect(planet.mesh.rotation.y).toBe(planet.currentRotation);
    });

    it('should accumulate rotation over multiple updates', () => {
      planet.update(1.0);
      const rotationAfter1 = planet.currentRotation;

      planet.update(1.0);
      const rotationAfter2 = planet.currentRotation;

      expect(rotationAfter2).toBe(rotationAfter1 + 0.1);
    });

    it('should scale rotation by deltaTime', () => {
      const planet1 = new Planet();
      const planet2 = new Planet();
      planet2.rotationSpeed = planet1.rotationSpeed; // Ensure same speed

      planet1.update(1.0);
      planet2.update(0.5);

      expect(planet1.currentRotation).toBeCloseTo(planet2.currentRotation * 2, 5);
    });

    it('should handle custom rotation speed', () => {
      planet.rotationSpeed = 0.5;
      planet.update(1.0);

      expect(planet.currentRotation).toBe(0.5);
    });
  });

  describe('navigation targeting', () => {
    it('should set nav targeted state', () => {
      planet.setNavTargeted(true);
      expect(planet.isNavTargeted).toBe(true);
      expect(planet.isNavTarget()).toBe(true);
    });

    it('should clear nav targeted state', () => {
      planet.setNavTargeted(true);
      planet.setNavTargeted(false);
      expect(planet.isNavTargeted).toBe(false);
      expect(planet.isNavTarget()).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return position copy', () => {
      const pos = planet.getPosition();
      pos.x = 999;
      expect(planet.position.x).toBe(100);
    });

    it('should return type', () => {
      expect(planet.getType()).toBe('planet');
    });

    it('should return id', () => {
      expect(planet.getId()).toBeDefined();
      expect(typeof planet.getId()).toBe('string');
    });

    it('should return name', () => {
      expect(planet.getName()).toBe('Test Planet');
    });

    it('should return mass', () => {
      expect(planet.getMass()).toBe(1000000);
    });

    it('should return greeting', () => {
      expect(planet.getGreeting()).toBe('Welcome to Test Planet');
    });

    it('should return services', () => {
      expect(planet.getServices()).toEqual(['refuel+repair', 'trading']);
    });

    it('should return commable status', () => {
      // Note: isCommable property is shadowed by the method
      expect(planet.isCommable).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should serialize state', () => {
      const state = planet.serializeState();

      expect(state.id).toBe(planet.getId());
      expect(state.name).toBe('Test Planet');
      expect(state.radius).toBe(10);
      expect(state.color).toBe(0x8B4513);
      expect(state.greeting).toBe('Welcome to Test Planet');
      expect(state.rotationSpeed).toBe(0.1);
      expect(state.position.x).toBe(100);
      expect(state.position.y).toBe(200);
      expect(state.position.z).toBe(300);
      expect(state.dockable).toBe(true);
    });

    it('should serialize dockable property', () => {
      planet.dockable = false;
      const state = planet.serializeState();

      expect(state.dockable).toBe(false);
    });
  });

  describe('moon support', () => {
    it('should allow setting moon', () => {
      const moon = new Planet(2, new THREE.Vector3(120, 200, 300), 0xCCCCCC, 'Test Moon');
      planet.moon = moon;

      expect(planet.moon).toBe(moon);
      expect(planet.moon.getName()).toBe('Test Moon');
    });

    it('should serialize without moon reference', () => {
      const moon = new Planet(2);
      planet.moon = moon;

      const state = planet.serializeState();
      // Moon is not included in serialization
      expect(state.moon).toBeUndefined();
    });
  });

  describe('size variations', () => {
    it('should create small planets correctly', () => {
      const small = new Planet(3, testPosition);
      expect(small.radius).toBe(3);
      expect(small.getMass()).toBe(27000); // 3^3 * 1000
    });

    it('should create large planets correctly', () => {
      const large = new Planet(20, testPosition);
      expect(large.radius).toBe(20);
      expect(large.getMass()).toBe(8000000); // 20^3 * 1000
    });
  });

  describe('dockability', () => {
    it('should allow changing dockable status', () => {
      expect(planet.dockable).toBe(true);
      planet.dockable = false;
      expect(planet.dockable).toBe(false);
    });
  });

  describe('service variations', () => {
    it('should support no services', () => {
      const noServicePlanet = new Planet(5, testPosition, 0xFF0000, 'Barren', 'No services here', []);
      expect(noServicePlanet.getServices()).toEqual([]);
    });

    it('should support single service', () => {
      const singleServicePlanet = new Planet(5, testPosition, 0xFF0000, 'Fuel Station', 'Fuel only', ['refuel']);
      expect(singleServicePlanet.getServices()).toEqual(['refuel']);
    });

    it('should support multiple services', () => {
      const multiServicePlanet = new Planet(5, testPosition, 0xFF0000, 'Hub', 'Full service', ['refuel+repair', 'trading', 'jobs', 'shipyard']);
      expect(multiServicePlanet.getServices()).toEqual(['refuel+repair', 'trading', 'jobs', 'shipyard']);
    });
  });
});
