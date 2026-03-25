export const PRIMARY_CROP_OPTIONS = [
  { key: "paddy", label: "Paddy" },
  { key: "wheat", label: "Wheat" },
  { key: "barley", label: "Barley" },
  { key: "corn", label: "Corn" },
  { key: "sorghum", label: "Sorghum" },
  { key: "millet", label: "Millet" },
  { key: "oats", label: "Oats" },
  { key: "chickpea", label: "Chickpea" },
  { key: "black-gram", label: "Black Gram" },
  { key: "green-gram", label: "Green Gram" },
  { key: "groundnut", label: "Groundnut" },
  { key: "soybean", label: "Soybean" },
  { key: "mustard", label: "Mustard" },
  { key: "sunflower", label: "Sunflower" },
  { key: "cotton", label: "Cotton" },
  { key: "turmeric", label: "Turmeric" },
  { key: "vegetables", label: "Vegetables" }
];

export const VEGETABLE_CROP_OPTIONS = [
  { key: "tomato", label: "Tomato" },
  { key: "onion", label: "Onion" },
  { key: "potato", label: "Potato" },
  { key: "brinjal", label: "Brinjal" },
  { key: "okra", label: "Okra" },
  { key: "chilli", label: "Chilli" },
  { key: "cabbage", label: "Cabbage" },
  { key: "cauliflower", label: "Cauliflower" },
  { key: "carrot", label: "Carrot" },
  { key: "cucumber", label: "Cucumber" },
  { key: "spinach", label: "Spinach" },
  { key: "beans", label: "Beans" },
  { key: "peas", label: "Peas" },
  { key: "bottle-gourd", label: "Bottle Gourd" },
  { key: "pumpkin", label: "Pumpkin" }
];

export const CROP_CATALOG = {
  paddy: {
    label: "Paddy",
    family: "Cereal",
    thresholdProfileKey: "paddy",
    estimatedGrowCost: 32000,
    marketPrice: 2400,
    marketUnit: "per quintal",
    moistureRange: [22, 38],
    phRange: [5.4, 7.2],
    temperatureRange: [20, 32],
    conductivityRange: [80, 260],
    minHealthScore: 48
  },
  wheat: {
    label: "Wheat",
    family: "Cereal",
    thresholdProfileKey: "wheat",
    estimatedGrowCost: 26000,
    marketPrice: 2450,
    marketUnit: "per quintal",
    moistureRange: [18, 28],
    phRange: [6.0, 7.6],
    temperatureRange: [14, 25],
    conductivityRange: [90, 250],
    minHealthScore: 50
  },
  barley: {
    label: "Barley",
    family: "Cereal",
    thresholdProfileKey: "wheat",
    estimatedGrowCost: 23000,
    marketPrice: 2100,
    marketUnit: "per quintal",
    moistureRange: [16, 26],
    phRange: [6.0, 8.2],
    temperatureRange: [12, 24],
    conductivityRange: [80, 280],
    minHealthScore: 45
  },
  corn: {
    label: "Corn",
    family: "Cereal",
    thresholdProfileKey: "corn",
    estimatedGrowCost: 30000,
    marketPrice: 2250,
    marketUnit: "per quintal",
    moistureRange: [18, 30],
    phRange: [5.8, 7.5],
    temperatureRange: [18, 32],
    conductivityRange: [90, 270],
    minHealthScore: 52
  },
  sorghum: {
    label: "Sorghum",
    family: "Cereal",
    thresholdProfileKey: "corn",
    estimatedGrowCost: 28000,
    marketPrice: 2600,
    marketUnit: "per quintal",
    moistureRange: [16, 28],
    phRange: [5.8, 7.8],
    temperatureRange: [20, 34],
    conductivityRange: [90, 280],
    minHealthScore: 48
  },
  millet: {
    label: "Millet",
    family: "Cereal",
    thresholdProfileKey: "wheat",
    estimatedGrowCost: 22000,
    marketPrice: 3200,
    marketUnit: "per quintal",
    moistureRange: [14, 24],
    phRange: [5.8, 7.8],
    temperatureRange: [18, 32],
    conductivityRange: [80, 260],
    minHealthScore: 44
  },
  oats: {
    label: "Oats",
    family: "Cereal",
    thresholdProfileKey: "wheat",
    estimatedGrowCost: 25000,
    marketPrice: 2300,
    marketUnit: "per quintal",
    moistureRange: [16, 26],
    phRange: [6.0, 7.5],
    temperatureRange: [12, 24],
    conductivityRange: [85, 240],
    minHealthScore: 47
  },
  chickpea: {
    label: "Chickpea",
    family: "Pulse",
    thresholdProfileKey: "pulse",
    estimatedGrowCost: 24000,
    marketPrice: 6200,
    marketUnit: "per quintal",
    moistureRange: [14, 24],
    phRange: [6.0, 8.0],
    temperatureRange: [18, 30],
    conductivityRange: [80, 220],
    minHealthScore: 46
  },
  "black-gram": {
    label: "Black Gram",
    family: "Pulse",
    thresholdProfileKey: "pulse",
    estimatedGrowCost: 26000,
    marketPrice: 7600,
    marketUnit: "per quintal",
    moistureRange: [16, 26],
    phRange: [6.0, 7.8],
    temperatureRange: [22, 32],
    conductivityRange: [80, 220],
    minHealthScore: 48
  },
  "green-gram": {
    label: "Green Gram",
    family: "Pulse",
    thresholdProfileKey: "pulse",
    estimatedGrowCost: 25000,
    marketPrice: 7800,
    marketUnit: "per quintal",
    moistureRange: [16, 26],
    phRange: [6.0, 7.8],
    temperatureRange: [22, 32],
    conductivityRange: [80, 220],
    minHealthScore: 48
  },
  groundnut: {
    label: "Groundnut",
    family: "Oilseed",
    thresholdProfileKey: "oilseed",
    estimatedGrowCost: 30000,
    marketPrice: 5600,
    marketUnit: "per quintal",
    moistureRange: [16, 26],
    phRange: [5.8, 7.4],
    temperatureRange: [22, 32],
    conductivityRange: [85, 230],
    minHealthScore: 48
  },
  soybean: {
    label: "Soybean",
    family: "Oilseed",
    thresholdProfileKey: "oilseed",
    estimatedGrowCost: 28000,
    marketPrice: 4300,
    marketUnit: "per quintal",
    moistureRange: [18, 28],
    phRange: [6.0, 7.5],
    temperatureRange: [20, 32],
    conductivityRange: [85, 230],
    minHealthScore: 48
  },
  mustard: {
    label: "Mustard",
    family: "Oilseed",
    thresholdProfileKey: "oilseed",
    estimatedGrowCost: 23000,
    marketPrice: 5200,
    marketUnit: "per quintal",
    moistureRange: [14, 24],
    phRange: [6.0, 7.8],
    temperatureRange: [16, 28],
    conductivityRange: [80, 220],
    minHealthScore: 46
  },
  sunflower: {
    label: "Sunflower",
    family: "Oilseed",
    thresholdProfileKey: "oilseed",
    estimatedGrowCost: 26000,
    marketPrice: 5000,
    marketUnit: "per quintal",
    moistureRange: [16, 26],
    phRange: [6.0, 7.5],
    temperatureRange: [20, 32],
    conductivityRange: [85, 230],
    minHealthScore: 47
  },
  cotton: {
    label: "Cotton",
    family: "Fiber",
    thresholdProfileKey: "fiber",
    estimatedGrowCost: 34000,
    marketPrice: 7200,
    marketUnit: "per quintal",
    moistureRange: [16, 28],
    phRange: [5.8, 8.0],
    temperatureRange: [22, 34],
    conductivityRange: [90, 250],
    minHealthScore: 50
  },
  turmeric: {
    label: "Turmeric",
    family: "Spice",
    thresholdProfileKey: "spice",
    estimatedGrowCost: 62000,
    marketPrice: 8800,
    marketUnit: "per quintal",
    moistureRange: [20, 32],
    phRange: [5.8, 7.5],
    temperatureRange: [20, 32],
    conductivityRange: [90, 240],
    minHealthScore: 54
  },
  tomato: {
    label: "Tomato",
    family: "Vegetable",
    thresholdProfileKey: "fruitingVegetable",
    estimatedGrowCost: 52000,
    marketPrice: 1800,
    marketUnit: "per quintal",
    moistureRange: [20, 30],
    phRange: [6.0, 7.5],
    temperatureRange: [18, 30],
    conductivityRange: [90, 240],
    minHealthScore: 54
  },
  onion: {
    label: "Onion",
    family: "Vegetable",
    thresholdProfileKey: "rootVegetable",
    estimatedGrowCost: 46000,
    marketPrice: 2400,
    marketUnit: "per quintal",
    moistureRange: [16, 26],
    phRange: [6.0, 7.4],
    temperatureRange: [16, 28],
    conductivityRange: [90, 240],
    minHealthScore: 52
  },
  potato: {
    label: "Potato",
    family: "Vegetable",
    thresholdProfileKey: "rootVegetable",
    estimatedGrowCost: 48000,
    marketPrice: 2000,
    marketUnit: "per quintal",
    moistureRange: [18, 28],
    phRange: [5.2, 6.8],
    temperatureRange: [14, 24],
    conductivityRange: [80, 220],
    minHealthScore: 50
  },
  brinjal: {
    label: "Brinjal",
    family: "Vegetable",
    thresholdProfileKey: "fruitingVegetable",
    estimatedGrowCost: 42000,
    marketPrice: 2200,
    marketUnit: "per quintal",
    moistureRange: [18, 28],
    phRange: [5.8, 7.2],
    temperatureRange: [20, 32],
    conductivityRange: [90, 240],
    minHealthScore: 52
  },
  okra: {
    label: "Okra",
    family: "Vegetable",
    thresholdProfileKey: "fruitingVegetable",
    estimatedGrowCost: 39000,
    marketPrice: 2600,
    marketUnit: "per quintal",
    moistureRange: [18, 26],
    phRange: [6.0, 7.5],
    temperatureRange: [21, 33],
    conductivityRange: [90, 240],
    minHealthScore: 50
  },
  chilli: {
    label: "Chilli",
    family: "Vegetable",
    thresholdProfileKey: "fruitingVegetable",
    estimatedGrowCost: 68000,
    marketPrice: 9500,
    marketUnit: "per quintal",
    moistureRange: [16, 24],
    phRange: [6.0, 7.3],
    temperatureRange: [20, 30],
    conductivityRange: [90, 230],
    minHealthScore: 56
  },
  cabbage: {
    label: "Cabbage",
    family: "Vegetable",
    thresholdProfileKey: "leafyVegetable",
    estimatedGrowCost: 38000,
    marketPrice: 1400,
    marketUnit: "per quintal",
    moistureRange: [18, 30],
    phRange: [6.0, 7.4],
    temperatureRange: [14, 24],
    conductivityRange: [90, 220],
    minHealthScore: 50
  },
  cauliflower: {
    label: "Cauliflower",
    family: "Vegetable",
    thresholdProfileKey: "leafyVegetable",
    estimatedGrowCost: 41000,
    marketPrice: 1800,
    marketUnit: "per quintal",
    moistureRange: [18, 30],
    phRange: [6.0, 7.4],
    temperatureRange: [14, 24],
    conductivityRange: [90, 220],
    minHealthScore: 52
  },
  carrot: {
    label: "Carrot",
    family: "Vegetable",
    thresholdProfileKey: "rootVegetable",
    estimatedGrowCost: 44000,
    marketPrice: 2800,
    marketUnit: "per quintal",
    moistureRange: [18, 26],
    phRange: [5.8, 7.0],
    temperatureRange: [15, 25],
    conductivityRange: [80, 220],
    minHealthScore: 50
  },
  cucumber: {
    label: "Cucumber",
    family: "Vegetable",
    thresholdProfileKey: "fruitingVegetable",
    estimatedGrowCost: 36000,
    marketPrice: 1600,
    marketUnit: "per quintal",
    moistureRange: [20, 30],
    phRange: [5.8, 7.2],
    temperatureRange: [20, 30],
    conductivityRange: [90, 230],
    minHealthScore: 50
  },
  spinach: {
    label: "Spinach",
    family: "Vegetable",
    thresholdProfileKey: "leafyVegetable",
    estimatedGrowCost: 30000,
    marketPrice: 1200,
    marketUnit: "per quintal",
    moistureRange: [20, 30],
    phRange: [6.0, 7.5],
    temperatureRange: [14, 24],
    conductivityRange: [85, 220],
    minHealthScore: 48
  },
  beans: {
    label: "Beans",
    family: "Vegetable",
    thresholdProfileKey: "leafyVegetable",
    estimatedGrowCost: 35000,
    marketPrice: 4200,
    marketUnit: "per quintal",
    moistureRange: [18, 28],
    phRange: [6.0, 7.2],
    temperatureRange: [18, 28],
    conductivityRange: [90, 220],
    minHealthScore: 50
  },
  peas: {
    label: "Peas",
    family: "Vegetable",
    thresholdProfileKey: "leafyVegetable",
    estimatedGrowCost: 34000,
    marketPrice: 3800,
    marketUnit: "per quintal",
    moistureRange: [18, 28],
    phRange: [6.0, 7.2],
    temperatureRange: [15, 25],
    conductivityRange: [85, 220],
    minHealthScore: 50
  },
  "bottle-gourd": {
    label: "Bottle Gourd",
    family: "Vegetable",
    thresholdProfileKey: "fruitingVegetable",
    estimatedGrowCost: 33000,
    marketPrice: 1700,
    marketUnit: "per quintal",
    moistureRange: [20, 30],
    phRange: [6.0, 7.4],
    temperatureRange: [20, 32],
    conductivityRange: [90, 240],
    minHealthScore: 48
  },
  pumpkin: {
    label: "Pumpkin",
    family: "Vegetable",
    thresholdProfileKey: "fruitingVegetable",
    estimatedGrowCost: 31000,
    marketPrice: 1500,
    marketUnit: "per quintal",
    moistureRange: [18, 30],
    phRange: [6.0, 7.4],
    temperatureRange: [20, 32],
    conductivityRange: [90, 240],
    minHealthScore: 48
  }
};

export const CROP_THRESHOLD_PROFILES = {
  default: {
    nutrients: {
      N: { lowMax: 10, mediumMax: 25 },
      P: { lowMax: 15, mediumMax: 30 },
      K: { lowMax: 50, mediumMax: 150 }
    },
    ph: { min: 6.0, max: 7.5, warningBuffer: 0.4 },
    ec: { min: 80, max: 240, warningBuffer: 40 }
  },
  paddy: {
    nutrients: {
      N: { lowMax: 18, mediumMax: 40 },
      P: { lowMax: 14, mediumMax: 28 },
      K: { lowMax: 80, mediumMax: 160 }
    },
    ph: { min: 5.5, max: 6.8, warningBuffer: 0.4 },
    ec: { min: 70, max: 200, warningBuffer: 35 }
  },
  wheat: {
    nutrients: {
      N: { lowMax: 20, mediumMax: 42 },
      P: { lowMax: 16, mediumMax: 32 },
      K: { lowMax: 70, mediumMax: 150 }
    },
    ph: { min: 6.0, max: 7.5, warningBuffer: 0.4 },
    ec: { min: 80, max: 220, warningBuffer: 35 }
  },
  corn: {
    nutrients: {
      N: { lowMax: 22, mediumMax: 48 },
      P: { lowMax: 18, mediumMax: 34 },
      K: { lowMax: 90, mediumMax: 170 }
    },
    ph: { min: 5.8, max: 7.4, warningBuffer: 0.4 },
    ec: { min: 85, max: 240, warningBuffer: 40 }
  },
  fruitingVegetable: {
    nutrients: {
      N: { lowMax: 24, mediumMax: 52 },
      P: { lowMax: 20, mediumMax: 40 },
      K: { lowMax: 110, mediumMax: 220 }
    },
    ph: { min: 6.0, max: 7.2, warningBuffer: 0.4 },
    ec: { min: 90, max: 230, warningBuffer: 35 }
  },
  rootVegetable: {
    nutrients: {
      N: { lowMax: 18, mediumMax: 38 },
      P: { lowMax: 16, mediumMax: 32 },
      K: { lowMax: 105, mediumMax: 200 }
    },
    ph: { min: 5.8, max: 7.0, warningBuffer: 0.4 },
    ec: { min: 80, max: 210, warningBuffer: 30 }
  },
  leafyVegetable: {
    nutrients: {
      N: { lowMax: 22, mediumMax: 45 },
      P: { lowMax: 18, mediumMax: 36 },
      K: { lowMax: 95, mediumMax: 190 }
    },
    ph: { min: 6.0, max: 7.3, warningBuffer: 0.4 },
    ec: { min: 85, max: 220, warningBuffer: 35 }
  },
  pulse: {
    nutrients: {
      N: { lowMax: 14, mediumMax: 30 },
      P: { lowMax: 18, mediumMax: 36 },
      K: { lowMax: 75, mediumMax: 150 }
    },
    ph: { min: 6.0, max: 7.8, warningBuffer: 0.4 },
    ec: { min: 80, max: 220, warningBuffer: 35 }
  },
  oilseed: {
    nutrients: {
      N: { lowMax: 18, mediumMax: 36 },
      P: { lowMax: 18, mediumMax: 34 },
      K: { lowMax: 80, mediumMax: 165 }
    },
    ph: { min: 5.8, max: 7.6, warningBuffer: 0.4 },
    ec: { min: 85, max: 230, warningBuffer: 35 }
  },
  fiber: {
    nutrients: {
      N: { lowMax: 20, mediumMax: 44 },
      P: { lowMax: 18, mediumMax: 34 },
      K: { lowMax: 90, mediumMax: 180 }
    },
    ph: { min: 5.8, max: 7.8, warningBuffer: 0.4 },
    ec: { min: 90, max: 245, warningBuffer: 35 }
  },
  spice: {
    nutrients: {
      N: { lowMax: 24, mediumMax: 50 },
      P: { lowMax: 20, mediumMax: 40 },
      K: { lowMax: 110, mediumMax: 220 }
    },
    ph: { min: 5.8, max: 7.4, warningBuffer: 0.4 },
    ec: { min: 90, max: 240, warningBuffer: 35 }
  }
};

export function getCropProfile(cropKey) {
  return CROP_CATALOG[cropKey] || null;
}

export function isVegetableCropKey(cropKey) {
  return VEGETABLE_CROP_OPTIONS.some((item) => item.key === cropKey);
}
