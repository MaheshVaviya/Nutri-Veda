const axios = require('axios').default || require('axios');
const BASE_URL = 'http://localhost:3000';

class NutriVedaTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`\\n🧪 Testing: ${testName}`);
      await testFunction();
      console.log(`✅ PASSED: ${testName}`);
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  async testHealthCheck() {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.status) {
      throw new Error('Health check response missing status');
    }
  }

  async testCreateFood() {
    const foodData = {
      name: "Brown Rice",
      calories: 112,
      protein: 2.3,
      carbs: 22,
      fat: 0.9,
      fiber: 1.8,
      rasa: "sweet",
      virya: "cooling",
      guna: ["heavy", "moist"],
      vipaka: "sweet",
      doshaImpact: {
        vata: "decreases",
        pitta: "neutral",
        kapha: "increases"
      },
      season: ["all"],
      region: ["all"],
      category: "grains"
    };

    const response = await axios.post(`${BASE_URL}/api/v1/foods`, foodData);
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('Food creation was not successful');
    }
    
    this.createdFoodId = response.data.data.id;
    console.log(`   Created food with ID: ${this.createdFoodId}`);
  }

  async testGetAllFoods() {
    const response = await axios.get(`${BASE_URL}/api/v1/foods`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('Get foods was not successful');
    }
    
    console.log(`   Found ${response.data.count} foods in database`);
  }

  async testCreatePatient() {
    const patientData = {
      name: "Test Patient",
      age: 30,
      gender: "female",
      phone: "9876543210",
      email: "patient@test.com",
      dosha: "vata",
      dietary_habits: "vegetarian",
      clinical_notes: "Test patient for new fields validation",
      created_by: "DIET001",
      condition: ["stress", "digestive issues"],
      allergies: ["peanuts"],
      digestion: "weak",
      waterIntake: 2.0,
      lifestyle: {
        activityLevel: "moderate",
        sleepPattern: "irregular",
        stressLevel: "high"
      },
      history: {
        previousConditions: ["anxiety"],
        currentMedications: ["none"]
      },
      height: 165,
      weight: 55,
      region: "north_indian"
    };

    const response = await axios.post(`${BASE_URL}/api/v1/patients`, patientData);
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('Patient creation was not successful');
    }
    
    this.createdPatientId = response.data.data.id;
    console.log(`   Created patient with ID: ${this.createdPatientId}`);
    console.log(`   Calculated BMI: ${response.data.data.bmi}`);
    console.log(`   Dietary habits: ${response.data.data.dietary_habits}`);
    console.log(`   Created by: ${response.data.data.created_by}`);
  }

  async testCreateDietChart() {
    if (!this.createdPatientId || !this.createdFoodId) {
      throw new Error('Need patient and food IDs from previous tests');
    }

    const dietChartData = {
      patientId: this.createdPatientId,
      dietitianId: "test-dietitian",
      meals: [
        {
          name: "Breakfast",
          time: "08:00",
          foods: [
            {
              id: this.createdFoodId,
              name: "Brown Rice",
              quantity: 1,
              calories: 112,
              protein: 2.3,
              carbs: 22,
              fat: 0.9,
              fiber: 1.8,
              rasa: "sweet",
              virya: "cooling",
              doshaImpact: {
                vata: "decreases",
                pitta: "neutral",
                kapha: "increases"
              }
            }
          ],
          instructions: "Eat slowly and mindfully"
        },
        {
          name: "Lunch",
          time: "12:30",
          foods: [
            {
              id: this.createdFoodId,
              name: "Brown Rice",
              quantity: 1.5,
              calories: 168,
              protein: 3.45,
              carbs: 33,
              fat: 1.35,
              fiber: 2.7,
              rasa: "sweet",
              virya: "cooling",
              doshaImpact: {
                vata: "decreases",
                pitta: "neutral", 
                kapha: "increases"
              }
            }
          ]
        }
      ],
      chartName: "Test Diet Chart",
      instructions: "Follow this chart for 7 days",
      duration: 7,
      targetCalories: 1500,
      healthGoals: ["weight_gain", "digestive_health"]
    };

    const response = await axios.post(`${BASE_URL}/api/v1/diet-charts`, dietChartData);
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('Diet chart creation was not successful');
    }
    
    const dietChart = response.data.data;
    console.log(`   Created diet chart with ID: ${dietChart.id}`);
    console.log(`   Total calories: ${dietChart.totalNutrition.calories}`);
    console.log(`   Balance score: ${dietChart.ayurvedaBalance.balanceScore}`);
    
    this.createdDietChartId = dietChart.id;
  }

  async testSearchFoodsByDosha() {
    const response = await axios.get(`${BASE_URL}/api/v1/foods/search/dosha?dosha=vata&impact=decreases`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('Food search was not successful');
    }
    
    console.log(`   Found ${response.data.count} foods that decrease vata`);
  }

  async testGetDietChartsByPatient() {
    if (!this.createdPatientId) {
      throw new Error('Need patient ID from previous test');
    }

    const response = await axios.get(`${BASE_URL}/api/v1/diet-charts/patient/${this.createdPatientId}`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('Get diet charts by patient was not successful');
    }
    
    console.log(`   Found ${response.data.count} diet charts for patient`);
  }

  async testPatientFieldValidation() {
    // Test invalid dietary habits
    const invalidPatientData = {
      name: "Invalid Patient",
      age: 25,
      gender: "male",
      dosha: "pitta",
      dietary_habits: "invalid_diet" // Should fail validation
    };

    try {
      await axios.post(`${BASE_URL}/api/v1/patients`, invalidPatientData);
      throw new Error('Expected validation error for invalid dietary habits');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`   ✓ Correctly rejected invalid dietary habits`);
      } else {
        throw error;
      }
    }

    // Test valid non-vegetarian patient
    const validPatientData = {
      name: "Non-Veg Patient",
      age: 35,
      gender: "male",
      dosha: "kapha",
      dietary_habits: "non-vegetarian",
      clinical_notes: "Prefers non-vegetarian diet",
      created_by: "DIET002"
    };

    const response = await axios.post(`${BASE_URL}/api/v1/patients`, validPatientData);
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    console.log(`   ✓ Successfully created non-vegetarian patient`);
    console.log(`   Dietary habits: ${response.data.data.dietary_habits}`);
  }

  async runAllTests() {
    console.log('🧪 Starting NutriVeda Backend Tests...\\n');
    
    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('Create Food', () => this.testCreateFood());
    await this.runTest('Get All Foods', () => this.testGetAllFoods());
    await this.runTest('Create Patient', () => this.testCreatePatient());
    await this.runTest('Patient Field Validation', () => this.testPatientFieldValidation());
    await this.runTest('Create Diet Chart', () => this.testCreateDietChart());
    await this.runTest('Search Foods by Dosha', () => this.testSearchFoodsByDosha());
    await this.runTest('Get Diet Charts by Patient', () => this.testGetDietChartsByPatient());
    
    this.printSummary();
  }

  printSummary() {
    console.log('\\n' + '='.repeat(50));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.tests.length}`);
    
    if (this.results.failed > 0) {
      console.log('\\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\\n' + (this.results.failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
    console.log('='.repeat(50));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new NutriVedaTester();
  tester.runAllTests().catch(console.error);
}

module.exports = NutriVedaTester;