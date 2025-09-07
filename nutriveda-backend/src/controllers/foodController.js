const Food = require('../models/Food');
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

class FoodController {
  static uploadMiddleware = upload.single('csvFile');

  static async createFood(req, res) {
    try {
      const food = await Food.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Food created successfully',
        data: food
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async uploadFoodCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      // Save uploaded file temporarily
      const tempFilePath = await CSVService.saveUploadedFile(req.file, 'foods');
      
      try {
        // Parse CSV file
        const parseResult = await CSVService.parseFoodCSV(tempFilePath);
        
        if (parseResult.foods.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No valid food records found in CSV',
            errors: parseResult.errors
          });
        }

        // Insert foods into database
        const insertResult = await Food.createMany(parseResult.foods);
        
        // Clean up temporary file
        CSVService.cleanupFile(tempFilePath);

        res.status(201).json({
          success: true,
          message: 'Foods uploaded successfully',
          data: {
            totalRows: parseResult.totalRows,
            successfulRows: insertResult.success.length,
            errorRows: insertResult.errors.length + parseResult.errors.length,
            parseErrors: parseResult.errors,
            insertErrors: insertResult.errors,
            insertedFoods: insertResult.success
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

  static async getAllFoods(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const foods = await Food.findAll(limit);
      
      res.status(200).json({
        success: true,
        message: 'Foods retrieved successfully',
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

  static async getFoodById(req, res) {
    try {
      const food = await Food.findById(req.params.id);
      
      if (!food) {
        return res.status(404).json({
          success: false,
          message: 'Food not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Food retrieved successfully',
        data: food
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async searchFoodsByDosha(req, res) {
    try {
      const { dosha, impact } = req.query;
      
      if (!dosha) {
        return res.status(400).json({
          success: false,
          message: 'Dosha parameter is required'
        });
      }

      const foods = await Food.searchByDosha(dosha, impact || 'decreases');
      
      res.status(200).json({
        success: true,
        message: `Foods for ${dosha} dosha retrieved successfully`,
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

  static async searchFoods(req, res) {
    try {
      const filters = {
        category: req.query.category,
        season: req.query.season,
        rasa: req.query.rasa,
        vegNonVeg: req.query.vegNonVeg
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const foods = await Food.find(filters);
      
      res.status(200).json({
        success: true,
        message: 'Foods retrieved successfully',
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

  static async clearAllFoods(req, res) {
    try {
      // This is a dangerous operation - you might want to add authentication
      const db = require('../config/database');
      const foods = await Food.findAll(10000);
      let deletedCount = 0;
      
      for (const food of foods) {
        try {
          await db.delete(Food.collection, food.id);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting food ${food.id}:`, error);
        }
      }

      res.status(200).json({
        success: true,
        message: `Cleared ${deletedCount} foods from database`,
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

module.exports = FoodController;