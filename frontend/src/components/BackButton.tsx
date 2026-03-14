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
}

const BackButton: React.FC<BackButtonProps> = ({
  label,
  to,
  onClick,
  className,
  variant = 'default',
  disabled = false,
  type = 'button',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      navigate(to);
    }
  };

  return (
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
      {label}
    </button>
  );
};

export default BackButton;