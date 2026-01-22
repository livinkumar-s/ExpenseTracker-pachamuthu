import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import "./header.css"

const Header = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(['token']);
  const isLoggedIn = !!cookies.token;

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    // Remove token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Clear user data
    localStorage.removeItem('user');
    // Redirect to login
    navigate('/login');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const user = JSON.parse(localStorage.getItem("user"));

  const hasToken = document.cookie
    .split("; ")
    .some(row => row.startsWith("token="));

  return (
    <header className="header">
      <div className="logo-container" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
        <i className="fas fa-chart-line logo-icon"></i>
        <h1 className="logo">Expense<span className="logo-highlight">Flow</span></h1>
      </div>

      <div className="header-right">
        {hasToken && (<div className="user-section">
          <div className="user-icon">
            👤
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>)}
        {isLoggedIn ? (
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