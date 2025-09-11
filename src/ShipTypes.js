// ShipTypes.js
// Central registry for all ship types

export const ShipTypes = {
  Flea: {
    name: 'Flea',
    model: 'ship2.fbx',
    scale: 1.0, // can be adjusted if needed
    exhaust: 'default', // placeholder for exhaust config
    stats: {
      maxSpeed: 10,
      acceleration: 2,
      rotationSpeed: 1
    }
  },
  Arrow: {
    name: 'Arrow',
    model: 'ship1.fbx',
    scale: 1.0,
    exhaust: 'default',
    stats: {
      maxSpeed: 10,
      acceleration: 2,
      rotationSpeed: 1
    }
  }
};

export function getShipType(typeName) {
  return ShipTypes[typeName] || ShipTypes.Flea;
}
