const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testAIDietGeneration() {
  try {
    console.log('🧪 Testing AI Diet Generation API...');
    
    // First, let's test getting patients
    console.log('📋 Fetching patients...');
    const patientsResponse = await axios.get(`${API_BASE}/patients`);
    console.log(`✅ Found ${patientsResponse.data.data.length} patients`);
    
    if (patientsResponse.data.data.length === 0) {
      console.log('❌ No patients found. Please register a patient first.');
      return;
    }
    
    // Get the first patient
    const patient = patientsResponse.data.data[0];
    console.log(`👤 Testing with patient: ${patient.name} (ID: ${patient.id})`);
    console.log(`🧘 Dosha: ${patient.dosha}`);
    console.log(`📊 BMI: ${patient.bmi}, BMR: ${patient.bmr}`);
    
    // Test fetching/generating diet chart
    console.log('\n🤖 Testing AI diet chart generation...');
    const dietResponse = await axios.get(`${API_BASE}/ai-diet/patient/${patient.id}`);
    
    if (dietResponse.data.success) {
      console.log('✅ AI Diet Chart Response received!');
      console.log(`📅 Generated at: ${dietResponse.data.data.generatedAt}`);
      console.log(`📊 Number of days: ${dietResponse.data.data.dietPlan?.days?.length || 'Unknown'}`);
      
      // Check if we have actual meal data
      if (dietResponse.data.data.dietPlan?.days?.length > 0) {
        const firstDay = dietResponse.data.data.dietPlan.days[0];
        console.log(`🍽️ Day 1 Breakfast: ${firstDay.meals?.breakfast?.items?.slice(0, 2).join(', ')}`);
        console.log(`🍽️ Day 1 Lunch: ${firstDay.meals?.lunch?.items?.slice(0, 2).join(', ')}`);
        console.log(`🍽️ Day 1 Dinner: ${firstDay.meals?.dinner?.items?.slice(0, 2).join(', ')}`);
        console.log(`📊 Day 1 Total Calories: ${firstDay.total_calories}`);
      }
      
      // Test PDF generation
      console.log('\n📋 Testing PDF generation...');
      const pdfResponse = await axios.post(`${API_BASE}/pdf/generate/${patient.id}`);
      
      if (pdfResponse.data.success) {
        console.log('✅ PDF generated successfully!');
        console.log(`📄 File: ${pdfResponse.data.data.fileName}`);
        console.log(`🔗 Download URL: ${pdfResponse.data.data.downloadUrl}`);
      } else {
        console.log('❌ PDF generation failed:', pdfResponse.data.message);
      }
      
    } else {
      console.log('❌ AI Diet Chart generation failed:', dietResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Add axios if not available
if (typeof require !== 'undefined') {
  testAIDietGeneration();
} else {
  console.log('Please run this with: node test_api.js');
}
