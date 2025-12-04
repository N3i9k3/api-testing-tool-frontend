import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  // ---------------- THEME STATE ----------------
  const [theme, setTheme] = useState(
    // Load saved theme from localStorage if available
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    // Add or remove "dark" class on <html>
    document.documentElement.classList.toggle("dark", theme === "dark");

    // Persist theme
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* THEME TOGGLE BUTTON */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all duration-200"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      {/* ROUTER */}
      <Router>
        <Routes>
          {/* Default route */}
          <Route path="/" element={<Navigate to="/signup" />} />

          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;


