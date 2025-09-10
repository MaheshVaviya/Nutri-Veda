const express = require('express');
const DietChartController = require('../controllers/aiDietController');

const router = express.Router();

// AI Diet Chart routes
router.post('/generate/:patientId', DietChartController.generateDietChart);
router.get('/patient/:patientId', DietChartController.getDietChart);
router.put('/save/:patientId', DietChartController.saveDietChart);

// Diet chart info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Diet Chart API',
    endpoints: {
      generate: 'POST /api/v1/ai-diet/generate/:patientId - Generate AI diet chart',
      get: 'GET /api/v1/ai-diet/patient/:patientId - Get patient diet chart',
      save: 'PUT /api/v1/ai-diet/save/:patientId - Save/update diet chart'
    }
  });
});

module.exports = router;
