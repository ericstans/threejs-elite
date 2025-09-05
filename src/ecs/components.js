// Minimal component constructors. Simple objects keep GC cheap.
import * as THREE from 'three';

export function Position(x=0,y=0,z=0) { return { position: new THREE.Vector3(x,y,z) }; }
export function Velocity(x=0,y=0,z=0) { return { velocity: new THREE.Vector3(x,y,z) }; }
export function Orientation() { return { quaternion: new THREE.Quaternion(), euler: new THREE.Euler() }; }
export function AngularVelocity(x=0,y=0,z=0) { return { angularVelocity: new THREE.Vector3(x,y,z) }; }
export function Renderable(mesh) { return { mesh }; }
export function RadarSignature(sig=1) { return { radarSignature: sig }; }
export function Dockable(kind='station') { return { dockable: true, dockKind: kind }; }
export function NameTag(name) { return { name }; }
export function Mass(mass) { return { mass }; }
export function Health(hp,maxHp=hp) { return { hp, maxHp }; }
