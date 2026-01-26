export const WEAPON_TYPES = {
    LASER: "Laser",
    PLASMA: "Plasma",
    MISSILE: "Missile",
    FLAK: "Flak"
}

export const SHIP_EQUIPMENT = {
  WEAPONS: {
    "Laser 1": {
      type: WEAPON_TYPES.LASER,
      damage: 1,
      velocity: 100, // units per second
      cooldown: 0.5, // seconds
      range: 300, // units
      description: "It's better than nothing. Suitable for light mining work.",
      cost: 500
    },
    "Laser 2": {
      type: WEAPON_TYPES.LASER,
      damage: 2,
      velocity: 110, // units per second
      cooldown: 0.8, // seconds
      range: 350, // units
      description: "Improved laser.",
      cost: 3500
    },
    "Laser 3": {
      type: WEAPON_TYPES.LASER,
      damage: 3,
      velocity: 120, // units per second
      cooldown: 1, // seconds
      range: 400, // units
      description: "More improved laser.",
      cost: 10000
    }
  },
  HULLS: {
    "Light Hull": {
        armor: 10,
        speed: 1.2, // affects max speed
        maneuverability: 1.1, // affects turn rate
        description: "Lightweight hull for increased top speed and turning.",
        cost: 2000
    },
    "Medium Hull": {
        armor: 15,
        speed: 1.0,
        maneuverability: 1.0,
        description: "Stock hull.", 
        cost: 2500
    },
    "Heavy Hull": {
      armor: 20,
        speed: 0.8,
        maneuverability: 0.9,
        description: "Heavy hull for protection against serious threats.",
        cost: 5000
    }
  },
  THRUSTERS: {
    "Basic Thrusters": {
        thrust: 1.0, // affects acceleration
        maneuverability: 1.0, // affects turn rate
        description: "Stock thrusters.",
        cost: 3000
    },
    "Premium Thrusters": {
        thrust: 1.2,
        maneuverability: 1.1,
        description: "Enhanced thrusters.",
        cost: 7000
        }
    }
}
