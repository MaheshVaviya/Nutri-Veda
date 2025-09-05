const db = require('../config/database');

class Patient {
  static collection = 'patients';

  static validatePatient(patientData) {
    const required = ['name', 'age', 'gender', 'dosha'];
    for (let field of required) {
      if (!patientData[field]) {
        throw new Error(`${field} is required`);
      }
    }
  }

  static async create(patientData) {
    this.validatePatient(patientData);
    
    const patient = {
      // Basic Info
      name: patientData.name,
      age: parseInt(patientData.age),
      gender: patientData.gender, // male, female, other
      
      // Contact Info
      phone: patientData.phone || '',
      email: patientData.email || '',
      address: patientData.address || '',
      
      // Ayurvedic Profile
      dosha: patientData.dosha, // vata, pitta, kapha, vata-pitta, etc.
      
      // Health Conditions
      condition: Array.isArray(patientData.condition) ? patientData.condition : 
                (patientData.condition ? [patientData.condition] : []),
      
      // Allergies & Restrictions
      allergies: Array.isArray(patientData.allergies) ? patientData.allergies : 
                (patientData.allergies ? [patientData.allergies] : []),
      
      // Digestive Health
      digestion: patientData.digestion || 'regular', // strong, weak, irregular, regular
      waterIntake: parseFloat(patientData.waterIntake || 2.5), // liters per day
      
      // Lifestyle
      lifestyle: {
        activityLevel: patientData.lifestyle?.activityLevel || patientData.activityLevel || 'moderate',
        sleepPattern: patientData.lifestyle?.sleepPattern || patientData.sleepPattern || 'regular',
        stressLevel: patientData.lifestyle?.stressLevel || patientData.stressLevel || 'moderate',
        workType: patientData.lifestyle?.workType || patientData.workType || 'desk'
      },
      
      // Medical History
      history: {
        previousConditions: patientData.history?.previousConditions || [],
        currentMedications: patientData.history?.currentMedications || [],
        surgeries: patientData.history?.surgeries || [],
        familyHistory: patientData.history?.familyHistory || []
      },
      
      // Physical Stats
      height: parseFloat(patientData.height || 0),
      weight: parseFloat(patientData.weight || 0),
      bmi: 0, // Will be calculated
      
      // Regional Preferences
      region: patientData.region || 'general',
      cuisinePreference: patientData.cuisinePreference || 'indian',
      
      // Meta
      dietitianId: patientData.dietitianId || '',
      isActive: true
    };
    
    // Calculate BMI if height and weight provided
    if (patient.height > 0 && patient.weight > 0) {
      const heightInMeters = patient.height / 100;
      patient.bmi = parseFloat((patient.weight / (heightInMeters * heightInMeters)).toFixed(2));
    }
    
    return await db.create(this.collection, patient);
  }

  static async findById(id) {
    return await db.findById(this.collection, id);
  }

  static async findByDosha(dosha) {
    return await db.findByField(this.collection, 'dosha', dosha);
  }

  static async update(id, patientData) {
    // Recalculate BMI if height/weight updated
    if (patientData.height && patientData.weight) {
      const heightInMeters = patientData.height / 100;
      patientData.bmi = parseFloat((patientData.weight / (heightInMeters * heightInMeters)).toFixed(2));
    }
    
    return await db.update(this.collection, id, patientData);
  }
}

module.exports = Patient;