const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  static async generateDietPlanPDF(patientData, outputPath = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Set up output path
        const fileName = outputPath || `diet_plan_${patientData.id}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../../temp', fileName);

        // Ensure temp directory exists
        const tempDir = path.dirname(filePath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Generate PDF content
        this.addHeader(doc);
        this.addPatientDetails(doc, patientData);
        this.addDietPlanTemplate(doc);
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve({ 
            success: true, 
            filePath,
            fileName: path.basename(filePath)
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

static addHeader(doc) {
    const logoPath = path.join('../../assets/images/logo.png');


    // Add logo if it exists
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 60 }); // Logo at top-left
    }

    // Move title slightly to the right to avoid overlap with logo
    doc.fontSize(24)
        .fillColor('#2c5530')
        .text('NutriVeda - Ayurvedic Diet Plan', 120, 50, { align: 'left' });
    
    doc.fontSize(12)
        .fillColor('#666')
        .text(`Generated on: ${new Date().toLocaleDateString()}`, 120, 80, { align: 'left' });
    
    doc.moveTo(50, 100)
        .lineTo(545, 100)
        .stroke('#2c5530');
    
    doc.moveDown(2);
  }

  static addPatientDetails(doc, patient) {
    const startY = doc.y;
    
    // Patient Details Header
    doc.fontSize(18)
       .fillColor('#2c5530')
       .text('Patient Information', 50, startY);
    
    doc.moveDown(0.5);
    
    // Create two columns for patient details
    const leftCol = 50;
    const rightCol = 300;
    let currentY = doc.y;
    
    doc.fontSize(11).fillColor('#333');
    
    // Left column
    this.addDetailRow(doc, 'Name:', patient.name || 'N/A', leftCol, currentY);
    this.addDetailRow(doc, 'Age:', `${patient.age || 'N/A'} years`, leftCol, currentY + 20);
    this.addDetailRow(doc, 'Gender:', patient.gender || 'N/A', leftCol, currentY + 40);
    this.addDetailRow(doc, 'Height:', `${patient.height || 'N/A'} cm`, leftCol, currentY + 60);
    this.addDetailRow(doc, 'Weight:', `${patient.weight || 'N/A'} kg`, leftCol, currentY + 80);
    this.addDetailRow(doc, 'BMI:', patient.bmi || 'N/A', leftCol, currentY + 100);
    
    // Right column  
    this.addDetailRow(doc, 'Dosha:', patient.dosha || 'N/A', rightCol, currentY);
    this.addDetailRow(doc, 'Digestion:', patient.digestion || 'N/A', rightCol, currentY + 20);
    this.addDetailRow(doc, 'Water Intake:', `${patient.waterIntake || 'N/A'} L/day`, rightCol, currentY + 40);
    this.addDetailRow(doc, 'Activity Level:', patient.activityLevel || 'N/A', rightCol, currentY + 60);
    this.addDetailRow(doc, 'Sleep Pattern:', patient.sleepPattern || 'N/A', rightCol, currentY + 80);
    this.addDetailRow(doc, 'Stress Level:', patient.stressLevel || 'N/A', rightCol, currentY + 100);
    
    // Medical information
    doc.y = currentY + 130;
    this.addDetailRow(doc, 'Medical Conditions:', (patient.condition || []).join(', ') || 'None', leftCol, doc.y);
    this.addDetailRow(doc, 'Allergies:', (patient.allergies || []).join(', ') || 'None', leftCol, doc.y + 20);
    this.addDetailRow(doc, 'Current Medications:', (patient.medicalHistory?.currentMedications || []).join(', ') || 'None', leftCol, doc.y + 40);
    
    doc.y += 70;
  }

  static addDetailRow(doc, label, value, x, y) {
    doc.fontSize(10)
       .fillColor('#666')
       .text(label, x, y, { width: 80 });
    
    doc.fontSize(10)
       .fillColor('#333')
       .text(value, x + 85, y, { width: 150 });
  }

  static addDietPlanTemplate(doc) {
    // Add new page if needed
    if (doc.y > 600) {
      doc.addPage();
    }
    
    doc.moveDown(2);
    
    // Diet Plan Header
    doc.fontSize(18)
       .fillColor('#2c5530')
       .text('14-Day Diet Plan Template', 50, doc.y);
    
    doc.moveDown(1);
    
    // Table setup
    const tableTop = doc.y;
    const colWidth = 120;
    const rowHeight = 25;
    
    // Table headers
    const headers = ['Day', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    let currentX = 50;
    
    doc.fontSize(10).fillColor('#fff');
    
    // Header background
    doc.rect(50, tableTop, 495, rowHeight).fill('#2c5530');
    
    // Header text
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, index) => {
      doc.text(header, currentX + 5, tableTop + 8, { 
        width: index === 0 ? 60 : colWidth - 10,
        align: 'center'
      });
      currentX += index === 0 ? 65 : colWidth;
    });
    doc.fillColor('#333').font('Helvetica');
    
    // Table rows
    doc.fillColor('#333');
    let currentY = tableTop + rowHeight;
    
    for (let day = 1; day <= 14; day++) {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 80;
      }
      
      currentX = 50;
      
      // Alternate row colors
      if (day % 2 === 0) {
        doc.rect(50, currentY, 495, rowHeight).fill('#f9f9f9');
      }
      
      // Day number
      doc.fontSize(9)
         .fillColor('#333')
         .text(`Day ${day}`, currentX + 5, currentY + 8, { 
           width: 55, 
           align: 'center' 
         });
      
      currentX += 65;
      
      // Meal placeholders
      const meals = [
        '[Breakfast items will be generated here]',
        '[Lunch items will be generated here]', 
        '[Dinner items will be generated here]',
        '[Snack items will be generated here]'
      ];
      
      meals.forEach(meal => {
        doc.fontSize(8)
           .fillColor('#666')
           .text(meal, currentX + 3, currentY + 6, { 
             width: colWidth - 6,
             align: 'left'
           });
        currentX += colWidth;
      });
      
      currentY += rowHeight;
      
      // Add border lines
      doc.strokeColor('#ddd')
         .lineWidth(0.5)
         .moveTo(50, currentY)
         .lineTo(545, currentY)
         .stroke();
    }
    
    // Table border
    doc.rect(50, tableTop, 495, currentY - tableTop)
       .stroke('#2c5530');
    
    // Vertical lines
    let borderX = 115; // After day column
    for (let i = 0; i < 4; i++) {
      doc.moveTo(borderX, tableTop)
         .lineTo(borderX, currentY)
         .stroke('#ddd');
      borderX += colWidth;
    }
  }

  static addFooter(doc) {
    doc.fontSize(8)
       .fillColor('#666')
       .text('This diet plan template will be customized based on your Ayurvedic constitution and health goals.', 
             50, 750, { align: 'center', width: 495 });
    
    doc.text('For questions or modifications, please consult your Ayurvedic practitioner.', 
             50, 765, { align: 'center', width: 495 });
  }

  static async cleanupTempFiles(olderThanMinutes = 60) {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) return;

      const files = fs.readdirSync(tempDir);
      const now = new Date();

      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          const fileAge = (now - stats.mtime) / (1000 * 60); // in minutes

          if (fileAge > olderThanMinutes) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Cleaned up temp PDF: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning temp files:', error);
    }
  }
}

module.exports = PDFService;