const axios = require('axios');
const BASE_URL = 'http://localhost:3000';

class StepByStepRegistrationTester {
  constructor() {
    this.sessionData = {};
  }

  async testStepByStepRegistration() {
    console.log('🧪 Testing Step-by-Step Patient Registration...\n');

    try {
      // Get registration guide first
      await this.testRegistrationGuide();
      
      // Step 1: Basic Information
      await this.testStep1BasicInfo();
      
      // Step 2: Contact Information
      await this.testStep2ContactInfo();
      
      // Step 3: Health Profile
      await this.testStep3HealthProfile();
      
      // Step 4: Complete Registration
      await this.testStep4CompleteRegistration();

      console.log('\n🎉 All step-by-step registration tests passed!');
      
    } catch (error) {
      console.error('\n❌ Step-by-step registration test failed:', error.message);
      throw error;
    }
  }

  async testRegistrationGuide() {
    console.log('📋 Testing: Registration Guide');
    
    const response = await axios.get(`${BASE_URL}/api/v1/patient-registration/register/guide`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const guide = response.data.data;
    console.log(`   ✅ Guide retrieved: ${guide.totalSteps} steps`);
    console.log(`   📊 Steps: ${guide.steps.map(s => s.title).join(' → ')}\n`);
  }

  async testStep1BasicInfo() {
    console.log('👤 Testing: Step 1 - Basic Information');
    
    const step1Data = {
      name: "Test Patient Registration",
      age: 32,
      gender: "female",
      phone: "9876543299"
    };

    const response = await axios.post(`${BASE_URL}/api/v1/patient-registration/register/step1`, step1Data);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const result = response.data;
    this.sessionData.sessionId = result.sessionId;
    this.sessionData.basicInfo = result.data;
    
    console.log(`   ✅ Step 1 completed`);
    console.log(`   📝 Session ID: ${result.sessionId}`);
    console.log(`   📊 Progress: ${result.progress}%`);
    console.log(`   ➡️  Next step: ${result.nextStep}\n`);
  }

  async testStep2ContactInfo() {
    console.log('📞 Testing: Step 2 - Contact Information');
    
    const step2Data = {
      sessionId: this.sessionData.sessionId,
      email: "test.registration@email.com",
      address: "123 Test Street, Mumbai",
      region: "Maharashtra"
    };

    const response = await axios.post(`${BASE_URL}/api/v1/patient-registration/register/step2`, step2Data);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const result = response.data;
    this.sessionData.contactInfo = result.data;
    
    console.log(`   ✅ Step 2 completed`);
    console.log(`   📧 Email: ${result.data.email}`);
    console.log(`   📊 Progress: ${result.progress}%`);
    console.log(`   ➡️  Next step: ${result.nextStep}\n`);
  }

  async testStep3HealthProfile() {
    console.log('🏥 Testing: Step 3 - Health Profile');
    
    const step3Data = {
      sessionId: this.sessionData.sessionId,
      dosha: "vata-pitta",
      dietary_habits: "vegetarian",
      height: 165,
      weight: 58,
      allergies: ["dust", "pollen"],
      condition: ["stress", "headaches"]
    };

    const response = await axios.post(`${BASE_URL}/api/v1/patient-registration/register/step3`, step3Data);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const result = response.data;
    this.sessionData.healthProfile = result.data;
    
    console.log(`   ✅ Step 3 completed`);
    console.log(`   🔬 Dosha: ${result.data.dosha}`);
    console.log(`   🥗 Diet: ${result.data.dietary_habits}`);
    console.log(`   📏 BMI: ${result.data.bmi}`);
    console.log(`   📊 Progress: ${result.progress}%`);
    console.log(`   ➡️  Next step: ${result.nextStep}\n`);
  }

  async testStep4CompleteRegistration() {
    console.log('✅ Testing: Step 4 - Complete Registration');
    
    const step4Data = {
      sessionId: this.sessionData.sessionId,
      clinical_notes: "Step-by-step registration test patient. Shows good vata-pitta balance.",
      created_by: "TEST_PRACTITIONER_001",
      basicInfo: this.sessionData.basicInfo,
      contactInfo: this.sessionData.contactInfo,
      healthProfile: this.sessionData.healthProfile
    };

    const response = await axios.post(`${BASE_URL}/api/v1/patient-registration/register/step4`, step4Data);
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    const result = response.data;
    
    console.log(`   ✅ Registration completed!`);
    console.log(`   🆔 Patient ID: ${result.data.patient.id}`);
    console.log(`   👤 Patient: ${result.data.patient.name}`);
    console.log(`   📊 Progress: ${result.progress}%`);
    console.log(`   🎯 Status: ${result.nextStep}`);
    console.log(`   📋 Next actions: ${result.data.nextActions.join(', ')}\n`);

    this.createdPatientId = result.data.patient.id;
  }

  async testErrorHandling() {
    console.log('🚫 Testing: Error Handling');

    try {
      // Test missing required field
      await axios.post(`${BASE_URL}/api/v1/patient-registration/register/step1`, {
        name: "Test",
        age: 25
        // Missing gender and phone
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`   ✅ Correctly rejected incomplete data`);
      } else {
        throw error;
      }
    }

    try {
      // Test invalid dosha
      await axios.post(`${BASE_URL}/api/v1/patient-registration/register/step3`, {
        sessionId: "fake_session",
        dosha: "invalid_dosha"
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`   ✅ Correctly rejected invalid dosha`);
      } else {
        throw error;
      }
    }

    console.log('');
  }

  async runAllTests() {
    try {
      await this.testStepByStepRegistration();
      await this.testErrorHandling();
      
      console.log('🎯 STEP-BY-STEP REGISTRATION TEST SUMMARY');
      console.log('='.repeat(50));
      console.log('✅ All tests passed successfully!');
      console.log('📋 Registration guide works');
      console.log('👤 Step 1 (Basic info) works');
      console.log('📞 Step 2 (Contact info) works'); 
      console.log('🏥 Step 3 (Health profile) works');
      console.log('✅ Step 4 (Complete registration) works');
      console.log('🚫 Error handling works');
      
      if (this.createdPatientId) {
        console.log(`🆔 Created patient ID: ${this.createdPatientId}`);
      }
      
      console.log('='.repeat(50));
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new StepByStepRegistrationTester();
  tester.runAllTests().catch(console.error);
}

module.exports = StepByStepRegistrationTester;
