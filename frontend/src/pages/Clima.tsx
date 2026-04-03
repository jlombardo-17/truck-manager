import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WeatherMap from '../components/WeatherMap';
import BackButton from '../components/BackButton';
import '../styles/Clima.css';

const Clima: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="clima-page">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-title">Truck Manager</h1>
          <div className="navbar-user">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="clima-content">
        <div className="clima-header-row">
          <BackButton label="← Volver al Dashboard" to="/dashboard" variant="ghost" />
        </div>

        <WeatherMap />
      </main>
    </div>
  );
};

export default Clima;
