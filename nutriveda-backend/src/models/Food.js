const db = require('../config/database');

class Food {
  static collection = 'foods';

  static validateFood(foodData) {
    const required = ['name', 'calories', 'protein', 'carbs', 'fat', 'rasa', 'virya', 'guna', 'vipaka'];
    for (let field of required) {
      if (!foodData[field] && foodData[field] !== 0) {
        throw new Error(`${field} is required`);
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
}

module.exports = Food;