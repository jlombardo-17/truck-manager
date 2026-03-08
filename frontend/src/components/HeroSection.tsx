import React from 'react';
import '../styles/HeroSection.css';

interface HeroFeature {
  title: string;
  description: string;
}

interface HeroProps {
  subtitle?: string;
  title: string;
  description?: string;
  features?: HeroFeature[];
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  image?: {
    src: string;
    alt: string;
  };
  backgroundImage?: string;
  darkBg?: boolean;
}

const HeroSection: React.FC<HeroProps> = ({
  subtitle,
  title,
  description,
  features = [],
  primaryAction,
  secondaryAction,
  image,
  backgroundImage,
  darkBg = true,
}) => {
  const heroClass = darkBg ? 'hero hero-dark' : 'hero hero-light';
  const getBackgroundImage = (img: string): string => {
    // Check if it's a CSS gradient (linear-gradient, radial-gradient, etc.)
    if (img.includes('gradient')) {
      return img;
    }
    // Otherwise treat it as a URL
    return `url(${img})`;
  };
  const heroStyle = backgroundImage ? { backgroundImage: getBackgroundImage(backgroundImage) } : {};

  return (
    <section className={heroClass} style={heroStyle}>
      <div className="hero-content">
        <div className="hero-wrapper">
          {/* Left Column: Text Content */}
          <div className="hero-text">
            {subtitle && <p className="hero-subtitle">{subtitle}</p>}
            
            <h1 className="hero-title">{title}</h1>
            
            {description && <p className="hero-description">{description}</p>}

            {/* Features List */}
            {features.length > 0 && (
              <ul className="hero-features">
                {features.map((feature, index) => (
                  <li key={index}>
                    <div className="feature-icon">✓</div>
                    <div>
                      <strong>{feature.title}</strong>
                      <p>{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Action Buttons */}
            {(primaryAction || secondaryAction) && (
              <div className="hero-actions">
                {primaryAction && (
                  <button
                    className="btn-primary-hero"
                    onClick={primaryAction.onClick}
                  >
                    {primaryAction.label}
                  </button>
                )}
                {secondaryAction && (
                  <button
                    className="btn-secondary-hero"
                    onClick={secondaryAction.onClick}
                  >
                    {secondaryAction.label}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Image */}
          {image && (
            <div className="hero-image">
              <img src={image.src} alt={image.alt} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
