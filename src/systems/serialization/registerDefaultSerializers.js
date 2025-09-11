import * as THREE from 'three';
import { Asteroid } from '../../Asteroid.js';
import { NPCShip } from '../../NPCShip.js';
import { Planet } from '../../Planet.js';
import { SpaceStation } from '../../SpaceStation.js';

export function registerDefaultSerializers(sectorManager) {
  // Asteroid
  sectorManager.registerSerializer('asteroid', {
    save(obj) { return { ...obj.serializeState() }; },
    load(state) {
      const pos = state.position;
      const asteroid = new Asteroid(new THREE.Vector3(pos.x, pos.y, pos.z), state.size);
      asteroid.health = state.health;
      if (asteroid.health <= 0) asteroid.isDestroyed = true;
      return asteroid;
    }
  });

  // NPC Ship
  sectorManager.registerSerializer('npcShip', {
    save(obj) { return { ...obj.serializeState() }; },
    load(state) {
      const pos = state.position;
      const npc = new NPCShip(
        new THREE.Vector3(pos.x, pos.y, pos.z),
        state.name || 'Derelict Cruiser',
        state.conversation || null
      );
      npc.health = state.health;
      npc.maxHealth = state.maxHealth;
      npc.destroyed = state.destroyed;

      // Load NPC flags if available
      if (state.npcFlags) {
        npc.npcFlags = { ...npc.npcFlags, ...state.npcFlags };
      }

      // Load patrol data if available
      if (state.patrolWaypoints && state.patrolWaypoints.length > 0) {
        npc.setPatrolWaypoints(state.patrolWaypoints);
        npc.currentWaypointIndex = state.currentWaypointIndex || 0;
        npc.patrolActive = state.patrolActive || false;
      }

      if (npc.destroyed && npc.mesh.parent) npc.mesh.parent.remove(npc.mesh);
      return npc;
    }
  });

  // Planet
  sectorManager.registerSerializer('planet', {
    save(obj) { return { ...obj.serializeState() }; },
    load(state) {
      const pos = state.position;
      const planet = new Planet(state.radius, new THREE.Vector3(pos.x, pos.y, pos.z), state.color, state.name, state.greeting);
      planet.rotationSpeed = state.rotationSpeed ?? planet.rotationSpeed;
      planet.dockable = state.dockable !== undefined ? state.dockable : true;
      return planet;
    }
  });

  // Space Station
  sectorManager.registerSerializer('station', {
    save(obj) { return { ...obj.serializeState() }; },
    load(state, context) {
      // Need to attach to its planet; planet may not yet exist if load order differs.
      // Defer planet resolution until after all loads if necessary via context hook.
      const findPlanet = (name) => context?.planets?.find(p => p.getName && p.getName() === name);
      let planet = findPlanet(state.planetName);
      if (!planet) {
        // Create a dummy small planet placeholder (will be replaced if real one appears)
        planet = new Planet(10, new THREE.Vector3(0,0,0), 0x555555, state.planetName || 'Host');
        context?.planets?.push && context.planets.push(planet);
      }
      const station = new SpaceStation(planet, { orbitRadius: state.orbitRadius, size: state.size, name: state.name, orbitSpeed: state.orbitSpeed });
      station.angle = state.angle || station.angle;
      return station;
    }
  });
}
