/**
 * Header - Componente de cabecera con identidad visual Sonepar
 * 
 * Incluye logo orbital SVG, título de la aplicación y elementos de navegación
 */

import React from 'react';
import OrbitalLogo from './OrbitalLogo.jsx';

function Header({ title = 'Formación Interna v3', version = 'v3.0.0', showVersion = true }) {
  return (
    <header className="sonepar-header">
      <div className="header-content">
        <div className="sonepar-logo">
          <OrbitalLogo size={32} animated={false} />
          <span className="logo-text">Sonepar</span>
        </div>
        
        <h1>{title}</h1>
        
        <div className="header-actions">
          {showVersion && (
            <span className="version-badge">{version}</span>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;