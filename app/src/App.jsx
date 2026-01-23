import React, { useState } from 'react'
import './App.css'
import { Navigate, Route, Router, Routes } from 'react-router-dom'
import Home from "./components/home.jsx"
import Header from './components/header.jsx'
import { CookiesProvider } from 'react-cookie'
import LoginPage from './components/login.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'

function App() {


  const [authorized, setAuthorized] = useState(false);
  const [user,setUser]=useState(null)
  return (
    <CookiesProvider>
      <div className="App">
        <Header user={user} authorized={authorized} />
        <Routes>
          <Route path="/" element={
            <PrivateRoute setUser={setUser} authorized={authorized} setAuthorized={setAuthorized}>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </CookiesProvider>
  );
}

export default App;
