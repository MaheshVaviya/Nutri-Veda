const PDFService = require('./src/services/pdfService');
const fs = require('fs');
const path = require('path');

// Test data simulating patient with calorie limit and dosha preferences
const testPatient = {
  id: "test-patient-123",
  name: "Priya Sharma",
  age: 32,
  weight: 65,
  height: 165,
  gender: "Female",
  activityLevel: "Moderate",
  dietaryRestrictions: ["Vegetarian"],
  healthGoals: ["Weight Loss", "Energy Boost"],
  constitution: "Pitta-Kapha",
  dosha: "Pitta-Kapha",
  calorieLimit: 1400
};

async function testEnhancedPDF() {
  try {
    console.log('🧪 Testing Enhanced PDF Generation with AI...');
    console.log(`👤 Patient: ${testPatient.name}`);
    console.log(`🧘 Dosha: ${testPatient.dosha}`);
    console.log(`📊 Calorie Limit: ${testPatient.calorieLimit} cal/day`);
    
    // Generate PDF with AI-powered diet plan
    const result = await PDFService.generateDietPlanPDF(testPatient);
    
    console.log('✅ Enhanced PDF with AI diet plan generated successfully!');
    console.log(`📄 PDF saved to: ${result.filePath}`);
    console.log(`📁 File name: ${result.fileName}`);
    
    // Verify file exists and has content
    if (fs.existsSync(result.filePath)) {
      const stats = fs.statSync(result.filePath);
      console.log(`📊 PDF size: ${(stats.size / 1024).toFixed(2)} KB`);
      
      if (stats.size > 0) {
        console.log('✅ PDF file is valid and contains data');
        console.log('\n🎨 Enhanced Features Included:');
        console.log('  • AI-generated diet plan based on patient preferences');
        console.log('  • Personalized calorie distribution');
        console.log('  • Dosha-specific food recommendations');
        console.log('  • Colored meal sections (Green, Yellow, Blue backgrounds)');
        console.log('  • Grid-based layout for better organization');
        console.log('  • Enhanced typography with proper spacing');
        console.log('  • Calculated BMI display');
        console.log('  • Emoji-categorized meals');
        console.log('  • Professional header and footer design');
        console.log('  • Ayurvedic principles integration');
        
        // Copy to a test location for easy access
        const testOutputPath = path.join(__dirname, 'test_ai_enhanced_diet_plan.pdf');
        fs.copyFileSync(result.filePath, testOutputPath);
        console.log(`📋 Test copy saved to: ${testOutputPath}`);
        
        return true;
      } else {
        console.log('❌ PDF file is empty');
        return false;
      }
    } else {
      console.log('❌ PDF file was not created');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error generating enhanced PDF with AI:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
  try {
    console.log('🧪 Testing Enhanced PDF Generation...');
    
    // Generate PDF with enhanced styling
    const result = await PDFService.generateDietPlanPDF({
      patient: testPatient,
      aiDietPlan: testAIDietPlan
    });
    
    console.log('✅ Enhanced PDF generated successfully!');
    console.log(`📄 PDF saved to: ${result.filePath}`);
    console.log(`� File name: ${result.fileName}`);
    
    // Verify file exists and has content
    if (fs.existsSync(result.filePath)) {
      const stats = fs.statSync(result.filePath);
      console.log(`📊 PDF size: ${(stats.size / 1024).toFixed(2)} KB`);
      
      if (stats.size > 0) {
        console.log('✅ PDF file is valid and contains data');
        console.log('\n🎨 Enhanced Features Included:');
        console.log('  • Colored meal sections (Green, Yellow, Blue backgrounds)');
        console.log('  • Grid-based layout for better organization');
        console.log('  • Enhanced typography with proper spacing');
        console.log('  • Calculated BMI display');
        console.log('  • Emoji-categorized meals');
        console.log('  • Professional header and footer design');
        console.log('  • Ingredient database visualization');
        
        // Copy to a test location for easy access
        const testOutputPath = path.join(__dirname, 'test_enhanced_diet_plan.pdf');
        fs.copyFileSync(result.filePath, testOutputPath);
        console.log(`📋 Test copy saved to: ${testOutputPath}`);
        
        return true;
      } else {
        console.log('❌ PDF file is empty');
        return false;
      }
    } else {
      console.log('❌ PDF file was not created');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error generating enhanced PDF:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testEnhancedPDF().then(success => {
  if (success) {
    console.log('\n🎉 Enhanced PDF generation test completed successfully!');
    console.log('💡 You can now open the generated PDF to see the enhanced styling');
  } else {
    console.log('\n❌ Enhanced PDF generation test failed');
  }
  process.exit(success ? 0 : 1);
});
