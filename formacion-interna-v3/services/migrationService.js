/**
 * MigrationService - Servicio para migración automática de datos v2 → v3
 * 
 * Detecta datos v2 existentes y los transforma a la nueva estructura v3
 * con backup automático y rollback en caso de fallo.
 */

import dataService from './dataService.js';

class MigrationService {
  constructor() {
    this.V2_STORAGE_KEY = 'sonepar-formacion-empleados';
    this.BACKUP_KEY = 'sonepar-formacion-v2-backup';
    this.MIGRATION_LOG_KEY = 'sonepar-formacion-migration-log';
  }

  // ==================== DETECCIÓN Y MIGRACIÓN ====================

  /**
   * Verifica si hay datos v2 que necesitan migración
   */
  needsMigration() {
    const v2Data = this.detectV2Data();
    const settings = dataService.getSettings();
    
    // Necesita migración si hay datos v2 y no se ha migrado antes
    return v2Data && !settings.lastMigration;
  }

  /**
   * Detecta automáticamente datos v2 en localStorage al cargar la aplicación
   */
  autoDetectAndMigrate() {
    if (this.needsMigration()) {
      console.log('🔄 Datos v2 detectados automáticamente, iniciando migración...');
      return this.migrateFromV2ToV3();
    }
    return Promise.resolve({ success: true, message: 'No se requiere migración' });
  }

  /**
   * Detecta datos v2 en localStorage con validación mejorada
   */
  detectV2Data() {
    const v2DataRaw = localStorage.getItem(this.V2_STORAGE_KEY);
    if (!v2DataRaw) return null;
    
    try {
      const v2Data = JSON.parse(v2DataRaw);
      
      // Validar que sea un array válido
      if (!Array.isArray(v2Data)) {
        console.warn('⚠️ Datos v2 no son un array válido');
        return null;
      }
      
      // Validar que tenga al menos un empleado
      if (v2Data.length === 0) {
        console.warn('⚠️ Datos v2 están vacíos');
        return null;
      }
      
      // Validar estructura básica de empleados
      const validEmployees = v2Data.filter(emp => 
        emp && typeof emp === 'object' && (emp.nombre || emp.id)
      );
      
      if (validEmployees.length === 0) {
        console.warn('⚠️ No se encontraron empleados válidos en datos v2');
        return null;
      }
      
      if (validEmployees.length !== v2Data.length) {
        console.warn(`⚠️ ${v2Data.length - validEmployees.length} empleados inválidos encontrados en datos v2`);
      }
      
      return validEmployees;
      
    } catch (error) {
      console.error('❌ Error parsing v2 data:', error);
      return null;
    }
  }

  /**
   * Ejecuta la migración completa de v2 a v3
   */
  async migrateFromV2ToV3() {
    try {
      this.logMigrationStep('Iniciando migración v2 → v3');
      
      // 1. Detectar datos v2
      const v2Data = this.detectV2Data();
      if (!v2Data) {
        throw new Error('No se encontraron datos v2 para migrar');
      }
      
      this.logMigrationStep(`Detectados ${v2Data.length} empleados en v2`);
      
      // 2. Crear backup
      await this.createBackup(v2Data);
      this.logMigrationStep('Backup creado exitosamente');
      
      // 3. Transformar datos
      const v3Data = this.transformV2ToV3(v2Data);
      this.logMigrationStep('Datos transformados a estructura v3');
      
      // 4. Validar migración
      const isValid = this.validateMigration(v3Data, v2Data);
      if (!isValid) {
        throw new Error('Validación de migración falló');
      }
      
      this.logMigrationStep('Validación exitosa');
      
      // 5. Guardar datos v3
      this.saveV3Data(v3Data);
      this.logMigrationStep('Datos v3 guardados');
      
      // 6. Marcar migración completada
      this.markMigrationComplete();
      this.logMigrationStep('Migración completada exitosamente');
      
      return {
        success: true,
        message: 'Migración v2 → v3 completada exitosamente',
        migratedEmployees: v3Data.employees.length,
        migratedModules: v3Data.modules.length,
        migratedProgress: v3Data.progress.length
      };
      
    } catch (error) {
      this.logMigrationStep(`Error en migración: ${error.message}`);
      
      // Intentar rollback automático
      try {
        await this.rollbackToV2();
        this.logMigrationStep('Rollback exitoso');
        
        return {
          success: false,
          message: `Error en migración: ${error.message}. Se restauraron los datos v2.`,
          error: error.message
        };
      } catch (rollbackError) {
        this.logMigrationStep(`Error en rollback: ${rollbackError.message}`);
        
        return {
          success: false,
          message: `Error crítico en migración y rollback: ${error.message}`,
          error: error.message,
          rollbackError: rollbackError.message
        };
      }
    }
  }

  // ==================== BACKUP Y ROLLBACK ====================

  /**
   * Crea backup de datos v2 con validación adicional
   */
  async createBackup(v2Data) {
    try {
      const backup = {
        data: v2Data,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        employeeCount: v2Data.length,
        checksum: this.calculateChecksum(v2Data)
      };
      
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
      this.logMigrationStep(`Backup creado: ${backup.employeeCount} empleados, checksum: ${backup.checksum}`);
      
      return backup;
    } catch (error) {
      throw new Error(`Error creando backup: ${error.message}`);
    }
  }

  /**
   * Calcula checksum simple para validar integridad del backup
   */
  calculateChecksum(data) {
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Restaura datos v2 desde backup con validación
   */
  async rollbackToV2() {
    try {
      const backupRaw = localStorage.getItem(this.BACKUP_KEY);
      if (!backupRaw) {
        throw new Error('No se encontró backup para rollback');
      }
      
      const backup = JSON.parse(backupRaw);
      
      // Validar integridad del backup
      if (!backup.data || !Array.isArray(backup.data)) {
        throw new Error('Backup corrupto: datos inválidos');
      }
      
      // Validar checksum si está disponible
      if (backup.checksum) {
        const currentChecksum = this.calculateChecksum(backup.data);
        if (currentChecksum !== backup.checksum) {
          console.warn('⚠️ Checksum del backup no coincide, pero continuando con rollback');
        }
      }
      
      this.logMigrationStep(`Iniciando rollback desde backup del ${backup.timestamp}`);
      
      // Restaurar datos v2
      localStorage.setItem(this.V2_STORAGE_KEY, JSON.stringify(backup.data));
      
      // Limpiar datos v3
      dataService.clearAllData();
      
      // Limpiar configuración de migración
      const settings = dataService.getSettings();
      settings.lastMigration = null;
      dataService.updateSettings(settings);
      
      this.logMigrationStep(`Rollback completado - ${backup.employeeCount || backup.data.length} empleados restaurados`);
      
      return {
        success: true,
        message: 'Rollback completado exitosamente',
        restoredEmployees: backup.data.length,
        backupDate: backup.timestamp
      };
      
    } catch (error) {
      this.logMigrationStep(`Error en rollback: ${error.message}`);
      throw error;
    }
  }

  // ==================== TRANSFORMACIÓN DE DATOS ====================

  /**
   * Transforma estructura v2 a v3
   */
  transformV2ToV3(v2Data) {
    const employees = [];
    const modules = [];
    const progress = [];
    const moduleMap = new Map(); // Para evitar duplicados
    
    v2Data.forEach((empleadoV2, index) => {
      // Transformar empleado
      const employee = this.transformEmployee(empleadoV2, index);
      employees.push(employee);
      
      // Extraer y transformar módulos y progreso
      if (empleadoV2.modulos && Array.isArray(empleadoV2.modulos)) {
        empleadoV2.modulos.forEach((moduloV2, moduleIndex) => {
          // Skip modules with empty or invalid names
          if (!moduloV2 || !moduloV2.nombre || typeof moduloV2.nombre !== 'string' || moduloV2.nombre.trim().length === 0) {
            return;
          }
          
          // Transformar módulo (evitar duplicados)
          const moduleId = this.generateModuleId(moduloV2.nombre);
          if (!moduleMap.has(moduleId)) {
            const module = this.transformModule(moduloV2, moduleId, moduleIndex);
            modules.push(module);
            moduleMap.set(moduleId, module);
          }
          
          // Transformar progreso
          const progressRecord = this.transformProgress(employee.id, moduleId, moduloV2);
          progress.push(progressRecord);
        });
      }
    });
    
    return {
      employees,
      modules,
      progress,
      deadlines: [], // Se crearán posteriormente
      certificates: [], // Se generarán cuando se completen módulos
      settings: this.createDefaultSettings()
    };
  }

  /**
   * Transforma empleado v2 a v3
   */
  transformEmployee(empleadoV2, index) {
    return {
      id: empleadoV2.id ? `emp-${empleadoV2.id}` : `emp-migrated-${index + 1}`,
      nombre: empleadoV2.nombre || `Empleado ${index + 1}`,
      area: empleadoV2.area || 'Sin asignar',
      rol: empleadoV2.rol || 'General',
      fechaAlta: empleadoV2.fechaAlta || empleadoV2.fechaIncorporacion || new Date().toISOString().split('T')[0],
      activo: empleadoV2.activo !== undefined ? empleadoV2.activo : true,
      email: empleadoV2.email || ''
    };
  }

  /**
   * Transforma módulo v2 a v3
   */
  transformModule(moduloV2, moduleId, index) {
    return {
      id: moduleId,
      nombre: moduloV2.nombre || `Módulo ${index + 1}`,
      descripcion: moduloV2.descripcion || '',
      horasEstimadas: moduloV2.horasEstimadas || moduloV2.horas || 1,
      obligatorioPorRol: this.inferMandatoryRoles(moduloV2),
      categoria: moduloV2.categoria || this.inferCategory(moduloV2.nombre),
      orden: index + 1
    };
  }

  /**
   * Transforma progreso v2 a v3
   */
  transformProgress(employeeId, moduleId, moduloV2) {
    let estado = 'pendiente';
    let fechaCompletado = null;
    
    if (moduloV2.completado === true || moduloV2.estado === 'completado') {
      estado = 'completado';
      fechaCompletado = moduloV2.fechaCompletado || moduloV2.fechaFinalizacion || new Date().toISOString().split('T')[0];
    } else if (moduloV2.enCurso === true || moduloV2.estado === 'en-curso') {
      estado = 'en-curso';
    }
    
    return {
      empleadoId: employeeId,
      moduloId: moduleId,
      estado,
      fechaInicio: moduloV2.fechaInicio || (estado !== 'pendiente' ? new Date().toISOString().split('T')[0] : null),
      fechaCompletado,
      horasReales: moduloV2.horasReales || null,
      certificadoId: null // Se generará posteriormente
    };
  }

  // ==================== UTILIDADES DE TRANSFORMACIÓN ====================

  /**
   * Genera ID único para módulo basado en nombre
   */
  generateModuleId(nombre) {
    if (!nombre || typeof nombre !== 'string') {
      return 'mod-unnamed';
    }
    
    const normalized = nombre
      .trim()
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // If normalized is empty, use a default
    if (normalized.length === 0) {
      return 'mod-unnamed';
    }
    
    return `mod-${normalized}`;
  }

  /**
   * Infiere roles obligatorios basado en datos históricos
   */
  inferMandatoryRoles(moduloV2) {
    const nombre = (moduloV2.nombre || '').toLowerCase();
    
    // Reglas de inferencia basadas en nombres comunes
    if (nombre.includes('seguridad') || nombre.includes('riesgo')) {
      return ['Técnico', 'Comercial'];
    }
    if (nombre.includes('ventas') || nombre.includes('comercial')) {
      return ['Comercial'];
    }
    if (nombre.includes('técnico') || nombre.includes('instalación')) {
      return ['Técnico'];
    }
    if (nombre.includes('administr') || nombre.includes('gestión')) {
      return ['Administrativo'];
    }
    
    // Por defecto, aplicable a todos los roles
    return ['Técnico', 'Comercial', 'Administrativo'];
  }

  /**
   * Infiere categoría basada en nombre del módulo
   */
  inferCategory(nombre) {
    const nombreLower = (nombre || '').toLowerCase();
    
    if (nombreLower.includes('seguridad') || nombreLower.includes('riesgo')) {
      return 'Seguridad';
    }
    if (nombreLower.includes('ventas') || nombreLower.includes('comercial')) {
      return 'Comercial';
    }
    if (nombreLower.includes('técnico') || nombreLower.includes('instalación')) {
      return 'Técnico';
    }
    if (nombreLower.includes('calidad') || nombreLower.includes('proceso')) {
      return 'Calidad';
    }
    
    return 'General';
  }

  /**
   * Crea configuración por defecto para v3
   */
  createDefaultSettings() {
    return {
      version: '3.0.0',
      lastMigration: new Date().toISOString(),
      roles: ['Técnico', 'Comercial', 'Administrativo'],
      areas: ['Ventas', 'Técnico', 'Administración']
    };
  }

  // ==================== VALIDACIÓN ====================

  /**
   * Valida que la migración sea correcta
   */
  validateMigration(v3Data, v2Data) {
    try {
      // Validar que no se perdieron empleados
      if (v3Data.employees.length !== v2Data.length) {
        console.error(`Número de empleados no coincide: v2=${v2Data.length}, v3=${v3Data.employees.length}`);
        return false;
      }
      
      // Validar que todos los empleados tienen ID
      const employeesWithoutId = v3Data.employees.filter(emp => !emp.id || !emp.nombre);
      if (employeesWithoutId.length > 0) {
        console.error('Empleados sin ID o nombre:', employeesWithoutId);
        return false;
      }
      
      // Validar que todos los módulos tienen ID
      const modulesWithoutId = v3Data.modules.filter(mod => !mod.id || !mod.nombre);
      if (modulesWithoutId.length > 0) {
        console.error('Módulos sin ID o nombre:', modulesWithoutId);
        return false;
      }
      
      // Validar que el progreso referencia empleados y módulos válidos
      const employeeIds = new Set(v3Data.employees.map(emp => emp.id));
      const moduleIds = new Set(v3Data.modules.map(mod => mod.id));
      
      const invalidProgress = v3Data.progress.filter(prog => 
        !employeeIds.has(prog.empleadoId) || !moduleIds.has(prog.moduloId)
      );
      
      if (invalidProgress.length > 0) {
        console.error('Progreso con referencias inválidas:', invalidProgress);
        return false;
      }
      
      // Validar estructura de datos
      const requiredEmployeeFields = ['id', 'nombre', 'area', 'rol', 'fechaAlta', 'activo'];
      const requiredModuleFields = ['id', 'nombre', 'horasEstimadas', 'obligatorioPorRol', 'categoria'];
      const requiredProgressFields = ['empleadoId', 'moduloId', 'estado'];
      
      const invalidEmployees = v3Data.employees.filter(emp => 
        !requiredEmployeeFields.every(field => emp.hasOwnProperty(field))
      );
      
      const invalidModules = v3Data.modules.filter(mod => 
        !requiredModuleFields.every(field => mod.hasOwnProperty(field))
      );
      
      const invalidProgressRecords = v3Data.progress.filter(prog => 
        !requiredProgressFields.every(field => prog.hasOwnProperty(field))
      );
      
      if (invalidEmployees.length > 0 || invalidModules.length > 0 || invalidProgressRecords.length > 0) {
        console.error('Datos con campos faltantes:', {
          invalidEmployees,
          invalidModules,
          invalidProgressRecords
        });
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Error en validación:', error);
      return false;
    }
  }

  // ==================== GUARDADO Y FINALIZACIÓN ====================

  /**
   * Guarda datos v3 en localStorage
   */
  saveV3Data(v3Data) {
    // Importar todos los datos usando dataService
    dataService.importAllData(v3Data);
    
    // Actualizar configuración
    dataService.updateSettings(v3Data.settings);
  }

  /**
   * Marca la migración como completada
   */
  markMigrationComplete() {
    const settings = dataService.getSettings();
    settings.lastMigration = new Date().toISOString();
    dataService.updateSettings(settings);
  }

  // ==================== LOGGING ====================

  /**
   * Registra pasos de migración para debugging
   */
  logMigrationStep(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(logEntry);
    
    // Guardar en localStorage para debugging
    const existingLog = localStorage.getItem(this.MIGRATION_LOG_KEY) || '';
    const newLog = existingLog + logEntry + '\n';
    localStorage.setItem(this.MIGRATION_LOG_KEY, newLog);
  }

  /**
   * Obtiene log de migración
   */
  getMigrationLog() {
    return localStorage.getItem(this.MIGRATION_LOG_KEY) || '';
  }

  /**
   * Limpia log de migración
   */
  clearMigrationLog() {
    localStorage.removeItem(this.MIGRATION_LOG_KEY);
  }

  // ==================== UTILIDADES PÚBLICAS ====================

  /**
   * Inicializa la aplicación con detección y migración automática
   */
  async initializeApp() {
    try {
      const status = this.getMigrationStatus();
      
      // Si hay datos v2 y no se ha migrado, ejecutar migración automática
      if (status.needsMigration) {
        console.log('🔄 Iniciando migración automática v2 → v3...');
        const result = await this.migrateFromV2ToV3();
        
        if (result.success) {
          console.log('✅ Migración automática completada exitosamente');
        } else {
          console.error('❌ Error en migración automática:', result.message);
        }
        
        return result;
      }
      
      // Si ya hay datos v3, verificar integridad
      if (status.hasV3Data) {
        const employees = dataService.getEmployees();
        const modules = dataService.getModules();
        
        console.log(`✅ Aplicación inicializada con ${employees.length} empleados y ${modules.length} módulos`);
        
        return {
          success: true,
          message: 'Aplicación inicializada correctamente',
          hasData: true,
          employees: employees.length,
          modules: modules.length
        };
      }
      
      // No hay datos, aplicación nueva
      console.log('📝 Aplicación nueva - no hay datos existentes');
      return {
        success: true,
        message: 'Aplicación nueva inicializada',
        hasData: false
      };
      
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      return {
        success: false,
        message: `Error inicializando aplicación: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Obtiene información del estado de migración
   */
  getMigrationStatus() {
    const hasV2Data = !!this.detectV2Data();
    const hasV3Data = dataService.getEmployees().length > 0;
    const settings = dataService.getSettings();
    const lastMigration = settings.lastMigration;
    
    return {
      hasV2Data,
      hasV3Data,
      lastMigration,
      needsMigration: this.needsMigration(),
      canRollback: !!localStorage.getItem(this.BACKUP_KEY)
    };
  }

  /**
   * Limpia todos los datos de migración (para testing)
   */
  clearMigrationData() {
    localStorage.removeItem(this.BACKUP_KEY);
    localStorage.removeItem(this.MIGRATION_LOG_KEY);
  }
}

// Exportar instancia singleton
const migrationService = new MigrationService();
export default migrationService;