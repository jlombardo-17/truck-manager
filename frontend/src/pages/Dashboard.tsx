import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-title">🚚 Truck Manager</h1>
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

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>¡Bienvenido a Truck Manager!</h2>
          <p>Sistema de gestión y mantenimiento de flota de camiones</p>

          <div className="user-info-card">
            <h3>Tu Información</h3>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Nombre:</strong> {user?.firstName} {user?.lastName}
            </p>
            <p>
              <strong>Rol:</strong> <span className="role-badge">{user?.role}</span>
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card clickable" onClick={() => navigate('/camiones')}>
              <h3>📋 Gestión de Camiones</h3>
              <p>Administra tu flota de vehículos</p>
              <button className="feature-button">Ver Camiones →</button>
            </div>

            <div className="feature-card clickable" onClick={() => navigate('/choferes')}>
              <h3>👥 Gestión de Choferes</h3>
              <p>Administra la información de tus conductores</p>
              <button className="feature-button">Ver Choferes →</button>
            </div>

            <div className="feature-card">
              <h3>🗺️ Viajes y Rutas</h3>
              <p>Próximamente: Planifica y controla tus entregas</p>
            </div>

            <div className="feature-card">
              <h3>📊 Reportes</h3>
              <p>Próximamente: Visualiza estadísticas y métricas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
