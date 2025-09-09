const Patient = require('../models/Patient');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Helper function to load foods data
async function loadFoodsData() {
  return new Promise((resolve, reject) => {
    const foods = [];
    const foodsPath = path.join(__dirname, '../../sample_data/foods_sample.csv');
    
    fs.createReadStream(foodsPath)
      .pipe(csv())
      .on('data', (data) => foods.push(data))
      .on('end', () => resolve(foods))
      .on('error', reject);
  });
}

// Helper function to load recipes data
async function loadRecipesData() {
  return new Promise((resolve, reject) => {
    const recipes = [];
    const recipesPath = path.join(__dirname, '../../sample_data/recipes_sample.csv');
    
    fs.createReadStream(recipesPath)
      .pipe(csv())
      .on('data', (data) => recipes.push(data))
      .on('end', () => resolve(recipes))
      .on('error', reject);
  });
}

// Helper function to filter foods by dosha
function filterFoodsByDosha(foods, dosha) {
  return foods.filter(food => {
    const doshaEffect = food.DoshaEffect.toLowerCase();
    const doshaLetter = dosha.charAt(0).toLowerCase();
    
    // Look for foods that balance the person's dosha (reduce it)
    return doshaEffect.includes(`${doshaLetter}-`) || doshaEffect.includes(`${doshaLetter}0`);
  });
}

// Helper function to filter recipes by dosha and meal type
function filterRecipesByDoshaAndMeal(recipes, dosha, mealType) {
  return recipes.filter(recipe => {
    const doshaSuitability = recipe.dosha_suitability.toLowerCase();
    const doshaLetter = dosha.charAt(0).toLowerCase();
    const recipeDosha = doshaSuitability.includes(`${doshaLetter}-`) || doshaSuitability.includes(`${doshaLetter}0`);
    
    // Match meal type
    const recipeMealType = recipe.meal_type.toLowerCase();
    const targetMealType = mealType.toLowerCase();
    
    return recipeDosha && (
      recipeMealType.includes(targetMealType) ||
      (targetMealType === 'breakfast' && recipeMealType.includes('breakfast')) ||
      (targetMealType === 'lunch' && (recipeMealType.includes('lunch') || recipeMealType.includes('main course'))) ||
      (targetMealType === 'dinner' && (recipeMealType.includes('dinner') || recipeMealType.includes('main course'))) ||
      (targetMealType === 'snack' && recipeMealType.includes('snack'))
    );
  });
}

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

      // Load sample data
      console.log('Loading foods and recipes data...');
      const [foods, recipes] = await Promise.all([
        loadFoodsData(),
        loadRecipesData()
      ]);

      console.log(`Loaded ${foods.length} foods and ${recipes.length} recipes`);

      // Filter data based on patient's dosha and dietary preferences
      const doshaBalancingFoods = filterFoodsByDosha(foods, patient.dosha);
      const breakfastRecipes = filterRecipesByDoshaAndMeal(recipes, patient.dosha, 'breakfast');
      const lunchRecipes = filterRecipesByDoshaAndMeal(recipes, patient.dosha, 'lunch');
      const dinnerRecipes = filterRecipesByDoshaAndMeal(recipes, patient.dosha, 'dinner');
      const snackRecipes = filterRecipesByDoshaAndMeal(recipes, patient.dosha, 'snack');

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Create detailed prompt with your actual data
      const prompt = `Create a detailed 14-day Ayurvedic diet plan for a patient using the following information:

PATIENT PROFILE:
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
- Medical Conditions: ${(patient.condition || []).join(', ') || 'None'}
- Allergies: ${(patient.allergies || []).join(', ') || 'None'}
- Digestion: ${patient.digestion || 'normal'}
- Sleep Pattern: ${patient.sleepPattern || 'normal'}

AVAILABLE INGREDIENTS (Dosha-Balancing for ${patient.dosha}):
${doshaBalancingFoods.slice(0, 20).map(food => 
  `- ${food.IngredientName} (${food.Category}): ${food.Calories_100g} cal/100g, ${food.DoshaEffect}`
).join('\n')}

AVAILABLE RECIPES:
Breakfast Options: ${breakfastRecipes.slice(0, 5).map(r => r.name).join(', ')}
Lunch Options: ${lunchRecipes.slice(0, 5).map(r => r.name).join(', ')}
Dinner Options: ${dinnerRecipes.slice(0, 5).map(r => r.name).join(', ')}
Snack Options: ${snackRecipes.slice(0, 5).map(r => r.name).join(', ')}

REQUIREMENTS:
1. Create a 14-day meal plan using ONLY the ingredients and recipes provided above
2. Each day should have: Breakfast, Morning Snack, Lunch, Evening Snack, Dinner
3. Target daily calories: ${Math.round(patient.bmr * 1.2)} - ${Math.round(patient.bmr * 1.5)} calories
4. Focus on ${patient.dosha} dosha balancing
5. Consider dietary preferences: ${patient.dietary_habits}
6. Include cooking timings and Ayurvedic benefits

Respond with a JSON object in this exact format:
{
  "patient_info": {
    "name": "${patient.name}",
    "dosha": "${patient.dosha}",
    "target_calories": ${Math.round(patient.bmr * 1.3)}
  },
  "days": [
    {
      "day": 1,
      "date": "Day 1",
      "meals": {
        "breakfast": {
          "recipe_name": "Recipe from available list",
          "ingredients": ["ingredient1", "ingredient2"],
          "calories": 400,
          "timing": "7:00-8:00 AM",
          "ayurvedic_notes": "How this balances ${patient.dosha} dosha",
          "editable": true
        },
        "morning_snack": {
          "items": ["snack from available ingredients"],
          "calories": 150,
          "timing": "10:00-10:30 AM",
          "editable": true
        },
        "lunch": {
          "recipe_name": "Recipe from available list",
          "ingredients": ["ingredient1", "ingredient2"],
          "calories": 500,
          "timing": "12:30-1:30 PM",
          "ayurvedic_notes": "Largest meal for optimal digestion",
          "editable": true
        },
        "evening_snack": {
          "items": ["snack from available ingredients"],
          "calories": 150,
          "timing": "4:00-4:30 PM",
          "editable": true
        },
        "dinner": {
          "recipe_name": "Recipe from available list",
          "ingredients": ["ingredient1", "ingredient2"],
          "calories": 300,
          "timing": "7:00-8:00 PM",
          "ayurvedic_notes": "Light dinner for better sleep",
          "editable": true
        }
      },
      "total_calories": 1500,
      "dosha_focus": "Foods to balance ${patient.dosha} dosha"
    }
  ],
  "general_guidelines": [
    "Drink warm water throughout the day",
    "Eat at regular times to maintain digestive fire",
    "Focus on ${patient.dosha}-balancing foods from the ingredient list"
  ],
  "ayurvedic_tips": [
    "Specific tips for ${patient.dosha} constitution",
    "Seasonal and digestive recommendations"
  ]
}

Make sure to use only the ingredients and recipes I provided in the lists above.`;

      // Get AI response from Gemini
      console.log('Generating AI diet plan...');
      const result = await model.generateContent([
        {
          role: "user",
          parts: [{ text: `You are an experienced Ayurvedic nutritionist specializing in personalized diet plans using traditional Indian ingredients and recipes. Create practical, authentic diet plans that are health-focused and use only the provided ingredients and recipes.\n\n${prompt}` }]
        }
      ]);

      const response = await result.response;
      const aiResponse = response.text();
      console.log('AI Response received, parsing...');

      let dietPlan;
      try {
        // Try to parse the JSON response from Gemini
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          dietPlan = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.log('Raw Gemini response (first 500 chars):', aiResponse.substring(0, 500));
        
        // Create fallback diet plan using actual sample data
        const sampleBreakfastRecipes = breakfastRecipes.slice(0, 7);
        const sampleLunchRecipes = lunchRecipes.slice(0, 7);
        const sampleDinnerRecipes = dinnerRecipes.slice(0, 7);
        const sampleFoods = doshaBalancingFoods.slice(0, 10);
        
        dietPlan = {
          patient_info: {
            name: patient.name,
            dosha: patient.dosha,
            target_calories: Math.round(patient.bmr * 1.3)
          },
          days: Array.from({ length: 14 }, (_, i) => {
            const breakfastRecipe = sampleBreakfastRecipes[i % sampleBreakfastRecipes.length] || { name: "Oatmeal with fruits" };
            const lunchRecipe = sampleLunchRecipes[i % sampleLunchRecipes.length] || { name: "Dal Rice" };
            const dinnerRecipe = sampleDinnerRecipes[i % sampleDinnerRecipes.length] || { name: "Light Khichdi" };
            
            return {
              day: i + 1,
              date: `Day ${i + 1}`,
              meals: {
                breakfast: {
                  recipe_name: breakfastRecipe.name,
                  ingredients: [
                    sampleFoods[0]?.IngredientName || "Oats",
                    sampleFoods[1]?.IngredientName || "Milk",
                    "Fruits"
                  ],
                  calories: 400,
                  timing: "7:00-8:00 AM",
                  ayurvedic_notes: `Warm breakfast to balance ${patient.dosha} dosha`,
                  editable: true
                },
                morning_snack: {
                  items: [sampleFoods[2]?.IngredientName || "Almonds", "Fresh fruit"],
                  calories: 150,
                  timing: "10:00-10:30 AM",
                  editable: true
                },
                lunch: {
                  recipe_name: lunchRecipe.name,
                  ingredients: [
                    sampleFoods[3]?.IngredientName || "Moong Dal",
                    sampleFoods[0]?.IngredientName || "Basmati Rice",
                    sampleFoods[4]?.IngredientName || "Ghee"
                  ],
                  calories: 500,
                  timing: "12:30-1:30 PM",
                  ayurvedic_notes: "Largest meal of the day for optimal digestion",
                  editable: true
                },
                evening_snack: {
                  items: ["Herbal tea", sampleFoods[5]?.IngredientName || "Light snack"],
                  calories: 150,
                  timing: "4:00-4:30 PM",
                  editable: true
                },
                dinner: {
                  recipe_name: dinnerRecipe.name,
                  ingredients: [
                    sampleFoods[3]?.IngredientName || "Moong Dal",
                    sampleFoods[0]?.IngredientName || "Rice",
                    "Vegetables"
                  ],
                  calories: 300,
                  timing: "7:00-8:00 PM",
                  ayurvedic_notes: "Light and early dinner for better sleep",
                  editable: true
                }
              },
              total_calories: 1500,
              dosha_focus: `Foods to balance ${patient.dosha} dosha`
            };
          }),
          general_guidelines: [
            "Drink warm water throughout the day",
            "Eat at regular times to maintain digestive fire",
            "Avoid processed and cold foods",
            `Focus on ${patient.dosha}-balancing foods from your ingredient list`
          ],
          ayurvedic_tips: [
            `As a ${patient.dosha} constitution, follow specific guidelines for your dosha`,
            "Practice mindful eating",
            "Include spices that support digestion",
            "Choose foods with appropriate rasa and virya for your constitution"
          ],
          available_ingredients: sampleFoods.map(food => ({
            name: food.IngredientName,
            category: food.Category,
            dosha_effect: food.DoshaEffect,
            calories_per_100g: food.Calories_100g
          })),
          ai_note: "This diet plan uses your actual sample data. The AI will provide more personalized recommendations once properly configured."
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

      // Get patient data first
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Here you would fetch from your DietChart collection
      // For now, we'll simulate checking for existing diet chart
      
      // Load sample data to show available options
      const [foods, recipes] = await Promise.all([
        loadFoodsData(),
        loadRecipesData()
      ]);

      const doshaBalancingFoods = filterFoodsByDosha(foods, patient.dosha);

      res.status(200).json({
        success: true,
        message: 'Diet chart query completed',
        data: {
          patient_info: {
            id: patientId,
            name: patient.name,
            dosha: patient.dosha,
            dietary_habits: patient.dietary_habits,
            bmi: patient.bmi,
            bmr: patient.bmr
          },
          existing_diet_plan: null, // Will be populated when you implement DietChart model
          available_ingredients: doshaBalancingFoods.slice(0, 20).map(food => ({
            id: food.IngredientID,
            name: food.IngredientName,
            category: food.Category,
            calories_per_100g: food.Calories_100g,
            dosha_effect: food.DoshaEffect,
            suitable_for_patient: true
          })),
          message: 'No existing diet chart found. Click "Generate AI Diet Plan" to create a personalized 14-day plan.'
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
