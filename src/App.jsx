import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AIDetector from "./Input.jsx";
import FineTuneModel from "./Training.jsx";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/AIDetector" />} />
          <Route path="AIDetector" element={<AIDetector />} />
          <Route path="FineTuneModel" element={<FineTuneModel />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
