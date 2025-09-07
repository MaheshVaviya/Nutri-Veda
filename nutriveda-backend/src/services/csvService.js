const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

class CSVService {
  static async parseFoodCSV(filePath) {
    return new Promise((resolve, reject) => {
      const foods = [];
      const errors = [];
      let rowIndex = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowIndex++;
          try {
            // Map CSV columns to food object structure
            const food = {
              ingredientId: row.IngredientID?.trim(),
              name: row.IngredientName?.trim(),
              category: row.Category?.toLowerCase()?.trim(),
              vegNonVeg: row.VegNonVeg?.toLowerCase()?.trim(),
              calories: parseFloat(row.Calories_100g) || 0,
              protein: parseFloat(row.Protein_g) || 0,
              carbs: parseFloat(row.Carbs_g) || 0,
              fat: parseFloat(row.Fat_g) || 0,
              rasa: row.Rasa?.toLowerCase()?.trim(),
              virya: row.Virya?.toLowerCase()?.trim(),
              guna: row.Guna ? row.Guna.split(',').map(g => g.trim().toLowerCase()) : [],
              doshaEffect: row.DoshaEffect?.trim(),
              
              // Additional properties for compatibility
              servingSize: 100,
              unit: 'grams',
              isActive: true
            };

            // Parse dosha effect into structured format
            if (food.doshaEffect) {
              food.doshaImpact = this.parseDoshaEffect(food.doshaEffect);
            } else {
              food.doshaImpact = {
                vata: 'neutral',
                pitta: 'neutral',
                kapha: 'neutral'
              };
            }

            // Validate essential fields
            // Map CSV category to expected model category
            const categoryMapping = {
              'grain': 'grains',
              'flour': 'grains',
              'legume': 'legumes',
              'dairy/fat': 'dairy',
              'oil/fat': 'oils',
              'spice': 'spices',
              'vegetable': 'vegetables',
              'poultry': 'meat',
              'sweetener': 'sweets',
              'herb': 'herbs',
              'fruit': 'fruits',
              'nuts': 'nuts',
              'seed': 'seeds',
              'salt': 'spices',
              'seafood': 'fish',
              'condiment': 'snacks',
              'meat': 'meat',
              'dairy': 'dairy'
            };

            if (food.category && categoryMapping[food.category.toLowerCase()]) {
              food.category = categoryMapping[food.category.toLowerCase()];
            } else if (food.category) {
              // Default to snacks if unknown category
              food.category = 'snacks';
            }

            // Clean and validate guna array
            if (food.guna && Array.isArray(food.guna)) {
              const validGuna = ['heavy', 'light', 'oily', 'dry', 'hot', 'cold', 'stable', 'mobile', 'soft', 'hard', 'smooth', 'rough', 'subtle', 'gross', 'dense', 'liquid', 'sharp', 'dull', 'slimy', 'clear'];
              const gunaMapping = {
                'moist': 'liquid',
                'wet': 'liquid',
                'heavy': 'heavy',
                'light': 'light',
                'oily': 'oily',
                'dry': 'dry',
                'hot': 'hot',
                'cold': 'cold',
                'soft': 'soft',
                'hard': 'hard',
                'smooth': 'smooth',
                'rough': 'rough'
              };

              food.guna = food.guna.map(g => {
                const guna = g.toLowerCase().trim();
                return gunaMapping[guna] || (validGuna.includes(guna) ? guna : 'light');
              }).filter((g, i, arr) => arr.indexOf(g) === i); // Remove duplicates
            }

            if (!food.name) {
              throw new Error('IngredientName is required');
            }

            // Set default values for ayurvedic properties if missing
            if (!food.rasa || !['sweet', 'sour', 'salty', 'pungent', 'bitter', 'astringent'].includes(food.rasa)) {
              food.rasa = 'sweet'; // default
            }

            if (!food.virya || !['heating', 'cooling', 'neutral'].includes(food.virya)) {
              food.virya = 'neutral'; // default
            }

            if (!food.guna || food.guna.length === 0) {
              food.guna = ['light']; // default
            }

            // Set default vipaka if missing
            if (!food.vipaka || !['sweet', 'sour', 'pungent'].includes(food.vipaka)) {
              // Default vipaka based on rasa
              if (food.rasa === 'sweet') {
                food.vipaka = 'sweet';
              } else if (food.rasa === 'sour') {
                food.vipaka = 'sour';
              } else if (['pungent', 'bitter', 'astringent'].includes(food.rasa)) {
                food.vipaka = 'pungent';
              } else {
                food.vipaka = 'sweet'; // fallback default
              }
            }

            foods.push(food);
          } catch (error) {
            errors.push({
              row: rowIndex,
              data: row,
              error: error.message
            });
          }
        })
        .on('end', () => {
          resolve({
            foods,
            errors,
            totalRows: rowIndex,
            successfulRows: foods.length,
            errorRows: errors.length
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  static async parseDietChartCSV(filePath) {
    return new Promise((resolve, reject) => {
      const recipes = [];
      const errors = [];
      let rowIndex = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowIndex++;
          try {
            // Map CSV columns to recipe object structure
            const recipe = {
              recipeId: row.recipe_id?.trim(),
              name: row.name?.trim(),
              mealType: this.mapMealType(row.meal_type?.toLowerCase()?.trim()),
              cuisine: row.cuisine?.trim(),
              instructions: row.instructions?.trim(),
              prepTime: parseInt(row.prep_time) || 0,
              cookTime: parseInt(row.cook_time) || 0,
              servings: parseInt(row.servings) || 1,
              ayurvedaBenefit: row.ayurveda_benefit?.trim(),
              season: row.season ? row.season.split(',').map(s => s.trim().toLowerCase()) : ['all'],
              doshaSuitability: row.dosha_suitability?.trim(),
              sustainability: row.sustainability?.trim(),
              ageGroup: row.age_group ? row.age_group.split(',').map(a => a.trim()) : ['all'],
              allergens: row.allergens ? row.allergens.split(',').map(a => a.trim().toLowerCase()) : [],
              
              // Additional properties
              foods: [], // Will be populated separately
              isActive: true,
              difficulty: 'medium',
              totalTime: (parseInt(row.prep_time) || 0) + (parseInt(row.cook_time) || 0)
            };

            // Parse dosha suitability
            if (recipe.doshaSuitability) {
              recipe.doshaBalance = this.parseDoshaSuitability(recipe.doshaSuitability);
            }

            // Validate essential fields
            if (!recipe.name) {
              throw new Error('Recipe name is required');
            }

            if (!recipe.mealType || !['breakfast', 'lunch', 'dinner', 'snack'].includes(recipe.mealType)) {
              recipe.mealType = 'lunch'; // default
            }

            recipes.push(recipe);
          } catch (error) {
            errors.push({
              row: rowIndex,
              data: row,
              error: error.message
            });
          }
        })
        .on('end', () => {
          resolve({
            recipes,
            errors,
            totalRows: rowIndex,
            successfulRows: recipes.length,
            errorRows: errors.length
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  static parseDoshaEffect(doshaEffectString) {
    // Expected format: "V+,P-,K=" or "Vata+,Pitta-,Kapha="
    const doshaImpact = {
      vata: 'neutral',
      pitta: 'neutral',
      kapha: 'neutral'
    };

    if (!doshaEffectString) return doshaImpact;

    const effects = doshaEffectString.split(',');
    
    effects.forEach(effect => {
      const cleaned = effect.trim().toLowerCase();
      
      if (cleaned.includes('v') || cleaned.includes('vata')) {
        if (cleaned.includes('+')) doshaImpact.vata = 'increases';
        else if (cleaned.includes('-')) doshaImpact.vata = 'decreases';
      }
      
      if (cleaned.includes('p') || cleaned.includes('pitta')) {
        if (cleaned.includes('+')) doshaImpact.pitta = 'increases';
        else if (cleaned.includes('-')) doshaImpact.pitta = 'decreases';
      }
      
      if (cleaned.includes('k') || cleaned.includes('kapha')) {
        if (cleaned.includes('+')) doshaImpact.kapha = 'increases';
        else if (cleaned.includes('-')) doshaImpact.kapha = 'decreases';
      }
    });

    return doshaImpact;
  }

  static parseDoshaSuitability(doshaSuitabilityString) {
    // Expected format: "Vata,Pitta" or "All" or "Kapha"
    const suitability = {
      vata: false,
      pitta: false,
      kapha: false
    };

    if (!doshaSuitabilityString) return suitability;

    const cleaned = doshaSuitabilityString.toLowerCase();
    
    if (cleaned.includes('all')) {
      suitability.vata = true;
      suitability.pitta = true;
      suitability.kapha = true;
    } else {
      if (cleaned.includes('vata')) suitability.vata = true;
      if (cleaned.includes('pitta')) suitability.pitta = true;
      if (cleaned.includes('kapha')) suitability.kapha = true;
    }

    return suitability;
  }

  static async saveUploadedFile(file, type) {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${type}_${timestamp}_${file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);
    
    return filePath;
  }

  static mapMealType(csvMealType) {
    // Map CSV meal types to valid model meal types
    const mealTypeMapping = {
      'side dish': 'lunch',
      'main course': 'lunch', 
      'south indian breakfast': 'breakfast',
      'lunch': 'lunch',
      'dinner': 'dinner',
      'breakfast': 'breakfast',
      'snack': 'snack',
      'appetizer': 'snack',
      'dessert': 'snack',
      'beverage': 'snack',
      'soup': 'lunch'
    };
    
    return mealTypeMapping[csvMealType] || 'lunch'; // Default to lunch if not found
  }

  static cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}

module.exports = CSVService;
