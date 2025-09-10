import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Brain, FileText, Plus, Activity } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Patient Registration',
      description: 'Register new patients with their health profiles and dosha assessment',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      path: '/patients/register'
    },
    {
      title: 'AI Diet Plan Generator', 
      description: 'Generate personalized 14-day Ayurvedic diet plans using AI',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      path: '/diet-plans'
    },
    {
      title: 'Diet Plans',
      description: 'View, edit and manage existing diet plans',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      path: '/diet-plan-generator'
    },
    {
      title: 'Health Analytics',
      description: 'Track patient progress and health metrics',
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      path: '/analytics'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-4">
              🌿 NutriVeda Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Personalized Ayurvedic Nutrition Platform - Combining ancient wisdom with modern AI technology
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-orange-600">0</p>
                </div>
                <Users className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">AI Diet Plans</p>
                  <p className="text-3xl font-bold text-purple-600">0</p>
                </div>
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Plans</p>
                  <p className="text-3xl font-bold text-green-600">0</p>
                </div>
                <FileText className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-blue-600">--</p>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
                  onClick={() => navigate(feature.path)}
                >
                  <div className="flex items-start gap-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-orange-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="mt-4">
                        <span className="inline-flex items-center text-orange-600 font-medium group-hover:text-orange-700">
                          Get Started 
                          <Plus className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Getting Started Section */}
          <div className="mt-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-8 border border-orange-200">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-orange-800 mb-4">
                Getting Started with NutriVeda
              </h2>
              <p className="text-orange-700 mb-8 max-w-2xl mx-auto">
                Begin your journey with personalized Ayurvedic nutrition. Register your first patient and generate their AI-powered diet plan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/patients/register')}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  Register First Patient
                </button>
                <button
                  onClick={() => navigate('/diet-plans')}
                  className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all border-2 border-orange-200 hover:border-orange-300"
                >
                  Explore Diet Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;