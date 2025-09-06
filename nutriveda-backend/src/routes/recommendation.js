const express = require('express');
const RecommendationController = require('../controllers/recommendationController');

const router = express.Router();

// Recommendations info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Recommendations API',
    endpoints: {
      dietPlan: 'POST /api/v1/recommendations/diet-plan/:patientId',
      realtime: 'GET /api/v1/recommendations/realtime',
      foodSuggestions: 'GET /api/v1/recommendations/food-suggestions',
      mealAnalysis: 'GET /api/v1/recommendations/meal-analysis'
    }
  });
});

// Generate diet plan
router.post('/diet-plan/:patientId', RecommendationController.generateDietPlan);

// Get realtime recommendations
router.get('/realtime', RecommendationController.getRealtimeRecommendations);

// Get food suggestions
router.get('/food-suggestions', RecommendationController.getFoodSuggestions);

// Get meal plan analysis
router.post('/meal-analysis', RecommendationController.getMealPlanAnalysis);

module.exports = router;
