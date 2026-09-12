import React from 'react';
import WeatherMap from '../components/WeatherMap';
import AppNavbar from '../components/AppNavbar';
import BackButton from '../components/BackButton';
import '../styles/Clima.css';

const Clima: React.FC = () => {
  return (
    <div className="clima-page">
      <AppNavbar />

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
