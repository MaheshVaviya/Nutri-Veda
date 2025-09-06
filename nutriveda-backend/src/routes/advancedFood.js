const express = require('express');
const AdvancedFoodController = require('../controllers/advancedFoodController');

const router = express.Router();

// Advanced Food info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Advanced Food API',
    endpoints: {
      bulkUpload: 'POST /api/v1/advanced-foods/bulk-upload',
      search: 'GET /api/v1/advanced-foods/search',
      filters: 'GET /api/v1/advanced-foods/filters',
      analytics: 'GET /api/v1/advanced-foods/analytics',
      recommendations: 'GET /api/v1/advanced-foods/recommendations'
    }
  });
});

// Bulk upload CSV route
router.post('/bulk-upload', 
  AdvancedFoodController.uploadMiddleware,
  AdvancedFoodController.bulkUpload
);

// Search foods with advanced filters
router.get('/search', AdvancedFoodController.searchFoods);

// Get foods with filters
router.get('/filter', AdvancedFoodController.getFoodsWithFilters);

// Get nutrition summary
router.get('/nutrition-summary', AdvancedFoodController.getNutritionSummary);

// Get food categories
router.get('/categories', AdvancedFoodController.getFoodCategories);

// Recommend foods for specific dosha
router.get('/recommend/:dosha', AdvancedFoodController.recommendFoodsForDosha);

module.exports = router;
