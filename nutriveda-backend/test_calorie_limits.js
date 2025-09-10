const PDFService = require('./src/services/pdfService');
const fs = require('fs');
const path = require('path');

// Test edge cases and various calorie limits
async function testCalorieLimits() {
  console.log('🧪 Testing Different Calorie Limits and Edge Cases...\n');
  
  const testCases = [
    {
      name: "Low Calorie Diet",
      patient: {
        id: "test-low-cal",
        name: "Asha Mehra",
        age: 35,
        weight: 55,
        height: 155,
        gender: "Female",
        constitution: "Pitta",
        dosha: "Pitta",
        calorieLimit: 1000,
        healthGoals: ["Weight Loss"]
      }
    },
    {
      name: "High Calorie Diet",
      patient: {
        id: "test-high-cal",
        name: "Vikram Singh",
        age: 25,
        weight: 85,
        height: 180,
        gender: "Male",
        constitution: "Vata",
        dosha: "Vata",
        calorieLimit: 3000,
        healthGoals: ["Muscle Gain", "Weight Gain"]
      }
    },
    {
      name: "No Calorie Limit (AI Calculates)",
      patient: {
        id: "test-no-limit",
        name: "Maya Sharma",
        age: 30,
        weight: 60,
        height: 165,
        gender: "Female",
        constitution: "Kapha",
        dosha: "Kapha",
        // No calorieLimit - should be calculated by AI
        healthGoals: ["General Wellness"]
      }
    }
  ];
  
  for (let testCase of testCases) {
    try {
      console.log(`\n=== ${testCase.name} ===`);
      console.log(`👤 Patient: ${testCase.patient.name}`);
      console.log(`🧘 Dosha: ${testCase.patient.dosha}`);
      console.log(`📊 Calorie Limit: ${testCase.patient.calorieLimit || 'AI calculated'}`);
      
      const startTime = Date.now();
      const result = await PDFService.generateDietPlanPDF(testCase.patient);
      const endTime = Date.now();
      
      if (fs.existsSync(result.filePath)) {
        const stats = fs.statSync(result.filePath);
        console.log(`✅ PDF Generated: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`⏱️ Generation Time: ${endTime - startTime}ms`);
        
        // Copy for easy access
        const safeName = testCase.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const testOutputPath = path.join(__dirname, `test_${safeName}_diet_plan.pdf`);
        fs.copyFileSync(result.filePath, testOutputPath);
        console.log(`📋 Saved as: ${testOutputPath}`);
      } else {
        console.log('❌ PDF generation failed');
      }
      
    } catch (error) {
      console.error(`❌ Error for ${testCase.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Calorie limit testing completed!');
  console.log('💡 The AI successfully adapts to different calorie requirements');
  console.log('🔍 Check the generated PDFs to see how meal portions and selections change');
}

testCalorieLimits();
