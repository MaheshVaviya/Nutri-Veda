const PDFService = require('../services/pdfService');
const Patient = require('../models/Patient');
const path = require('path');
const fs = require('fs');

class PDFController {
  static async generateDietPlanPDF(req, res) {
    try {
      const { patientId } = req.params;
      
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      // Get patient data
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Generate PDF
      const result = await PDFService.generateDietPlanPDF(patient);
      
      if (!result.success) {
        throw new Error('Failed to generate PDF');
      }

      // Check if file exists
      if (!fs.existsSync(result.filePath)) {
        throw new Error('Generated PDF file not found');
      }

      res.status(200).json({
        success: true,
        message: 'Diet plan PDF generated successfully',
        data: {
          fileName: result.fileName,
          downloadUrl: `/api/v1/pdf/download/${result.fileName}`,
          patientName: patient.name,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({
        success: false,
        message: `Error generating PDF: ${error.message}`
      });
    }
  }

  static async downloadPDF(req, res) {
    try {
      const { fileName } = req.params;
      
      if (!fileName || !fileName.endsWith('.pdf')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file name'
        });
      }

      const filePath = path.join(__dirname, '../../temp', fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'PDF file not found or expired'
        });
      }

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Clean up file after download (optional)
      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`🗑️ Cleaned up downloaded PDF: ${fileName}`);
            }
          } catch (error) {
            console.error('Error cleaning up PDF:', error);
          }
        }, 5000); // Delete after 5 seconds
      });

    } catch (error) {
      console.error('PDF download error:', error);
      res.status(500).json({
        success: false,
        message: `Error downloading PDF: ${error.message}`
      });
    }
  }

  static async listPatientPDFs(req, res) {
    try {
      const { patientId } = req.params;
      
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        return res.status(200).json({
          success: true,
          message: 'No PDFs found',
          data: []
        });
      }

      const files = fs.readdirSync(tempDir);
      const patientPDFs = files
        .filter(file => file.includes(`diet_plan_${patientId}_`) && file.endsWith('.pdf'))
        .map(file => {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          return {
            fileName: file,
            downloadUrl: `/api/v1/pdf/download/${file}`,
            createdAt: stats.birthtime,
            size: stats.size
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      res.status(200).json({
        success: true,
        message: 'Patient PDFs retrieved successfully',
        data: patientPDFs,
        count: patientPDFs.length
      });

    } catch (error) {
      console.error('List PDFs error:', error);
      res.status(500).json({
        success: false,
        message: `Error listing PDFs: ${error.message}`
      });
    }
  }

  static async cleanupTempPDFs(req, res) {
    try {
      await PDFService.cleanupTempFiles(60); // Clean files older than 60 minutes
      
      res.status(200).json({
        success: true,
        message: 'Temporary PDF cleanup completed'
      });

    } catch (error) {
      console.error('PDF cleanup error:', error);
      res.status(500).json({
        success: false,
        message: `Error during cleanup: ${error.message}`
      });
    }
  }
}

module.exports = PDFController;