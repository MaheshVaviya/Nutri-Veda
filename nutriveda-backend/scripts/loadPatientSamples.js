const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Patient = require('../src/models/Patient');

class PatientSampleLoader {
  constructor() {
    this.results = {
      loaded: 0,
      failed: 0,
      errors: []
    };
  }

  async loadFromCSV() {
    const csvFilePath = path.join(__dirname, '../sample_data/patients_sample.csv');
    
    console.log('🏥 Starting Patient Sample Data Loading...\n');
    console.log(`📂 Reading from: ${csvFilePath}\n`);

    return new Promise((resolve, reject) => {
      const patients = [];
      
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // Convert CSV row to patient data format
          const patientData = this.transformCSVToPatient(row);
          patients.push(patientData);
        })
        .on('end', async () => {
          console.log(`📊 Found ${patients.length} patients in CSV file\n`);
          
          // Load each patient into database
          for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            try {
              console.log(`⏳ Loading patient ${i + 1}/${patients.length}: ${patient.name}`);
              
              const result = await Patient.create(patient);
              
              console.log(`✅ Successfully loaded: ${patient.name} (ID: ${result.id})`);
              console.log(`   Dosha: ${patient.dosha} | Diet: ${patient.dietary_habits} | BMI: ${patient.bmi || 'N/A'}\n`);
              
              this.results.loaded++;
              
            } catch (error) {
              console.log(`❌ Failed to load: ${patient.name}`);
              console.log(`   Error: ${error.message}\n`);
              
              this.results.failed++;
              this.results.errors.push({
                patient: patient.name,
                error: error.message
              });
            }
          }
          
          this.printSummary();
          resolve(this.results);
        })
        .on('error', (error) => {
          console.error('❌ Error reading CSV file:', error);
          reject(error);
        });
    });
  }

  transformCSVToPatient(row) {
    // Convert CSV columns to patient object format
    return {
      name: row.Name,
      age: parseInt(row.Age),
      gender: row.Gender.toLowerCase(),
      phone: row.Phone,
      email: row.Email,
      address: row.Address,
      dosha: row.Dosha.toLowerCase(),
      dietary_habits: row.DietaryHabits.toLowerCase(),
      clinical_notes: row.ClinicalNotes,
      created_by: row.CreatedBy,
      
      // Physical measurements
      height: parseFloat(row.Height),
      weight: parseFloat(row.Weight),
      // BMI will be auto-calculated by the model
      
      // Health information
      digestion: row.Digestion?.toLowerCase() || 'regular',
      waterIntake: parseFloat(row.WaterIntake) || 2.5,
      
      // Lifestyle
      lifestyle: {
        activityLevel: row.ActivityLevel?.toLowerCase() || 'moderate',
        sleepPattern: row.SleepPattern?.toLowerCase() || 'regular',
        stressLevel: row.StressLevel?.toLowerCase() || 'moderate',
        workType: row.WorkType?.toLowerCase() || 'desk'
      },
      
      // Health conditions and allergies
      allergies: row.Allergies ? row.Allergies.split(',').map(a => a.trim()) : [],
      condition: row.Condition ? row.Condition.split(',').map(c => c.trim()) : [],
      
      // Regional preferences
      region: row.Region,
      cuisinePreference: row.CuisinePreference || 'indian',
      
      // Meta
      dietitianId: row.CreatedBy
    };
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PATIENT LOADING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully Loaded: ${this.results.loaded} patients`);
    console.log(`❌ Failed to Load: ${this.results.failed} patients`);
    console.log(`📊 Total Processed: ${this.results.loaded + this.results.failed} patients`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Patients:');
      this.results.errors.forEach(error => {
        console.log(`   - ${error.patient}: ${error.error}`);
      });
    }
    
    console.log('\n' + (this.results.failed === 0 ? '🎉 All patients loaded successfully!' : '⚠️  Some patients failed to load'));
    console.log('='.repeat(60));
  }
}

// Run the loader if this file is executed directly
if (require.main === module) {
  const loader = new PatientSampleLoader();
  loader.loadFromCSV()
    .then(() => {
      console.log('\n🏁 Patient loading process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error during patient loading:', error);
      process.exit(1);
    });
}

module.exports = PatientSampleLoader;
