import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AIDetector from "./Input.jsx";
import FineTuneModel from "./Training.jsx";

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/AIDetector" element={<AIDetector />} />
          <Route path="/FineTuneModel" element={<FineTuneModel />} />
          <Route path="/" element={<Navigate to="/AIDetector" />} />
        </Routes>
   
      </Router>
  
  );
}

export default App;
