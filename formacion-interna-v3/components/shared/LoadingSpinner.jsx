/**
 * LoadingSpinner - Componente de carga con identidad Sonepar
 * 
 * Spinner animado con colores corporativos y logo orbital
 */

import React from 'react';
import OrbitalLogo from './OrbitalLogo.jsx';

function LoadingSpinner({ 
  size = 'medium', 
  message = 'Cargando...', 
  showLogo = true,
  className = '' 
}) {
  const sizeClasses = {
    small: 'loading-spinner-sm',
    medium: 'loading-spinner-md',
    large: 'loading-spinner-lg'
  };

  const logoSizes = {
    small: 24,
    medium: 32,
    large: 48
  };

  return (
    <div className={`loading-container ${sizeClasses[size]} ${className}`}>
      {showLogo && (
        <div className="sonepar-logo">
          <OrbitalLogo size={logoSizes[size]} animated={true} />
        </div>
      )}
      
      <div className="loading-spinner"></div>
      
      {message && (
        <p className="loading-message">{message}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;