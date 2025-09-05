const express = require('express');
const FoodController = require('../controllers/foodController');

const router = express.Router();

router.post('/', FoodController.createFood);
router.get('/', FoodController.getAllFoods);
router.get('/search/dosha', FoodController.searchFoodsByDosha);
router.get('/:id', FoodController.getFoodById);

module.exports = router;