import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AppNavbar.css';

const AppNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1
          className="navbar-title"
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          Truck Manager
        </h1>
        <div className="navbar-user">
          <span className="user-name">
            {user?.firstName} {user?.lastName}
          </span>
          <button type="button" onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
