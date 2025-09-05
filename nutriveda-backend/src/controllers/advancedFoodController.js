const FoodService = require('../services/foodService');
const Food = require('../models/Food');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `foods-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

class AdvancedFoodController {
  static uploadMiddleware = upload.single('csvFile');

  static async bulkUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required'
        });
      }

      const results = await FoodService.bulkUploadFromCSV(req.file.path);

      // Clean up uploaded file
      require('fs').unlinkSync(req.file.path);

      res.status(200).json({
        success: true,
        message: 'Bulk upload completed',
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async searchFoods(req, res) {
    try {
      const { q, query } = req.query;
      const searchQuery = q || query;

      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const results = await FoodService.searchFoods(searchQuery);

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        count: results.length,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getFoodsWithFilters(req, res) {
    try {
      const filters = {
        category: req.query.category,
        rasa: req.query.rasa,
        dosha: req.query.dosha,
        doshaEffect: req.query.doshaEffect, // increases, decreases, neutral
        season: req.query.season,
        region: req.query.region,
        minCalories: req.query.minCalories,
        maxCalories: req.query.maxCalories,
        minProtein: req.query.minProtein,
        sortBy: req.query.sortBy // calories, protein, name
      };

      const foods = await FoodService.getFoodsWithFilters(filters);
      
      res.status(200).json({
        success: true,
        message: 'Filtered foods retrieved successfully',
        count: foods.length,
        filters: filters,
        data: foods
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getNutritionSummary(req, res) {
    try {
      const { foodIds, quantities } = req.body;

      if (!foodIds || !Array.isArray(foodIds)) {
        return res.status(400).json({
          success: false,
          message: 'foodIds array is required'
        });
      }

      const summary = await FoodService.getFoodNutritionSummary(foodIds, quantities);

      res.status(200).json({
        success: true,
        message: 'Nutrition summary calculated successfully',
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getFoodCategories(req, res) {
    try {
      const foods = await Food.findAll(1000);
      const categories = [...new Set(foods.map(food => food.category))].sort();
      const rasas = [...new Set(foods.map(food => food.rasa))].sort();
      const regions = [...new Set(foods.flatMap(food => food.region || []))].sort();
      const seasons = [...new Set(foods.flatMap(food => food.season || []))].sort();

      res.status(200).json({
        success: true,
        message: 'Food metadata retrieved successfully',
        data: {
          categories,
          rasas,
          regions,
          seasons,
          totalFoods: foods.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async recommendFoodsForDosha(req, res) {
    try {
      const { dosha, season, region, count = 10 } = req.query;

      if (!dosha) {
        return res.status(400).json({
          success: false,
          message: 'Dosha parameter is required'
        });
      }

      let foods = await Food.searchByDosha(dosha, 'decreases');

      // Apply additional filters
      if (season) {
        foods = foods.filter(food => 
          food.season && (food.season.includes(season) || food.season.includes('all'))
        );
      }

      if (region) {
        foods = foods.filter(food => 
          food.region && (food.region.includes(region) || food.region.includes('all'))
        );
      }

      // Limit results
      foods = foods.slice(0, parseInt(count));

      res.status(200).json({
        success: true,
        message: `Food recommendations for ${dosha} dosha`,
        count: foods.length,
        data: foods
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AdvancedFoodController;