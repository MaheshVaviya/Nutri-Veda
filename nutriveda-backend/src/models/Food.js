const db = require('../config/database');

class Food {
  static collection = 'foods';

  static validateFood(foodData) {
    const required = ['name', 'calories', 'protein', 'carbs', 'fat', 'rasa', 'virya', 'guna', 'vipaka'];
    
    // Check required fields
    for (let field of required) {
      if (!foodData[field] && foodData[field] !== 0) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate data types and ranges
    const numericFields = ['calories', 'protein', 'carbs', 'fat'];
    for (let field of numericFields) {
      const value = parseFloat(foodData[field]);
      if (isNaN(value)) {
        throw new Error(`${field} must be a valid number`);
      }
      if (value < 0) {
        throw new Error(`${field} cannot be negative`);
      }
      if (value > 10000) {
        throw new Error(`${field} value seems too high (max: 10000)`);
      }
    }

    // Validate optional numeric fields
    const optionalNumeric = ['fiber', 'sugar', 'sodium'];
    for (let field of optionalNumeric) {
      if (foodData[field] !== undefined) {
        const value = parseFloat(foodData[field]);
        if (isNaN(value) || value < 0) {
          throw new Error(`${field} must be a non-negative number`);
        }
      }
    }

    // Validate name
    if (typeof foodData.name !== 'string' || foodData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    if (foodData.name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }

    // Validate Ayurvedic properties
    const validRasa = ['sweet', 'sour', 'salty', 'pungent', 'bitter', 'astringent'];
    if (!validRasa.includes(foodData.rasa)) {
      throw new Error(`Rasa must be one of: ${validRasa.join(', ')}`);
    }

    const validVirya = ['heating', 'cooling', 'neutral'];
    if (!validVirya.includes(foodData.virya)) {
      throw new Error(`Virya must be one of: ${validVirya.join(', ')}`);
    }

    const validGuna = ['heavy', 'light', 'oily', 'dry', 'hot', 'cold', 'stable', 'mobile', 'soft', 'hard', 'smooth', 'rough', 'subtle', 'gross', 'dense', 'liquid', 'sharp', 'dull', 'slimy', 'clear'];
    if (!Array.isArray(foodData.guna) || foodData.guna.length === 0) {
      throw new Error('Guna must be a non-empty array');
    }
    for (let guna of foodData.guna) {
      if (!validGuna.includes(guna)) {
        throw new Error(`Invalid guna: ${guna}. Must be one of: ${validGuna.join(', ')}`);
      }
    }

    const validVipaka = ['sweet', 'sour', 'pungent'];
    if (!validVipaka.includes(foodData.vipaka)) {
      throw new Error(`Vipaka must be one of: ${validVipaka.join(', ')}`);
    }

    // Validate dosha impact if provided
    if (foodData.doshaImpact) {
      const validImpacts = ['increases', 'decreases', 'neutral'];
      const doshas = ['vata', 'pitta', 'kapha'];
      for (let dosha of doshas) {
        if (foodData.doshaImpact[dosha] && !validImpacts.includes(foodData.doshaImpact[dosha])) {
          throw new Error(`${dosha} impact must be one of: ${validImpacts.join(', ')}`);
        }
      }
    }

    // Validate category if provided
    if (foodData.category) {
      const validCategories = ['grains', 'vegetables', 'fruits', 'legumes', 'nuts', 'seeds', 'dairy', 'meat', 'fish', 'oils', 'spices', 'herbs', 'beverages', 'sweets', 'snacks'];
      if (!validCategories.includes(foodData.category)) {
        throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
      }
    }

    // Validate season if provided
    if (foodData.season) {
      const validSeasons = ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'all'];
      if (!Array.isArray(foodData.season)) {
        throw new Error('Season must be an array');
      }
      for (let season of foodData.season) {
        if (!validSeasons.includes(season)) {
          throw new Error(`Invalid season: ${season}. Must be one of: ${validSeasons.join(', ')}`);
        }
      }
    }
  }

  static async create(foodData) {
    this.validateFood(foodData);
    
    const food = {
      name: foodData.name,
      calories: parseFloat(foodData.calories),
      protein: parseFloat(foodData.protein),
      carbs: parseFloat(foodData.carbs),
      fat: parseFloat(foodData.fat),
      
      // Ayurvedic Properties
      rasa: foodData.rasa, // sweet, sour, salty, pungent, bitter, astringent
      virya: foodData.virya, // heating, cooling
      guna: Array.isArray(foodData.guna) ? foodData.guna : [foodData.guna], // heavy, light, oily, dry, etc.
      vipaka: foodData.vipaka, // sweet, sour, pungent
      
      // Dosha Impact
      doshaImpact: {
        vata: foodData.doshaImpact?.vata || 'neutral', // increases, decreases, neutral
        pitta: foodData.doshaImpact?.pitta || 'neutral',
        kapha: foodData.doshaImpact?.kapha || 'neutral'
      },
      
      // Additional Properties
      season: Array.isArray(foodData.season) ? foodData.season : (foodData.season ? [foodData.season] : ['all']),
      region: Array.isArray(foodData.region) ? foodData.region : (foodData.region ? [foodData.region] : ['all']),
      
      // Additional nutritional info
      fiber: parseFloat(foodData.fiber || 0),
      category: foodData.category || 'general',
      servingSize: parseFloat(foodData.servingSize || 100),
      unit: foodData.unit || 'grams',
      
      // Meta
      isActive: true
    };
    
    return await db.create(this.collection, food);
  }

  static async findByName(name) {
    const foods = await db.findByField(this.collection, 'name', name);
    return foods.length > 0 ? foods[0] : null;
  }

  static async searchByDosha(dosha, impact = 'decreases') {
    const allFoods = await db.findAll(this.collection);
    return allFoods.filter(food => 
      food.doshaImpact && food.doshaImpact[dosha] === impact
    );
  }

  static async searchBySeason(season) {
    const allFoods = await db.findAll(this.collection);
    return allFoods.filter(food => 
      food.season && (food.season.includes(season) || food.season.includes('all'))
    );
  }

  static async findById(id) {
    return await db.findById(this.collection, id);
  }

  static async findAll(limit = 100) {
    return await db.findAll(this.collection, limit);
  }

  static async find(filter = {}) {
    try {
      // For now, get all foods and filter in memory
      // In production, you'd want to implement proper database filtering
      const allFoods = await this.findAll(1000); // Get more foods for filtering
      
      let filteredFoods = allFoods;

      // Apply filters
      if (filter.category) {
        filteredFoods = filteredFoods.filter(food => 
          food.category === filter.category || 
          (filter.category.$in && filter.category.$in.includes(food.category))
        );
      }

      if (filter.season) {
        filteredFoods = filteredFoods.filter(food => 
          food.season && (
            food.season.includes(filter.season) || 
            food.season.includes('all')
          )
        );
      }

      if (filter.rasa) {
        filteredFoods = filteredFoods.filter(food => food.rasa === filter.rasa);
      }

      return filteredFoods;
    } catch (error) {
      console.error(`❌ Error finding foods with filter:`, error.message);
      throw new Error(`Error finding foods: ${error.message}`);
    }
  }
}

module.exports = Food;