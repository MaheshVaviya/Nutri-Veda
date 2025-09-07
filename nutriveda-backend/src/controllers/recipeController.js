const Recipe = require('../models/Recipe');
const CSVService = require('../services/csvService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

class RecipeController {
  static uploadMiddleware = upload.single('csvFile');

  static async createRecipe(req, res) {
    try {
      const recipe = await Recipe.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Recipe created successfully',
        data: recipe
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async uploadRecipeCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      // Save uploaded file temporarily
      const tempFilePath = await CSVService.saveUploadedFile(req.file, 'recipes');
      
      try {
        // Parse CSV file
        const parseResult = await CSVService.parseDietChartCSV(tempFilePath);
        
        if (parseResult.recipes.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No valid recipe records found in CSV',
            errors: parseResult.errors
          });
        }

        // Insert recipes into database
        const insertResult = await Recipe.createMany(parseResult.recipes);
        
        // Clean up temporary file
        CSVService.cleanupFile(tempFilePath);

        res.status(201).json({
          success: true,
          message: 'Recipes uploaded successfully',
          data: {
            totalRows: parseResult.totalRows,
            successfulRows: insertResult.success.length,
            errorRows: insertResult.errors.length + parseResult.errors.length,
            parseErrors: parseResult.errors,
            insertErrors: insertResult.errors,
            insertedRecipes: insertResult.success
          }
        });

      } catch (error) {
        // Clean up temporary file on error
        CSVService.cleanupFile(tempFilePath);
        throw error;
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error uploading CSV: ${error.message}`
      });
    }
  }

  static async getAllRecipes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const recipes = await Recipe.findAll(limit);
      
      res.status(200).json({
        success: true,
        message: 'Recipes retrieved successfully',
        count: recipes.length,
        data: recipes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getRecipeById(req, res) {
    try {
      const recipe = await Recipe.findById(req.params.id);
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Recipe retrieved successfully',
        data: recipe
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async searchRecipes(req, res) {
    try {
      const filters = {
        mealType: req.query.mealType,
        season: req.query.season,
        dosha: req.query.dosha,
        cuisine: req.query.cuisine,
        maxCookTime: req.query.maxCookTime,
        allergens: req.query.allergens ? req.query.allergens.split(',') : []
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });

      const recipes = await Recipe.searchRecipes(filters);
      
      res.status(200).json({
        success: true,
        message: 'Recipes retrieved successfully',
        count: recipes.length,
        filters: filters,
        data: recipes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getRecipesByMealType(req, res) {
    try {
      const { mealType } = req.params;
      const recipes = await Recipe.findByMealType(mealType);
      
      res.status(200).json({
        success: true,
        message: `${mealType} recipes retrieved successfully`,
        count: recipes.length,
        data: recipes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getRecipesBySeason(req, res) {
    try {
      const { season } = req.params;
      const recipes = await Recipe.findBySeason(season);
      
      res.status(200).json({
        success: true,
        message: `${season} recipes retrieved successfully`,
        count: recipes.length,
        data: recipes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getRecipesByDosha(req, res) {
    try {
      const { dosha } = req.params;
      const recipes = await Recipe.findByDosha(dosha);
      
      res.status(200).json({
        success: true,
        message: `Recipes for ${dosha} dosha retrieved successfully`,
        count: recipes.length,
        data: recipes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateRecipe(req, res) {
    try {
      const recipe = await Recipe.update(req.params.id, req.body);
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Recipe updated successfully',
        data: recipe
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteRecipe(req, res) {
    try {
      const result = await Recipe.delete(req.params.id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Recipe deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async clearAllRecipes(req, res) {
    try {
      // This is a dangerous operation - you might want to add authentication
      const db = require('../config/database');
      const recipes = await Recipe.findAll(10000);
      let deletedCount = 0;
      
      for (const recipe of recipes) {
        try {
          await db.delete(Recipe.collection, recipe.id);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting recipe ${recipe.id}:`, error);
        }
      }

      res.status(200).json({
        success: true,
        message: `Cleared ${deletedCount} recipes from database`,
        deletedCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = RecipeController;
