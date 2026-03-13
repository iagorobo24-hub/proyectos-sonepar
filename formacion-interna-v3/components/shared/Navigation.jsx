/**
 * Navigation - Componente de navegación por tabs con atajos de teclado
 * 
 * Implementa navegación principal con persistencia de estado y accesibilidad
 */

import React, { useEffect } from 'react';

function Navigation({ activeTab, onTabChange }) {
  const tabs = [
    { 
      id: 'equipo', 
      label: 'Equipo', 
      icon: '👥', 
      shortcut: 'Alt+1',
      description: 'Dashboard y matriz de progreso del equipo'
    },
    { 
      id: 'empleado', 
      label: 'Empleado', 
      icon: '👤', 
      shortcut: 'Alt+2',
      description: 'Vista individual de empleado'
    },
    { 
      id: 'modulos', 
      label: 'Módulos', 
      icon: '📚', 
      shortcut: 'Alt+3',
      description: 'Gestión de módulos y configuración por rol'
    },
    { 
      id: 'ajustes', 
      label: 'Ajustes', 
      icon: '⚙️', 
      shortcut: 'Alt+4',
      description: 'Configuración del sistema y importación'
    }
  ];

  // Manejar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        const keyMap = {
          '1': 'equipo',
          '2': 'empleado',
          '3': 'modulos',
          '4': 'ajustes'
        };

        const targetTab = keyMap[event.key];
        if (targetTab) {
          event.preventDefault();
          onTabChange(targetTab);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange]);

  // Persistir tab activo en sessionStorage
  useEffect(() => {
    sessionStorage.setItem('sonepar-active-tab', activeTab);
  }, [activeTab]);

  return (
    <nav className="sonepar-navigation" role="navigation" aria-label="Navegación principal">
      <div className="nav-tabs" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            title={`${tab.description} (${tab.shortcut})`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            <span className="sr-only">{tab.shortcut}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;