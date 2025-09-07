const db = require('../config/database');

class Food {
  static collection = 'foods';

  static async create(foodData) {
    const food = {
      ingredientId: foodData.ingredientId || null,
      name: foodData.name,
      calories: parseFloat(foodData.calories) || 0,
      protein: parseFloat(foodData.protein) || 0,
      carbs: parseFloat(foodData.carbs) || 0,
      fat: parseFloat(foodData.fat) || 0,
      rasa: foodData.rasa || 'sweet',
      virya: foodData.virya || 'neutral',
      guna: Array.isArray(foodData.guna) ? foodData.guna : [foodData.guna || 'light'],
      vipaka: foodData.vipaka || 'sweet',
      category: foodData.category || 'snacks',
      vegNonVeg: foodData.vegNonVeg || 'veg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return await db.create(this.collection, food);
  }

  static async createMany(foodsArray) {
    const results = {
      success: [],
      errors: []
    };

    console.log(`📊 Processing ${foodsArray.length} foods`);

    for (let i = 0; i < foodsArray.length; i++) {
      try {
        const food = await this.create(foodsArray[i]);
        results.success.push({
          type: 'success',
          index: i,
          data: food,
          name: foodsArray[i].name
        });
        
        if (i % 50 === 0) {
          console.log(`✅ Processed ${i + 1}/${foodsArray.length} foods`);
        }
      } catch (error) {
        results.errors.push({
          type: 'error',
          index: i,
          data: foodsArray[i],
          error: error.message,
          name: foodsArray[i].name
        });
      }
    }

    console.log(`🎉 Complete: ${results.success.length}/${foodsArray.length} foods uploaded successfully`);
    return results;
  }

  static async findAll(limit = 100) {
    return await db.findAll(this.collection, limit);
  }

  static async findById(id) {
    return await db.findById(this.collection, id);
  }

  static async find(filter = {}) {
    try {
      // Get all foods and filter in memory
      const allFoods = await this.findAll(1000); // Get more foods for filtering
      
      let filteredFoods = allFoods;

      // Apply filters
      if (filter.category) {
        filteredFoods = filteredFoods.filter(food => food.category === filter.category);
      }

      if (filter.rasa) {
        filteredFoods = filteredFoods.filter(food => food.rasa === filter.rasa);
      }

      if (filter.virya) {
        filteredFoods = filteredFoods.filter(food => food.virya === filter.virya);
      }

      if (filter.vegNonVeg) {
        filteredFoods = filteredFoods.filter(food => food.vegNonVeg === filter.vegNonVeg);
      }

      if (filter.season) {
        filteredFoods = filteredFoods.filter(food => 
          food.season && (food.season.includes(filter.season) || food.season.includes('all'))
        );
      }

      return filteredFoods;
    } catch (error) {
      console.error('❌ Error filtering foods:', error.message);
      throw new Error(`Error filtering foods: ${error.message}`);
    }
  }

}

module.exports = Food;