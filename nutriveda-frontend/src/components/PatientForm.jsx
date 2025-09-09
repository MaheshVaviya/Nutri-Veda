import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Calendar, Scale, Ruler, Activity } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

const PatientForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    age: '',
    gender: '',
    phone: '',
    
    // Step 2: Contact Info
    email: '',
    address: '',
    region: 'General',
    
    // Step 3: Health Profile
    dosha: '',
    dietary_habits: 'vegetarian',
    height: '',
    weight: '',
    weight_goal: 'weight_maintenance',
    allergies: [],
    condition: [],
    
    // Step 4: Health Metrics
    digestion: '',
    water_intake: '',
    activity_level: '',
    sleep_pattern: '',
    
    // Step 5: Lifestyle
    stress_level: '',
    work_type: '',
    cuisine_preference: '',
    
    // Step 6: Final
    clinical_notes: '',
    created_by: 'Dr. Practitioner'
  });

  const calculateBMI = () => {
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    const age = parseFloat(formData.age);
    
    if (height && weight) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      
      let bmr = null;
      if (age && formData.gender) {
        if (formData.gender === 'male') {
          bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
        } else if (formData.gender === 'female') {
          bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161);
        }
      }
      
      return { bmi, bmr };
    }
    return { bmi: null, bmr: null };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          [name]: [...(prev[name] || []), value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: (prev[name] || []).filter(item => item !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const submitStep = async (stepNumber) => {
    setLoading(true);
    setMessage('');
    
    try {
      let endpoint = '';
      let payload = {};
      
      switch (stepNumber) {
        case 1:
          endpoint = '/patient-registration/register/step1';
          payload = {
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            phone: formData.phone
          };
          break;
        case 2:
          endpoint = '/patient-registration/register/step2';
          payload = {
            sessionId,
            email: formData.email,
            address: formData.address,
            region: formData.region
          };
          break;
        case 3:
          const { bmi, bmr } = calculateBMI();
          endpoint = '/patient-registration/register/step3';
          payload = {
            sessionId,
            dosha: formData.dosha || '', // Make dosha optional
            dietary_habits: formData.dietary_habits,
            height: parseFloat(formData.height),
            weight: parseFloat(formData.weight),
            weight_goal: formData.weight_goal,
            allergies: formData.allergies,
            condition: formData.condition,
            bmi: parseFloat(bmi) || 0,
            bmr: bmr || 0
          };
          break;
        case 4:
          endpoint = '/patient-registration/register/step4';
          payload = {
            sessionId,
            digestion: formData.digestion,
            water_intake: formData.water_intake,
            activity_level: formData.activity_level,
            sleep_pattern: formData.sleep_pattern
          };
          break;
        case 5:
          endpoint = '/patient-registration/register/step5';
          payload = {
            sessionId,
            stress_level: formData.stress_level,
            work_type: formData.work_type,
            cuisine_preference: formData.cuisine_preference
          };
          break;
        case 6:
          endpoint = '/patient-registration/register/step6';
          payload = {
            sessionId,
            clinical_notes: formData.clinical_notes,
            created_by: formData.created_by
          };
          break;
        default:
          console.error('Invalid step number:', stepNumber);
          setMessage('❌ Invalid step number');
          setLoading(false);
          return;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        if (stepNumber === 1) {
          setSessionId(result.sessionId);
        }
        
        if (stepNumber === 6) {
          // Registration complete - navigate to diet plan generation
          setMessage('✅ Registration completed! Redirecting to diet plan generation...');
          setTimeout(() => {
            navigate(`/diet-plans?patientId=${result.data.patient.id}&name=${result.data.patient.name}`);
          }, 2000);
        } else {
          setMessage(`✅ ${result.message}`);
          setCurrentStep(stepNumber + 1);
        }
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    submitStep(currentStep);
  };

  const handleBack = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Basic Information',
      2: 'Contact Details',
      3: 'Health Profile',
      4: 'Health Metrics',
      5: 'Lifestyle',
      6: 'Complete Registration'
    };
    return titles[currentStep];
  };

  const progress = (currentStep / 6) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-emerald-800 mb-2">🌿 Patient Registration</h1>
            <p className="text-emerald-600">Complete your Ayurvedic consultation profile</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-emerald-700">Step {currentStep} of 6</span>
              <span className="text-sm font-medium text-emerald-700">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-lg font-semibold text-emerald-800">{getStepTitle()}</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-8">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <User className="inline w-4 h-4 mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Age *
                    </label>
                    <input
                      type="number"
                      name="age"
                      required
                      min="1"
                      max="120"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="Age in years"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      required
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="inline w-4 h-4 mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91-XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Region
                    </label>
                    <select
                      name="region"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.region}
                      onChange={handleInputChange}
                    >
                      <option value="General">General</option>
                      <option value="North India">North India</option>
                      <option value="South India">South India</option>
                      <option value="East India">East India</option>
                      <option value="West India">West India</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      rows="3"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your complete address"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Health Profile */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dosha Constitution (Optional)
                    </label>
                    <select
                      name="dosha"
                      required
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.dosha}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Dosha</option>
                      <option value="vata">Vata (Air + Space)</option>
                      <option value="pitta">Pitta (Fire + Water)</option>
                      <option value="kapha">Kapha (Earth + Water)</option>
                      <option value="vata-pitta">Vata-Pitta</option>
                      <option value="pitta-kapha">Pitta-Kapha</option>
                      <option value="vata-kapha">Vata-Kapha</option>
                      <option value="tridoshic">Tridoshic (Balanced)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dietary Preference
                    </label>
                    <select
                      name="dietary_habits"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.dietary_habits}
                      onChange={handleInputChange}
                    >
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="eggs">Vegetarian + Eggs</option>
                      <option value="non-vegetarian">Non-Vegetarian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Ruler className="inline w-4 h-4 mr-2" />
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="Height in cm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Scale className="inline w-4 h-4 mr-2" />
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="Weight in kg"
                    />
                  </div>

                  {formData.height && formData.weight && (
                    <div className="md:col-span-2 p-4 bg-emerald-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <span className="text-2xl font-bold text-emerald-600">{calculateBMI().bmi}</span>
                          <p className="text-sm text-emerald-700">BMI</p>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-emerald-600">{calculateBMI().bmr}</span>
                          <p className="text-sm text-emerald-700">BMR (cal/day)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Health Metrics */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Digestion Quality
                    </label>
                    <select
                      name="digestion"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.digestion}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Digestion</option>
                      <option value="strong">Strong (Quick & Complete)</option>
                      <option value="regular">Regular (Normal)</option>
                      <option value="weak">Weak (Slow/Incomplete)</option>
                      <option value="irregular">Irregular (Variable)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Daily Water Intake (Liters)
                    </label>
                    <select
                      name="water_intake"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.water_intake}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Water Intake</option>
                      <option value="less_than_1">Less than 1L</option>
                      <option value="1_to_2">1-2 Liters</option>
                      <option value="2_to_3">2-3 Liters</option>
                      <option value="more_than_3">More than 3L</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Activity className="inline w-4 h-4 mr-2" />
                      Activity Level
                    </label>
                    <select
                      name="activity_level"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.activity_level}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Activity Level</option>
                      <option value="sedentary">Sedentary (Little exercise)</option>
                      <option value="light">Light (Light exercise 1-3 days/week)</option>
                      <option value="moderate">Moderate (Moderate exercise 3-5 days/week)</option>
                      <option value="active">Active (Hard exercise 6-7 days/week)</option>
                      <option value="very_active">Very Active (Physical job + exercise)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sleep Pattern
                    </label>
                    <select
                      name="sleep_pattern"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.sleep_pattern}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Sleep Pattern</option>
                      <option value="regular">Regular (7-8h, consistent schedule)</option>
                      <option value="irregular">Irregular (Inconsistent timing)</option>
                      <option value="early_riser">Early Riser (Sleep/wake early)</option>
                      <option value="night_owl">Night Owl (Sleep/wake late)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Lifestyle */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stress Level
                    </label>
                    <select
                      name="stress_level"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.stress_level}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Stress Level</option>
                      <option value="low">Low (Calm & Relaxed)</option>
                      <option value="moderate">Moderate (Occasional Stress)</option>
                      <option value="high">High (Frequent Stress)</option>
                      <option value="very_high">Very High (Chronic Stress)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Work Type
                    </label>
                    <select
                      name="work_type"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.work_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Work Type</option>
                      <option value="physical">Physical (Active/Manual)</option>
                      <option value="desk">Desk Job (Sedentary)</option>
                      <option value="mixed">Mixed (Sitting & Standing)</option>
                      <option value="outdoor">Outdoor (Field work)</option>
                      <option value="creative">Creative (Design/Art)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cuisine Preference
                    </label>
                    <select
                      name="cuisine_preference"
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      value={formData.cuisine_preference}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Cuisine Preference</option>
                      <option value="north_indian">North Indian</option>
                      <option value="south_indian">South Indian</option>
                      <option value="gujarati">Gujarati</option>
                      <option value="maharashtrian">Maharashtrian</option>
                      <option value="bengali">Bengali</option>
                      <option value="punjabi">Punjabi</option>
                      <option value="rajasthani">Rajasthani</option>
                      <option value="kerala">Kerala</option>
                      <option value="mixed_indian">Mixed Indian</option>
                      <option value="continental">Continental</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Final */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Clinical Notes (Optional)
                  </label>
                  <textarea
                    name="clinical_notes"
                    rows="4"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    value={formData.clinical_notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes or specific health concerns..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Practitioner ID
                  </label>
                  <input
                    type="text"
                    name="created_by"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    value={formData.created_by}
                    onChange={handleInputChange}
                    placeholder="Practitioner/Doctor ID"
                  />
                </div>

                <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                  <h3 className="font-semibold text-emerald-800 mb-3">Registration Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {formData.name}</div>
                    <div><strong>Age:</strong> {formData.age} years</div>
                    <div><strong>Dosha:</strong> {formData.dosha}</div>
                    <div><strong>Diet:</strong> {formData.dietary_habits}</div>
                    {formData.height && formData.weight && (
                      <>
                        <div><strong>BMI:</strong> {calculateBMI().bmi}</div>
                        <div><strong>BMR:</strong> {calculateBMI().bmr} cal/day</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg ${
                message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  currentStep === 6 ? 'Complete Registration →' : 'Next Step →'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
