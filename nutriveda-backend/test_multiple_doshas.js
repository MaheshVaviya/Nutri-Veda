const PDFService = require('./src/services/pdfService');
const fs = require('fs');
const path = require('path');

// Test with different patient parameters
const testPatientVata = {
  id: "test-vata-patient",
  name: "Rajesh Kumar",
  age: 28,
  weight: 70,
  height: 175,
  gender: "Male",
  activityLevel: "High",
  dietaryRestrictions: ["Vegetarian"],
  healthGoals: ["Muscle Gain", "Better Digestion"],
  constitution: "Vata",
  dosha: "Vata",
  calorieLimit: 2200
};

const testPatientKapha = {
  id: "test-kapha-patient", 
  name: "Sunita Patel",
  age: 45,
  weight: 78,
  height: 160,
  gender: "Female",
  activityLevel: "Low",
  dietaryRestrictions: ["Gluten-free"],
  healthGoals: ["Weight Loss", "Energy Boost"],
  constitution: "Kapha",
  dosha: "Kapha",
  calorieLimit: 1200
};

async function testMultipleDoshas() {
  console.log('🧪 Testing AI Diet Generation for Multiple Doshas...\n');
  
  const patients = [testPatientVata, testPatientKapha];
  
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    
    try {
      console.log(`\n=== Testing Patient ${i + 1}: ${patient.name} ===`);
      console.log(`🧘 Dosha: ${patient.dosha}`);
      console.log(`📊 Calorie Target: ${patient.calorieLimit} cal/day`);
      console.log(`🎯 Goals: ${patient.healthGoals.join(', ')}`);
      
      const result = await PDFService.generateDietPlanPDF(patient);
      
      if (fs.existsSync(result.filePath)) {
        const stats = fs.statSync(result.filePath);
        console.log(`✅ PDF Generated: ${(stats.size / 1024).toFixed(2)} KB`);
        
        // Copy for easy access
        const testOutputPath = path.join(__dirname, `test_${patient.dosha.toLowerCase()}_diet_plan.pdf`);
        fs.copyFileSync(result.filePath, testOutputPath);
        console.log(`📋 Saved as: ${testOutputPath}`);
      } else {
        console.log('❌ PDF generation failed');
      }
      
    } catch (error) {
      console.error(`❌ Error for ${patient.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Multi-dosha testing completed!');
  console.log('💡 Check the generated PDFs to see dosha-specific recommendations');
}

testMultipleDoshas();
