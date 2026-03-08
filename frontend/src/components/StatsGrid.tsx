import React from 'react';
import '../styles/StatsCard.css';

export interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4;
  loading?: boolean;
}

const trendIcons = {
  up: '↑',
  down: '↓',
  stable: '→'
};

const StatsCard: React.FC<{ stat: StatItem }> = ({ stat }) => {
  const colorClass = `stat-card-${stat.color || 'blue'}`;
  const trendClass = stat.trend ? `stat-trend-${stat.trend.direction}` : '';

  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-header">
        {stat.icon && <div className="stat-icon">{stat.icon}</div>}
        <h3 className="stat-label">{stat.label}</h3>
      </div>

      <div className="stat-value">
        <span className="stat-number">{stat.value}</span>
        {stat.unit && <span className="stat-unit">{stat.unit}</span>}
      </div>

      {stat.trend && (
        <div className={`stat-trend ${trendClass}`}>
          <span className="trend-icon">{trendIcons[stat.trend.direction]}</span>
          <span className="trend-value">{stat.trend.percentage}%</span>
          <span className="trend-period">desde el mes pasado</span>
        </div>
      )}
    </div>
  );
};

const StatsGrid: React.FC<StatsGridProps> = ({ 
  stats, 
  columns = 4,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className={`stats-grid stats-grid-${columns}`}>
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="stat-card-skeleton">
            <div className="skeleton-header"></div>
            <div className="skeleton-value"></div>
            <div className="skeleton-trend"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`stats-grid stats-grid-${columns}`}>
      {stats.map((stat, index) => (
        <StatsCard key={index} stat={stat} />
      ))}
    </div>
  );
};

export { StatsCard, StatsGrid };
export default StatsGrid;
