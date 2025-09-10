const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const DietChart = require('../models/DietChart');
const db = require('../config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class PDFService {
  // Helper function to load foods data
  static async loadFoodsData() {
    return new Promise((resolve, reject) => {
      const foods = [];
      const foodsPath = path.join(__dirname, '../../sample_data/foods_sample.csv');
      
      if (!fs.existsSync(foodsPath)) {
        console.log('⚠️ Foods data file not found, using basic ingredients');
        resolve([]);
        return;
      }
      
      fs.createReadStream(foodsPath)
        .pipe(csv())
        .on('data', (data) => foods.push(data))
        .on('end', () => {
          console.log(`✅ Loaded ${foods.length} food items`);
          resolve(foods);
        })
        .on('error', (error) => {
          console.log('⚠️ Error loading foods data:', error.message);
          resolve([]);
        });
    });
  }

  // Helper function to load recipes data
  static async loadRecipesData() {
    return new Promise((resolve, reject) => {
      const recipes = [];
      const recipesPath = path.join(__dirname, '../../sample_data/recipes_sample.csv');
      
      if (!fs.existsSync(recipesPath)) {
        console.log('⚠️ Recipes data file not found, using basic recipes');
        resolve([]);
        return;
      }
      
      fs.createReadStream(recipesPath)
        .pipe(csv())
        .on('data', (data) => recipes.push(data))
        .on('end', () => {
          console.log(`✅ Loaded ${recipes.length} recipes`);
          resolve(recipes);
        })
        .on('error', (error) => {
          console.log('⚠️ Error loading recipes data:', error.message);
          resolve([]);
        });
    });
  }

  // Helper function to filter foods by dosha
  static filterFoodsByDosha(foods, dosha) {
    if (!dosha || foods.length === 0) return foods.slice(0, 20);
    
    return foods.filter(food => {
      const doshaEffect = (food.DoshaEffect || '').toLowerCase();
      const doshaLetter = dosha.charAt(0).toLowerCase();
      
      // Look for foods that balance the person's dosha (reduce it)
      return doshaEffect.includes(`${doshaLetter}-`) || doshaEffect.includes(`${doshaLetter}0`);
    }).slice(0, 30);
  }

  // Helper function to filter recipes by dosha and meal type
  static filterRecipesByDoshaAndMeal(recipes, dosha, mealType) {
    if (!dosha || recipes.length === 0) return recipes.slice(0, 10);
    
    return recipes.filter(recipe => {
      const doshaSuitability = (recipe.dosha_suitability || '').toLowerCase();
      const doshaLetter = dosha.charAt(0).toLowerCase();
      const recipeMealType = (recipe.meal_type || '').toLowerCase();
      
      return (doshaSuitability.includes(doshaLetter) || doshaSuitability.includes('all')) &&
             recipeMealType.includes(mealType.toLowerCase());
    }).slice(0, 10);
  }

  // Generate AI diet plan using Gemini
  static async generateAIDietPlan(patientData) {
    try {
      console.log('🤖 Generating AI diet plan for patient...');
      
      // Load food and recipe data
      const foods = await this.loadFoodsData();
      const recipes = await this.loadRecipesData();
      
      // Calculate BMI and BMR if not provided
      const height = patientData.height || 165;
      const weight = patientData.weight || 65;
      const age = patientData.age || 30;
      const gender = patientData.gender || 'Female';
      
      const bmi = weight / ((height / 100) ** 2);
      const bmr = gender.toLowerCase() === 'male' 
        ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
        : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);

      // Get calorie limit from patient data or calculate based on BMR
      const calorieLimit = patientData.calorieLimit || Math.round(bmr * 1.3);
      const dosha = patientData.constitution || patientData.dosha || 'Vata';
      
      // Filter foods and recipes by dosha
      const doshaBalancingFoods = this.filterFoodsByDosha(foods, dosha);
      const breakfastRecipes = this.filterRecipesByDoshaAndMeal(recipes, dosha, 'breakfast');
      const lunchRecipes = this.filterRecipesByDoshaAndMeal(recipes, dosha, 'lunch');
      const dinnerRecipes = this.filterRecipesByDoshaAndMeal(recipes, dosha, 'dinner');
      const snackRecipes = this.filterRecipesByDoshaAndMeal(recipes, dosha, 'snack');

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Create enhanced prompt for AI generation
      const prompt = `Generate a 7-day personalized Ayurvedic diet plan for PDF generation.

Patient Information:
- Name: ${patientData.name || 'Patient'}
- Age: ${age}
- Gender: ${gender}
- Dosha: ${dosha}
- Height: ${height} cm
- Weight: ${weight} kg
- BMI: ${bmi.toFixed(1)}
- Daily Calorie Target: ${calorieLimit} calories
- Activity Level: ${patientData.activityLevel || 'moderate'}
- Dietary Restrictions: ${(patientData.dietaryRestrictions || []).join(', ') || 'none'}
- Health Goals: ${(patientData.healthGoals || []).join(', ') || 'general wellness'}

AVAILABLE DOSHA-BALANCING INGREDIENTS:
${doshaBalancingFoods.slice(0, 20).map(food => 
  `- ${food.IngredientName || food.name} (${food.Category || 'ingredient'}): ${food.Calories_100g || '50'} cal/100g`
).join('\n')}

AVAILABLE RECIPES BY MEAL TYPE:
Breakfast Options: ${breakfastRecipes.length > 0 ? breakfastRecipes.map(r => r.name || r.recipe_name).join(', ') : 'Oats porridge, Upma, Poha, Idli'}
Lunch Options: ${lunchRecipes.length > 0 ? lunchRecipes.map(r => r.name || r.recipe_name).join(', ') : 'Dal rice, Vegetable curry, Chapati, Quinoa salad'}
Dinner Options: ${dinnerRecipes.length > 0 ? dinnerRecipes.map(r => r.name || r.recipe_name).join(', ') : 'Light soup, Steamed vegetables, Khichdi'}
Snack Options: ${snackRecipes.length > 0 ? snackRecipes.map(r => r.name || r.recipe_name).join(', ') : 'Herbal tea, Nuts, Fresh fruits'}

Rules:
- Generate REAL, SPECIFIC food items and recipes for all 7 days
- NO placeholder text like "[items will be generated here]"
- Focus on ${dosha} dosha balancing foods
- Target daily calories: ${calorieLimit} calories (±200 calories is acceptable)
- Include proper meal timing according to Ayurvedic principles
- Output ONLY valid JSON format exactly like this:

{
  "weeklyPlans": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "meals": {
            "breakfast": {
              "items": [
                {"name": "Oats Porridge with Almonds", "quantity": "1 bowl", "calories": 300, "protein": 8, "carbs": 50, "fats": 8},
                {"name": "Herbal Tea", "quantity": "1 cup", "calories": 5, "protein": 0, "carbs": 1, "fats": 0}
              ]
            },
            "lunch": {
              "items": [
                {"name": "Brown Rice", "quantity": "1 cup", "calories": 220, "protein": 5, "carbs": 45, "fats": 2},
                {"name": "Dal Tadka", "quantity": "1 bowl", "calories": 180, "protein": 12, "carbs": 25, "fats": 4}
              ]
            },
            "dinner": {
              "items": [
                {"name": "Roti", "quantity": "2 pieces", "calories": 160, "protein": 6, "carbs": 30, "fats": 3},
                {"name": "Mixed Vegetables", "quantity": "1 bowl", "calories": 120, "protein": 4, "carbs": 15, "fats": 5}
              ]
            },
            "snacks": {
              "items": [
                {"name": "Green Tea", "quantity": "1 cup", "calories": 5, "protein": 0, "carbs": 1, "fats": 0},
                {"name": "Almonds", "quantity": "6 pieces", "calories": 35, "protein": 1, "carbs": 1, "fats": 3}
              ]
            }
          }
        }
      ]
    }
  ],
  "generatedAt": "${new Date().toISOString()}",
  "totalDays": 7,
  "ayurvedicPrinciples": [
    "Balancing ${dosha} dosha with appropriate foods",
    "Following proper meal timing for optimal digestion",
    "Including six tastes (sweet, sour, salty, bitter, pungent, astringent)",
    "Supporting digestive fire (Agni) with warming spices"
  ]
}

Generate complete meal plans for all 7 days with specific foods and calories.`;

      console.log('📤 Sending request to Gemini AI...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();
      
      console.log('📥 AI Response received, parsing...');
      
      // Clean and parse the AI response
      let cleanResponse = aiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^\s*```.*$/gm, '')
        .trim();
      
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = cleanResponse.substring(jsonStart, jsonEnd);
        const aiDietPlan = JSON.parse(jsonStr);
        
        console.log('✅ AI diet plan generated successfully');
        return aiDietPlan;
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
      
    } catch (error) {
      console.error('❌ Error generating AI diet plan:', error.message);
      // Return a fallback basic diet plan
      return this.generateFallbackDietPlan(patientData);
    }
  }

  // Fallback diet plan if AI generation fails
  static generateFallbackDietPlan(patientData) {
    const calorieLimit = patientData.calorieLimit || 1500;
    const dosha = patientData.constitution || patientData.dosha || 'Vata';
    
    return {
      weeklyPlans: [
        {
          week: 1,
          days: [
            {
              day: 1,
              meals: {
                breakfast: {
                  items: [
                    { name: "Oats Porridge", quantity: "1 bowl", calories: 250, protein: 8, carbs: 45, fats: 5 },
                    { name: "Herbal Tea", quantity: "1 cup", calories: 5, protein: 0, carbs: 1, fats: 0 }
                  ]
                },
                lunch: {
                  items: [
                    { name: "Brown Rice", quantity: "1 cup", calories: 220, protein: 5, carbs: 45, fats: 2 },
                    { name: "Dal", quantity: "1 bowl", calories: 180, protein: 12, carbs: 25, fats: 4 },
                    { name: "Vegetables", quantity: "1 serving", calories: 100, protein: 3, carbs: 15, fats: 3 }
                  ]
                },
                dinner: {
                  items: [
                    { name: "Roti", quantity: "2 pieces", calories: 160, protein: 6, carbs: 30, fats: 3 },
                    { name: "Vegetable Curry", quantity: "1 bowl", calories: 150, protein: 4, carbs: 20, fats: 6 }
                  ]
                },
                snacks: {
                  items: [
                    { name: "Green Tea", quantity: "1 cup", calories: 5, protein: 0, carbs: 1, fats: 0 },
                    { name: "Nuts", quantity: "small portion", calories: 80, protein: 3, carbs: 3, fats: 7 }
                  ]
                }
              }
            }
          ]
        }
      ],
      generatedAt: new Date().toISOString(),
      totalDays: 7,
      ayurvedicPrinciples: [
        `Balancing ${dosha} dosha with appropriate foods`,
        "Following proper meal timing for optimal digestion",
        "Including warming spices to enhance digestive fire",
        "Maintaining balanced nutrition with Ayurvedic principles"
      ]
    };
  }

  static async generateDietPlanPDF(patientData, outputPath = null) {
    return new Promise(async (resolve, reject) => {
      try {
        // First try to fetch AI-generated diet chart
        console.log('🔍 Looking for AI-generated diet chart for patient:', patientData.id || patientData._id);
        
        let aiDietCharts = [];
        let dietChart = null;
        
        try {
          // Try to get AI diet charts first
          const patientIdToSearch = patientData.id || patientData._id;
          aiDietCharts = await db.findByField('aiDietCharts', 'patientId', patientIdToSearch);
          
          if (aiDietCharts && aiDietCharts.length > 0) {
            // Get the most recent AI diet chart
            dietChart = aiDietCharts.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0];
            console.log('✅ Found AI diet chart:', dietChart.id);
          }
        } catch (aiError) {
          console.log('⚠️ No AI diet charts found:', aiError.message);
        }
        
        // If no AI chart found, try regular diet charts
        if (!dietChart) {
          try {
            const DietChart = require('../models/DietChart');
            const regularDietCharts = await DietChart.findByPatient(patientData.id || patientData._id);
            dietChart = regularDietCharts && regularDietCharts.length > 0 ? regularDietCharts[0] : null;
            if (dietChart) {
              console.log('✅ Found regular diet chart:', dietChart.id);
            }
          } catch (regularError) {
            console.log('⚠️ No regular diet charts found either:', regularError.message);
          }
        }
        
        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true
        });

        // Set up output path
        const fileName = outputPath || `diet_plan_${patientData._id || patientData.id}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../../temp', fileName);

        // Ensure temp directory exists
        const tempDir = path.dirname(filePath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Generate PDF content
        this.addHeader(doc);
        this.addPatientDetails(doc, patientData);
        
        if (dietChart && (dietChart.dietPlan || dietChart.meals)) {
          // Handle both AI-generated diet plans and regular meal charts
          if (dietChart.dietPlan) {
            console.log('📋 Generating PDF from existing AI diet plan...');
            this.addAIDietPlan(doc, dietChart.dietPlan);
          } else {
            console.log('📋 Generating PDF from regular meal chart...');
            this.addMealChart(doc, dietChart);
          }
        } else {
          console.log('🤖 No diet chart found, generating AI diet plan with patient preferences...');
          
          // Extract patient info properly - handle different data structures
          const patient = patientData.patient || patientData;
          const calorieLimit = patient.calorieLimit || patient.bmr ? Math.round(patient.bmr * 1.3) : 1500;
          const dosha = patient.constitution || patient.dosha || 'Vata';
          
          console.log(`📊 Patient: ${patient.name}`);
          console.log(`📊 Using calorie limit: ${calorieLimit} cal/day`);
          console.log(`🧘 Using dosha: ${dosha}`);
          
          // Generate AI diet plan with proper patient data
          const aiDietPlan = await this.generateAIDietPlan({
            name: patient.name,
            age: patient.age || 30,
            weight: patient.weight || 65,
            height: patient.height || 165,
            gender: patient.gender || 'Female',
            activityLevel: patient.activityLevel || 'moderate',
            dietaryRestrictions: patient.dietaryRestrictions || [],
            healthGoals: patient.healthGoals || ['general wellness'],
            constitution: dosha,
            dosha: dosha,
            calorieLimit: calorieLimit,
            bmr: patient.bmr || 1400,
            bmi: patient.bmi || 22
          });
          
          console.log('✅ AI diet plan generated, adding to PDF...');
          this.addAIDietPlan(doc, aiDietPlan);
          
          // Save the generated diet plan to database for future use
          try {
            if (patient.id || patient._id || patientData.id || patientData._id) {
              const patientId = patient.id || patient._id || patientData.id || patientData._id;
              const aiDietChartData = {
                patientId: patientId,
                patientName: patient.name,
                dietPlan: aiDietPlan,
                generatedAt: new Date(),
                generatedBy: 'AI',
                status: 'active',
                aiGenerated: true
              };
              
              await db.create('aiDietCharts', aiDietChartData);
              console.log('💾 AI diet plan saved to database for future use');
            }
          } catch (saveError) {
            console.log('⚠️ Could not save AI diet plan to database:', saveError.message);
          }
        }
        
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve({ 
            success: true, 
            filePath,
            fileName: path.basename(filePath)
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static addHeader(doc) {
    // Enhanced NutriVeda Header with better styling
    doc.fontSize(28)
        .fillColor('#059669')
        .text('🌿 NutriVeda', 50, 50, { align: 'center' });
    
    doc.fontSize(18)
        .fillColor('#065f46')
        .text('Personalized Ayurvedic Diet Plan', 50, 85, { align: 'center' });
    
    doc.fontSize(12)
        .fillColor('#6b7280')
        .text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`, 50, 110, { align: 'center' });
    
    // Enhanced decorative line
    doc.moveTo(100, 135)
        .lineTo(495, 135)
        .strokeColor('#059669')
        .lineWidth(3)
        .stroke();
    
    // Subtitle line
    doc.moveTo(150, 140)
        .lineTo(445, 140)
        .strokeColor('#86efac')
        .lineWidth(1)
        .stroke();
    
    doc.moveDown(3);
  }

  static addPatientDetails(doc, patient) {
    const startY = doc.y;
    
    // Enhanced Patient Details Header with background
    doc.rect(50, startY - 5, 495, 30)
       .fillColor('#f0fdf4')
       .fill();
    
    doc.fontSize(18)
       .fillColor('#166534')
       .text('👤 Patient Information', 60, startY + 5);
    
    doc.y = startY + 35;
    
    // Calculate BMI if not provided
    const calculatedBMI = patient.bmi || 
      (patient.weight && patient.height ? 
       (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1) : 'N/A');
    
    // Create enhanced two-column layout
    const leftCol = 60;
    const rightCol = 320;
    let currentY = doc.y + 10;
    
    // Enhanced styling for patient details
    doc.fontSize(11).fillColor('#333');
    
    // Left column with enhanced formatting
    this.addEnhancedDetailRow(doc, 'Full Name:', patient.name || 'N/A', leftCol, currentY);
    this.addEnhancedDetailRow(doc, 'Age:', `${patient.age || 'N/A'} years`, leftCol, currentY + 22);
    this.addEnhancedDetailRow(doc, 'Gender:', patient.gender || 'N/A', leftCol, currentY + 44);
    this.addEnhancedDetailRow(doc, 'Height:', `${patient.height || 'N/A'} cm`, leftCol, currentY + 66);
    this.addEnhancedDetailRow(doc, 'Weight:', `${patient.weight || 'N/A'} kg`, leftCol, currentY + 88);
    this.addEnhancedDetailRow(doc, 'BMI:', calculatedBMI, leftCol, currentY + 110);
    
    // Right column with enhanced formatting
    this.addEnhancedDetailRow(doc, 'Primary Dosha:', patient.dosha || 'N/A', rightCol, currentY);
    this.addEnhancedDetailRow(doc, 'Digestion:', patient.digestion || 'Normal', rightCol, currentY + 22);
    this.addEnhancedDetailRow(doc, 'Water Intake:', `${patient.waterIntake || 'N/A'} L/day`, rightCol, currentY + 44);
    this.addEnhancedDetailRow(doc, 'Activity Level:', patient.activityLevel || patient.lifestyle?.activityLevel || 'Moderate', rightCol, currentY + 66);
    this.addEnhancedDetailRow(doc, 'Sleep Pattern:', patient.sleepPattern || patient.lifestyle?.sleepPattern || 'Normal', rightCol, currentY + 88);
    this.addEnhancedDetailRow(doc, 'Stress Level:', patient.stressLevel || patient.lifestyle?.stressLevel || 'Moderate', rightCol, currentY + 110);
    
    // Medical information section with enhanced styling
    doc.y = currentY + 145;
    
    // Medical section header
    doc.fontSize(14)
       .fillColor('#dc2626')
       .text('🏥 Medical Profile', leftCol, doc.y);
    doc.moveDown(1);
    
    // Medical details with word wrapping
    const medicalY = doc.y;
    this.addWrappedDetailRow(doc, 'Medical Conditions:', 
      (patient.condition && patient.condition.length > 0 ? patient.condition.join(', ') : 'None'), 
      leftCol, medicalY, 480);
    
    this.addWrappedDetailRow(doc, 'Known Allergies:', 
      (patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None'), 
      leftCol, medicalY + 25, 480);
    
    this.addWrappedDetailRow(doc, 'Current Medications:', 
      (patient.history?.currentMedications || patient.medicalHistory?.currentMedications || []).length > 0 ? 
      (patient.history?.currentMedications || patient.medicalHistory?.currentMedications || []).join(', ') : 'None', 
      leftCol, medicalY + 50, 480);
    
    // Additional dietary preferences
    if (patient.dietary_habits) {
      this.addWrappedDetailRow(doc, 'Dietary Preference:', patient.dietary_habits, leftCol, medicalY + 75, 480);
      doc.y = medicalY + 100;
    } else {
      doc.y = medicalY + 85;
    }
    
    doc.moveDown(1);
  }

  static addEnhancedDetailRow(doc, label, value, x, y) {
    // Label with enhanced styling
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(label, x, y, { width: 100 });
    
    // Value with enhanced styling
    doc.fontSize(11)
       .fillColor('#111827')
       .text(value, x + 105, y, { width: 140 });
  }

  static addWrappedDetailRow(doc, label, value, x, y, maxWidth = 400) {
    // Label
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(label, x, y, { width: 120 });
    
    // Value with text wrapping
    doc.fontSize(10)
       .fillColor('#111827')
       .text(value, x + 125, y, { width: maxWidth - 125 });
  }

  static addDetailRow(doc, label, value, x, y) {
    doc.fontSize(10)
       .fillColor('#666')
       .text(label, x, y, { width: 80 });
    
    doc.fontSize(10)
       .fillColor('#333')
       .text(value, x + 85, y, { width: 150 });
  }

  static addAIDietPlan(doc, dietPlan) {
    console.log('🤖 Adding AI-generated diet plan to PDF...');
    
    // Add new page if needed
    if (doc.y > 600) {
      doc.addPage();
    }
    
    doc.moveDown(2);
    
    // AI Diet Plan Header with enhanced styling
    doc.fontSize(20)
       .fillColor('#059669')
       .text('🤖 AI-Generated 14-Day Ayurvedic Diet Plan', 50, doc.y, { align: 'center' });
    
    doc.moveDown(1);
    
    // Patient info summary with better formatting
    if (dietPlan.patient_info) {
      doc.fontSize(12)
         .fillColor('#065f46')
         .text(`Personalized for: ${dietPlan.patient_info.name}`, 50, doc.y, { align: 'center' });
      doc.fontSize(11)
         .fillColor('#374151')
         .text(`Dosha: ${dietPlan.patient_info.dosha} | Target Calories: ${dietPlan.patient_info.target_calories} cal/day`, 50, doc.y + 15, { align: 'center' });
      doc.moveDown(2);
    }
    
    // AI Generation timestamp and note
    if (dietPlan.generation_timestamp) {
      doc.fontSize(9)
         .fillColor('#6b7280')
         .text(`Generated on: ${new Date(dietPlan.generation_timestamp).toLocaleString()}`, 50, doc.y, { align: 'center' });
      doc.moveDown(1);
    }
    
    // General Guidelines with enhanced layout
    if (dietPlan.general_guidelines && dietPlan.general_guidelines.length > 0) {
      if (doc.y > 650) {
        doc.addPage();
      }
      
      doc.fontSize(16)
         .fillColor('#059669')
         .text('📋 General Ayurvedic Guidelines', 50, doc.y);
      doc.moveDown(0.8);
      
      // Create a box for guidelines
      const guidelinesStartY = doc.y;
      doc.rect(50, guidelinesStartY - 5, 495, 10 + (dietPlan.general_guidelines.length * 18))
         .fillColor('#f0fdf4')
         .fill();
      
      doc.fillColor('#374151'); // Reset text color
      
      dietPlan.general_guidelines.forEach((guideline, index) => {
        doc.fontSize(10)
           .text(`${index + 1}. ${guideline}`, 60, guidelinesStartY + (index * 18));
      });
      
      doc.y = guidelinesStartY + (dietPlan.general_guidelines.length * 18) + 15;
    }
    
    // Ayurvedic Tips with enhanced styling
    if (dietPlan.ayurvedic_tips && dietPlan.ayurvedic_tips.length > 0) {
      if (doc.y > 650) {
        doc.addPage();
      }
      
      doc.fontSize(16)
         .fillColor('#059669')
         .text('🌿 Personalized Ayurvedic Insights', 50, doc.y);
      doc.moveDown(0.8);
      
      // Create a box for tips
      const tipsStartY = doc.y;
      doc.rect(50, tipsStartY - 5, 495, 10 + (dietPlan.ayurvedic_tips.length * 18))
         .fillColor('#fef3c7')
         .fill();
      
      doc.fillColor('#374151'); // Reset text color
      
      dietPlan.ayurvedic_tips.forEach((tip, index) => {
        doc.fontSize(10)
           .text(`• ${tip}`, 60, tipsStartY + (index * 18));
      });
      
      doc.y = tipsStartY + (dietPlan.ayurvedic_tips.length * 18) + 20;
    }
    
    // 14-Day Meal Plan with enhanced table layout
    if (dietPlan.days && dietPlan.days.length > 0) {
      if (doc.y > 500) {
        doc.addPage();
      }
      
      doc.fontSize(18)
         .fillColor('#059669')
         .text('📅 Your 14-Day Personalized Meal Journey', 50, doc.y, { align: 'center' });
      doc.moveDown(1.5);
      
      // Process days in groups for better pagination
      const daysPerPage = 2; // Show 2 days per section for detailed view
      
      for (let i = 0; i < dietPlan.days.length; i += daysPerPage) {
        const dayGroup = dietPlan.days.slice(i, i + daysPerPage);
        
        dayGroup.forEach((day, groupIndex) => {
          const actualDayIndex = i + groupIndex;
          
          // Check if we need a new page
          if (doc.y > 600) {
            doc.addPage();
          }
          
          // Day header with enhanced styling
          const dayHeaderY = doc.y;
          doc.rect(50, dayHeaderY, 495, 35)
             .fillColor('#e0f2fe')
             .fill();
          
          doc.fontSize(16)
             .fillColor('#0369a1')
             .text(`Day ${day.day}`, 60, dayHeaderY + 8);
          
          if (day.total_calories) {
            doc.fontSize(11)
               .fillColor('#374151')
               .text(`Total: ${day.total_calories} calories`, 200, dayHeaderY + 10);
          }
          
          if (day.dosha_focus) {
            doc.fontSize(9)
               .fillColor('#6b7280')
               .text(day.dosha_focus, 60, dayHeaderY + 22);
          }
          
          doc.y = dayHeaderY + 45;
          
          // Meals in a clean grid layout
          const meals = day.meals || {};
          const mealTypes = ['breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner'];
          const mealConfig = {
            breakfast: { emoji: '🌅', name: 'Breakfast', color: '#fef3c7' },
            morning_snack: { emoji: '🍎', name: 'Morning Snack', color: '#dcfce7' },
            lunch: { emoji: '☀️', name: 'Lunch', color: '#fed7aa' },
            evening_snack: { emoji: '🍵', name: 'Evening Snack', color: '#e0e7ff' },
            dinner: { emoji: '🌙', name: 'Dinner', color: '#f3e8ff' }
          };
          
          const mealStartY = doc.y;
          const mealWidth = 95; // Width for each meal column
          const mealSpacing = 5;
          
          mealTypes.forEach((mealType, mealIndex) => {
            const meal = meals[mealType];
            if (!meal || !meal.items) return;
            
            const mealX = 50 + (mealIndex * (mealWidth + mealSpacing));
            const config = mealConfig[mealType];
            
            // Meal box background
            doc.rect(mealX, mealStartY, mealWidth, 120)
               .fillColor(config.color)
               .fill();
            
            // Meal header
            doc.fontSize(10)
               .fillColor('#374151')
               .text(`${config.emoji} ${config.name}`, mealX + 5, mealStartY + 5, { width: mealWidth - 10 });
            
            // Timing
            if (meal.timing) {
              doc.fontSize(8)
                 .fillColor('#6b7280')
                 .text(meal.timing, mealX + 5, mealStartY + 18, { width: mealWidth - 10 });
            }
            
            // Items (cleaned up and formatted)
            let itemY = mealStartY + 30;
            if (meal.items && Array.isArray(meal.items)) {
              meal.items.slice(0, 4).forEach((item) => { // Limit to 4 items per meal for space
                let cleanItem = item.replace(/🍽️|•/g, '').trim();
                if (cleanItem.length > 25) cleanItem = cleanItem.substring(0, 22) + '...';
                
                if (cleanItem.length > 0) {
                  doc.fontSize(8)
                     .fillColor('#374151')
                     .text(`• ${cleanItem}`, mealX + 5, itemY, { width: mealWidth - 10 });
                  itemY += 10;
                }
              });
            }
            
            // Calories at bottom
            if (meal.calories) {
              doc.fontSize(8)
                 .fillColor('#059669')
                 .text(`${meal.calories} cal`, mealX + 5, mealStartY + 105, { width: mealWidth - 10, align: 'right' });
            }
          });
          
          doc.y = mealStartY + 130;
          
          // Add separator line between days
          if (actualDayIndex < dietPlan.days.length - 1) {
            doc.moveTo(50, doc.y + 5)
               .lineTo(545, doc.y + 5)
               .strokeColor('#e5e7eb')
               .lineWidth(1)
               .stroke();
            doc.moveDown(1);
          }
        });
        
        // Add page break between day groups (except last group)
        if (i + daysPerPage < dietPlan.days.length) {
          doc.addPage();
        }
      }
    }
    
    // Available ingredients section
    if (dietPlan.available_ingredients && dietPlan.available_ingredients.length > 0) {
      if (doc.y > 600) {
        doc.addPage();
      }
      
      doc.moveDown(2);
      doc.fontSize(16)
         .fillColor('#059669')
         .text('🥗 Your Personalized Ingredient Database', 50, doc.y);
      doc.moveDown(1);
      
      // Create ingredient grid
      const ingredientsPerRow = 3;
      const ingredientWidth = 160;
      
      dietPlan.available_ingredients.slice(0, 15).forEach((ingredient, index) => {
        const row = Math.floor(index / ingredientsPerRow);
        const col = index % ingredientsPerRow;
        const x = 50 + (col * (ingredientWidth + 10));
        const y = doc.y + (row * 25);
        
        if (y > 750) {
          doc.addPage();
          const newRow = 0;
          const newY = 50 + (newRow * 25);
          
          doc.fontSize(9)
             .fillColor('#374151')
             .text(`• ${ingredient.name} (${ingredient.category})`, x, newY, { width: ingredientWidth });
        } else {
          doc.fontSize(9)
             .fillColor('#374151')
             .text(`• ${ingredient.name} (${ingredient.category})`, x, y, { width: ingredientWidth });
        }
      });
      
      const totalRows = Math.ceil(Math.min(15, dietPlan.available_ingredients.length) / ingredientsPerRow);
      doc.y += (totalRows * 25) + 20;
    }
    
    // Enhanced AI Generation Note
    if (dietPlan.ai_note) {
      if (doc.y > 700) {
        doc.addPage();
      }
      
      doc.moveDown(1);
      
      // Create a highlighted box for the AI note
      const noteStartY = doc.y;
      const noteHeight = 60;
      
      doc.rect(50, noteStartY - 5, 495, noteHeight)
         .fillColor('#f0f9ff')
         .fill();
      
      doc.fontSize(12)
         .fillColor('#0369a1')
         .text('🤖 AI Generation Report', 60, noteStartY + 5);
      
      doc.fontSize(9)
         .fillColor('#374151')
         .text(dietPlan.ai_note, 60, noteStartY + 22, { width: 475, align: 'justify' });
      
      doc.y = noteStartY + noteHeight + 10;
    }
    
    // Footer disclaimer
    if (doc.y > 720) {
      doc.addPage();
    }
    
    doc.moveDown(1);
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('Important: This AI-generated diet plan is customized based on your Ayurvedic constitution and health profile. Please consult with your healthcare provider or Ayurvedic practitioner before making significant dietary changes.', 50, doc.y, { 
         width: 495, 
         align: 'center' 
       });
  }

  static addMealChart(doc, dietChart) {
    let yPosition = doc.y + 20;

    // Chart Info
    doc.fontSize(16)
       .fillColor('#065f46')
       .text(`Diet Chart: ${dietChart.chartName || 'Custom Plan'}`, 50, yPosition);
    
    yPosition += 25;
    doc.fontSize(11)
       .fillColor('#374151');
    
    if (dietChart.instructions) {
      doc.text(`Instructions: ${dietChart.instructions}`, 70, yPosition);
      yPosition += 20;
    }

    // Meals
    if (dietChart.meals && dietChart.meals.length > 0) {
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(18)
         .fillColor('#059669')
         .text('Meal Plan', 50, yPosition);
      
      yPosition += 30;

      dietChart.meals.forEach((meal, index) => {
        // Check if we need a new page
        if (yPosition > 600) {
          doc.addPage();
          yPosition = 50;
        }

        // Meal header
        doc.fontSize(14)
           .fillColor('#f59e0b')
           .text(`${meal.name || `Meal ${index + 1}`}`, 50, yPosition);
        
        if (meal.time) {
          doc.fontSize(10)
             .fillColor('#6b7280')
             .text(`Time: ${meal.time}`, 200, yPosition + 2);
        }

        yPosition += 25;

        // Foods
        if (meal.foods && meal.foods.length > 0) {
          doc.fontSize(10)
             .fillColor('#374151');
          
          meal.foods.forEach(food => {
            if (yPosition > 750) {
              doc.addPage();
              yPosition = 50;
            }
            const quantity = food.quantity ? ` (${food.quantity} serving${food.quantity > 1 ? 's' : ''})` : '';
            doc.text(`  • ${food.name || food.foodName || food}${quantity}`, 70, yPosition);
            yPosition += 12;
          });
        }

        // Meal instructions
        if (meal.instructions) {
          doc.fontSize(9)
             .fillColor('#065f46')
             .text(`💡 ${meal.instructions}`, 70, yPosition);
          yPosition += 15;
        }

        yPosition += 20;
      });
    }

    // Nutritional Summary
    if (dietChart.totalNutrition) {
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(16)
         .fillColor('#065f46')
         .text('Nutritional Summary', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#374151');

      const nutrition = dietChart.totalNutrition;
      doc.text(`Total Calories: ${nutrition.calories || 0} kcal`, 70, yPosition);
      yPosition += 15;
      doc.text(`Protein: ${nutrition.protein || 0}g`, 70, yPosition);
      yPosition += 15;
      doc.text(`Carbohydrates: ${nutrition.carbs || 0}g`, 70, yPosition);
      yPosition += 15;
      doc.text(`Fat: ${nutrition.fat || 0}g`, 70, yPosition);
      yPosition += 15;
      if (nutrition.fiber) {
        doc.text(`Fiber: ${nutrition.fiber}g`, 70, yPosition);
        yPosition += 15;
      }
    }
  }

  static addDietPlanTemplate(doc) {
    // Add new page if needed
    if (doc.y > 600) {
      doc.addPage();
    }
    
    doc.moveDown(2);
    
    // Template message
    doc.fontSize(16)
       .fillColor('#dc2626')
       .text('⚠️ No Diet Plan Available', 50, doc.y, { align: 'center' });
    
    doc.moveDown(1);
    
    doc.fontSize(12)
       .fillColor('#374151')
       .text('No AI-generated diet plan was found for this patient. Please generate a diet plan first using the AI Diet Plan Generator.', 50, doc.y, { align: 'center', width: 495 });
    
    doc.moveDown(2);
    
    // Template table (simplified version)
    doc.fontSize(14)
       .fillColor('#2c5530')
       .text('Sample 14-Day Diet Plan Template', 50, doc.y);
    
    doc.moveDown(1);
    
    // Add simple template structure
    const days = 14;
    for (let day = 1; day <= days; day++) {
      if (doc.y > 700) {
        doc.addPage();
      }
      
      doc.fontSize(11)
         .fillColor('#333')
         .text(`Day ${day}: [Meals will be generated by AI based on patient's dosha and health profile]`, 60, doc.y);
      
      doc.moveDown(0.5);
    }
    
    doc.moveDown(2);
    
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('To generate a personalized diet plan, please use the AI Diet Plan Generator in the application.', 50, doc.y, { align: 'center', width: 495 });
  }

  static addFooter(doc) {
    // Add footer to all pages
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Enhanced footer design
      doc.rect(50, 765, 495, 25)
         .fillColor('#f9fafb')
         .fill();
      
      // Footer line
      doc.moveTo(50, 765)
         .lineTo(545, 765)
         .strokeColor('#059669')
         .lineWidth(2)
         .stroke();
      
      // Footer text with enhanced styling
      doc.fontSize(9)
         .fillColor('#374151')
         .text('🌿 Generated by NutriVeda AI - Personalized Ayurvedic Nutrition Platform', 60, 772);
      
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text(`Page ${i + 1} of ${pages.count}`, 480, 775);
      
      // Add a small logo/branding element
      doc.fontSize(8)
         .fillColor('#059669')
         .text('www.nutriveda.ai', 60, 782);
    }
  }

  static async cleanupTempFiles(olderThanMinutes = 60) {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) return;

      const files = fs.readdirSync(tempDir);
      const now = new Date();

      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          const fileAge = (now - stats.mtime) / (1000 * 60); // in minutes

          if (fileAge > olderThanMinutes) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Cleaned up temp PDF: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning temp files:', error);
    }
  }
}

module.exports = PDFService;