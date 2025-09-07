const express = require('express');
const RecipeController = require('../controllers/recipeController');

const router = express.Router();

// CSV Upload routes
router.post('/upload-csv', RecipeController.uploadMiddleware, RecipeController.uploadRecipeCSV);
router.delete('/clear-all', RecipeController.clearAllRecipes);

// Recipe CRUD routes
router.post('/', RecipeController.createRecipe);
router.get('/', RecipeController.getAllRecipes);
router.get('/search', RecipeController.searchRecipes);
router.get('/meal-type/:mealType', RecipeController.getRecipesByMealType);
router.get('/season/:season', RecipeController.getRecipesBySeason);
router.get('/dosha/:dosha', RecipeController.getRecipesByDosha);
router.get('/:id', RecipeController.getRecipeById);
router.put('/:id', RecipeController.updateRecipe);
router.delete('/:id', RecipeController.deleteRecipe);

module.exports = router;
