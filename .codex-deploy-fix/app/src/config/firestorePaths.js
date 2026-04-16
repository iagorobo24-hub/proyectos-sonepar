/**
 * Rutas centralizadas de Firestore para SoneparTools
 * Todas las rutas siguen el patrón: users/{uid}/{collection}/{docId}
 */

// Ruta base para un usuario
export const userDoc = (uid) => `users/${uid}`;

// Historial de fichas técnicas consultadas
export const userHistory = (uid) => `${userDoc(uid)}/fichas/history`;

// Presupuestos guardados
export const userBudgets = (uid) => `${userDoc(uid)}/budgets`;

// Incidencias reportadas
export const userIncidents = (uid) => `${userDoc(uid)}/incidents`;

// Entradas de KPI logístico
export const userKpi = (uid) => `${userDoc(uid)}/kpi/entries`;

// Datos del simulador de almacén (progreso, intentos)
export const userSimulator = (uid, sessionId) => `${userDoc(uid)}/simulator/${sessionId}`;

// Progreso de formación (empleados, módulos completados)
export const userTraining = (uid) => `${userDoc(uid)}/training`;

// Preferencias de usuario (tema, sidebar colapsado, etc.)
export const userPreferences = (uid) => `${userDoc(uid)}/preferences`;

// Perfil de usuario con metadata de migración
export const userProfile = (uid) => `${userDoc(uid)}/profile`;

// Mapeo de keys de localStorage a rutas de Firestore
export const STORAGE_MAPPING = {
  'sonepar_fichas_historial': { collection: 'fichas', doc: 'history' },
  'sonepar_presupuestos_historial': { collection: 'budgets' },
  'sonepar_incidencias': { collection: 'incidents' },
  'sonepar_kpi_historial': { collection: 'kpi', doc: 'entries' },
  'sonepar_simulador_*': { collection: 'simulator' },
  'sonepar_formacion_empleados': { collection: 'training', doc: 'employees' },
  'sonepar_formacion_modulos': { collection: 'training', doc: 'modules' },
  'sonepar_formacion_progresos': { collection: 'training', doc: 'progress' },
  'sonepar_formacion_fechas': { collection: 'training', doc: 'dates' },
  'sonepar_theme': { collection: 'preferences', doc: 'theme' },
  'sidebar_collapsed': { collection: 'preferences', doc: 'sidebar' },
};

export default {
  userDoc,
  userHistory,
  userBudgets,
  userIncidents,
  userKpi,
  userSimulator,
  userTraining,
  userPreferences,
  userProfile,
  STORAGE_MAPPING,
};
