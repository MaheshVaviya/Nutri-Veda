const express = require('express');
const FoodController = require('../controllers/foodController');

const router = express.Router();

// CSV Upload routes
router.post('/upload-csv', FoodController.uploadMiddleware, FoodController.uploadFoodCSV);
router.delete('/clear-all', FoodController.clearAllFoods);

// Food CRUD routes
router.post('/', FoodController.createFood);
router.get('/', FoodController.getAllFoods);
router.get('/search', FoodController.searchFoods);
router.get('/search/dosha', FoodController.searchFoodsByDosha);
router.get('/:id', FoodController.getFoodById);

module.exports = router;