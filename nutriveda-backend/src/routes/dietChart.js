const express = require('express');
const DietChartController = require('../controllers/dietChartController');

const router = express.Router();

router.get('/', DietChartController.getAllDietCharts);
router.post('/', DietChartController.createDietChart);
router.get('/:id', DietChartController.getDietChartById);
router.get('/patient/:patientId', DietChartController.getDietChartsByPatient);

module.exports = router;