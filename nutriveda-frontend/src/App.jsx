import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientForm from './pages/PatientForm';
import DietPlanGenerator from './pages/DietPlanGenerator';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PatientForm />} />
          <Route path="/patient-registration" element={<PatientForm />} />
          <Route path="/diet-plan-generator" element={<DietPlanGenerator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
