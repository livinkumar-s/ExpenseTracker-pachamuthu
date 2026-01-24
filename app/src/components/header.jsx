import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import "./header.css"

const Header = ({ authorized, user, setUser, setAuthorized }) => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogout = async (e) => {

    try {
      const res = await fetch("http://localhost:3333/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setUser(null)
        setAuthorized(false)
      }

    } catch (error) {
      console.error("Logout failed", error);
    }
  };


  const handleHomeClick = () => {
    navigate('/');
  };




  return (
    <header className="header">
      <div className="logo-container" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
        <i className="fas fa-chart-line logo-icon"></i>
        <h1 className="logo">Expense<span className="logo-highlight">Flow</span></h1>
      </div>

      <div className="header-right">
        {authorized && (<div className="user-section">
          <div className="user-icon">
            👤
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>)}
        {authorized ? (
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        ) : (
          <button
            className="login-btn"
            onClick={handleLoginClick}
          >
            <i className="fas fa-sign-in-alt"></i>
            <span>Login / Register</span>
          </button>
        )}
      </div>


    </header>
  );
};

export default Header;