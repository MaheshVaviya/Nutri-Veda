const db = require('../config/database');

class Recipe {
  static collection = 'recipes';

  static validateRecipe(recipeData) {
    const required = ['name', 'mealType'];
    
    // Check required fields
    for (let field of required) {
      if (!recipeData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate name
    if (typeof recipeData.name !== 'string' || recipeData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(recipeData.mealType)) {
      throw new Error(`Meal type must be one of: ${validMealTypes.join(', ')}`);
    }

    // Validate numeric fields
    const numericFields = ['prepTime', 'cookTime', 'servings'];
    for (let field of numericFields) {
      if (recipeData[field] !== undefined) {
        const value = parseInt(recipeData[field]);
        if (isNaN(value) || value < 0) {
          throw new Error(`${field} must be a non-negative number`);
        }
      }
    }

    // Validate season
    if (recipeData.season) {
      const validSeasons = ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'all'];
      if (!Array.isArray(recipeData.season)) {
        throw new Error('Season must be an array');
      }
      for (let season of recipeData.season) {
        if (!validSeasons.includes(season)) {
          throw new Error(`Invalid season: ${season}. Must be one of: ${validSeasons.join(', ')}`);
        }
      }
    }
  }

  static async create(recipeData) {
    this.validateRecipe(recipeData);
    
    // Check for existing recipe by recipeId to prevent duplicates
    if (recipeData.recipeId) {
      const existingRecipe = await this.findByRecipeId(recipeData.recipeId);
      if (existingRecipe) {
        throw new Error(`Recipe with recipeId '${recipeData.recipeId}' already exists`);
      }
    }
    
    const recipe = {
      // Core identification
      recipeId: recipeData.recipeId || null,
      name: recipeData.name.trim(),
      
      // Recipe details
      mealType: recipeData.mealType.toLowerCase(),
      cuisine: recipeData.cuisine || 'indian',
      instructions: recipeData.instructions || '',
      
      // Timing
      prepTime: parseInt(recipeData.prepTime) || 0,
      cookTime: parseInt(recipeData.cookTime) || 0,
      totalTime: (parseInt(recipeData.prepTime) || 0) + (parseInt(recipeData.cookTime) || 0),
      servings: parseInt(recipeData.servings) || 1,
      
      // Ayurvedic properties
      ayurvedaBenefit: recipeData.ayurvedaBenefit || '',
      doshaSuitability: recipeData.doshaSuitability || '',
      doshaBalance: recipeData.doshaBalance || {
        vata: false,
        pitta: false,
        kapha: false
      },
      
      // Contextual information
      season: Array.isArray(recipeData.season) ? recipeData.season : ['all'],
      ageGroup: Array.isArray(recipeData.ageGroup) ? recipeData.ageGroup : ['all'],
      allergens: Array.isArray(recipeData.allergens) ? recipeData.allergens : [],
      
      // Sustainability and health
      sustainability: recipeData.sustainability || '',
      difficulty: recipeData.difficulty || 'medium',
      
      // Food ingredients (to be populated separately)
      foods: recipeData.foods || [],
      
      // Calculated nutrition (will be calculated when foods are added)
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      
      // Meta
      isActive: recipeData.isActive !== undefined ? recipeData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return await db.create(this.collection, recipe);
  }

  static async createMany(recipesArray) {
    const results = {
      success: [],
      errors: []
    };

    const BATCH_SIZE = 50; // Process 50 recipes at a time
    console.log(`📊 Processing ${recipesArray.length} recipes in batches of ${BATCH_SIZE}`);

    for (let i = 0; i < recipesArray.length; i += BATCH_SIZE) {
      const batch = recipesArray.slice(i, i + BATCH_SIZE);
      console.log(`📄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(recipesArray.length/BATCH_SIZE)} (${batch.length} recipes)`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (recipeData, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const recipe = await this.create(recipeData);
          return {
            type: 'success',
            index: globalIndex,
            data: recipe,
            recipeId: recipeData.recipeId,
            name: recipeData.name
          };
        } catch (error) {
          return {
            type: 'error',
            index: globalIndex,
            data: recipeData,
            error: error.message,
            recipeId: recipeData.recipeId,
            name: recipeData.name
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Separate successes and errors
      batchResults.forEach(result => {
        if (result.type === 'success') {
          results.success.push(result);
        } else {
          results.errors.push(result);
        }
      });

      // Progress update
      console.log(`✅ Batch complete: ${results.success.length} successful, ${results.errors.length} errors`);
    }

    console.log(`🎉 All batches complete: ${results.success.length}/${recipesArray.length} recipes uploaded successfully`);
    return results;
  }

  static async findById(id) {
    return await db.findById(this.collection, id);
  }

  static async findByRecipeId(recipeId) {
    const recipes = await db.findByField(this.collection, 'recipeId', recipeId);
    return recipes.length > 0 ? recipes[0] : null;
  }

  static async findAll(limit = 100) {
    return await db.findAll(this.collection, limit);
  }

  static async findByMealType(mealType) {
    return await db.findByField(this.collection, 'mealType', mealType.toLowerCase());
  }

  static async findBySeason(season) {
    const allRecipes = await db.findAll(this.collection);
    return allRecipes.filter(recipe => 
      recipe.season && (recipe.season.includes(season.toLowerCase()) || recipe.season.includes('all'))
    );
  }

  static async findByDosha(dosha) {
    const allRecipes = await db.findAll(this.collection);
    return allRecipes.filter(recipe => 
      recipe.doshaBalance && recipe.doshaBalance[dosha.toLowerCase()] === true
    );
  }

  static async searchRecipes(filters = {}) {
    try {
      let recipes = await this.findAll(1000);

      // Apply filters
      if (filters.mealType) {
        recipes = recipes.filter(recipe => recipe.mealType === filters.mealType.toLowerCase());
      }

      if (filters.season) {
        recipes = recipes.filter(recipe => 
          recipe.season && (
            recipe.season.includes(filters.season.toLowerCase()) || 
            recipe.season.includes('all')
          )
        );
      }

      if (filters.dosha) {
        recipes = recipes.filter(recipe => 
          recipe.doshaBalance && recipe.doshaBalance[filters.dosha.toLowerCase()] === true
        );
      }

      if (filters.cuisine) {
        recipes = recipes.filter(recipe => 
          recipe.cuisine && recipe.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase())
        );
      }

      if (filters.maxCookTime) {
        recipes = recipes.filter(recipe => recipe.cookTime <= parseInt(filters.maxCookTime));
      }

      if (filters.allergens && filters.allergens.length > 0) {
        recipes = recipes.filter(recipe => {
          const recipeAllergens = recipe.allergens || [];
          return !filters.allergens.some(allergen => 
            recipeAllergens.includes(allergen.toLowerCase())
          );
        });
      }

      return recipes;
    } catch (error) {
      console.error('❌ Error searching recipes:', error.message);
      throw new Error(`Error searching recipes: ${error.message}`);
    }
  }

  static async update(id, recipeData) {
    const updateData = {
      ...recipeData,
      updatedAt: new Date().toISOString()
    };
    
    return await db.update(this.collection, id, updateData);
  }

  static async delete(id) {
    return await db.delete(this.collection, id);
  }
}

module.exports = Recipe;
