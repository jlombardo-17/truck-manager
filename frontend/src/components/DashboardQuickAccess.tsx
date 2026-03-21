import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardQuickAccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="dashboard-quick-access"
      onClick={() => navigate('/dashboard')}
      aria-label="Ir al dashboard"
      title="Ir al Dashboard"
    >
      <span className="dashboard-quick-access__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" role="img">
          <path d="M12 3.2 3.5 10a1 1 0 0 0 1.24 1.56L6 10.6V19a2 2 0 0 0 2 2h2.5a1 1 0 0 0 1-1v-4h1v4a1 1 0 0 0 1 1H16a2 2 0 0 0 2-2v-8.4l1.26.96A1 1 0 1 0 20.5 10L12 3.2Z" />
        </svg>
      </span>
      <span className="dashboard-quick-access__label">Home</span>
    </button>
  );
};

export default DashboardQuickAccess;
