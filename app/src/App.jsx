import React from 'react'
import './App.css'
import { Navigate, Route, Router, Routes } from 'react-router-dom'
import Home from "./components/home.jsx"
import Header from './components/header.jsx'
import { CookiesProvider } from 'react-cookie'
import LoginPage from './components/login.jsx'

const PrivateRoute = ({ children }) => {
  const token = document.cookie.includes('token=');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <CookiesProvider>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </CookiesProvider>
  );
}

export default App;
