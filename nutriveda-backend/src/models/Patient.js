const db = require('../config/database');

class Patient {
  static collection = 'patients';

  static validatePatient(patientData) {
    const required = ['name', 'age', 'gender'];
    
    // Check required fields
    for (let field of required) {
      if (!patientData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate name
    if (typeof patientData.name !== 'string' || patientData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    if (patientData.name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }

    // Validate age
    const age = parseInt(patientData.age);
    if (isNaN(age) || age < 0 || age > 150) {
      throw new Error('Age must be a number between 0 and 150');
    }

    // Validate gender
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(patientData.gender)) {
      throw new Error(`Gender must be one of: ${validGenders.join(', ')}`);
    }

    // Validate dosha if provided
    const dosha = patientData.dosha || patientData.doshaType;
    if (dosha) {
      const validDoshas = ['vata', 'pitta', 'kapha', 'vata_pitta', 'pitta_kapha', 'vata_kapha', 'tridoshic', 'unknown'];
      if (!validDoshas.includes(dosha)) {
        throw new Error(`Dosha must be one of: ${validDoshas.join(', ')}`);
      }
    }

    // Validate dietary habits if provided
    if (patientData.dietary_habits) {
      const validDietaryHabits = ['vegetarian', 'non-vegetarian'];
      if (!validDietaryHabits.includes(patientData.dietary_habits)) {
        throw new Error(`Dietary habits must be one of: ${validDietaryHabits.join(', ')}`);
      }
    }

    // Validate email format if provided
    if (patientData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientData.email)) {
        throw new Error('Please provide a valid email address');
      }
    }

    // Validate phone if provided
    if (patientData.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(patientData.phone.replace(/\D/g, ''))) {
        throw new Error('Phone number must be 10 digits');
      }
    }

    // Validate height and weight if provided
    if (patientData.height) {
      const height = parseFloat(patientData.height);
      if (isNaN(height) || height < 50 || height > 300) {
        throw new Error('Height must be between 50 and 300 cm');
      }
    }

    if (patientData.weight) {
      const weight = parseFloat(patientData.weight);
      if (isNaN(weight) || weight < 10 || weight > 500) {
        throw new Error('Weight must be between 10 and 500 kg');
      }
    }

    // Validate water intake if provided
    if (patientData.waterIntake) {
      const waterIntake = parseFloat(patientData.waterIntake);
      if (isNaN(waterIntake) || waterIntake < 0 || waterIntake > 10) {
        throw new Error('Water intake must be between 0 and 10 liters per day');
      }
    }

    // Validate digestion if provided
    if (patientData.digestion) {
      const validDigestion = ['strong', 'weak', 'irregular', 'regular'];
      if (!validDigestion.includes(patientData.digestion)) {
        throw new Error(`Digestion must be one of: ${validDigestion.join(', ')}`);
      }
    }

    // Validate lifestyle fields if provided
    if (patientData.lifestyle) {
      const lifestyle = patientData.lifestyle;
      
      if (lifestyle.activityLevel) {
        const validActivity = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
        if (!validActivity.includes(lifestyle.activityLevel)) {
          throw new Error(`Activity level must be one of: ${validActivity.join(', ')}`);
        }
      }

      if (lifestyle.sleepPattern) {
        const validSleep = ['regular', 'irregular', 'early_riser', 'night_owl'];
        if (!validSleep.includes(lifestyle.sleepPattern)) {
          throw new Error(`Sleep pattern must be one of: ${validSleep.join(', ')}`);
        }
      }

      if (lifestyle.stressLevel) {
        const validStress = ['low', 'moderate', 'high', 'very_high'];
        if (!validStress.includes(lifestyle.stressLevel)) {
          throw new Error(`Stress level must be one of: ${validStress.join(', ')}`);
        }
      }

      if (lifestyle.workType) {
        const validWork = ['physical', 'desk', 'mixed', 'outdoor', 'creative'];
        if (!validWork.includes(lifestyle.workType)) {
          throw new Error(`Work type must be one of: ${validWork.join(', ')}`);
        }
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
      occupation: patientData.occupation || '',
      
      // Contact Info
      phone: patientData.phone || '',
      email: patientData.email || '',
      address: patientData.address || '',
      
      // Ayurvedic Profile
      dosha: patientData.dosha || patientData.doshaType || 'unknown', // vata, pitta, kapha, vata_pitta, etc.
      
      // Dietary Information
      dietary_habits: patientData.dietary_habits || patientData.dietType || 'vegetarian', // vegetarian, non-vegetarian
      mealsPerDay: patientData.mealsPerDay || 3,
      foodPreferences: Array.isArray(patientData.foodPreferences) ? patientData.foodPreferences : [],
      alcoholConsumption: patientData.alcoholConsumption || 'never',
      smokingHabits: patientData.smokingHabits || 'never',
      
      // Clinical Information
      clinical_notes: patientData.clinical_notes || patientData.additionalNotes || '',
      
      // Health Conditions
      condition: Array.isArray(patientData.condition) ? patientData.condition : 
                Array.isArray(patientData.healthConditions) ? patientData.healthConditions :
                (patientData.condition ? [patientData.condition] : []),
      
      // Allergies & Restrictions
      allergies: Array.isArray(patientData.allergies) ? patientData.allergies : 
                (patientData.allergies ? [patientData.allergies] : []),
      
      // Digestive Health
      digestion: patientData.digestion || patientData.digestiveHealth || 'regular', // strong, weak, irregular, regular
      waterIntake: parseFloat(patientData.waterIntake || 2.5), // liters per day
      
      // Lifestyle
      lifestyle: {
        activityLevel: patientData.lifestyle?.activityLevel || patientData.activityLevel || 'moderate',
        sleepPattern: patientData.lifestyle?.sleepPattern || patientData.sleepPattern || 'regular',
        stressLevel: patientData.lifestyle?.stressLevel || patientData.stressLevel || 'moderate',
        workType: patientData.lifestyle?.workType || patientData.workType || 'desk',
        energyLevels: patientData.energyLevels || 'moderate',
        menstrualCycle: patientData.menstrualCycle || ''
      },
      
      // Medical History
      history: {
        previousConditions: patientData.history?.previousConditions || [],
        currentMedications: Array.isArray(patientData.currentMedications) ? patientData.currentMedications : [],
        surgeries: patientData.history?.surgeries || [],
        familyHistory: patientData.history?.familyHistory || [],
        previousDiets: patientData.previousDiets || '',
        supplements: patientData.supplements || '',
        exerciseRoutine: patientData.exerciseRoutine || ''
      },
      
      // Goals
      goals: {
        healthGoals: Array.isArray(patientData.healthGoals) ? patientData.healthGoals : [],
        targetWeight: parseFloat(patientData.targetWeight || 0),
        timeframe: patientData.timeframe || '',
        budgetRange: patientData.budgetRange || '',
        cookingTime: patientData.cookingTime || ''
      },
      
      // Physical Stats
      height: parseFloat(patientData.height || 0),
      weight: parseFloat(patientData.weight || 0),
      bmi: parseFloat(patientData.bmi || 0), // Will be calculated or use provided
      bmr: parseFloat(patientData.bmr || 0),
      
      // Regional Preferences
      region: patientData.region || 'general',
      cuisinePreference: patientData.cuisinePreference || 'indian',
      
      // Meta
      dietitianId: patientData.dietitianId || '',
      created_by: patientData.created_by || patientData.dietitianId || '', // practitioner who created the record
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
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

  static async findAll() {
    return await db.findAll(this.collection);
  }

  static async findByDosha(dosha) {
    return await db.findByField(this.collection, 'dosha', dosha);
  }

  static async findByPhone(phone) {
    return await db.findByField(this.collection, 'phone', phone);
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