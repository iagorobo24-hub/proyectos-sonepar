import { useState, useEffect } from 'react';

/**
 * Componente Spinner reutilizable para estados de carga
 */
export default function Spinner({ 
  size = 24, 
  color = 'var(--color-brand)', 
  thickness = 3,
  className = '',
  label = '' 
}) {
  return (
    <div className={`spinner-container ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div 
        className="spinner"
        style={{
          width: size,
          height: size,
          border: `${thickness}px solid rgba(128,128,128,0.2)`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && (
        <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{label}</span>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
