/**
 * OrbitalLogo - Logo SVG orbital de Sonepar
 * 
 * Componente que renderiza el logo corporativo de Sonepar con animación orbital
 */

import React from 'react';

function OrbitalLogo({ size = 32, animated = false, className = '' }) {
  const logoId = `orbital-logo-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`orbital-logo-svg ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Definiciones para gradientes y animaciones */}
      <defs>
        <linearGradient id={`${logoId}-primary`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003087" />
          <stop offset="100%" stopColor="#4A90D9" />
        </linearGradient>
        
        <linearGradient id={`${logoId}-secondary`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A90D9" />
          <stop offset="100%" stopColor="#003087" />
        </linearGradient>

        {animated && (
          <animateTransform
            id={`${logoId}-orbit`}
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 16 16"
            to="360 16 16"
            dur="8s"
            repeatCount="indefinite"
          />
        )}
      </defs>

      {/* Círculo exterior (órbita) */}
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Núcleo central */}
      <circle
        cx="16"
        cy="16"
        r="4"
        fill={`url(#${logoId}-primary)`}
      />

      {/* Satélite orbital */}
      <g>
        {animated && <animateTransform xlinkHref={`#${logoId}-orbit`} />}
        <circle
          cx="26"
          cy="16"
          r="3"
          fill={`url(#${logoId}-secondary)`}
        />
        
        {/* Estela del satélite */}
        <circle
          cx="24"
          cy="16"
          r="1.5"
          fill="currentColor"
          opacity="0.4"
        />
        <circle
          cx="22"
          cy="16"
          r="1"
          fill="currentColor"
          opacity="0.2"
        />
      </g>

      {/* Puntos de conexión orbital */}
      <circle cx="16" cy="2" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="30" cy="16" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="16" cy="30" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="2" cy="16" r="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default OrbitalLogo;