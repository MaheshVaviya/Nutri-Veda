const Patient = require('../models/Patient');
const OpenAI = require('openai');

class DietChartController {
  // Generate AI-powered diet chart
  static async generateDietChart(req, res) {
    try {
      const { patientId } = req.params;
      
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      // Get patient data
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Initialize OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY // You'll add this to your .env file
      });

      // Create detailed prompt for AI
      const prompt = `Create a 14-day Ayurvedic diet plan for a patient with the following details:

Patient Information:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Height: ${patient.height} cm
- Weight: ${patient.weight} kg
- BMI: ${patient.bmi}
- BMR: ${patient.bmr} cal/day
- Dosha: ${patient.dosha}
- Dietary Habits: ${patient.dietary_habits}
- Activity Level: ${patient.activityLevel || 'moderate'}
- Water Intake: ${patient.waterIntake || '2-3'} L/day
- Medical Conditions: ${(patient.condition || []).join(', ') || 'None'}
- Allergies: ${(patient.allergies || []).join(', ') || 'None'}
- Digestion: ${patient.digestion || 'normal'}
- Sleep Pattern: ${patient.sleepPattern || 'normal'}
- Stress Level: ${patient.stressLevel || 'moderate'}

Please create a detailed 14-day meal plan that includes:
1. Breakfast, Lunch, Dinner, and 2 Snacks for each day
2. Ayurvedic principles based on the patient's dosha
3. Caloric requirements aligned with BMR and activity level
4. Consideration for dietary preferences and restrictions
5. Seasonal and digestive recommendations

Format the response as a JSON object with this structure:
{
  "days": [
    {
      "day": 1,
      "date": "Day 1",
      "meals": {
        "breakfast": {
          "items": ["dish1", "dish2"],
          "calories": 400,
          "timing": "7:00-8:00 AM",
          "ayurvedic_notes": "Warm foods to balance dosha"
        },
        "morning_snack": {
          "items": ["snack"],
          "calories": 150,
          "timing": "10:00-10:30 AM"
        },
        "lunch": {
          "items": ["main dish", "side dish"],
          "calories": 500,
          "timing": "12:30-1:30 PM",
          "ayurvedic_notes": "Largest meal of the day"
        },
        "evening_snack": {
          "items": ["snack"],
          "calories": 150,
          "timing": "4:00-4:30 PM"
        },
        "dinner": {
          "items": ["light meal"],
          "calories": 300,
          "timing": "7:00-8:00 PM",
          "ayurvedic_notes": "Light and early dinner"
        }
      },
      "total_calories": 1500,
      "dosha_balance": "Emphasis on balancing ${patient.dosha} dosha"
    }
  ],
  "general_guidelines": [
    "Drink warm water throughout the day",
    "Eat at regular times",
    "Avoid processed foods"
  ],
  "ayurvedic_tips": [
    "Specific tips based on dosha and constitution"
  ]
}

Ensure the plan is authentic to Ayurvedic principles and suitable for Indian dietary preferences.`;

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an experienced Ayurvedic nutritionist with deep knowledge of Indian cuisine and Ayurvedic principles. Create personalized diet plans that are practical, authentic, and health-focused."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      });

      let dietPlan;
      try {
        dietPlan = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback to a structured response
        dietPlan = {
          days: [],
          general_guidelines: ["AI response parsing failed, manual review required"],
          ayurvedic_tips: ["Please consult with Ayurvedic practitioner"]
        };
      }

      // Save diet chart to database (you can create a DietChart model)
      const dietChartData = {
        patientId,
        patientName: patient.name,
        generatedAt: new Date(),
        aiGenerated: true,
        dietPlan,
        status: 'draft', // draft, approved, active
        createdBy: req.body.createdBy || 'AI System'
      };

      // You can save this to a DietChart collection in Firebase
      // const savedDietChart = await DietChart.create(dietChartData);

      res.status(200).json({
        success: true,
        message: 'Diet chart generated successfully',
        data: {
          dietChart: dietChartData,
          patientInfo: {
            id: patient.id,
            name: patient.name,
            dosha: patient.dosha,
            bmi: patient.bmi
          }
        }
      });

    } catch (error) {
      console.error('Diet chart generation error:', error);
      res.status(500).json({
        success: false,
        message: `Error generating diet chart: ${error.message}`
      });
    }
  }

  // Save/Update diet chart after editing
  static async saveDietChart(req, res) {
    try {
      const { patientId } = req.params;
      const { dietPlan, status = 'approved' } = req.body;

      // Here you would save the edited diet chart to your database
      // const updatedDietChart = await DietChart.updateOrCreate(patientId, {
      //   dietPlan,
      //   status,
      //   updatedAt: new Date()
      // });

      res.status(200).json({
        success: true,
        message: 'Diet chart saved successfully',
        data: {
          patientId,
          status,
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Save diet chart error:', error);
      res.status(500).json({
        success: false,
        message: `Error saving diet chart: ${error.message}`
      });
    }
  }

  // Get diet chart for a patient
  static async getDietChart(req, res) {
    try {
      const { patientId } = req.params;

      // Here you would fetch from your DietChart collection
      // const dietChart = await DietChart.findByPatientId(patientId);

      // For now, return a mock response
      res.status(200).json({
        success: true,
        message: 'Diet chart retrieved successfully',
        data: {
          dietChart: null, // Will be populated when you implement DietChart model
          message: 'No diet chart found for this patient'
        }
      });

    } catch (error) {
      console.error('Get diet chart error:', error);
      res.status(500).json({
        success: false,
        message: `Error retrieving diet chart: ${error.message}`
      });
    }
  }
}

module.exports = DietChartController;
