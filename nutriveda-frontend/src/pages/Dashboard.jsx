// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiAlertCircle, 
  FiPlus, 
  FiSearch,
  FiCalendar,
  FiUserPlus,
  FiCheckSquare,
  FiChevronRight,
  FiRefreshCw
} from 'react-icons/fi';

// --- CUSTOM SVG GAUGE FOR BMI ---
const BmiGauge = ({ value, healthyMin, healthyMax, maxBmi = 40 }) => {
  const radius = 50;
  const circumference = Math.PI * radius;
  const strokeWidth = 10;
  const calculatePercent = (val) => Math.max(0, Math.min(100, (val / maxBmi) * 100));
  const valuePercent = calculatePercent(value);
  const healthyMinPercent = calculatePercent(healthyMin);
  const healthyMaxPercent = calculatePercent(healthyMax);
  const healthyRangePercent = healthyMaxPercent - healthyMinPercent;
  const healthyRangeOffset = circumference - (healthyMaxPercent / 100) * circumference;

  return (
    <div className="relative flex justify-center items-end">
      <svg width="220" height="110" viewBox="0 0 120 65" className="-mt-4">
        <defs>
            <linearGradient id="valueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" /> 
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
        </defs>
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#a7f3d0" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${(healthyRangePercent / 100) * circumference}, ${circumference}`} strokeDashoffset={healthyRangeOffset} />
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="url(#valueGradient)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${(valuePercent / 100) * circumference}, ${circumference}`} style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-4xl font-bold text-emerald-800">{value || '--'}</span>
        <span className="text-sm text-gray-500 -mt-1">Avg. BMI</span>
      </div>
    </div>
  );
};

// --- CUSTOM SVG DONUT CHART FOR DOSHAS ---
const DoshaDonutChart = ({ data, total }) => {
  const radius = 50;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  
  // Color palette
  const colors = {
    pitta: '#f97316', // orange-500
    vata: '#f59e0b',   // amber-500
    kapha: '#0891b2',  // cyan-600
  };

  let accumulatedPercent = 0;

  const segments = ['vata', 'pitta', 'kapha'].map(key => {
    const percent = data[key] ? (data[key] / total) * 100 : 0;
    const dashArray = (percent / 100) * circumference;
    const dashOffset = (accumulatedPercent / 100) * circumference;
    accumulatedPercent += percent;
    
    return {
      key,
      color: colors[key],
      value: data[key] || 0,
      percent: percent.toFixed(0),
      dashArray: `${dashArray} ${circumference - dashArray}`,
      dashOffset: -dashOffset,
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="transform -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
          {segments.map(segment => (
            <circle
              key={segment.key}
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
              className="transition-all duration-500"
            />
          ))}
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
           <span className="text-3xl font-bold text-emerald-900">{total}</span>
           <span className="text-sm text-gray-500 -mt-1">Patients</span>
        </div>
      </div>
      {/* Legend */}
      <div className="space-y-2">
        {segments.map(segment => (
          <div key={segment.key} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
            <span className="text-sm font-medium text-gray-700 capitalize">{segment.key}</span>
            <span className="text-sm text-gray-500">({segment.value} - {segment.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    inactivePatients: 0,
    patientsByDosha: { vata: 0, pitta: 0, kapha: 0 },
    avgBMI: 0,
    specialConditions: 0
  });
  
  const [notifications, setNotifications] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // In a real application, you would fetch from your actual API endpoints
      // For demonstration, I'm using mock data with a delay to simulate API calls
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock API responses
      const dashboardStats = {
        totalPatients: 142,
        activePatients: 118,
        inactivePatients: 24,
        patientsByDosha: { vata: 42, pitta: 56, kapha: 44 },
        avgBMI: 24.3,
        specialConditions: 28
      };
      
      const mockNotifications = [
        { id: 1, type: 'new_patient', message: 'New patient registration: Priya Sharma', time: '2 hours ago' },
        { id: 2, type: 'appointment', message: 'Appointment reminder: Raj Patel at 2:30 PM', time: '5 hours ago' },
        { id: 3, type: 'review', message: 'Diet plan review requested: Anjali Mehta', time: '1 day ago' }
      ];
      
      const mockRecentPatients = [
        { id: 1, name: 'Arun Kumar', dosha: 'Pitta', bmi: 26.2, lastVisit: '3 days ago' },
        { id: 2, name: 'Meera Desai', dosha: 'Vata', bmi: 22.1, lastVisit: '5 days ago' },
        { id: 3, name: 'Sanjay Patel', dosha: 'Kapha', bmi: 28.7, lastVisit: '1 week ago' },
        { id: 4, name: 'Lina Thomas', dosha: 'Pitta', bmi: 23.9, lastVisit: '1 week ago' }
      ];
      
      setStats(dashboardStats);
      setNotifications(mockNotifications);
      setRecentPatients(mockRecentPatients);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalDoshaPatients = stats.patientsByDosha.vata + stats.patientsByDosha.pitta + stats.patientsByDosha.kapha;

  // Notification icons and styles
  const notificationIcons = {
    new_patient: <FiUserPlus className="text-cyan-600" />,
    appointment: <FiCalendar className="text-emerald-500" />,
    review: <FiCheckSquare className="text-amber-500" />,
  };
  
  const notificationIconBg = {
    new_patient: 'bg-cyan-100',
    appointment: 'bg-emerald-100',
    review: 'bg-amber-100',
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-stone-50 items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-emerald-600 text-4xl mx-auto mb-4" />
          <p className="text-stone-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 font-sans">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 bg-stone-50/80 backdrop-blur-sm z-10 p-6 md:p-8 border-b border-stone-200">
          <div className="flex justify-between items-center">
            <div className='flex items-center gap-4'>
              <h2 className="text-3xl font-bold font-serif text-emerald-900">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={fetchDashboardData}
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                title="Refresh data"
              >
                <FiRefreshCw className="text-stone-600" />
              </button>
              <div className="relative hidden sm:block">
                <FiSearch className="absolute left-3.5 top-3 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Search patients..." 
                  className="pl-10 pr-4 py-2.5 w-64 rounded-full border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-900 font-semibold border-2 border-white shadow-sm">
                DT
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Wider Column (Left) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Action Items (Notifications) */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold font-serif text-emerald-900">Action Items</h3>
                  <span className="text-sm font-medium text-emerald-600">{notifications.length} New</span>
                </div>
                <div className="space-y-4">
                  {notifications.map(notification => (
                    <div key={notification.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${notificationIconBg[notification.type]}`}>
                        <span className="text-xl">{notificationIcons[notification.type]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recently Active Patients */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold font-serif text-emerald-900">Recently Active Patients</h3>
                  <button className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-800">
                    View All <FiChevronRight size={16} className="ml-1" />
                  </button>
                </div>
                {/* Horizontal Scroll Container */}
                <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4">
                  {recentPatients.map(patient => (
                    <div key={patient.id} className="flex-shrink-0 w-64 bg-white p-5 rounded-xl shadow-sm border border-stone-100 hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-base font-semibold text-gray-800 group-hover:text-emerald-800">{patient.name}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            patient.dosha === 'Pitta' ? 'bg-orange-100 text-orange-800' :
                            patient.dosha === 'Vata'  ? 'bg-amber-100 text-amber-800'  :
                            'bg-cyan-100 text-cyan-800'
                          }`}>
                          {patient.dosha}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">Last Visit: {patient.lastVisit}</p>
                      <div className="border-t border-stone-100 pt-4 flex justify-between items-center">
                         <span className="text-sm font-medium text-gray-700">BMI: <span className="font-bold text-gray-900">{patient.bmi}</span></span>
                         <span className="text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                           View Profile
                         </span>
                      </div>
                    </div>
                  ))}
                  {/* "Add New" Card */}
                  <div className="flex-shrink-0 w-64 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center text-emerald-700 hover:bg-white hover:border-emerald-400 cursor-pointer transition-all">
                      <div className="text-center">
                        <FiPlus size={24} className="mx-auto mb-2" />
                        <span className="font-semibold">Add New Patient</span>
                      </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Narrow Column (Right) */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Patient Overview */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
                <h3 className="text-lg font-semibold font-serif text-emerald-900 mb-4">Patient Overview</h3>
                <DoshaDonutChart data={stats.patientsByDosha} total={totalDoshaPatients} />
                <hr className="my-5 border-stone-100" />
                <div className="flex space-x-2 justify-center">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">{stats.activePatients} Active</span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-800 text-xs rounded-full font-medium">{stats.inactivePatients} Inactive</span>
                  </div>
              </div>

              {/* Health Metrics */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
                <h3 className="text-lg font-semibold font-serif text-emerald-900 mb-4">Clinic Health</h3>
                <BmiGauge value={stats.avgBMI} healthyMin={18.5} healthyMax={24.9} />
                <p className="text-xs text-gray-500 mt-2 text-center">Healthy range: 18.5 - 24.9</p>

                <hr className="my-5 border-stone-100" />

                {/* Special Conditions Card */}
                <div className='flex items-center justify-between p-4 bg-orange-50 rounded-lg'>
                   <div className='flex items-center space-x-3'>
                      <div className='p-2 bg-orange-100 rounded-full'>
                        <FiAlertCircle className='text-orange-600'/>
                      </div>
                      <span className="text-sm font-medium text-orange-700">Special Conditions</span>
                   </div>
                   <span className="text-2xl font-bold text-orange-700">{stats.specialConditions}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;