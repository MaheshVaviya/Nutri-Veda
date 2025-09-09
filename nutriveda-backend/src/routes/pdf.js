const express = require('express');
const PDFController = require('../controllers/pdfController');

const router = express.Router();

// PDF routes
router.post('/generate/:patientId', PDFController.generateDietPlanPDF);
router.get('/download/:fileName', PDFController.downloadPDF);
router.get('/patient/:patientId', PDFController.listPatientPDFs);
router.post('/cleanup', PDFController.cleanupTempPDFs);

// PDF info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PDF Generation API',
    endpoints: {
      generate: 'POST /api/v1/pdf/generate/:patientId - Generate diet plan PDF',
      download: 'GET /api/v1/pdf/download/:fileName - Download PDF file',
      list: 'GET /api/v1/pdf/patient/:patientId - List patient PDFs',
      cleanup: 'POST /api/v1/pdf/cleanup - Clean temporary files'
    }
  });
});

module.exports = router;
