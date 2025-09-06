const db = require('../config/database');

class DietChart {
  static collection = 'dietCharts';

  static validateDietChart(dietChartData) {
    const required = ['patientId', 'meals'];
    for (let field of required) {
      if (!dietChartData[field]) {
        throw new Error(`${field} is required`);
      }
    }
  }

  static calculateTotalNutrition(meals) {
    const total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    meals.forEach(meal => {
      if (meal.foods && Array.isArray(meal.foods)) {
        meal.foods.forEach(food => {
          const quantity = food.quantity || 1;
          total.calories += (food.calories || 0) * quantity;
          total.protein += (food.protein || 0) * quantity;
          total.carbs += (food.carbs || 0) * quantity;
          total.fat += (food.fat || 0) * quantity;
          total.fiber += (food.fiber || 0) * quantity;
        });
      }
    });

    // Round to 2 decimal places
    Object.keys(total).forEach(key => {
      total[key] = parseFloat(total[key].toFixed(2));
    });

    return total;
  }

  static calculateAyurvedaBalance(meals, patientDosha) {
    const rasaCount = {
      sweet: 0, sour: 0, salty: 0, 
      pungent: 0, bitter: 0, astringent: 0
    };
    
    const doshaImpact = {
      vata: { increases: 0, decreases: 0, neutral: 0 },
      pitta: { increases: 0, decreases: 0, neutral: 0 },
      kapha: { increases: 0, decreases: 0, neutral: 0 }
    };

    let totalFoods = 0;

    meals.forEach(meal => {
      if (meal.foods && Array.isArray(meal.foods)) {
        meal.foods.forEach(food => {
          totalFoods++;
          
          // Count Rasa
          if (food.rasa && rasaCount.hasOwnProperty(food.rasa)) {
            rasaCount[food.rasa]++;
          }
          
          // Count Dosha Impact
          if (food.doshaImpact) {
            ['vata', 'pitta', 'kapha'].forEach(dosha => {
              const impact = food.doshaImpact[dosha] || 'neutral';
              if (doshaImpact[dosha][impact] !== undefined) {
                doshaImpact[dosha][impact]++;
              }
            });
          }
        });
      }
    });

    return {
      rasaDistribution: rasaCount,
      doshaBalance: doshaImpact,
      primaryDoshaBalance: doshaImpact[patientDosha] || doshaImpact.vata,
      totalFoodItems: totalFoods,
      balanceScore: this.calculateBalanceScore(doshaImpact[patientDosha], totalFoods)
    };
  }

  static calculateBalanceScore(primaryDoshaBalance, totalFoods) {
    if (totalFoods === 0) return 0;
    
    const decreasesPercent = (primaryDoshaBalance.decreases / totalFoods) * 100;
    const increasesPercent = (primaryDoshaBalance.increases / totalFoods) * 100;
    
    // Ideal is more decreasing foods for the primary dosha
    let score = decreasesPercent - (increasesPercent * 0.5);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  static async create(dietChartData) {
    this.validateDietChart(dietChartData);
    
    const totalNutrition = this.calculateTotalNutrition(dietChartData.meals);
    
    // Get patient info for ayurveda balance calculation
    const Patient = require('./Patient');
    const patient = await Patient.findById(dietChartData.patientId);
    const patientDosha = patient ? patient.dosha : 'vata';
    
    const ayurvedaBalance = this.calculateAyurvedaBalance(dietChartData.meals, patientDosha);
    
    const dietChart = {
      patientId: dietChartData.patientId,
      dietitianId: dietChartData.dietitianId || '',
      
      // Meal Structure
      meals: dietChartData.meals.map(meal => ({
        name: meal.name || 'Meal',
        time: meal.time || '',
        foods: meal.foods || [],
        instructions: meal.instructions || '',
        totalMealCalories: meal.foods ? meal.foods.reduce((sum, food) => 
          sum + ((food.calories || 0) * (food.quantity || 1)), 0) : 0
      })),
      
      // Calculated Nutritional Summary
      totalNutrition,
      
      // Calculated Ayurveda Balance
      ayurvedaBalance,
      
      // Chart Metadata
      date: dietChartData.date || new Date().toISOString().split('T')[0],
      duration: dietChartData.duration || 1, // days
      chartName: dietChartData.chartName || `Diet Chart - ${new Date().toLocaleDateString()}`,
      
      // Additional Info
      instructions: dietChartData.instructions || '',
      notes: dietChartData.notes || '',
      season: dietChartData.season || 'all',
      status: 'active', // active, completed, paused
      
      // Goals
      goals: {
        targetCalories: dietChartData.targetCalories || totalNutrition.calories,
        targetProtein: dietChartData.targetProtein || totalNutrition.protein,
        healthGoals: dietChartData.healthGoals || []
      }
    };
    
    return await db.create(this.collection, dietChart);
  }

  static async findById(id) {
    return await db.findById(this.collection, id);
  }

  static async findAll() {
    return await db.findAll(this.collection);
  }

  static async findByPatient(patientId) {
    return await db.findByField(this.collection, 'patientId', patientId);
  }

  static async findByDietitian(dietitianId) {
    return await db.findByField(this.collection, 'dietitianId', dietitianId);
  }

  static async update(id, dietChartData) {
    // Recalculate nutrition and balance if meals updated
    if (dietChartData.meals) {
      dietChartData.totalNutrition = this.calculateTotalNutrition(dietChartData.meals);
      
      // Get current chart to find patient dosha
      const currentChart = await this.findById(id);
      if (currentChart) {
        const Patient = require('./Patient');
        const patient = await Patient.findById(currentChart.patientId);
        const patientDosha = patient ? patient.dosha : 'vata';
        dietChartData.ayurvedaBalance = this.calculateAyurvedaBalance(dietChartData.meals, patientDosha);
      }
    }
    
    return await db.update(this.collection, id, dietChartData);
  }
}

module.exports = DietChart;