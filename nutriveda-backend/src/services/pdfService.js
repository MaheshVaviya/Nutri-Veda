const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const DietChart = require('../models/DietChart');

class PDFService {
  static async generateDietPlanPDF(patientData, outputPath = null) {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch the AI-generated diet chart
        const dietChart = await DietChart.findOne({ patientId: patientData._id }).sort({ createdAt: -1 });
        
        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true
        });

        // Set up output path
        const fileName = outputPath || `diet_plan_${patientData._id}_${Date.now()}.pdf`;
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
        
        if (dietChart && dietChart.dietPlan) {
          this.addAIDietPlan(doc, dietChart.dietPlan);
        } else {
          this.addDietPlanTemplate(doc);
        }
        
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
    // NutriVeda Header with colors
    doc.fontSize(24)
        .fillColor('#059669')
        .text('🌿 NutriVeda', 50, 50, { align: 'center' });
    
    doc.fontSize(16)
        .fillColor('#065f46')
        .text('Personalized Ayurvedic Diet Plan', 50, 80, { align: 'center' });
    
    doc.fontSize(12)
        .fillColor('#6b7280')
        .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 105, { align: 'center' });
    
    doc.moveTo(50, 125)
        .lineTo(545, 125)
        .strokeColor('#059669')
        .lineWidth(2)
        .stroke();
    
    doc.moveDown(2);
  }

  static addAIDietPlan(doc, dietPlan) {
    let yPosition = doc.y + 20;

    // General Guidelines
    if (dietPlan.general_guidelines && dietPlan.general_guidelines.length > 0) {
      doc.fontSize(16)
         .fillColor('#065f46')
         .text('General Guidelines', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#374151');
      
      dietPlan.general_guidelines.forEach((guideline) => {
        if (yPosition > 750) {
          doc.addPage();
          yPosition = 50;
        }
        doc.text(`• ${guideline}`, 70, yPosition);
        yPosition += 15;
      });
      
      yPosition += 20;
    }

    // Ayurvedic Tips
    if (dietPlan.ayurvedic_tips && dietPlan.ayurvedic_tips.length > 0) {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.fontSize(16)
         .fillColor('#065f46')
         .text('🌿 Ayurvedic Tips', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#374151');
      
      dietPlan.ayurvedic_tips.forEach((tip) => {
        if (yPosition > 750) {
          doc.addPage();
          yPosition = 50;
        }
        doc.text(`• ${tip}`, 70, yPosition);
        yPosition += 15;
      });
      
      yPosition += 30;
    }

    // 14-Day Meal Plan
    if (dietPlan.days && dietPlan.days.length > 0) {
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(18)
         .fillColor('#059669')
         .text('14-Day Meal Plan', 50, yPosition);
      
      yPosition += 30;

      dietPlan.days.forEach((day) => {
        // Check if we need a new page
        if (yPosition > 600) {
          doc.addPage();
          yPosition = 50;
        }

        // Day header
        doc.fontSize(14)
           .fillColor('#f59e0b')
           .text(`Day ${day.day}${day.date ? ` - ${day.date}` : ''}`, 50, yPosition);
        
        if (day.total_calories) {
          doc.fontSize(10)
             .fillColor('#6b7280')
             .text(`Total: ${day.total_calories} calories | ${day.dosha_balance || ''}`, 200, yPosition + 2);
        }

        yPosition += 25;

        // Meals
        const meals = ['breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner'];
        const mealTitles = {
          breakfast: '🌅 Breakfast',
          morning_snack: '☕ Morning Snack',
          lunch: '🍽️ Lunch',
          evening_snack: '🍎 Evening Snack',
          dinner: '🌙 Dinner'
        };

        meals.forEach(mealType => {
          if (day.meals[mealType]) {
            const meal = day.meals[mealType];
            
            // Check if we need a new page
            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }

            doc.fontSize(12)
               .fillColor('#059669')
               .text(mealTitles[mealType], 70, yPosition);
            
            if (meal.timing) {
              doc.fontSize(9)
                 .fillColor('#6b7280')
                 .text(`(${meal.timing})`, 170, yPosition + 2);
            }

            yPosition += 18;

            // Meal items
            if (meal.items && meal.items.length > 0) {
              doc.fontSize(10)
                 .fillColor('#374151');
              
              meal.items.forEach(item => {
                if (yPosition > 750) {
                  doc.addPage();
                  yPosition = 50;
                }
                doc.text(`  • ${item}`, 90, yPosition);
                yPosition += 12;
              });
            }

            // Calories and notes
            if (meal.calories) {
              doc.fontSize(9)
                 .fillColor('#6b7280')
                 .text(`Calories: ${meal.calories}`, 90, yPosition);
              yPosition += 12;
            }
            
            if (meal.ayurvedic_notes) {
              doc.fontSize(9)
                 .fillColor('#065f46')
                 .text(`💡 ${meal.ayurvedic_notes}`, 90, yPosition);
              yPosition += 12;
            }

            yPosition += 10;
          }
        });

        yPosition += 15;
      });
    }
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
    // Add footer to all pages
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(50, 770)
         .lineTo(545, 770)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();
      
      // Footer text
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text('Generated by NutriVeda - AI-Powered Ayurvedic Nutrition', 50, 780)
         .text(`Page ${i + 1} of ${pages.count}`, 450, 780);
    }
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