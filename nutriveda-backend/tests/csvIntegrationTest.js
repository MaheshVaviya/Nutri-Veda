const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

class CSVTestClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async testHealthCheck() {
    try {
      console.log('🔍 Testing health check...');
      const response = await axios.get(`${this.baseURL.replace('/api/v1', '')}/health`);
      console.log('✅ Health check passed:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }

  async uploadFoodCSV() {
    try {
      console.log('\n📄 Uploading Food CSV...');
      
      const csvPath = path.join(__dirname, '../sample_data/foods_sample.csv');
      
      if (!fs.existsSync(csvPath)) {
        throw new Error('Food CSV file not found at: ' + csvPath);
      }

      const formData = new FormData();
      formData.append('csvFile', fs.createReadStream(csvPath));

      const response = await axios.post(`${this.baseURL}/foods/upload-csv`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000 // 5 minutes for large CSV uploads
      });

      console.log('✅ Food CSV uploaded successfully!');
      console.log('📊 Upload Results:', {
        totalRows: response.data.data.totalRows,
        successfulRows: response.data.data.successfulRows,
        errorRows: response.data.data.errorRows
      });

      if (response.data.data.parseErrors.length > 0) {
        console.log('⚠️  Parse Errors:', response.data.data.parseErrors);
      }

      if (response.data.data.insertErrors.length > 0) {
        console.log('⚠️  Insert Errors:', response.data.data.insertErrors);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Food CSV upload failed:', error.response?.data || error.message);
      return null;
    }
  }

  async uploadRecipeCSV() {
    try {
      console.log('\n🍽️  Uploading Recipe CSV...');
      
      const csvPath = path.join(__dirname, '../sample_data/recipes_sample.csv');
      
      if (!fs.existsSync(csvPath)) {
        throw new Error('Recipe CSV file not found at: ' + csvPath);
      }

      const formData = new FormData();
      formData.append('csvFile', fs.createReadStream(csvPath));

      const response = await axios.post(`${this.baseURL}/recipes/upload-csv`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000 // 5 minutes for large CSV uploads
      });

      console.log('✅ Recipe CSV uploaded successfully!');
      console.log('📊 Upload Results:', {
        totalRows: response.data.data.totalRows,
        successfulRows: response.data.data.successfulRows,
        errorRows: response.data.data.errorRows
      });

      if (response.data.data.parseErrors.length > 0) {
        console.log('⚠️  Parse Errors:', response.data.data.parseErrors);
      }

      if (response.data.data.insertErrors.length > 0) {
        console.log('⚠️  Insert Errors:', response.data.data.insertErrors);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Recipe CSV upload failed:', error.response?.data || error.message);
      return null;
    }
  }

  async testFoodSearch() {
    try {
      console.log('\n🔍 Testing Food Search...');
      
      // Test getting all foods
      const allFoods = await axios.get(`${this.baseURL}/foods?limit=10`);
      console.log(`✅ Retrieved ${allFoods.data.count} foods`);

      // Test search by dosha
      const vataFoods = await axios.get(`${this.baseURL}/foods/search/dosha?dosha=vata&impact=decreases`);
      console.log(`✅ Found ${vataFoods.data.count} foods good for Vata`);

      // Test search by category
      const grainFoods = await axios.get(`${this.baseURL}/foods/search?category=grains`);
      console.log(`✅ Found ${grainFoods.data.count} grain foods`);

      return true;
    } catch (error) {
      console.error('❌ Food search failed:', error.response?.data || error.message);
      return false;
    }
  }

  async testRecipeSearch() {
    try {
      console.log('\n🍽️  Testing Recipe Search...');
      
      // Test getting all recipes
      const allRecipes = await axios.get(`${this.baseURL}/recipes?limit=10`);
      console.log(`✅ Retrieved ${allRecipes.data.count} recipes`);

      // Test search by meal type
      const lunchRecipes = await axios.get(`${this.baseURL}/recipes/meal-type/lunch`);
      console.log(`✅ Found ${lunchRecipes.data.count} lunch recipes`);

      // Test search by dosha
      const vataRecipes = await axios.get(`${this.baseURL}/recipes/dosha/vata`);
      console.log(`✅ Found ${vataRecipes.data.count} recipes for Vata`);

      // Test search by season
      const winterRecipes = await axios.get(`${this.baseURL}/recipes/season/winter`);
      console.log(`✅ Found ${winterRecipes.data.count} winter recipes`);

      return true;
    } catch (error) {
      console.error('❌ Recipe search failed:', error.response?.data || error.message);
      return false;
    }
  }

  async clearData() {
    try {
      console.log('\n🧹 Clearing test data...');
      
      // Clear foods
      await axios.delete(`${this.baseURL}/foods/clear-all`);
      console.log('✅ Cleared foods');

      // Clear recipes
      await axios.delete(`${this.baseURL}/recipes/clear-all`);
      console.log('✅ Cleared recipes');

      return true;
    } catch (error) {
      console.error('❌ Clear data failed:', error.response?.data || error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting CSV Integration Tests...\n');

    // Test health check
    const healthOK = await this.testHealthCheck();
    if (!healthOK) {
      console.log('❌ Server not healthy, aborting tests');
      return;
    }

    // Skip clearing data since user wants to continue uploading without clearing
    console.log('⏭️ Skipping data clearing - continuing from existing data...');

    // Upload CSV files
    const foodUpload = await this.uploadFoodCSV();
    const recipeUpload = await this.uploadRecipeCSV();

    if (!foodUpload || !recipeUpload) {
      console.log('❌ CSV uploads failed, aborting search tests');
      return;
    }

    // Test search functionality
    await this.testFoodSearch();
    await this.testRecipeSearch();

    console.log('\n🎉 All tests completed!');
    console.log('\n📝 API Endpoints Summary:');
    console.log('Foods:');
    console.log('  - Upload CSV: POST /api/v1/foods/upload-csv');
    console.log('  - Get all: GET /api/v1/foods');
    console.log('  - Search: GET /api/v1/foods/search?category=grains');
    console.log('  - By Dosha: GET /api/v1/foods/search/dosha?dosha=vata');
    console.log('Recipes:');
    console.log('  - Upload CSV: POST /api/v1/recipes/upload-csv');
    console.log('  - Get all: GET /api/v1/recipes');
    console.log('  - By meal type: GET /api/v1/recipes/meal-type/lunch');
    console.log('  - By dosha: GET /api/v1/recipes/dosha/vata');
    console.log('  - By season: GET /api/v1/recipes/season/winter');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new CSVTestClient();
  tester.runAllTests().catch(console.error);
}

module.exports = CSVTestClient;
