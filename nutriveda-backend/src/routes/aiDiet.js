const express = require('express');
const AIDietController = require('../controllers/aiDietController');

const router = express.Router();

// AI Diet Chart routes
router.post('/generate/:patientId', AIDietController.generateDietChart);
router.get('/patient/:patientId', AIDietController.getDietChart);
router.put('/save/:patientId', AIDietController.saveDietChart);

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
