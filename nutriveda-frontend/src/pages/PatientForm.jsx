import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, Users, Briefcase,
  Heart, Activity, Scale, Droplets, Apple, Utensils,
  Moon, Brain, Target, Clock, DollarSign, ChefHat,
  FileText, Plus, X, ArrowRight, ArrowLeft, CheckCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

const PatientForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [message, setMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Test backend connection on component mount
  React.useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await fetch(`${API_BASE}/patients`);
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('error');
        console.error('Backend connection test failed:', error);
      }
    };

    testBackendConnection();
  }, []);

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    occupation: '',
    
    // Health Information
    height: '',
    weight: '',
    activityLevel: '',
    healthConditions: [],
    allergies: [],
    currentMedications: [],
    
    // Dietary Information
    dietType: '',
    foodPreferences: [],
    mealsPerDay: '',
    waterIntake: '',
    alcoholConsumption: '',
    smokingHabits: '',
    
    // Ayurvedic Information
    doshaType: '',
    digestiveHealth: '',
    sleepPattern: '',
    stressLevel: '',
    menstrualCycle: '',
    energyLevels: '',
    
    // Goals and Preferences
    healthGoals: [],
    targetWeight: '',
    timeframe: '',
    budgetRange: '',
    cookingTime: '',
    
    // Additional Information
    previousDiets: '',
    supplements: '',
    exerciseRoutine: '',
    additionalNotes: ''
  });

  const calculateBMI = () => {
    const height = parseFloat(formData.height) / 100; // Convert cm to meters
    const weight = parseFloat(formData.weight);
    if (height && weight) {
      return (weight / (height * height)).toFixed(1);
    }
    return '';
  };

  const calculateBMR = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);
    
    if (weight && height && age && formData.gender) {
      let bmr;
      if (formData.gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
      return Math.round(bmr);
    }
    return '';
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addArrayItem = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    setMessage('🔄 Registering patient...');

    try {
      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          bmi: calculateBMI(),
          bmr: calculateBMR()
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSubmissionStatus('success');
        setMessage('🎉 Patient registered successfully! Redirecting to diet plan generator...');
        
        // Redirect to diet plan generator with patient details
        setTimeout(() => {
          const patientId = result.data.patientId || result.data._id;
          navigate(`/diet-plan-generator?patientId=${patientId}&name=${encodeURIComponent(formData.name)}`);
        }, 2000);
      } else {
        setSubmissionStatus('error');
        setMessage(`❌ ${result.message || 'Registration failed. Please try again.'}`);
      }
    } catch (error) {
      setSubmissionStatus('error');
      setMessage(`❌ Network error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Health Info', icon: Heart },
    { number: 3, title: 'Dietary Info', icon: Apple },
    { number: 4, title: 'Ayurvedic Info', icon: Brain },
    { number: 5, title: 'Goals', icon: Target },
    { number: 6, title: 'Additional Info', icon: FileText }
  ];

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-center items-center space-x-4 mb-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === step.number
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : currentStep > step.number
                  ? 'bg-emerald-400 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              {step.number < steps.length && (
                <div className={`w-8 h-1 mx-2 ${
                  currentStep > step.number ? 'bg-emerald-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-emerald-800 mb-2">
          Step {currentStep}: {steps[currentStep - 1].title}
        </h2>
        <p className="text-emerald-600">
          {currentStep === 1 && "Let's start with your basic information"}
          {currentStep === 2 && "Tell us about your health and fitness"}
          {currentStep === 3 && "Share your dietary preferences"}
          {currentStep === 4 && "Ayurvedic constitution assessment"}
          {currentStep === 5 && "What are your health goals?"}
          {currentStep === 6 && "Any additional information"}
        </p>
      </div>
    </div>
  );

  const ArrayInput = ({ field, placeholder, icon: Icon }) => {
    const [inputValue, setInputValue] = useState('');
    
    return (
      <div>
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addArrayItem(field, inputValue);
                  setInputValue('');
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              addArrayItem(field, inputValue);
              setInputValue('');
            }}
            className="px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {formData[field].length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData[field].map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeArrayItem(field, index)}
                  className="ml-2 text-emerald-600 hover:text-emerald-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline w-4 h-4 mr-2" />
          Full Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter your full name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="inline w-4 h-4 mr-2" />
          Email Address *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Phone className="inline w-4 h-4 mr-2" />
          Phone Number *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter your phone number"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline w-4 h-4 mr-2" />
          Age *
        </label>
        <input
          type="number"
          value={formData.age}
          onChange={(e) => updateFormData('age', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter your age"
          min="1"
          max="120"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="inline w-4 h-4 mr-2" />
          Gender *
        </label>
        <select
          value={formData.gender}
          onChange={(e) => updateFormData('gender', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          required
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Briefcase className="inline w-4 h-4 mr-2" />
          Occupation
        </label>
        <input
          type="text"
          value={formData.occupation}
          onChange={(e) => updateFormData('occupation', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter your occupation"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Scale className="inline w-4 h-4 mr-2" />
            Height (cm) *
          </label>
          <input
            type="number"
            value={formData.height}
            onChange={(e) => updateFormData('height', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter height in cm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Scale className="inline w-4 h-4 mr-2" />
            Weight (kg) *
          </label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => updateFormData('weight', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter weight in kg"
            required
          />
        </div>

        <div className="flex flex-col justify-center">
          {calculateBMI() && (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700">
                <strong>BMI:</strong> {calculateBMI()}
              </p>
              <p className="text-sm text-emerald-700">
                <strong>BMR:</strong> {calculateBMR()} cal/day
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Activity className="inline w-4 h-4 mr-2" />
          Activity Level *
        </label>
        <select
          value={formData.activityLevel}
          onChange={(e) => updateFormData('activityLevel', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          required
        >
          <option value="">Select activity level</option>
          <option value="sedentary">Sedentary (little or no exercise)</option>
          <option value="light">Light (light exercise 1-3 days/week)</option>
          <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
          <option value="active">Active (heavy exercise 6-7 days/week)</option>
          <option value="very_active">Very Active (very heavy exercise, physical job)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Heart className="inline w-4 h-4 mr-2" />
          Health Conditions
        </label>
        <ArrayInput
          field="healthConditions"
          placeholder="Add health condition (e.g., diabetes, hypertension)"
          icon={Heart}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Allergies
        </label>
        <ArrayInput
          field="allergies"
          placeholder="Add allergy (e.g., nuts, dairy, gluten)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Current Medications
        </label>
        <ArrayInput
          field="currentMedications"
          placeholder="Add medication name"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Apple className="inline w-4 h-4 mr-2" />
            Diet Type *
          </label>
          <select
            value={formData.dietType}
            onChange={(e) => updateFormData('dietType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          >
            <option value="">Select diet type</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="non_vegetarian">Non-Vegetarian</option>
            <option value="jain">Jain</option>
            <option value="eggetarian">Eggetarian</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Utensils className="inline w-4 h-4 mr-2" />
            Meals Per Day *
          </label>
          <select
            value={formData.mealsPerDay}
            onChange={(e) => updateFormData('mealsPerDay', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          >
            <option value="">Select meals per day</option>
            <option value="3">3 meals</option>
            <option value="4">4 meals</option>
            <option value="5">5 meals</option>
            <option value="6">6 meals</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Droplets className="inline w-4 h-4 mr-2" />
            Water Intake (L/day) *
          </label>
          <input
            type="number"
            value={formData.waterIntake}
            onChange={(e) => updateFormData('waterIntake', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter daily water intake"
            step="0.1"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alcohol Consumption
          </label>
          <select
            value={formData.alcoholConsumption}
            onChange={(e) => updateFormData('alcoholConsumption', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select frequency</option>
            <option value="never">Never</option>
            <option value="occasionally">Occasionally</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Smoking Habits
        </label>
        <select
          value={formData.smokingHabits}
          onChange={(e) => updateFormData('smokingHabits', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Select smoking habits</option>
          <option value="never">Never smoked</option>
          <option value="former">Former smoker</option>
          <option value="light">Light smoker (1-5 cigarettes/day)</option>
          <option value="moderate">Moderate smoker (6-15 cigarettes/day)</option>
          <option value="heavy">Heavy smoker (16+ cigarettes/day)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Food Preferences
        </label>
        <ArrayInput
          field="foodPreferences"
          placeholder="Add food preference (e.g., spicy, sweet, low-salt)"
          icon={Apple}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
        <h3 className="text-lg font-semibold text-orange-800 mb-2">🕉️ Ayurvedic Constitution Assessment</h3>
        <p className="text-orange-600 text-sm">
          This information helps us create a personalized diet plan based on Ayurvedic principles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Brain className="inline w-4 h-4 mr-2" />
            Dosha Type
          </label>
          <select
            value={formData.doshaType}
            onChange={(e) => updateFormData('doshaType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select your dosha (if known)</option>
            <option value="vata">Vata (Air & Space)</option>
            <option value="pitta">Pitta (Fire & Water)</option>
            <option value="kapha">Kapha (Earth & Water)</option>
            <option value="vata_pitta">Vata-Pitta</option>
            <option value="pitta_kapha">Pitta-Kapha</option>
            <option value="vata_kapha">Vata-Kapha</option>
            <option value="tridoshic">Tridoshic (balanced)</option>
            <option value="unknown">Don't know</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digestive Health
          </label>
          <select
            value={formData.digestiveHealth}
            onChange={(e) => updateFormData('digestiveHealth', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select digestive health</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="average">Average</option>
            <option value="poor">Poor</option>
            <option value="irregular">Irregular</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Moon className="inline w-4 h-4 mr-2" />
            Sleep Pattern
          </label>
          <select
            value={formData.sleepPattern}
            onChange={(e) => updateFormData('sleepPattern', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select sleep pattern</option>
            <option value="early_riser">Early riser (before 6 AM)</option>
            <option value="normal">Normal (6-7 AM)</option>
            <option value="late_riser">Late riser (after 8 AM)</option>
            <option value="irregular">Irregular schedule</option>
            <option value="night_owl">Night owl</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stress Level
          </label>
          <select
            value={formData.stressLevel}
            onChange={(e) => updateFormData('stressLevel', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select stress level</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Energy Levels
          </label>
          <select
            value={formData.energyLevels}
            onChange={(e) => updateFormData('energyLevels', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select energy levels</option>
            <option value="very_high">Very High</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
            <option value="very_low">Very Low</option>
            <option value="fluctuating">Fluctuating</option>
          </select>
        </div>

        {formData.gender === 'female' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menstrual Cycle
            </label>
            <select
              value={formData.menstrualCycle}
              onChange={(e) => updateFormData('menstrualCycle', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select cycle pattern</option>
              <option value="regular">Regular (28-32 days)</option>
              <option value="irregular">Irregular</option>
              <option value="heavy">Heavy flow</option>
              <option value="light">Light flow</option>
              <option value="painful">Painful periods</option>
              <option value="menopause">Menopause</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="inline w-4 h-4 mr-2" />
            Target Weight (kg)
          </label>
          <input
            type="number"
            value={formData.targetWeight}
            onChange={(e) => updateFormData('targetWeight', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter target weight"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline w-4 h-4 mr-2" />
            Timeframe
          </label>
          <select
            value={formData.timeframe}
            onChange={(e) => updateFormData('timeframe', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select timeframe</option>
            <option value="1_month">1 month</option>
            <option value="3_months">3 months</option>
            <option value="6_months">6 months</option>
            <option value="1_year">1 year</option>
            <option value="long_term">Long-term (lifestyle change)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-2" />
            Budget Range (monthly)
          </label>
          <select
            value={formData.budgetRange}
            onChange={(e) => updateFormData('budgetRange', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select budget range</option>
            <option value="under_3000">Under ₹3,000</option>
            <option value="3000_5000">₹3,000 - ₹5,000</option>
            <option value="5000_10000">₹5,000 - ₹10,000</option>
            <option value="10000_20000">₹10,000 - ₹20,000</option>
            <option value="above_20000">Above ₹20,000</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ChefHat className="inline w-4 h-4 mr-2" />
            Cooking Time Available
          </label>
          <select
            value={formData.cookingTime}
            onChange={(e) => updateFormData('cookingTime', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select cooking time</option>
            <option value="minimal">Minimal (under 30 mins/day)</option>
            <option value="moderate">Moderate (30-60 mins/day)</option>
            <option value="extensive">Extensive (1-2 hours/day)</option>
            <option value="love_cooking">I love cooking (flexible time)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Target className="inline w-4 h-4 mr-2" />
          Health Goals
        </label>
        <ArrayInput
          field="healthGoals"
          placeholder="Add health goal (e.g., weight loss, muscle gain, better digestion)"
          icon={Target}
        />
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 mr-2" />
          Previous Diets Tried
        </label>
        <textarea
          value={formData.previousDiets}
          onChange={(e) => updateFormData('previousDiets', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={4}
          placeholder="Describe any previous diets you've tried and their results..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supplements & Vitamins
        </label>
        <textarea
          value={formData.supplements}
          onChange={(e) => updateFormData('supplements', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="List any supplements or vitamins you currently take..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Activity className="inline w-4 h-4 mr-2" />
          Exercise Routine
        </label>
        <textarea
          value={formData.exerciseRoutine}
          onChange={(e) => updateFormData('exerciseRoutine', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="Describe your current exercise routine..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={formData.additionalNotes}
          onChange={(e) => updateFormData('additionalNotes', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={4}
          placeholder="Any additional information you'd like to share..."
        />
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
        <h3 className="text-lg font-semibold text-emerald-800 mb-3">📋 Registration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Age:</strong> {formData.age} years</p>
            <p><strong>Gender:</strong> {formData.gender}</p>
            {calculateBMI() && <p><strong>BMI:</strong> {calculateBMI()}</p>}
          </div>
          <div>
            <p><strong>Diet Type:</strong> {formData.dietType}</p>
            <p><strong>Activity Level:</strong> {formData.activityLevel}</p>
            <p><strong>Dosha:</strong> {formData.doshaType || 'To be determined'}</p>
            {formData.healthGoals.length > 0 && (
              <p><strong>Goals:</strong> {formData.healthGoals.slice(0, 2).join(', ')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 px-6 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-xl font-bold text-emerald-800">NutriVeda</h1>
          </div>
          <div className="flex space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
              backendStatus === 'connected' ? 'bg-green-100 text-green-800' :
              backendStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' ? 'bg-green-500' :
                backendStatus === 'error' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`}></div>
              <span>
                {backendStatus === 'connected' ? 'Backend Connected' :
                 backendStatus === 'error' ? 'Backend Error' :
                 'Checking Backend...'}
              </span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/diet-plan-generator')}
              className="px-4 py-2 text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              Diet Plans
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-emerald-800 mb-4">
              🌿 NutriVeda Patient Registration
            </h1>
            <p className="text-emerald-600 text-lg">
              Complete your profile to get personalized Ayurvedic nutrition guidance
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-8">
            {renderStepIndicator()}

            {/* Form Content */}
            <div className="mb-8">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
              {currentStep === 6 && renderStep6()}
            </div>

            {/* Status Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                submissionStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                submissionStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {message}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>

              {currentStep === 6 ? (
                <button
                  type="button"
                  onClick={submitForm}
                  disabled={isSubmitting || !formData.name || !formData.email}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete Registration
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && (!formData.name || !formData.email || !formData.phone || !formData.age || !formData.gender)) ||
                    (currentStep === 2 && (!formData.height || !formData.weight || !formData.activityLevel)) ||
                    (currentStep === 3 && (!formData.dietType || !formData.mealsPerDay || !formData.waterIntake))
                  }
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
