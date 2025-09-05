const Food = require('../models/Food');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class FoodService {
  static async bulkUploadFromCSV(filePath) {
    const results = [];
    const errors = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Normalize and validate CSV data
          try {
            const foodData = this.normalizeCSVData(row);
            results.push(foodData);
          } catch (error) {
            errors.push(`Row error: ${error.message}`);
          }
        })
        .on('end', async () => {
          try {
            const uploadResults = await this.bulkCreateFoods(results);
            resolve({
              totalRows: results.length,
              successful: uploadResults.successful,
              failed: uploadResults.failed,
              errors: [...errors, ...uploadResults.errors]
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  static normalizeCSVData(row) {
    return {
      name: row.name || row.Name || row.food_name,
      calories: parseFloat(row.calories || row.Calories || row.energy || 0),
      protein: parseFloat(row.protein || row.Protein || 0),
      carbs: parseFloat(row.carbs || row.carbohydrates || row.Carbs || 0),
      fat: parseFloat(row.fat || row.Fat || row.total_fat || 0),
      fiber: parseFloat(row.fiber || row.Fiber || row.dietary_fiber || 0),
      
      // Ayurvedic properties
      rasa: row.rasa || row.Rasa || 'sweet',
      virya: row.virya || row.Virya || 'neutral',
      guna: row.guna ? row.guna.split(',').map(g => g.trim()) : ['neutral'],
      vipaka: row.vipaka || row.Vipaka || 'sweet',
      
      // Dosha impact
      doshaImpact: {
        vata: row.vata_impact || row['vata'] || 'neutral',
        pitta: row.pitta_impact || row['pitta'] || 'neutral',
        kapha: row.kapha_impact || row['kapha'] || 'neutral'
      },
      
      // Regional and seasonal
      season: row.season ? row.season.split(',').map(s => s.trim()) : ['all'],
      region: row.region ? row.region.split(',').map(r => r.trim()) : ['all'],
      category: row.category || row.Category || 'general',
      
      // Additional properties
      servingSize: parseFloat(row.serving_size || row.servingSize || 100),
      unit: row.unit || 'grams'
    };
  }

  static async bulkCreateFoods(foodsData) {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < foodsData.length; i++) {
      try {
        await Food.create(foodsData[i]);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return results;
  }

  static async searchFoods(query) {
    const searchTerms = query.toLowerCase().split(' ');
    const allFoods = await Food.findAll(1000); // Get more foods for better search

    return allFoods.filter(food => {
      const searchableText = [
        food.name,
        food.category,
        food.rasa,
        food.virya,
        ...(food.guna || []),
        ...(food.season || []),
        ...(food.region || [])
      ].join(' ').toLowerCase();

      return searchTerms.some(term => searchableText.includes(term));
    });
  }

  static async getFoodsWithFilters(filters) {
    let foods = await Food.findAll(1000);

    // Apply filters
    if (filters.category) {
      foods = foods.filter(food => food.category === filters.category);
    }

    if (filters.rasa) {
      foods = foods.filter(food => food.rasa === filters.rasa);
    }

    if (filters.dosha && filters.doshaEffect) {
      foods = foods.filter(food => 
        food.doshaImpact && food.doshaImpact[filters.dosha] === filters.doshaEffect
      );
    }

    if (filters.season) {
      foods = foods.filter(food => 
        food.season && (food.season.includes(filters.season) || food.season.includes('all'))
      );
    }

    if (filters.region) {
      foods = foods.filter(food => 
        food.region && (food.region.includes(filters.region) || food.region.includes('all'))
      );
    }

    if (filters.minCalories) {
      foods = foods.filter(food => food.calories >= parseFloat(filters.minCalories));
    }

    if (filters.maxCalories) {
      foods = foods.filter(food => food.calories <= parseFloat(filters.maxCalories));
    }

    if (filters.minProtein) {
      foods = foods.filter(food => food.protein >= parseFloat(filters.minProtein));
    }

    // Sort results
    if (filters.sortBy) {
      foods.sort((a, b) => {
        if (filters.sortBy === 'calories') return a.calories - b.calories;
        if (filters.sortBy === 'protein') return b.protein - a.protein;
        if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
    }

    return foods;
  }

  static async getFoodNutritionSummary(foodIds, quantities = {}) {
    const summary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      foodCount: 0,
      doshaBalance: { vata: 0, pitta: 0, kapha: 0 },
      rasaDistribution: { 
        sweet: 0, sour: 0, salty: 0, 
        pungent: 0, bitter: 0, astringent: 0 
      }
    };

    for (const foodId of foodIds) {
      const food = await Food.findById(foodId);
      if (!food) continue;

      const quantity = quantities[foodId] || 1;
      summary.totalCalories += food.calories * quantity;
      summary.totalProtein += food.protein * quantity;
      summary.totalCarbs += food.carbs * quantity;
      summary.totalFat += food.fat * quantity;
      summary.totalFiber += (food.fiber || 0) * quantity;
      summary.foodCount++;

      // Dosha impact counting
      if (food.doshaImpact) {
        Object.keys(food.doshaImpact).forEach(dosha => {
          if (food.doshaImpact[dosha] === 'increases') {
            summary.doshaBalance[dosha] += 1;
          } else if (food.doshaImpact[dosha] === 'decreases') {
            summary.doshaBalance[dosha] -= 1;
          }
        });
      }

      // Rasa distribution
      if (food.rasa && summary.rasaDistribution[food.rasa] !== undefined) {
        summary.rasaDistribution[food.rasa] += quantity;
      }
    }

    // Round nutritional values
    Object.keys(summary).forEach(key => {
      if (typeof summary[key] === 'number' && key.startsWith('total')) {
        summary[key] = Math.round(summary[key] * 100) / 100;
      }
    });

    return summary;
  }
}

module.exports = FoodService;