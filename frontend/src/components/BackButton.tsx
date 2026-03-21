import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  label: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'ghost' | 'sticky';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  showHomeButton?: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({
  label,
  to,
  onClick,
  className,
  variant = 'default',
  disabled = false,
  type = 'button',
  showHomeButton = true,
}) => {
  const navigate = useNavigate();
  const normalizedLabel = label.replace(/^\s*[←<-]+\s*/u, '').trim();
  const shouldShowHomeButton =
    showHomeButton && to !== '/dashboard' && !/dashboard/i.test(normalizedLabel);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      navigate(to);
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="btn-back-dashboard-group">
      <button
        type={type}
        className={[
          'btn-back-dashboard',
          variant !== 'default' ? `btn-back-dashboard--${variant}` : undefined,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleClick}
        disabled={disabled}
      >
        <span className="btn-back-dashboard__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" role="img">
            <path d="M15.7 4.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l5.3 5.3a1 1 0 0 1-1.42 1.4l-7-7a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 1.41 0z" />
          </svg>
        </span>
        <span className="btn-back-dashboard__label">{normalizedLabel}</span>
      </button>

      {shouldShowHomeButton && (
        <button
          type="button"
          className="btn-back-dashboard btn-back-dashboard--home"
          onClick={handleGoHome}
          disabled={disabled}
          title="Ir al Dashboard"
          aria-label="Ir al Dashboard"
        >
          <span className="btn-back-dashboard__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" role="img">
              <path d="M12 3.2 3.5 10a1 1 0 0 0 1.24 1.56L6 10.6V19a2 2 0 0 0 2 2h2.5a1 1 0 0 0 1-1v-4h1v4a1 1 0 0 0 1 1H16a2 2 0 0 0 2-2v-8.4l1.26.96A1 1 0 1 0 20.5 10L12 3.2Z" />
            </svg>
          </span>
          <span className="btn-back-dashboard__label">Home</span>
        </button>
      )}
    </div>
  );
};

export default BackButton;