const DietChart = require('../models/DietChart');

class DietChartController {
  static async createDietChart(req, res) {
    try {
      const dietChart = await DietChart.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Diet chart created successfully',
        data: dietChart
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getDietChartById(req, res) {
    try {
      const dietChart = await DietChart.findById(req.params.id);
      
      if (!dietChart) {
        return res.status(404).json({
          success: false,
          message: 'Diet chart not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Diet chart retrieved successfully',
        data: dietChart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getDietChartsByPatient(req, res) {
    try {
      const dietCharts = await DietChart.findByPatient(req.params.patientId);
      
      res.status(200).json({
        success: true,
        message: 'Diet charts retrieved successfully',
        count: dietCharts.length,
        data: dietCharts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = DietChartController;