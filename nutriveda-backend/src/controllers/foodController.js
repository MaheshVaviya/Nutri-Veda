const Food = require('../models/Food');

class FoodController {
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
}

module.exports = FoodController;