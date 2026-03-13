/**
 * Constants - Constantes de la aplicación Formación Interna v3
 */

// Estados de progreso de módulos
export const PROGRESS_STATES = {
  PENDING: 'pendiente',
  IN_PROGRESS: 'en-curso',
  COMPLETED: 'completado'
};

// Tipos de vencimiento
export const DEADLINE_TYPES = {
  MANDATORY: 'obligatorio',
  RECOMMENDED: 'recomendado'
};

// Roles disponibles
export const ROLES = {
  TECHNICAL: 'Técnico',
  COMMERCIAL: 'Comercial',
  ADMINISTRATIVE: 'Administrativo'
};

// Áreas de trabajo
export const WORK_AREAS = {
  SALES: 'Ventas',
  TECHNICAL: 'Técnico',
  ADMINISTRATION: 'Administración'
};

// Categorías de módulos
export const MODULE_CATEGORIES = {
  SECURITY: 'Seguridad',
  COMMERCIAL: 'Comercial',
  TECHNICAL: 'Técnico',
  QUALITY: 'Calidad',
  GENERAL: 'General'
};

// Colores para estados de matriz
export const MATRIX_COLORS = {
  COMPLETED: '#28a745',      // Verde
  IN_PROGRESS: '#4A90D9',    // Azul claro
  UPCOMING_DEADLINE: '#ffc107', // Amarillo
  OVERDUE: '#dc3545',        // Rojo
  PENDING: '#6c757d'         // Gris
};

// Configuración de cache
export const CACHE_CONFIG = {
  TTL: 5000, // 5 segundos
  MAX_SIZE: 100 // Máximo número de entradas en cache
};

// Configuración de vencimientos
export const DEADLINE_CONFIG = {
  WARNING_DAYS: 7,  // Días para mostrar alerta amarilla
  URGENT_DAYS: 3    // Días para considerar urgente
};

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// Configuración de validación
export const VALIDATION_CONFIG = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_HOURS: 0.5,
  MAX_HOURS: 80,
  MAX_DESCRIPTION_LENGTH: 500
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  EMPLOYEE_NOT_FOUND: 'Empleado no encontrado',
  MODULE_NOT_FOUND: 'Módulo no encontrado',
  INVALID_DATA: 'Datos inválidos',
  MIGRATION_FAILED: 'Error en migración',
  VALIDATION_FAILED: 'Error de validación',
  NETWORK_ERROR: 'Error de conexión',
  STORAGE_FULL: 'Almacenamiento lleno'
};

// Configuración de la aplicación
export const APP_CONFIG = {
  VERSION: '3.0.0',
  NAME: 'Formación Interna Sonepar',
  STORAGE_PREFIX: 'sonepar-formacion-v3-',
  BACKUP_PREFIX: 'sonepar-formacion-v2-backup',
  LOG_PREFIX: 'sonepar-formacion-migration-log'
};

// Configuración de exportación
export const EXPORT_CONFIG = {
  CSV_DELIMITER: ',',
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss'
};

// Configuración de IA
export const AI_CONFIG = {
  MAX_PROMPT_LENGTH: 2000,
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3
};

// Configuración de certificados PDF
export const PDF_CONFIG = {
  PAGE_SIZE: 'a4',
  MARGIN: 20,
  FONT_SIZE: {
    TITLE: 24,
    SUBTITLE: 18,
    BODY: 12,
    SMALL: 10
  }
};

// Atajos de teclado
export const KEYBOARD_SHORTCUTS = {
  TEAM_TAB: 'Alt+1',
  EMPLOYEE_TAB: 'Alt+2',
  MODULES_TAB: 'Alt+3',
  SETTINGS_TAB: 'Alt+4',
  SEARCH: 'Ctrl+F',
  SAVE: 'Ctrl+S',
  NEW: 'Ctrl+N'
};

// URLs y endpoints (para futuras integraciones)
export const API_ENDPOINTS = {
  CLAUDE_API: 'https://api.anthropic.com/v1/messages',
  BACKUP_SERVICE: '/api/backup',
  EXPORT_SERVICE: '/api/export'
};

// Configuración de rendimiento
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,     // ms para debouncing de filtros
  THROTTLE_DELAY: 100,     // ms para throttling de scroll
  VIRTUAL_SCROLL_THRESHOLD: 50, // Número de elementos para activar virtual scroll
  BATCH_SIZE: 20           // Tamaño de lote para operaciones masivas
};

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 5000,  // 5 segundos
  SUCCESS_DURATION: 3000,  // 3 segundos
  ERROR_DURATION: 10000,   // 10 segundos
  MAX_NOTIFICATIONS: 5     // Máximo número de notificaciones simultáneas
};