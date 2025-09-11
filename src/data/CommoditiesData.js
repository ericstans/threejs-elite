// Commodity definitions with base prices
export const COMMODITIES = {
  // Raw Materials
  'Iron Ore': {
    name: 'Iron Ore',
    buyPrice: 50,
    sellPrice: 40,
    category: 'raw_materials',
    description: 'Basic metal ore used in construction'
  },
  'Copper Ore': {
    name: 'Copper Ore',
    buyPrice: 75,
    sellPrice: 60,
    category: 'raw_materials',
    description: 'Conductive metal ore for electronics'
  },
  'Gold Ore': {
    name: 'Gold Ore',
    buyPrice: 200,
    sellPrice: 160,
    category: 'raw_materials',
    description: 'Precious metal ore for high-end applications'
  },
  'Platinum Ore': {
    name: 'Platinum Ore',
    buyPrice: 500,
    sellPrice: 400,
    category: 'raw_materials',
    description: 'Rare metal ore for advanced technology'
  },

  // Processed Materials
  'Steel Ingots': {
    name: 'Steel Ingots',
    buyPrice: 120,
    sellPrice: 96,
    category: 'processed_materials',
    description: 'Refined steel ready for manufacturing'
  },
  'Electronics': {
    name: 'Electronics',
    buyPrice: 300,
    sellPrice: 240,
    category: 'processed_materials',
    description: 'Basic electronic components'
  },
  'Advanced Circuits': {
    name: 'Advanced Circuits',
    buyPrice: 800,
    sellPrice: 640,
    category: 'processed_materials',
    description: 'High-tech electronic circuits'
  },

  // Food and Consumables
  'Food Rations': {
    name: 'Food Rations',
    buyPrice: 25,
    sellPrice: 20,
    category: 'consumables',
    description: 'Basic nutritional sustenance'
  },
  'Medical Supplies': {
    name: 'Medical Supplies',
    buyPrice: 150,
    sellPrice: 120,
    category: 'consumables',
    description: 'Essential medical equipment and drugs'
  },
  'Luxury Goods': {
    name: 'Luxury Goods',
    buyPrice: 1000,
    sellPrice: 800,
    category: 'consumables',
    description: 'High-end consumer products'
  },

  // Energy and Fuel
  'Energy Cells': {
    name: 'Energy Cells',
    buyPrice: 100,
    sellPrice: 80,
    category: 'energy',
    description: 'Portable energy storage units'
  },
  'Fuel Rods': {
    name: 'Fuel Rods',
    buyPrice: 250,
    sellPrice: 200,
    category: 'energy',
    description: 'Nuclear fuel for power generation'
  },

  // Technology
  'Data Chips': {
    name: 'Data Chips',
    buyPrice: 400,
    sellPrice: 320,
    category: 'technology',
    description: 'Information storage and processing units'
  },
  'Quantum Processors': {
    name: 'Quantum Processors',
    buyPrice: 2000,
    sellPrice: 1600,
    category: 'technology',
    description: 'Advanced computing components'
  }
};

// Get all commodity names
export function getAllCommodityNames() {
  return Object.keys(COMMODITIES);
}

// Get commodity by name
export function getCommodity(name) {
  return COMMODITIES[name];
}

// Get commodities by category
export function getCommoditiesByCategory(category) {
  return Object.values(COMMODITIES).filter(commodity => commodity.category === category);
}

// Get all categories
export function getAllCategories() {
  const categories = new Set();
  Object.values(COMMODITIES).forEach(commodity => {
    categories.add(commodity.category);
  });
  return Array.from(categories);
}
