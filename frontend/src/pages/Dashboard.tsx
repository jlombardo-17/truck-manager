import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, DashboardResumen, DesempenoCamion, DesempenoChofer } from '../services/dashboardService';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [desempenoCamiones, setDesempenoCamiones] = useState<DesempenoCamion[]>([]);
  const [desempenoChoferes, setDesempenoChoferes] = useState<DesempenoChofer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resumenData, camionesData, choferesData] = await Promise.all([
        dashboardService.getResumen(),
        dashboardService.getDesempenoCamiones(),
        dashboardService.getDesempenoChoferes(),
      ]);
      setResumen(resumenData);
      setDesempenoCamiones(camionesData);
      setDesempenoChoferes(choferesData);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(value);
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

          {/* KPI Cards */}
          {!loading && resumen && (
            <div className="kpi-cards">
              <div className="kpi-card success">
                <h4>💰 Ingresos del Mes</h4>
                <p className="kpi-value">{formatCurrency(resumen.ingresosDelMes)}</p>
              </div>
              <div className="kpi-card danger">
                <h4>📉 Gastos del Mes</h4>
                <p className="kpi-value">{formatCurrency(resumen.gastosDelMes)}</p>
              </div>
              <div className="kpi-card warning">
                <h4>📈 Ganancia Neta</h4>
                <p className="kpi-value">{formatCurrency(resumen.gananciaNetaDelMes)}</p>
              </div>
              <div className="kpi-card info">
                <h4>🚚 Camiones Activos Hoy</h4>
                <p className="kpi-value">{resumen.camionesActivos}</p>
              </div>
              <div className="kpi-card primary">
                <h4>✅ Viajes Completados</h4>
                <p className="kpi-value">{resumen.viajesCompletados}</p>
              </div>
            </div>
          )}

          {/* Alertas Documentos */}
          {!loading && resumen && resumen.documentosPorVencer.length > 0 && (
            <div className="alerts-section">
              <h3>⚠️ Documentos Próximos a Vencer</h3>
              <div className="alerts-list">
                {resumen.documentosPorVencer.map((doc, idx) => (
                  <div key={idx} className="alert-item">
                    <span className="alert-text">
                      {doc.choferNombre} - {doc.documentoTipo} ({doc.diasRestantes} días)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desempeño Camiones */}
          {!loading && desempenoCamiones.length > 0 && (
            <div className="performance-section">
              <h3>🏅 Top Camiones por Eficiencia</h3>
              <div className="performance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Viajes</th>
                      <th>Ingresos</th>
                      <th>Gastos</th>
                      <th>Eficiencia</th>
                      <th>KM Recorridos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desempenoCamiones.slice(0, 5).map((camion) => (
                      <tr key={camion.id}>
                        <td className="bold">{camion.placa}</td>
                        <td>{camion.viajesCompletos}</td>
                        <td>{formatCurrency(camion.ingresos)}</td>
                        <td>{formatCurrency(camion.gastos)}</td>
                        <td>
                          <span className={`efficiency-badge ${camion.eficiencia >= 50 ? 'high' : camion.eficiencia >= 25 ? 'medium' : 'low'}`}>
                            {camion.eficiencia.toFixed(1)}%
                          </span>
                        </td>
                        <td>{camion.kmRecorridos.toFixed(1)} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Desempeño Choferes */}
          {!loading && desempenoChoferes.length > 0 && (
            <div className="performance-section">
              <h3>👨‍✈️ Top Choferes por Viajes</h3>
              <div className="performance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Viajes</th>
                      <th>Ingresos</th>
                      <th>Comisiones</th>
                      <th>Puntualidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desempenoChoferes.slice(0, 5).map((chofer) => (
                      <tr key={chofer.id}>
                        <td className="bold">{chofer.nombre}</td>
                        <td>{chofer.viajesCompletos}</td>
                        <td>{formatCurrency(chofer.ingresos)}</td>
                        <td>{formatCurrency(chofer.comisiones)}</td>
                        <td>
                          <span className="puntuality-badge">{chofer.puntualidad}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

            <div className="feature-card clickable" onClick={() => navigate('/viajes')}>
              <h3>🗺️ Viajes y Rutas</h3>
              <p>Planifica y controla tus entregas con rutas en mapas</p>
              <button className="feature-button">Ver Viajes →</button>
            </div>

            <div className="feature-card clickable" onClick={() => navigate('/reportes')}>
              <h3>📊 Reportes</h3>
              <p>Visualiza rentabilidad diaria y mensual por camión o chofer</p>
              <button className="feature-button">Ver Reportes →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
