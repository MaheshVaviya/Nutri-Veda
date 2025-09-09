import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientForm from './components/PatientForm';
import DietPlanGenerator from './pages/DietPlanGenerator';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients/register" element={<PatientForm />} />
          <Route path="/patient-registration" element={<PatientForm />} />
          <Route path="/diet-plans" element={<DietPlanGenerator />} />
          <Route path="/diet-plan-generator" element={<DietPlanGenerator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;