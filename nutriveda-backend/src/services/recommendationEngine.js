const Patient = require('../models/Patient');
const Food = require('../models/Food');

class RecommendationEngine {
  // Meal type configurations
  static mealTypes = {
    breakfast: {
      caloriePercentage: 0.25,
      preferredTypes: ['breakfast', 'beverages', 'fruits'],
      timeRange: '6:00-10:00'
    },
    lunch: {
      caloriePercentage: 0.40,
      preferredTypes: ['main-course', 'vegetables', 'grains'],
      timeRange: '12:00-14:00'
    },
    dinner: {
      caloriePercentage: 0.30,
      preferredTypes: ['main-course', 'vegetables', 'light'],
      timeRange: '18:00-21:00'
    },
    snack: {
      caloriePercentage: 0.05,
      preferredTypes: ['snacks', 'fruits', 'nuts'],
      timeRange: 'flexible'
    }
  };

  /**
   * Generate a comprehensive diet plan for a patient
   * @param {string} patientId - Patient ID
   * @param {object} options - Diet plan options
   * @returns {object} Generated diet plan
   */
  static async generateDietPlan(patientId, options = {}) {
    try {
      // Get patient information
      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Calculate daily calorie requirements
      const dailyCalories = options.targetCalories || this.calculateDailyCalories(patient);
      
      // Generate meals for specified duration
      const days = [];
      for (let day = 1; day <= options.duration; day++) {
        const dayMeals = await this.generateDayMeals(patient, dailyCalories, options);
        days.push({
          day,
          meals: dayMeals.meals,
          nutritionalBalance: dayMeals.nutrition,
          ayurvedicBalance: dayMeals.ayurveda,
          totalCalories: dayMeals.totalCalories
        });
      }

      return {
        patientId,
        duration: options.duration,
        dailyCalories,
        days,
        recommendations: this.generateGeneralRecommendations(patient)
      };
    } catch (error) {
      throw new Error(`Diet plan generation failed: ${error.message}`);
    }
  }

  /**
   * Get real-time food recommendations based on current context
   * @param {string} patientId - Patient ID
   * @param {object} context - Current context (time, previous meals, etc.)
   * @returns {object} Real-time recommendations
   */
  static async getRealtimeRecommendations(patientId, context = {}) {
    try {
      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      const currentHour = new Date().getHours();
      const mealType = this.determineMealType(currentHour);
      
      // Get suitable foods for current meal
      const suitableFoods = await this.getSuitableFoods(patient, {
        mealType,
        season: context.season || 'all',
        specialConditions: patient.medicalConditions || []
      });

      return {
        mealType,
        currentTime: new Date().toLocaleTimeString(),
        recommendations: suitableFoods.slice(0, 5), // Top 5 recommendations
        nutritionalGuidance: this.getNutritionalGuidance(patient, mealType),
        ayurvedicAdvice: this.getAyurvedicAdvice(patient, mealType)
      };
    } catch (error) {
      throw new Error(`Real-time recommendations failed: ${error.message}`);
    }
  }

  /**
   * Get foods suitable for a patient based on various criteria
   * @param {object} patient - Patient object
   * @param {object} criteria - Selection criteria
   * @returns {array} Array of suitable foods
   */
  static async getSuitableFoods(patient, criteria = {}) {
    try {
      // Build food filter query
      const filter = {};
      
      if (criteria.season && criteria.season !== 'all') {
        filter.season = criteria.season;
      }
      
      if (criteria.mealType) {
        filter.category = { $in: this.mealTypes[criteria.mealType]?.preferredTypes || [] };
      }

      // Get all foods matching basic criteria
      const foods = await Food.find(filter);
      
      // Filter foods based on patient's conditions and preferences
      const suitableFoods = foods.filter(food => {
        return this.isFoodSuitable(food, patient, criteria);
      });

      // Sort by suitability score
      return suitableFoods.sort((a, b) => {
        const scoreA = this.calculateFoodScore(a, patient, criteria);
        const scoreB = this.calculateFoodScore(b, patient, criteria);
        return scoreB - scoreA;
      });
    } catch (error) {
      throw new Error(`Suitable foods retrieval failed: ${error.message}`);
    }
  }

  /**
   * Calculate daily calorie requirements for a patient
   * @param {object} patient - Patient object
   * @returns {number} Daily calorie requirement
   */
  static calculateDailyCalories(patient) {
    // Basic BMR calculation using Harris-Benedict equation
    let bmr;
    if (patient.gender === 'male') {
      bmr = 88.362 + (13.397 * patient.weight) + (4.799 * patient.height) - (5.677 * patient.age);
    } else {
      bmr = 447.593 + (9.247 * patient.weight) + (3.098 * patient.height) - (4.330 * patient.age);
    }

    // Activity factor (assuming moderate activity)
    const activityFactor = 1.5;
    return Math.round(bmr * activityFactor);
  }

  /**
   * Generate meals for a single day
   * @param {object} patient - Patient object
   * @param {number} dailyCalories - Target daily calories
   * @param {object} options - Generation options
   * @returns {object} Day's meals with nutrition info
   */
  static async generateDayMeals(patient, dailyCalories, options) {
    const meals = {};
    let totalCalories = 0;
    const nutrition = { protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const ayurveda = { vata: 0, pitta: 0, kapha: 0 };

    // Generate meals based on meal types
    for (const [mealType, config] of Object.entries(this.mealTypes)) {
      if (mealType === 'snack' && !options.includeSnacks) continue;
      
      const targetCalories = Math.round(dailyCalories * config.caloriePercentage);
      const suitableFoods = await this.getSuitableFoods(patient, {
        mealType,
        season: options.season,
        specialConditions: options.specialConditions
      });

      // Select foods for this meal
      const mealFoods = this.selectMealFoods(suitableFoods, targetCalories);
      meals[mealType] = mealFoods;

      // Accumulate nutrition
      mealFoods.forEach(food => {
        totalCalories += food.nutrition.calories || 0;
        nutrition.protein += food.nutrition.protein || 0;
        nutrition.carbs += food.nutrition.carbs || 0;
        nutrition.fat += food.nutrition.fat || 0;
        nutrition.fiber += food.nutrition.fiber || 0;
        
        if (food.ayurveda) {
          ayurveda.vata += food.ayurveda.vata || 0;
          ayurveda.pitta += food.ayurveda.pitta || 0;
          ayurveda.kapha += food.ayurveda.kapha || 0;
        }
      });
    }

    return { meals, nutrition, ayurveda, totalCalories };
  }

  /**
   * Determine meal type based on current hour
   * @param {number} hour - Current hour (0-23)
   * @returns {string} Meal type
   */
  static determineMealType(hour) {
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 12 && hour < 14) return 'lunch';
    if (hour >= 18 && hour < 21) return 'dinner';
    return 'snack';
  }

  /**
   * Check if a food is suitable for a patient
   * @param {object} food - Food object
   * @param {object} patient - Patient object
   * @param {object} criteria - Selection criteria
   * @returns {boolean} Whether food is suitable
   */
  static isFoodSuitable(food, patient, criteria) {
    // Check allergies
    if (patient.allergies && patient.allergies.some(allergy => 
      food.allergens && food.allergens.includes(allergy))) {
      return false;
    }

    // Check dietary restrictions
    if (patient.dietaryRestrictions) {
      if (patient.dietaryRestrictions.includes('vegetarian') && !food.isVegetarian) {
        return false;
      }
      if (patient.dietaryRestrictions.includes('vegan') && !food.isVegan) {
        return false;
      }
    }

    // Check medical conditions
    if (patient.medicalConditions) {
      if (patient.medicalConditions.includes('diabetes') && 
          food.nutrition && food.nutrition.sugar > 10) {
        return false;
      }
      if (patient.medicalConditions.includes('hypertension') && 
          food.nutrition && food.nutrition.sodium > 500) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate suitability score for a food
   * @param {object} food - Food object
   * @param {object} patient - Patient object
   * @param {object} criteria - Selection criteria
   * @returns {number} Suitability score
   */
  static calculateFoodScore(food, patient, criteria) {
    let score = 0;

    // Base nutritional score
    if (food.nutrition) {
      score += (food.nutrition.protein || 0) * 0.3;
      score += (food.nutrition.fiber || 0) * 0.2;
      score -= (food.nutrition.sugar || 0) * 0.1;
    }

    // Ayurvedic compatibility (if patient has dosha information)
    if (patient.ayurveda && food.ayurveda) {
      const patientDosha = patient.ayurveda.primaryDosha;
      if (patientDosha && food.ayurveda[patientDosha] > 0) {
        score += 10;
      }
    }

    // Seasonal preference
    if (criteria.season && food.season === criteria.season) {
      score += 5;
    }

    return score;
  }

  /**
   * Select foods for a meal based on calorie target
   * @param {array} availableFoods - Available foods
   * @param {number} targetCalories - Target calorie count
   * @returns {array} Selected foods for the meal
   */
  static selectMealFoods(availableFoods, targetCalories) {
    const selectedFoods = [];
    let currentCalories = 0;
    const maxFoods = 4; // Maximum foods per meal

    for (let i = 0; i < availableFoods.length && selectedFoods.length < maxFoods; i++) {
      const food = availableFoods[i];
      const foodCalories = food.nutrition?.calories || 100;
      
      if (currentCalories + foodCalories <= targetCalories * 1.2) { // 20% tolerance
        selectedFoods.push({
          ...food,
          quantity: this.calculateQuantity(food, targetCalories - currentCalories)
        });
        currentCalories += foodCalories;
      }
    }

    return selectedFoods;
  }

  /**
   * Calculate appropriate quantity for a food item
   * @param {object} food - Food object
   * @param {number} remainingCalories - Remaining calorie budget
   * @returns {string} Quantity string
   */
  static calculateQuantity(food, remainingCalories) {
    const baseCalories = food.nutrition?.calories || 100;
    const ratio = Math.min(remainingCalories / baseCalories, 2); // Max 2x serving
    
    if (ratio < 0.5) return '1/2 serving';
    if (ratio < 1) return '3/4 serving';
    if (ratio < 1.5) return '1 serving';
    return '1.5 servings';
  }

  /**
   * Generate general recommendations for a patient
   * @param {object} patient - Patient object
   * @returns {array} Array of recommendations
   */
  static generateGeneralRecommendations(patient) {
    const recommendations = [];

    // Age-based recommendations
    if (patient.age > 60) {
      recommendations.push("Include calcium-rich foods for bone health");
      recommendations.push("Ensure adequate protein intake to prevent muscle loss");
    }

    // Condition-based recommendations
    if (patient.medicalConditions) {
      if (patient.medicalConditions.includes('diabetes')) {
        recommendations.push("Monitor carbohydrate intake and prefer complex carbs");
        recommendations.push("Include fiber-rich foods to help control blood sugar");
      }
      if (patient.medicalConditions.includes('hypertension')) {
        recommendations.push("Limit sodium intake and include potassium-rich foods");
      }
    }

    // General health recommendations
    recommendations.push("Drink at least 8 glasses of water daily");
    recommendations.push("Include a variety of colorful fruits and vegetables");
    
    return recommendations;
  }

  /**
   * Get nutritional guidance for a specific meal type
   * @param {object} patient - Patient object
   * @param {string} mealType - Type of meal
   * @returns {string} Nutritional guidance
   */
  static getNutritionalGuidance(patient, mealType) {
    const guidance = {
      breakfast: "Start your day with protein and fiber to maintain energy levels",
      lunch: "Include a balanced mix of protein, carbs, and vegetables",
      dinner: "Keep it light with easily digestible foods",
      snack: "Choose nutrient-dense options like nuts or fruits"
    };

    return guidance[mealType] || "Maintain balanced nutrition throughout the day";
  }

  /**
   * Get Ayurvedic advice for a specific meal type
   * @param {object} patient - Patient object
   * @param {string} mealType - Type of meal
   * @returns {string} Ayurvedic advice
   */
  static getAyurvedicAdvice(patient, mealType) {
    const advice = {
      breakfast: "Eat warm, cooked foods to kindle digestive fire",
      lunch: "This is when digestive fire is strongest - eat your largest meal",
      dinner: "Choose warm, light foods that are easy to digest",
      snack: "If hungry, choose warm beverages or light fruits"
    };

    return advice[mealType] || "Eat mindfully and according to your constitution";
  }
}

module.exports = RecommendationEngine;
