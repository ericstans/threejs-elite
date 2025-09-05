import * as THREE from 'three';
import { Asteroid } from '../../Asteroid.js';
import { NPCShip } from '../../NPCShip.js';

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
      const npc = new NPCShip(new THREE.Vector3(pos.x, pos.y, pos.z));
      npc.health = state.health;
      npc.maxHealth = state.maxHealth;
      npc.destroyed = state.destroyed;
      if (npc.destroyed && npc.mesh.parent) npc.mesh.parent.remove(npc.mesh);
      return npc;
    }
  });
}
