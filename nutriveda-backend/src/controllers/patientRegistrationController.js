const Patient = require('../models/Patient');

// Session storage for multi-step registration
const sessions = {};

class PatientRegistrationController {
  // Step 1: Basic Information (name, age, gender, phone)
  static async registerBasicInfo(req, res) {
    try {
      const { name, age, gender, phone } = req.body;

      // Validate required fields
      const validation = PatientRegistrationController.validateBasicInfo({ name, age, gender, phone });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          step: 1,
          nextStep: 1
        });
      }

      // Check for duplicate phone
      const existingPatient = await PatientRegistrationController.checkDuplicatePhone(phone);
      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: 'A patient with this phone number already exists',
          step: 1,
          nextStep: 1
        });
      }

      // Generate session ID and store step 1 data
      const sessionId = PatientRegistrationController.generateSessionId();
      sessions[sessionId] = {
        basicInfo: {
          name: name.trim(),
          age: parseInt(age),
          gender,
          phone,
          timestamp: new Date()
        }
      };

      res.status(200).json({
        success: true,
        message: 'Basic information recorded successfully',
        step: 1,
        nextStep: 2,
        sessionId,
        progress: 17,
        data: sessions[sessionId].basicInfo
      });

    } catch (error) {
      console.error('Step 1 Registration Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during basic information registration',
        step: 1,
        nextStep: 1
      });
    }
  }

  // Step 2: Contact Information (email, address, region)
  static async registerContactInfo(req, res) {
    try {
      const { sessionId, email, address, region } = req.body;

      if (!sessionId || !sessions[sessionId]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session. Please start registration again.',
          step: 1,
          nextStep: 1
        });
      }

      // Validate email if provided
      if (email && !PatientRegistrationController.isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address',
          step: 2,
          nextStep: 2
        });
      }

      // Store step 2 data
      sessions[sessionId].contactInfo = {
        email: email?.trim() || '',
        address: address?.trim() || '',
        region: region || 'General',
        timestamp: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Contact information recorded successfully',
        step: 2,
        nextStep: 3,
        sessionId,
        progress: 33,
        data: sessions[sessionId].contactInfo
      });

    } catch (error) {
      console.error('Step 2 Registration Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during contact information registration',
        step: 2,
        nextStep: 2
      });
    }
  }

  // Step 3: Health Profile (dosha, dietary habits, height, weight, weight_goal, allergies, conditions)
  static async registerHealthProfile(req, res) {
    try {
      const { sessionId, dosha, dietary_habits, height, weight, weight_goal, allergies, condition } = req.body;

      if (!sessionId || !sessions[sessionId]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session. Please start registration again.',
          step: 1,
          nextStep: 1
        });
      }

      // Validate required fields
      if (!dosha) {
        return res.status(400).json({
          success: false,
          message: 'Dosha selection is required',
          step: 3,
          nextStep: 3
        });
      }

      if (!weight_goal) {
        return res.status(400).json({
          success: false,
          message: 'Weight goal is required',
          step: 3,
          nextStep: 3
        });
      }

      // Calculate BMI and BMR
      let bmi = null;
      let bmr = null;
      if (height && weight) {
        const heightInMeters = parseFloat(height) / 100;
        bmi = parseFloat((parseFloat(weight) / (heightInMeters * heightInMeters)).toFixed(2));
        
        // Calculate BMR using Mifflin-St Jeor Equation
        const { basicInfo } = sessions[sessionId];
        if (basicInfo.gender === 'male') {
          bmr = Math.round(10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * basicInfo.age + 5);
        } else if (basicInfo.gender === 'female') {
          bmr = Math.round(10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * basicInfo.age - 161);
        }
      }

      // Store step 3 data
      sessions[sessionId].healthProfile = {
        dosha,
        dietary_habits: dietary_habits || 'vegetarian',
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        weight_goal,
        bmi,
        bmr,
        allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
        condition: Array.isArray(condition) ? condition : (condition ? [condition] : []),
        timestamp: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Health profile recorded successfully',
        step: 3,
        nextStep: 4,
        sessionId,
        progress: 50,
        data: sessions[sessionId].healthProfile
      });

    } catch (error) {
      console.error('Step 3 Registration Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during health profile registration',
        step: 3,
        nextStep: 3
      });
    }
  }

  // Step 4: Health Metrics (digestion, water intake, activity level, sleep pattern)
  static async registerHealthMetrics(req, res) {
    try {
      const { sessionId, digestion, water_intake, activity_level, sleep_pattern } = req.body;

      if (!sessionId || !sessions[sessionId]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session. Please start registration again.',
          step: 1,
          nextStep: 1
        });
      }

      // Validate required fields
      if (!digestion || !water_intake || !activity_level || !sleep_pattern) {
        return res.status(400).json({
          success: false,
          message: 'All health metrics fields are required',
          step: 4,
          nextStep: 4
        });
      }

      // Store step 4 data
      sessions[sessionId].healthMetrics = {
        digestion,
        water_intake: parseFloat(water_intake),
        activity_level,
        sleep_pattern,
        timestamp: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Health metrics recorded successfully',
        step: 4,
        nextStep: 5,
        sessionId,
        progress: 67,
        data: sessions[sessionId].healthMetrics
      });

    } catch (error) {
      console.error('Step 4 Registration Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during health metrics registration',
        step: 4,
        nextStep: 4
      });
    }
  }

  // Step 5: Lifestyle & Preferences (stress level, work type, cuisine preference)
  static async registerLifestyle(req, res) {
    try {
      const { sessionId, stress_level, work_type, cuisine_preference } = req.body;

      if (!sessionId || !sessions[sessionId]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session. Please start registration again.',
          step: 1,
          nextStep: 1
        });
      }

      // Validate required fields
      if (!stress_level || !work_type || !cuisine_preference) {
        return res.status(400).json({
          success: false,
          message: 'All lifestyle fields are required',
          step: 5,
          nextStep: 5
        });
      }

      // Store step 5 data
      sessions[sessionId].lifestyle = {
        stress_level,
        work_type,
        cuisine_preference,
        timestamp: new Date()
      };

      res.status(200).json({
        success: true,
        message: 'Lifestyle preferences recorded successfully',
        step: 5,
        nextStep: 6,
        sessionId,
        progress: 83,
        data: sessions[sessionId].lifestyle
      });

    } catch (error) {
      console.error('Step 5 Registration Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during lifestyle registration',
        step: 5,
        nextStep: 5
      });
    }
  }

  // Step 6: Complete Registration (clinical notes, created_by)
  static async completeRegistration(req, res) {
    try {
      const { sessionId, clinical_notes, created_by } = req.body;

      if (!sessionId || !sessions[sessionId]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session. Please start registration again.',
          step: 1,
          nextStep: 1
        });
      }

      const sessionData = sessions[sessionId];
      
      // Validate that all previous steps are completed
      if (!sessionData.basicInfo || !sessionData.contactInfo || !sessionData.healthProfile || 
          !sessionData.healthMetrics || !sessionData.lifestyle) {
        return res.status(400).json({
          success: false,
          message: 'Please complete all previous steps',
          step: 6,
          nextStep: 6
        });
      }

      if (!created_by) {
        return res.status(400).json({
          success: false,
          message: 'Practitioner ID is required',
          step: 6,
          nextStep: 6
        });
      }

      // Combine all session data
      const { basicInfo, contactInfo, healthProfile, healthMetrics, lifestyle } = sessionData;

      // Combine all step data into final patient object  
      const patientData = {
        // Basic Info (Step 1)
        name: basicInfo.name,
        age: basicInfo.age,
        gender: basicInfo.gender,
        phone: basicInfo.phone,
        
        // Contact Info (Step 2)
        email: contactInfo.email || '',
        address: contactInfo.address || '',
        region: contactInfo.region || 'General',
        
        // Health Profile (Step 3)
        dosha: healthProfile.dosha,
        dietary_habits: healthProfile.dietary_habits || 'vegetarian',
        height: healthProfile.height || 0,
        weight: healthProfile.weight || 0,
        weight_goal: healthProfile.weight_goal || 'weight_maintenance',
        allergies: healthProfile.allergies || [],
        condition: healthProfile.condition || [],
        bmi: healthProfile.bmi || 0,
        bmr: healthProfile.bmr || 0,
        
        // Health Metrics (Step 4)
        digestion: healthMetrics.digestion,
        waterIntake: healthMetrics.water_intake,
        activityLevel: healthMetrics.activity_level,
        sleepPattern: healthMetrics.sleep_pattern,
        
        // Lifestyle (Step 5)
        stressLevel: lifestyle.stress_level,
        workType: lifestyle.work_type,
        cuisinePreference: lifestyle.cuisine_preference,
        
        // Final Step (Step 6)
        clinical_notes: clinical_notes || '',
        created_by,
        
        // Default Ayurvedic fields
        prakriti: healthProfile.dosha, // Using dosha as prakriti for now
        medicalHistory: {
          currentMedications: [],
          surgeries: [],
          familyHistory: []
        },
        dietitianId: created_by
      };

      // Create the patient
      const patient = await Patient.create(patientData);

      // Clean up session
      delete sessions[sessionId];

      res.status(201).json({
        success: true,
        message: 'Patient registration completed successfully! Redirecting to PDF generation...',
        step: 6,
        nextStep: 'pdf_generation',
        progress: 100,
        data: {
          patient: {
            id: patient.id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            dosha: patient.dosha,
            dietary_habits: patient.dietary_habits,
            weight_goal: patient.weight_goal,
            bmi: patient.bmi,
            bmr: patient.bmr,
            created_by: patient.created_by
          },
          pdfGeneration: {
            patientId: patient.id,
            generateUrl: `/api/v1/pdf/generate/${patient.id}`,
            downloadUrl: `/api/v1/pdf/patient/${patient.id}`
          },
          nextActions: [
            'Generate personalized diet plan PDF',
            'Download diet chart',
            'Schedule follow-up consultation',
            'Monitor progress weekly'
          ]
        }
      });

    } catch (error) {
      console.error('Complete Registration Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration completion',
        step: 6,
        nextStep: 6
      });
    }
  }

  // Helper method: Check for duplicate phone
  static async checkDuplicatePhone(phone) {
    try {
      const patients = await Patient.findByPhone(phone);
      return patients.length > 0 ? patients[0] : null;
    } catch (error) {
      console.error('Error checking duplicate phone:', error);
      return null;
    }
  }

  // Helper method: Validate basic info
  static validateBasicInfo({ name, age, gender, phone }) {
    if (!name || name.trim().length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters long' };
    }

    if (!age || age < 1 || age > 120) {
      return { isValid: false, message: 'Please enter a valid age between 1 and 120' };
    }

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return { isValid: false, message: 'Please select a valid gender' };
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      return { isValid: false, message: 'Please enter a valid 10-digit phone number' };
    }

    return { isValid: true };
  }

  // Helper method: Validate email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Helper method: Generate session ID
  static generateSessionId() {
    return 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get registration guide/help
  static async getRegistrationGuide(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Patient registration guide',
        data: {
          totalSteps: 6,
          steps: [
            {
              step: 1,
              title: 'Basic Information',
              description: 'Name, age, gender, and phone number',
              required: ['name', 'age', 'gender', 'phone'],
              estimated_time: '1 minute'
            },
            {
              step: 2,
              title: 'Contact & Location',
              description: 'Email, address, and region details',
              required: ['region'],
              optional: ['email', 'address'],
              estimated_time: '1 minute'
            },
            {
              step: 3,
              title: 'Physical Health',
              description: 'Height, weight, dosha, dietary habits, weight goals, allergies, and medical conditions',
              required: ['dosha', 'weight_goal'],
              optional: ['height', 'weight', 'dietary_habits', 'allergies', 'condition'],
              estimated_time: '2 minutes'
            },
            {
              step: 4,
              title: 'Health Profile',
              description: 'Digestion pattern, water intake, activity level, and sleep pattern',
              required: ['digestion', 'water_intake', 'activity_level', 'sleep_pattern'],
              estimated_time: '2 minutes'
            },
            {
              step: 5,
              title: 'Lifestyle & Preferences',
              description: 'Stress level, work type, and cuisine preferences',
              required: ['stress_level', 'work_type', 'cuisine_preference'],
              estimated_time: '1 minute'
            },
            {
              step: 6,
              title: 'Complete Registration',
              description: 'Clinical notes and practitioner details',
              required: ['created_by'],
              optional: ['clinical_notes'],
              estimated_time: '1 minute'
            }
          ],
          total_estimated_time: '8 minutes',
          notes: [
            'BMI and BMR are automatically calculated from height, weight, age, and gender',
            'All steps must be completed in sequence',
            'Session expires after 30 minutes of inactivity'
          ]
        }
      });
    } catch (error) {
      console.error('Registration Guide Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error retrieving registration guide'
      });
    }
  }
}

module.exports = PatientRegistrationController;
