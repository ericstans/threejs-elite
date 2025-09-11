// Unified Cargo Items - replaces both Resources and Commodities
export const CARGO_ITEMS = {
  // Raw Materials (can be mined or traded)
  'Iron Ore': {
    name: 'Iron Ore',
    category: 'raw_materials',
    description: 'Basic metal ore used in construction',
    color: '#8B4513', // Brown
    icon: 'fa-solid fa-mountain', // FontAwesome mountain icon
    rarity: 0.3, // Mining rarity (higher = more common)
    buyPrice: 50, // Price when buying from station
    sellPrice: 40, // Price when selling to station
    canMine: true, // Can be collected in space
    canTrade: true // Can be bought/sold at stations
  },
  'Copper Ore': {
    name: 'Copper Ore',
    category: 'raw_materials',
    description: 'Conductive metal ore for electronics',
    color: '#B87333', // Bronze
    icon: 'fa-solid fa-mountain', // FontAwesome mountain icon
    rarity: 0.25,
    buyPrice: 75,
    sellPrice: 60,
    canMine: true,
    canTrade: true
  },
  'Gold Ore': {
    name: 'Gold Ore',
    category: 'raw_materials',
    description: 'Precious metal ore for high-end applications',
    color: '#FFD700', // Gold
    icon: 'fa-solid fa-mountain', // FontAwesome mountain icon
    rarity: 0.01, // Very rare when mining
    buyPrice: 200,
    sellPrice: 160,
    canMine: true,
    canTrade: true
  },
  'Platinum Ore': {
    name: 'Platinum Ore',
    category: 'raw_materials',
    description: 'Rare metal ore for advanced technology',
    color: '#E5E4E2', // Platinum
    icon: 'fa-solid fa-mountain', // FontAwesome mountain icon
    rarity: 0.005, // Extremely rare when mining
    buyPrice: 500,
    sellPrice: 400,
    canMine: true,
    canTrade: true
  },
  'Carbon': {
    name: 'Carbon',
    category: 'raw_materials',
    description: 'Basic element for organic compounds',
    color: '#2F2F2F', // Dark grey
    icon: 'fa-solid fa-mountain', // FontAwesome mountain icon
    rarity: 0.4, // Very common when mining
    buyPrice: 20,
    sellPrice: 15,
    canMine: true,
    canTrade: true
  },
  'Silicon': {
    name: 'Silicon',
    category: 'raw_materials',
    description: 'Essential for electronics and glass',
    color: '#708090', // Slate grey
    icon: 'fa-solid fa-mountain', // FontAwesome mountain icon
    rarity: 0.35,
    buyPrice: 30,
    sellPrice: 25,
    canMine: true,
    canTrade: true
  },
  'Aluminum': {
    name: 'Aluminum',
    category: 'raw_materials',
    description: 'Lightweight metal for construction',
    color: '#C0C0C0', // Silver
    icon: 'fa-solid fa-mountain', // FontAwesome mountain icon
    rarity: 0.2,
    buyPrice: 40,
    sellPrice: 32,
    canMine: true,
    canTrade: true
  },
  'Titanium': {
    name: 'Titanium',
    category: 'raw_materials',
    description: 'Strong, lightweight metal for aerospace',
    color: '#E6E6FA', // Lavender
    icon: 'fa-solid fa-mountain', // FontAwesome mountain icon
    rarity: 0.08,
    buyPrice: 150,
    sellPrice: 120,
    canMine: true,
    canTrade: true
  },

  // Processed Materials (only available through trading)
  'Steel Ingots': {
    name: 'Steel Ingots',
    category: 'processed_materials',
    description: 'Refined steel ready for manufacturing',
    color: '#C0C0C0', // Silver
    icon: 'fa-solid fa-cube', // FontAwesome cube icon
    rarity: 0, // Cannot be mined
    buyPrice: 120,
    sellPrice: 96,
    canMine: false,
    canTrade: true
  },
  'Electronics': {
    name: 'Electronics',
    category: 'processed_materials',
    description: 'Basic electronic components',
    color: '#00FF00', // Green
    icon: 'fa-solid fa-microchip', // FontAwesome microchip icon
    rarity: 0,
    buyPrice: 300,
    sellPrice: 240,
    canMine: false,
    canTrade: true
  },
  'Advanced Circuits': {
    name: 'Advanced Circuits',
    category: 'processed_materials',
    description: 'High-tech electronic circuits',
    color: '#00AA00', // Dark green
    icon: 'fa-solid fa-microchip', // FontAwesome microchip icon
    rarity: 0,
    buyPrice: 800,
    sellPrice: 640,
    canMine: false,
    canTrade: true
  },

  // Food and Consumables (only available through trading)
  'Food Rations': {
    name: 'Food Rations',
    category: 'consumables',
    description: 'Basic nutritional sustenance',
    color: '#FFA500', // Orange
    icon: 'fa-solid fa-utensils', // FontAwesome utensils icon
    rarity: 0,
    buyPrice: 25,
    sellPrice: 20,
    canMine: false,
    canTrade: true
  },
  'Medical Supplies': {
    name: 'Medical Supplies',
    category: 'consumables',
    description: 'Essential medical equipment and drugs',
    color: '#FF69B4', // Hot pink
    icon: 'fa-solid fa-medkit', // FontAwesome medkit icon
    rarity: 0,
    buyPrice: 150,
    sellPrice: 120,
    canMine: false,
    canTrade: true
  },
  'Luxury Goods': {
    name: 'Luxury Goods',
    category: 'consumables',
    description: 'High-end consumer products',
    color: '#FFD700', // Gold
    icon: 'fa-solid fa-gem', // FontAwesome gem icon
    rarity: 0,
    buyPrice: 1000,
    sellPrice: 800,
    canMine: false,
    canTrade: true
  },

  // Energy and Fuel (can be mined or traded)
  'Energy Cells': {
    name: 'Energy Cells',
    category: 'energy',
    description: 'Portable energy storage units',
    color: '#00FFFF', // Cyan
    icon: 'fa-solid fa-battery-full', // FontAwesome battery icon
    rarity: 0.15,
    buyPrice: 100,
    sellPrice: 80,
    canMine: true,
    canTrade: true
  },
  'Fuel Rods': {
    name: 'Fuel Rods',
    category: 'energy',
    description: 'Nuclear fuel for power generation',
    color: '#FF4500', // Orange red
    icon: 'fa-solid fa-fire', // FontAwesome fire icon
    rarity: 0.05,
    buyPrice: 250,
    sellPrice: 200,
    canMine: true,
    canTrade: true
  },

  // Technology (only available through trading)
  'Data Chips': {
    name: 'Data Chips',
    category: 'technology',
    description: 'Information storage and processing units',
    color: '#9370DB', // Purple
    icon: 'fa-solid fa-memory', // FontAwesome memory icon
    rarity: 0,
    buyPrice: 400,
    sellPrice: 320,
    canMine: false,
    canTrade: true
  },
  'Quantum Processors': {
    name: 'Quantum Processors',
    category: 'technology',
    description: 'Advanced computing components',
    color: '#FF00FF', // Magenta
    icon: 'fa-solid fa-microchip', // FontAwesome microchip icon
    rarity: 0,
    buyPrice: 2000,
    sellPrice: 1600,
    canMine: false,
    canTrade: true
  }
};

// Get all cargo item names
export function getAllCargoItemNames() {
  return Object.keys(CARGO_ITEMS);
}

// Get cargo item by name
export function getCargoItem(name) {
  return CARGO_ITEMS[name];
}

// Get cargo items by category
export function getCargoItemsByCategory(category) {
  return Object.values(CARGO_ITEMS).filter(item => item.category === category);
}

// Get all categories
export function getAllCategories() {
  const categories = new Set();
  Object.values(CARGO_ITEMS).forEach(item => {
    categories.add(item.category);
  });
  return Array.from(categories);
}

// Get items that can be mined
export function getMineableItems() {
  return Object.values(CARGO_ITEMS).filter(item => item.canMine);
}

// Get items that can be traded
export function getTradeableItems() {
  return Object.values(CARGO_ITEMS).filter(item => item.canTrade);
}

// Get random mineable item based on rarity
export function getRandomMineableItem() {
  const mineableItems = getMineableItems();
  const random = Math.random();
  let cumulative = 0;

  for (const item of mineableItems) {
    cumulative += item.rarity;
    if (random <= cumulative) {
      return item;
    }
  }

  // Fallback to most common item
  return mineableItems.find(item => item.rarity === Math.max(...mineableItems.map(i => i.rarity)));
}

// Create cargo item instance for cargo bay
export function createCargoItem(itemName, source = 'unknown') {
  const itemData = getCargoItem(itemName);
  if (!itemData) return null;

  return {
    id: `cargo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: itemData.name,
    category: itemData.category,
    description: itemData.description,
    color: itemData.color,
    icon: itemData.icon,
    rarity: itemData.rarity,
    buyPrice: itemData.buyPrice,
    sellPrice: itemData.sellPrice,
    canMine: itemData.canMine,
    canTrade: itemData.canTrade,
    source: source, // 'mined', 'purchased', 'unknown'
    collectedAt: Date.now()
  };
}
