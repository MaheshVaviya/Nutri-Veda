import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Brain, Download, Edit, Save, Eye, RefreshCw, 
  Clock, Utensils, 
  ChevronDown, ChevronUp, Calendar, FileText
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

const DietPlanGenerator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientId = searchParams.get('patientId');
  const patientName = searchParams.get('name');

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dietPlan, setDietPlan] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedDays, setExpandedDays] = useState(new Set([1])); // Day 1 expanded by default
  const [availablePatients, setAvailablePatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Fetch available patients when no patient is selected
  useEffect(() => {
    const fetchAvailablePatients = async () => {
      if (patientId) return; // Don't fetch if patient is already selected
      
      setLoadingPatients(true);
      try {
        const response = await fetch(`${API_BASE}/patients`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setAvailablePatients(result.data);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchAvailablePatients();
  }, [patientId]);

  useEffect(() => {
    const fetchExistingDietChart = async () => {
      if (!patientId) return;
      
      try {
        const response = await fetch(`${API_BASE}/ai-diet/patient/${patientId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setDietPlan(result.data);
          setMessage('✅ Existing diet plan loaded successfully');
        } else {
          setMessage('No existing diet plan found. Generate a new one.');
        }
      } catch (error) {
        console.error('Error fetching existing diet chart:', error);
        setMessage('No existing diet plan found. Generate a new one.');
      }
    };

    fetchExistingDietChart();
  }, [patientId]);

  const generateAIDietPlan = async () => {
    if (!patientId) {
      setMessage('❌ Patient ID is required to generate diet plan');
      return;
    }

    setGenerating(true);
    setMessage('🤖 AI is creating your personalized diet plan...');

    try {
      const response = await fetch(`${API_BASE}/ai-diet/generate/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdBy: 'Dr. Practitioner'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setDietPlan(result.data.dietChart);
        setMessage('✅ AI diet plan generated successfully! You can now review and edit it.');
        setEditMode(true);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error generating diet plan: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const saveDietPlan = async () => {
    setSaving(true);
    setMessage('💾 Saving diet plan...');

    try {
      const response = await fetch(`${API_BASE}/ai-diet/save/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dietPlan: dietPlan.dietPlan,
          status: 'approved'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ Diet plan saved successfully!');
        setEditMode(false);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error saving diet plan: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    setLoading(true);
    setMessage('📋 Generating PDF...');

    try {
      const response = await fetch(`${API_BASE}/pdf/generate/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ PDF generated successfully!');
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = `http://localhost:5000${result.data.downloadUrl}`;
        downloadLink.download = result.data.fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error generating PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleDayExpansion = (dayNumber) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber);
    } else {
      newExpanded.add(dayNumber);
    }
    setExpandedDays(newExpanded);
  };

  const updateMealItem = (dayIndex, mealType, itemIndex, newValue) => {
    if (!editMode) return;
    
    const updatedPlan = { ...dietPlan };
    updatedPlan.dietPlan.days[dayIndex].meals[mealType].items[itemIndex] = newValue;
    setDietPlan(updatedPlan);
  };

  const addMealItem = (dayIndex, mealType) => {
    if (!editMode) return;
    
    const updatedPlan = { ...dietPlan };
    updatedPlan.dietPlan.days[dayIndex].meals[mealType].items.push('New item');
    setDietPlan(updatedPlan);
  };

  const removeMealItem = (dayIndex, mealType, itemIndex) => {
    if (!editMode) return;
    
    const updatedPlan = { ...dietPlan };
    updatedPlan.dietPlan.days[dayIndex].meals[mealType].items.splice(itemIndex, 1);
    setDietPlan(updatedPlan);
  };

  if (!patientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Select a Patient</h2>
          <p className="text-gray-600 mb-8 text-center">Choose a patient to generate their personalized diet plan.</p>
          
          {loadingPatients ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-2 text-gray-600">Loading patients...</p>
            </div>
          ) : availablePatients.length === 0 ? (
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">No Patients Found</h3>
              <p className="text-gray-600 mb-6">Start by registering your first patient.</p>
              <button
                onClick={() => navigate('/patients/register')}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Register New Patient
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availablePatients.map((patient) => (
                <div key={patient.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-500">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{patient.name}</h3>
                    <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      {patient.dosha || 'Unknown'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><strong>Age:</strong> {patient.age} years</p>
                    <p><strong>Gender:</strong> {patient.gender}</p>
                    {patient.bmi && <p><strong>BMI:</strong> {patient.bmi}</p>}
                    {patient.condition && patient.condition.length > 0 && (
                      <p><strong>Conditions:</strong> {patient.condition.join(', ')}</p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/diet-plans?patientId=${patient.id}&name=${encodeURIComponent(patient.name)}`)}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Generate Diet Plan
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors mr-4"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/patients/register')}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Register New Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-8 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-4xl font-bold text-orange-800 mb-2">
                  🍽️ AI Diet Plan Generator
                </h1>
                <p className="text-orange-600 text-lg">
                  Personalized Ayurvedic nutrition plan for{' '}
                  <span className="font-semibold text-orange-800">{patientName}</span>
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {!dietPlan && (
                  <button
                    onClick={generateAIDietPlan}
                    disabled={generating}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        Generate AI Diet Plan
                      </>
                    )}
                  </button>
                )}

                {dietPlan && (
                  <>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        editMode
                          ? 'bg-gray-500 text-white hover:bg-gray-600'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {editMode ? (
                        <>
                          <Eye className="w-5 h-5" />
                          View Mode
                        </>
                      ) : (
                        <>
                          <Edit className="w-5 h-5" />
                          Edit Mode
                        </>
                      )}
                    </button>

                    {editMode && (
                      <button
                        onClick={saveDietPlan}
                        disabled={saving}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Save Changes
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={downloadPDF}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Download PDF
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg ${
                message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 
                message.includes('🤖') || message.includes('💾') || message.includes('📋') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Diet Plan Display */}
          {dietPlan && dietPlan.dietPlan && (
            <div className="space-y-6">
              {/* General Guidelines */}
              {dietPlan.dietPlan.general_guidelines && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-6">
                  <h2 className="text-2xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    General Guidelines
                  </h2>
                  <ul className="space-y-2">
                    {dietPlan.dietPlan.general_guidelines.map((guideline, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ayurvedic Tips */}
              {dietPlan.dietPlan.ayurvedic_tips && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl shadow-lg border border-emerald-200 p-6">
                  <h2 className="text-2xl font-bold text-emerald-800 mb-4">
                    🌿 Ayurvedic Tips
                  </h2>
                  <ul className="space-y-2">
                    {dietPlan.dietPlan.ayurvedic_tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-emerald-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 14-Day Meal Plan */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-6">
                <h2 className="text-2xl font-bold text-orange-800 mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  14-Day Meal Plan
                </h2>

                <div className="space-y-4">
                  {dietPlan.dietPlan.days && dietPlan.dietPlan.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="border border-orange-200 rounded-xl overflow-hidden">
                      {/* Day Header */}
                      <div 
                        className="bg-gradient-to-r from-orange-100 to-red-100 p-4 cursor-pointer hover:from-orange-200 hover:to-red-200 transition-colors"
                        onClick={() => toggleDayExpansion(day.day)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-bold text-orange-800">
                              Day {day.day} - {day.date || `Day ${day.day}`}
                            </h3>
                            {day.total_calories && (
                              <p className="text-orange-600 text-sm">
                                Total Calories: {day.total_calories} | {day.dosha_balance}
                              </p>
                            )}
                          </div>
                          {expandedDays.has(day.day) ? (
                            <ChevronUp className="w-5 h-5 text-orange-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                      </div>

                      {/* Day Content */}
                      {expandedDays.has(day.day) && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
                            {/* Breakfast */}
                            {day.meals.breakfast && (
                              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                  <Utensils className="w-4 h-4" />
                                  Breakfast
                                </h4>
                                <p className="text-xs text-yellow-600 mb-2">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {day.meals.breakfast.timing}
                                </p>
                                <ul className="space-y-1">
                                  {day.meals.breakfast.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="text-sm">
                                      {editMode ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateMealItem(dayIndex, 'breakfast', itemIndex, e.target.value)}
                                            className="flex-1 px-2 py-1 text-xs border border-yellow-300 rounded"
                                          />
                                          <button
                                            onClick={() => removeMealItem(dayIndex, 'breakfast', itemIndex)}
                                            className="text-red-500 text-xs hover:text-red-700"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <span>• {item}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                {editMode && (
                                  <button
                                    onClick={() => addMealItem(dayIndex, 'breakfast')}
                                    className="text-xs text-yellow-600 hover:text-yellow-800 mt-2"
                                  >
                                    + Add item
                                  </button>
                                )}
                                <p className="text-xs text-yellow-600 mt-2 font-medium">
                                  {day.meals.breakfast.calories} cal
                                </p>
                                {day.meals.breakfast.ayurvedic_notes && (
                                  <p className="text-xs text-yellow-700 mt-1 italic">
                                    {day.meals.breakfast.ayurvedic_notes}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Morning Snack */}
                            {day.meals.morning_snack && (
                              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <h4 className="font-bold text-green-800 mb-2">Morning Snack</h4>
                                <p className="text-xs text-green-600 mb-2">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {day.meals.morning_snack.timing}
                                </p>
                                <ul className="space-y-1">
                                  {day.meals.morning_snack.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="text-sm">
                                      {editMode ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateMealItem(dayIndex, 'morning_snack', itemIndex, e.target.value)}
                                            className="flex-1 px-2 py-1 text-xs border border-green-300 rounded"
                                          />
                                          <button
                                            onClick={() => removeMealItem(dayIndex, 'morning_snack', itemIndex)}
                                            className="text-red-500 text-xs hover:text-red-700"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <span>• {item}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                {editMode && (
                                  <button
                                    onClick={() => addMealItem(dayIndex, 'morning_snack')}
                                    className="text-xs text-green-600 hover:text-green-800 mt-2"
                                  >
                                    + Add item
                                  </button>
                                )}
                                <p className="text-xs text-green-600 mt-2 font-medium">
                                  {day.meals.morning_snack.calories} cal
                                </p>
                              </div>
                            )}

                            {/* Lunch */}
                            {day.meals.lunch && (
                              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                                  <Utensils className="w-4 h-4" />
                                  Lunch
                                </h4>
                                <p className="text-xs text-orange-600 mb-2">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {day.meals.lunch.timing}
                                </p>
                                <ul className="space-y-1">
                                  {day.meals.lunch.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="text-sm">
                                      {editMode ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateMealItem(dayIndex, 'lunch', itemIndex, e.target.value)}
                                            className="flex-1 px-2 py-1 text-xs border border-orange-300 rounded"
                                          />
                                          <button
                                            onClick={() => removeMealItem(dayIndex, 'lunch', itemIndex)}
                                            className="text-red-500 text-xs hover:text-red-700"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <span>• {item}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                {editMode && (
                                  <button
                                    onClick={() => addMealItem(dayIndex, 'lunch')}
                                    className="text-xs text-orange-600 hover:text-orange-800 mt-2"
                                  >
                                    + Add item
                                  </button>
                                )}
                                <p className="text-xs text-orange-600 mt-2 font-medium">
                                  {day.meals.lunch.calories} cal
                                </p>
                                {day.meals.lunch.ayurvedic_notes && (
                                  <p className="text-xs text-orange-700 mt-1 italic">
                                    {day.meals.lunch.ayurvedic_notes}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Evening Snack */}
                            {day.meals.evening_snack && (
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h4 className="font-bold text-blue-800 mb-2">Evening Snack</h4>
                                <p className="text-xs text-blue-600 mb-2">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {day.meals.evening_snack.timing}
                                </p>
                                <ul className="space-y-1">
                                  {day.meals.evening_snack.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="text-sm">
                                      {editMode ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateMealItem(dayIndex, 'evening_snack', itemIndex, e.target.value)}
                                            className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded"
                                          />
                                          <button
                                            onClick={() => removeMealItem(dayIndex, 'evening_snack', itemIndex)}
                                            className="text-red-500 text-xs hover:text-red-700"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <span>• {item}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                {editMode && (
                                  <button
                                    onClick={() => addMealItem(dayIndex, 'evening_snack')}
                                    className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                                  >
                                    + Add item
                                  </button>
                                )}
                                <p className="text-xs text-blue-600 mt-2 font-medium">
                                  {day.meals.evening_snack.calories} cal
                                </p>
                              </div>
                            )}

                            {/* Dinner */}
                            {day.meals.dinner && (
                              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                                  <Utensils className="w-4 h-4" />
                                  Dinner
                                </h4>
                                <p className="text-xs text-purple-600 mb-2">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {day.meals.dinner.timing}
                                </p>
                                <ul className="space-y-1">
                                  {day.meals.dinner.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="text-sm">
                                      {editMode ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateMealItem(dayIndex, 'dinner', itemIndex, e.target.value)}
                                            className="flex-1 px-2 py-1 text-xs border border-purple-300 rounded"
                                          />
                                          <button
                                            onClick={() => removeMealItem(dayIndex, 'dinner', itemIndex)}
                                            className="text-red-500 text-xs hover:text-red-700"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <span>• {item}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                {editMode && (
                                  <button
                                    onClick={() => addMealItem(dayIndex, 'dinner')}
                                    className="text-xs text-purple-600 hover:text-purple-800 mt-2"
                                  >
                                    + Add item
                                  </button>
                                )}
                                <p className="text-xs text-purple-600 mt-2 font-medium">
                                  {day.meals.dinner.calories} cal
                                </p>
                                {day.meals.dinner.ayurvedic_notes && (
                                  <p className="text-xs text-purple-700 mt-1 italic">
                                    {day.meals.dinner.ayurvedic_notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!dietPlan && !generating && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-12 text-center">
              <div className="max-w-md mx-auto">
                <Brain className="w-16 h-16 text-orange-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Ready to Generate AI Diet Plan
                </h2>
                <p className="text-gray-600 mb-8">
                  Our AI will create a personalized 14-day Ayurvedic diet plan based on the patient's health profile, dosha constitution, and dietary preferences.
                </p>
                <button
                  onClick={generateAIDietPlan}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  <Brain className="w-5 h-5" />
                  Generate AI Diet Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DietPlanGenerator;
