export const BASE_YIELD = {
  Rice: 5.5,
  Wheat: 4,
  Maize: 6,
  Jowar: 3,
  Bajra: 2.5,
  Ragi: 2.8,
  Gram: 1.8,
  Tur: 1.5,
  Moong: 1.2,
  Urad: 1.1,
  Sugarcane: 70,
  Cotton: 2,
  Groundnut: 2.5,
  Soybean: 2.2,
  Mustard: 1.8,
  Potato: 25,
  Onion: 18,
  Tomato: 30,
  Banana: 40,
  Mango: 10
};
export const CROPS = [
  // Cereals / Millets
  {
    name: "Rice",
    seasons: ["Kharif"],
    ph: { min: 5, opt: 6.5, max: 7.5 },
    rainfall: { min: 800, opt: 1200, max: 2500 },
    moisture: { min: 60, opt: 80, max: 100 },
    temperature: { min: 20, opt: 28, max: 35 },
    nutrients: {
      N: { min: 60, opt: 100, max: 150 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 30, opt: 60, max: 90 }
    },
    priority: 2
  },
  {
    name: "Wheat",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 6.8, max: 7.5 },
    rainfall: { min: 300, opt: 450, max: 900 },
    moisture: { min: 40, opt: 55, max: 70 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 50, opt: 90, max: 130 },
      P: { min: 25, opt: 50, max: 80 },
      K: { min: 20, opt: 40, max: 70 }
    },
    priority: 2
  },
  {
    name: "Maize",
    seasons: ["Kharif", "Rabi"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 500, opt: 750, max: 1000 },
    moisture: { min: 40, opt: 60, max: 70 },
    temperature: { min: 18, opt: 26, max: 32 },
    nutrients: {
      N: { min: 50, opt: 100, max: 150 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 30, opt: 60, max: 90 }
    },
    priority: 1
  },
  {
    name: "Jowar",
    seasons: ["Kharif", "Rabi"],
    ph: { min: 5.5, opt: 7, max: 8 },
    rainfall: { min: 400, opt: 600, max: 800 },
    moisture: { min: 30, opt: 45, max: 60 },
    temperature: { min: 20, opt: 28, max: 35 },
    nutrients: {
      N: { min: 40, opt: 80, max: 120 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Bajra",
    seasons: ["Kharif"],
    ph: { min: 5, opt: 7, max: 8.5 },
    rainfall: { min: 250, opt: 400, max: 600 },
    moisture: { min: 20, opt: 35, max: 50 },
    temperature: { min: 25, opt: 30, max: 35 },
    nutrients: {
      N: { min: 20, opt: 40, max: 60 },
      P: { min: 15, opt: 30, max: 50 },
      K: { min: 15, opt: 30, max: 50 }
    },
    priority: 1
  },
  {
    name: "Ragi",
    seasons: ["Kharif"],
    ph: { min: 5, opt: 6.5, max: 7.5 },
    rainfall: { min: 500, opt: 700, max: 1000 },
    moisture: { min: 30, opt: 45, max: 60 },
    temperature: { min: 18, opt: 25, max: 30 },
    nutrients: {
      N: { min: 30, opt: 60, max: 90 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Barley",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 300, opt: 500, max: 800 },
    moisture: { min: 35, opt: 50, max: 65 },
    temperature: { min: 8, opt: 15, max: 25 },
    nutrients: {
      N: { min: 40, opt: 70, max: 100 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },

  // Pulses
  {
    name: "Gram",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 300, opt: 500, max: 800 },
    moisture: { min: 25, opt: 40, max: 55 },
    temperature: { min: 15, opt: 20, max: 25 },
    nutrients: {
      N: { min: 20, opt: 30, max: 40 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 15, opt: 30, max: 45 }
    },
    priority: 1
  },
  {
    name: "Tur",
    seasons: ["Kharif"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 600, opt: 800, max: 1000 },
    moisture: { min: 30, opt: 45, max: 60 },
    temperature: { min: 20, opt: 28, max: 35 },
    nutrients: {
      N: { min: 20, opt: 30, max: 40 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Moong",
    seasons: ["Kharif", "Summer"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 500, opt: 700, max: 1000 },
    moisture: { min: 25, opt: 40, max: 55 },
    temperature: { min: 20, opt: 28, max: 35 },
    nutrients: {
      N: { min: 15, opt: 25, max: 35 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 15, opt: 30, max: 45 }
    },
    priority: 1
  },
  {
    name: "Urad",
    seasons: ["Kharif"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 500, opt: 700, max: 1000 },
    moisture: { min: 25, opt: 40, max: 55 },
    temperature: { min: 20, opt: 28, max: 35 },
    nutrients: {
      N: { min: 15, opt: 25, max: 35 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 15, opt: 30, max: 45 }
    },
    priority: 1
  },
  {
    name: "Masur",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 300, opt: 500, max: 800 },
    moisture: { min: 25, opt: 40, max: 55 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 20, opt: 30, max: 40 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 15, opt: 30, max: 45 }
    },
    priority: 1
  },
  {
    name: "Peas",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 7.5 },
    rainfall: { min: 400, opt: 600, max: 900 },
    moisture: { min: 35, opt: 50, max: 65 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 20, opt: 30, max: 40 },
      P: { min: 25, opt: 40, max: 60 },
      K: { min: 20, opt: 35, max: 50 }
    },
    priority: 1
  },

  // Commercial (sugar, fibre, tobacco)
  {
    name: "Sugarcane",
    seasons: ["Annual"],
    ph: { min: 6, opt: 6.8, max: 8 },
    rainfall: { min: 750, opt: 1200, max: 2000 },
    moisture: { min: 60, opt: 75, max: 90 },
    temperature: { min: 20, opt: 27, max: 35 },
    nutrients: {
      N: { min: 120, opt: 180, max: 250 },
      P: { min: 60, opt: 80, max: 100 },
      K: { min: 60, opt: 120, max: 180 }
    },
    priority: 2
  },
  {
    name: "Cotton",
    seasons: ["Kharif"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 500, opt: 750, max: 1100 },
    moisture: { min: 35, opt: 50, max: 65 },
    temperature: { min: 21, opt: 28, max: 35 },
    nutrients: {
      N: { min: 60, opt: 120, max: 180 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 30, opt: 60, max: 90 }
    },
    priority: 2
  },
  {
    name: "Jute",
    seasons: ["Kharif"],
    ph: { min: 5, opt: 6.5, max: 7.5 },
    rainfall: { min: 1200, opt: 1500, max: 2000 },
    moisture: { min: 60, opt: 80, max: 95 },
    temperature: { min: 20, opt: 27, max: 34 },
    nutrients: {
      N: { min: 40, opt: 80, max: 120 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 30, opt: 60, max: 90 }
    },
    priority: 1
  },
  {
    name: "Tobacco",
    seasons: ["Rabi", "Summer"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 400, opt: 600, max: 900 },
    moisture: { min: 30, opt: 45, max: 60 },
    temperature: { min: 18, opt: 25, max: 30 },
    nutrients: {
      N: { min: 40, opt: 60, max: 80 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 40, opt: 80, max: 120 }
    },
    priority: 1
  },

  // Oilseeds & protein crops
  {
    name: "Groundnut",
    seasons: ["Kharif", "Rabi"],
    ph: { min: 6, opt: 6.8, max: 7.5 },
    rainfall: { min: 500, opt: 800, max: 1100 },
    moisture: { min: 35, opt: 50, max: 65 },
    temperature: { min: 20, opt: 28, max: 35 },
    nutrients: {
      N: { min: 20, opt: 40, max: 60 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 30, opt: 60, max: 90 }
    },
    priority: 1
  },
  {
    name: "Soybean",
    seasons: ["Kharif"],
    ph: { min: 6, opt: 6.8, max: 7.5 },
    rainfall: { min: 600, opt: 800, max: 1000 },
    moisture: { min: 50, opt: 65, max: 75 },
    temperature: { min: 20, opt: 27, max: 30 },
    nutrients: {
      N: { min: 20, opt: 40, max: 60 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 30, opt: 60, max: 90 }
    },
    priority: 1
  },
  {
    name: "Mustard",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 350, opt: 500, max: 800 },
    moisture: { min: 30, opt: 45, max: 60 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 40, opt: 80, max: 120 },
      P: { min: 30, opt: 50, max: 70 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Rapeseed",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 350, opt: 500, max: 800 },
    moisture: { min: 30, opt: 45, max: 60 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 40, opt: 80, max: 120 },
      P: { min: 30, opt: 50, max: 70 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Sunflower",
    seasons: ["Kharif", "Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 500, opt: 700, max: 1000 },
    moisture: { min: 30, opt: 45, max: 60 },
    temperature: { min: 20, opt: 25, max: 32 },
    nutrients: {
      N: { min: 40, opt: 80, max: 120 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 30, opt: 60, max: 90 }
    },
    priority: 1
  },
  {
    name: "Sesame",
    seasons: ["Kharif", "Summer"],
    ph: { min: 5.5, opt: 6.5, max: 8 },
    rainfall: { min: 400, opt: 600, max: 800 },
    moisture: { min: 25, opt: 40, max: 55 },
    temperature: { min: 20, opt: 27, max: 35 },
    nutrients: {
      N: { min: 30, opt: 50, max: 70 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Castor Seed",
    seasons: ["Kharif", "Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 400, opt: 600, max: 800 },
    moisture: { min: 25, opt: 40, max: 55 },
    temperature: { min: 18, opt: 25, max: 35 },
    nutrients: {
      N: { min: 40, opt: 80, max: 120 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Linseed",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 400, opt: 600, max: 800 },
    moisture: { min: 25, opt: 40, max: 55 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 30, opt: 60, max: 90 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },

  // Plantation crops
  {
    name: "Tea",
    seasons: ["Perennial"],
    ph: { min: 4.5, opt: 5.5, max: 6.5 },
    rainfall: { min: 1200, opt: 2000, max: 3000 },
    moisture: { min: 60, opt: 80, max: 95 },
    temperature: { min: 14, opt: 20, max: 30 },
    nutrients: {
      N: { min: 80, opt: 150, max: 220 },
      P: { min: 40, opt: 80, max: 120 },
      K: { min: 40, opt: 100, max: 160 }
    },
    priority: 1
  },
  {
    name: "Coffee",
    seasons: ["Perennial"],
    ph: { min: 5, opt: 6, max: 6.5 },
    rainfall: { min: 1200, opt: 2000, max: 2500 },
    moisture: { min: 60, opt: 75, max: 90 },
    temperature: { min: 15, opt: 20, max: 28 },
    nutrients: {
      N: { min: 60, opt: 120, max: 180 },
      P: { min: 40, opt: 80, max: 120 },
      K: { min: 40, opt: 100, max: 160 }
    },
    priority: 1
  },
  {
    name: "Rubber",
    seasons: ["Perennial"],
    ph: { min: 4.5, opt: 5.5, max: 6.5 },
    rainfall: { min: 2000, opt: 2500, max: 3500 },
    moisture: { min: 70, opt: 85, max: 95 },
    temperature: { min: 21, opt: 27, max: 35 },
    nutrients: {
      N: { min: 60, opt: 120, max: 180 },
      P: { min: 40, opt: 80, max: 120 },
      K: { min: 40, opt: 100, max: 160 }
    },
    priority: 1
  },
  {
    name: "Coconut",
    seasons: ["Perennial"],
    ph: { min: 5.5, opt: 6.5, max: 8 },
    rainfall: { min: 1000, opt: 2000, max: 3000 },
    moisture: { min: 60, opt: 75, max: 90 },
    temperature: { min: 20, opt: 27, max: 35 },
    nutrients: {
      N: { min: 80, opt: 120, max: 180 },
      P: { min: 40, opt: 60, max: 100 },
      K: { min: 80, opt: 160, max: 240 }
    },
    priority: 1
  },

  // Vegetables – roots & bulbs
  {
    name: "Potato",
    seasons: ["Rabi"],
    ph: { min: 5, opt: 5.5, max: 7 },
    rainfall: { min: 500, opt: 750, max: 1200 },
    moisture: { min: 60, opt: 75, max: 90 },
    temperature: { min: 15, opt: 18, max: 24 },
    nutrients: {
      N: { min: 80, opt: 150, max: 220 },
      P: { min: 60, opt: 80, max: 120 },
      K: { min: 80, opt: 150, max: 220 }
    },
    priority: 1
  },
  {
    name: "Onion",
    seasons: ["Rabi", "Kharif"],
    ph: { min: 6, opt: 6.5, max: 7.5 },
    rainfall: { min: 500, opt: 700, max: 1000 },
    moisture: { min: 50, opt: 65, max: 80 },
    temperature: { min: 15, opt: 22, max: 30 },
    nutrients: {
      N: { min: 60, opt: 100, max: 150 },
      P: { min: 40, opt: 60, max: 90 },
      K: { min: 40, opt: 80, max: 120 }
    },
    priority: 1
  },
  {
    name: "Tomato",
    seasons: ["Rabi", "Kharif"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 600, opt: 800, max: 1200 },
    moisture: { min: 60, opt: 75, max: 90 },
    temperature: { min: 18, opt: 22, max: 30 },
    nutrients: {
      N: { min: 60, opt: 120, max: 180 },
      P: { min: 50, opt: 80, max: 120 },
      K: { min: 60, opt: 120, max: 180 }
    },
    priority: 1
  },
  {
    name: "Garlic",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 6.5, max: 7.5 },
    rainfall: { min: 500, opt: 700, max: 1000 },
    moisture: { min: 50, opt: 65, max: 80 },
    temperature: { min: 12, opt: 18, max: 24 },
    nutrients: {
      N: { min: 60, opt: 100, max: 140 },
      P: { min: 40, opt: 60, max: 90 },
      K: { min: 40, opt: 80, max: 120 }
    },
    priority: 1
  },

  // Vegetables – cucurbits & gourds
  {
    name: "Watermelon",
    seasons: ["Summer"],
    ph: { min: 6, opt: 6.5, max: 7.5 },
    rainfall: { min: 400, opt: 600, max: 800 },
    moisture: { min: 40, opt: 55, max: 70 },
    temperature: { min: 22, opt: 28, max: 35 },
    nutrients: {
      N: { min: 40, opt: 80, max: 120 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 40, opt: 80, max: 120 }
    },
    priority: 1
  },
  {
    name: "Muskmelon",
    seasons: ["Summer"],
    ph: { min: 6, opt: 6.5, max: 7.5 },
    rainfall: { min: 400, opt: 600, max: 800 },
    moisture: { min: 40, opt: 55, max: 70 },
    temperature: { min: 22, opt: 28, max: 35 },
    nutrients: {
      N: { min: 40, opt: 80, max: 120 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 40, opt: 80, max: 120 }
    },
    priority: 1
  },
  {
    name: "Cucumber",
    seasons: ["Summer", "Kharif"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 500, opt: 700, max: 1000 },
    moisture: { min: 50, opt: 65, max: 80 },
    temperature: { min: 20, opt: 25, max: 32 },
    nutrients: {
      N: { min: 50, opt: 80, max: 120 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 40, opt: 80, max: 120 }
    },
    priority: 1
  },
  {
    name: "Bitter Gourd",
    seasons: ["Summer", "Kharif"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 500, opt: 700, max: 1000 },
    moisture: { min: 50, opt: 65, max: 80 },
    temperature: { min: 22, opt: 26, max: 32 },
    nutrients: {
      N: { min: 50, opt: 80, max: 120 },
      P: { min: 30, opt: 60, max: 90 },
      K: { min: 40, opt: 80, max: 120 }
    },
    priority: 1
  },

  // Spices & condiments
  {
    name: "Coriander",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 400, opt: 600, max: 800 },
    moisture: { min: 40, opt: 55, max: 70 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 40, opt: 60, max: 80 },
      P: { min: 30, opt: 50, max: 70 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Cumin",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 300, opt: 500, max: 700 },
    moisture: { min: 30, opt: 45, max: 60 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 30, opt: 50, max: 70 },
      P: { min: 20, opt: 40, max: 60 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },
  {
    name: "Fennel",
    seasons: ["Rabi"],
    ph: { min: 6, opt: 7, max: 8 },
    rainfall: { min: 400, opt: 600, max: 800 },
    moisture: { min: 35, opt: 50, max: 65 },
    temperature: { min: 10, opt: 18, max: 25 },
    nutrients: {
      N: { min: 40, opt: 60, max: 80 },
      P: { min: 30, opt: 50, max: 70 },
      K: { min: 20, opt: 40, max: 60 }
    },
    priority: 1
  },

  // Fruits
  {
    name: "Mango",
    seasons: ["Perennial"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 750, opt: 1000, max: 2500 },
    moisture: { min: 50, opt: 65, max: 80 },
    temperature: { min: 20, opt: 27, max: 35 },
    nutrients: {
      N: { min: 60, opt: 120, max: 180 },
      P: { min: 40, opt: 80, max: 120 },
      K: { min: 60, opt: 120, max: 180 }
    },
    priority: 1
  },
  {
    name: "Banana",
    seasons: ["Perennial"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 1000, opt: 2000, max: 3000 },
    moisture: { min: 60, opt: 80, max: 95 },
    temperature: { min: 18, opt: 27, max: 35 },
    nutrients: {
      N: { min: 100, opt: 200, max: 300 },
      P: { min: 60, opt: 100, max: 150 },
      K: { min: 120, opt: 200, max: 300 }
    },
    priority: 1
  },
  {
    name: "Grapes",
    seasons: ["Perennial"],
    ph: { min: 6, opt: 6.5, max: 7.5 },
    rainfall: { min: 600, opt: 800, max: 1000 },
    moisture: { min: 50, opt: 60, max: 70 },
    temperature: { min: 15, opt: 22, max: 32 },
    nutrients: {
      N: { min: 60, opt: 120, max: 180 },
      P: { min: 40, opt: 80, max: 120 },
      K: { min: 80, opt: 160, max: 240 }
    },
    priority: 1
  },
  {
    name: "Apple",
    seasons: ["Perennial"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 800, opt: 1000, max: 1500 },
    moisture: { min: 50, opt: 65, max: 80 },
    temperature: { min: 5, opt: 18, max: 24 },
    nutrients: {
      N: { min: 60, opt: 120, max: 180 },
      P: { min: 40, opt: 80, max: 120 },
      K: { min: 60, opt: 120, max: 180 }
    },
    priority: 1
  },
  {
    name: "Orange",
    seasons: ["Perennial"],
    ph: { min: 5.5, opt: 6.5, max: 7.5 },
    rainfall: { min: 750, opt: 1000, max: 1500 },
    moisture: { min: 50, opt: 65, max: 80 },
    temperature: { min: 15, opt: 22, max: 32 },
    nutrients: {
      N: { min: 60, opt: 120, max: 180 },
      P: { min: 40, opt: 80, max: 120 },
      K: { min: 60, opt: 120, max: 180 }
    },
    priority: 1
  }
];