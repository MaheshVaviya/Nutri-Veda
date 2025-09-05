const RecommendationEngine = require('../services/recommendationEngine');
const DietChart = require('../models/DietChart');

class RecommendationController {
  static async generateDietPlan(req, res) {
    try {
      const { patientId } = req.params;
      const options = {
        duration: parseInt(req.body.duration) || 7,
        targetCalories: req.body.targetCalories,
        season: req.body.season || 'all',
        specialConditions: req.body.specialConditions || [],
        mealsPerDay: parseInt(req.body.mealsPerDay) || 3,
        includeSnacks: req.body.includeSnacks || false
      };

      const dietPlan = await RecommendationEngine.generateDietPlan(patientId, options);

      // Save the generated diet plan
      const savedDietChart = await DietChart.create({
        patientId,
        dietitianId: req.user.id,
        chartName: `AI Generated Plan - ${new Date().toLocaleDateString()}`,
        duration: options.duration,
        season: options.season,
        meals: dietPlan.days[0].meals, // Save first day as template
        totalNutrition: dietPlan.days[0].nutritionalBalance,
        ayurvedaBalance: dietPlan.days[0].ayurvedicBalance,
        instructions: `Generated AI diet plan for ${options.duration} days`,
        goals: {
          targetCalories: dietPlan.dailyCalories,
          healthGoals: options.specialConditions
        }
      });

      res.status(200).json({
        success: true,
        message: 'Diet plan generated successfully',
        data: {
          dietPlan,
          savedDietChartId: savedDietChart.id
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getRealtimeRecommendations(req, res) {
    try {
      const { patientId } = req.params;
      const currentTime = req.query.time || new Date().toISOString();
      const weatherCondition = req.query.weather;

      const recommendations = await RecommendationEngine.getRealtimeRecommendations(
        patientId, 
        currentTime, 
        weatherCondition
      );

      res.status(200).json({
        success: true,
        message: 'Realtime recommendations generated',
        data: recommendations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getFoodSuggestions(req, res) {
    try {
      const { patientId } = req.params;
      const { mealType, targetCalories, excludeIds } = req.query;

      const Patient = require('../models/Patient');
      const patient = await Patient.findById(patientId);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const suitableFoods = await RecommendationEngine.getSuitableFoods(
        patient, 
        req.query.season || 'all',
        req.query.conditions ? req.query.conditions.split(',') : []
      );

      let suggestions = suitableFoods.slice(0, 20);

      // Exclude specific food IDs if provided
      if (excludeIds) {
        const excludeArray = excludeIds.split(',');
        suggestions = suggestions.filter(food => !excludeArray.includes(food.id));
      }

      // Filter by meal type preferences
      if (mealType && RecommendationEngine.mealTypes[mealType]) {
        const mealConfig = RecommendationEngine.mealTypes[mealType];
        suggestions = suggestions.filter(food => {
          if (mealConfig.preferredRasas && !mealConfig.preferredRasas.includes(food.rasa)) {
            return false;
          }
          if (mealConfig.avoidRasas && mealConfig.avoidRasas.includes(food.rasa)) {
            return false;
          }
          return true;
        });
      }

      res.status(200).json({
        success: true,
        message: 'Food suggestions retrieved successfully',
        data: {
          suggestions,
          count: suggestions.length,
          mealType,
          patientDosha: patient.dosha
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getMealPlanAnalysis(req, res) {
    try {
      const { foods } = req.body; // Array of food objects with quantities
      const { patientId } = req.query;

      if (!foods || !Array.isArray(foods)) {
        return res.status(400).json({
          success: false,
          message: 'Foods array is required'
        });
      }

      let patient = null;
      if (patientId) {
        const Patient = require('../models/Patient');
        patient = await Patient.findById(patientId);
      }

      // Calculate nutritional totals
      const nutritionalSummary = {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0
      };

      const ayurvedicAnalysis = {
        rasaDistribution: { sweet: 0, sour: 0, salty: 0, pungent: 0, bitter: 0, astringent: 0 },
        doshaImpact: { vata: 0, pitta: 0, kapha: 0 },
        qualityDistribution: {}
      };

      foods.forEach(food => {
        const quantity = food.quantity || 1;
        
        // Nutritional calculations
        nutritionalSummary.totalCalories += (food.calories || 0) * quantity;
        nutritionalSummary.totalProtein += (food.protein || 0) * quantity;
        nutritionalSummary.totalCarbs += (food.carbs || 0) * quantity;
        nutritionalSummary.totalFat += (food.fat || 0) * quantity;
        nutritionalSummary.totalFiber += (food.fiber || 0) * quantity;

        // Ayurvedic analysis
        if (food.rasa && ayurvedicAnalysis.rasaDistribution[food.rasa] !== undefined) {
          ayurvedicAnalysis.rasaDistribution[food.rasa] += quantity;
        }

        if (food.doshaImpact) {
          Object.keys(food.doshaImpact).forEach(dosha => {
            if (food.doshaImpact[dosha] === 'increases') {
              ayurvedicAnalysis.doshaImpact[dosha] += quantity;
            } else if (food.doshaImpact[dosha] === 'decreases') {
              ayurvedicAnalysis.doshaImpact[dosha] -= quantity;
            }
          });
        }

        if (food.guna) {
          food.guna.forEach(quality => {
            ayurvedicAnalysis.qualityDistribution[quality] = 
              (ayurvedicAnalysis.qualityDistribution[quality] || 0) + quantity;
          });
        }
      });

      // Round nutritional values
      Object.keys(nutritionalSummary).forEach(key => {
        nutritionalSummary[key] = Math.round(nutritionalSummary[key] * 100) / 100;
      });

      // Generate recommendations if patient provided
      let recommendations = [];
      if (patient) {
        recommendations = this.generateMealAnalysisRecommendations(
          nutritionalSummary, 
          ayurvedicAnalysis, 
          patient
        );
      }

      res.status(200).json({
        success: true,
        message: '# NutriVeda Advanced Features Implementation

## 1. AUTHENTICATION SYSTEM

### Install Additional Dependencies
```bash
npm install bcryptjs jsonwebtoken multer csv-parser