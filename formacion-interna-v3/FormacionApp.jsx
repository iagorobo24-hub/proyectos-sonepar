/**
 * FormacionApp - Aplicación principal de Formación Interna Sonepar v3
 * 
 * Punto de entrada que maneja la migración automática y la navegación principal
 */

import React, { useState, useEffect } from 'react';
import dataService from './services/dataService.js';
import migrationService from './services/migrationService.js';

// Componentes compartidos
import Header from './components/shared/Header.jsx';
import Navigation from './components/shared/Navigation.jsx';
import LoadingSpinner from './components/shared/LoadingSpinner.jsx';

// Componentes principales (se implementarán en tareas posteriores)
// import TeamDashboard from './components/dashboard/TeamDashboard.jsx';
// import EmployeeView from './components/employee/EmployeeView.jsx';
// import ModuleManager from './components/modules/ModuleManager.jsx';
// import Settings from './components/shared/Settings.jsx';

function FormacionApp() {
  const [activeTab, setActiveTab] = useState(() => {
    // Recuperar tab activo de sessionStorage
    return sessionStorage.getItem('sonepar-active-tab') || 'equipo';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [error, setError] = useState(null);

  // Ejecutar migración automática al cargar
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Usar el nuevo método de inicialización automática
      const initResult = await migrationService.initializeApp();
      
      if (!initResult.success) {
        setError(initResult.message);
        return;
      }
      
      // Mostrar resultado de migración si ocurrió
      if (initResult.migratedEmployees) {
        setMigrationStatus(initResult);
        console.log('✅ Migración completada:', initResult);
      }

      // Verificar estado final de la aplicación
      const status = migrationService.getMigrationStatus();
      console.log('📊 Estado final de la aplicación:', status);

    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      setError(`Error al inicializar la aplicación: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="sonepar-app loading">
        <LoadingSpinner 
          size="large" 
          message="Inicializando aplicación..." 
          showLogo={true}
        />
        {migrationStatus && (
          <div className="migration-status">
            <p>Migrando datos v2 → v3...</p>
            {migrationStatus.migratedEmployees && (
              <p>Empleados migrados: {migrationStatus.migratedEmployees}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="sonepar-app error">
        <div className="error-container">
          <LoadingSpinner 
            size="large" 
            message="" 
            showLogo={true}
          />
          <h2>Error en Formación Interna</h2>
          <div className="error-message">
            <p>{error}</p>
          </div>
          <div className="error-actions">
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                if (confirm('¿Está seguro de que desea limpiar todos los datos?')) {
                  dataService.clearAllData();
                  migrationService.clearMigrationData();
                  window.location.reload();
                }
              }}
            >
              Limpiar Datos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Aplicación principal
  return (
    <div className="sonepar-app">
      <Header title="Formación Interna v3" version="v3.0.0" />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content" role="main">
        <div className="status-live" aria-live="polite" aria-atomic="true">
          {/* Anuncios para lectores de pantalla */}
        </div>
        {activeTab === 'equipo' && <TeamDashboardPlaceholder />}
        {activeTab === 'empleado' && <EmployeeViewPlaceholder />}
        {activeTab === 'modulos' && <ModuleManagerPlaceholder />}
        {activeTab === 'ajustes' && <SettingsPlaceholder />}
      </main>
      {migrationStatus && migrationStatus.success && (
        <MigrationSuccessNotification 
          status={migrationStatus}
          onClose={() => setMigrationStatus(null)}
        />
      )}
    </div>
  );
}

// ==================== COMPONENTES TEMPORALES ====================

// Placeholders para componentes que se implementarán en tareas posteriores
function TeamDashboardPlaceholder() {
  const employees = dataService.getEmployees();
  const modules = dataService.getModules();
  const metrics = dataService.getTeamMetrics();

  return (
    <div className="placeholder-content">
      <h2>Dashboard de Equipo</h2>
      <div className="placeholder-info">
        <p>📊 Empleados: {employees.length}</p>
        <p>📚 Módulos: {modules.length}</p>
        <p>✅ Completado: {metrics.completionPercentage}%</p>
        <p>⏰ Pendientes: {metrics.pendingModules}</p>
      </div>
      <p className="placeholder-note">
        Este componente se implementará en la tarea 3.1
      </p>
    </div>
  );
}

function EmployeeViewPlaceholder() {
  return (
    <div className="placeholder-content">
      <h2>Vista de Empleado</h2>
      <p className="placeholder-note">
        Este componente se implementará en la tarea 14.1
      </p>
    </div>
  );
}

function ModuleManagerPlaceholder() {
  return (
    <div className="placeholder-content">
      <h2>Gestión de Módulos</h2>
      <p className="placeholder-note">
        Este componente se implementará en la tarea 10.1
      </p>
    </div>
  );
}

function SettingsPlaceholder() {
  const settings = dataService.getSettings();
  const migrationStatus = migrationService.getMigrationStatus();

  return (
    <div className="placeholder-content">
      <h2>Configuración</h2>
      <div className="settings-info">
        <h3>Estado del Sistema</h3>
        <p>Versión: {settings.version}</p>
        <p>Última migración: {settings.lastMigration || 'Nunca'}</p>
        <p>Datos v2: {migrationStatus.hasV2Data ? 'Sí' : 'No'}</p>
        <p>Datos v3: {migrationStatus.hasV3Data ? 'Sí' : 'No'}</p>
        
        <h3>Configuración</h3>
        <p>Roles: {settings.roles.join(', ')}</p>
        <p>Áreas: {settings.areas.join(', ')}</p>
      </div>
      <p className="placeholder-note">
        Configuración completa se implementará en tareas posteriores
      </p>
    </div>
  );
}

function MigrationSuccessNotification({ status, onClose }) {
  return (
    <div className="migration-notification success">
      <div className="notification-content">
        <h3>✅ Migración Exitosa</h3>
        <p>{status.message}</p>
        <ul>
          <li>Empleados migrados: {status.migratedEmployees}</li>
          <li>Módulos migrados: {status.migratedModules}</li>
          <li>Registros de progreso: {status.migratedProgress}</li>
        </ul>
        <button className="btn btn-primary" onClick={onClose}>
          Continuar
        </button>
      </div>
    </div>
  );
}

export default FormacionApp;