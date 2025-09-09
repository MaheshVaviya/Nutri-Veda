import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientForm from './pages/PatientForm';
import DietPlanGenerator from './pages/DietPlanGenerator';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PatientForm />} />
          <Route path="/patient-registration" element={<PatientForm />} />
          <Route path="/diet-plan-generator" element={<DietPlanGenerator />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;