/**
 * DataService - Servicio optimizado para operaciones CRUD en localStorage v3
 * 
 * Maneja la estructura de datos separada para optimizar rendimiento:
 * - sonepar-formacion-v3-employees
 * - sonepar-formacion-v3-modules  
 * - sonepar-formacion-v3-progress
 * - sonepar-formacion-v3-deadlines
 * - sonepar-formacion-v3-certificates
 * - sonepar-formacion-v3-settings
 */

class DataService {
  constructor() {
    this.STORAGE_KEYS = {
      employees: 'sonepar-formacion-v3-employees',
      modules: 'sonepar-formacion-v3-modules',
      progress: 'sonepar-formacion-v3-progress',
      deadlines: 'sonepar-formacion-v3-deadlines',
      certificates: 'sonepar-formacion-v3-certificates',
      settings: 'sonepar-formacion-v3-settings'
    };

    // Cache para memoización
    this._cache = new Map();
    this._cacheTimestamps = new Map();
    this.CACHE_TTL = 5000; // 5 segundos
  }

  // ==================== OPERACIONES BÁSICAS ====================

  /**
   * Obtiene datos de localStorage con cache
   */
  _getData(key) {
    const cacheKey = `get_${key}`;
    const now = Date.now();
    
    // Verificar cache
    if (this._cache.has(cacheKey)) {
      const timestamp = this._cacheTimestamps.get(cacheKey);
      if (now - timestamp < this.CACHE_TTL) {
        return this._cache.get(cacheKey);
      }
    }

    // Obtener datos frescos
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Actualizar cache
    this._cache.set(cacheKey, data);
    this._cacheTimestamps.set(cacheKey, now);
    
    return data;
  }

  /**
   * Guarda datos en localStorage e invalida cache
   */
  _setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    
    // Invalidar cache relacionado
    const cacheKey = `get_${key}`;
    this._cache.delete(cacheKey);
    this._cacheTimestamps.delete(cacheKey);
    
    // Invalidar caches de cálculos que dependen de estos datos
    this._invalidateCalculationCaches();
  }

  /**
   * Invalida caches de cálculos memoizados
   */
  _invalidateCalculationCaches() {
    const calculationKeys = Array.from(this._cache.keys())
      .filter(key => key.startsWith('calc_'));
    
    calculationKeys.forEach(key => {
      this._cache.delete(key);
      this._cacheTimestamps.delete(key);
    });
  }

  // ==================== EMPLEADOS ====================

  getEmployees() {
    return this._getData(this.STORAGE_KEYS.employees);
  }

  getEmployee(id) {
    const employees = this.getEmployees();
    return employees.find(emp => emp.id === id);
  }

  addEmployee(employee) {
    const employees = this.getEmployees();
    const newEmployee = {
      id: employee.id || `emp-${Date.now()}`,
      nombre: employee.nombre,
      area: employee.area,
      rol: employee.rol,
      fechaAlta: employee.fechaAlta || new Date().toISOString().split('T')[0],
      activo: employee.activo !== undefined ? employee.activo : true,
      email: employee.email || ''
    };
    
    employees.push(newEmployee);
    this._setData(this.STORAGE_KEYS.employees, employees);
    return newEmployee;
  }

  updateEmployee(id, updates) {
    const employees = this.getEmployees();
    const index = employees.findIndex(emp => emp.id === id);
    
    if (index === -1) {
      throw new Error(`Empleado con ID ${id} no encontrado`);
    }
    
    employees[index] = { ...employees[index], ...updates };
    this._setData(this.STORAGE_KEYS.employees, employees);
    return employees[index];
  }

  deleteEmployee(id) {
    const employees = this.getEmployees();
    const filteredEmployees = employees.filter(emp => emp.id !== id);
    
    if (employees.length === filteredEmployees.length) {
      throw new Error(`Empleado con ID ${id} no encontrado`);
    }
    
    this._setData(this.STORAGE_KEYS.employees, filteredEmployees);
    
    // Limpiar datos relacionados
    this._cleanupEmployeeData(id);
  }

  _cleanupEmployeeData(employeeId) {
    // Limpiar progreso
    const progress = this.getProgress();
    const filteredProgress = progress.filter(p => p.empleadoId !== employeeId);
    this._setData(this.STORAGE_KEYS.progress, filteredProgress);
    
    // Limpiar vencimientos
    const deadlines = this.getDeadlines();
    const filteredDeadlines = deadlines.filter(d => d.empleadoId !== employeeId);
    this._setData(this.STORAGE_KEYS.deadlines, filteredDeadlines);
    
    // Limpiar certificados
    const certificates = this.getCertificates();
    const filteredCertificates = certificates.filter(c => c.empleadoId !== employeeId);
    this._setData(this.STORAGE_KEYS.certificates, filteredCertificates);
  }

  // ==================== MÓDULOS ====================

  getModules() {
    return this._getData(this.STORAGE_KEYS.modules);
  }

  getModule(id) {
    const modules = this.getModules();
    return modules.find(mod => mod.id === id);
  }

  addModule(module) {
    const modules = this.getModules();
    const newModule = {
      id: module.id || `mod-${Date.now()}`,
      nombre: module.nombre,
      descripcion: module.descripcion || '',
      horasEstimadas: module.horasEstimadas || 1,
      obligatorioPorRol: module.obligatorioPorRol || [],
      categoria: module.categoria || 'General',
      orden: module.orden || modules.length + 1
    };
    
    modules.push(newModule);
    this._setData(this.STORAGE_KEYS.modules, modules);
    return newModule;
  }

  updateModule(id, updates) {
    const modules = this.getModules();
    const index = modules.findIndex(mod => mod.id === id);
    
    if (index === -1) {
      throw new Error(`Módulo con ID ${id} no encontrado`);
    }
    
    modules[index] = { ...modules[index], ...updates };
    this._setData(this.STORAGE_KEYS.modules, modules);
    return modules[index];
  }

  deleteModule(id) {
    const modules = this.getModules();
    const filteredModules = modules.filter(mod => mod.id !== id);
    
    if (modules.length === filteredModules.length) {
      throw new Error(`Módulo con ID ${id} no encontrado`);
    }
    
    this._setData(this.STORAGE_KEYS.modules, filteredModules);
    
    // Limpiar datos relacionados
    this._cleanupModuleData(id);
  }

  _cleanupModuleData(moduleId) {
    // Limpiar progreso
    const progress = this.getProgress();
    const filteredProgress = progress.filter(p => p.moduloId !== moduleId);
    this._setData(this.STORAGE_KEYS.progress, filteredProgress);
    
    // Limpiar vencimientos
    const deadlines = this.getDeadlines();
    const filteredDeadlines = deadlines.filter(d => d.moduloId !== moduleId);
    this._setData(this.STORAGE_KEYS.deadlines, filteredDeadlines);
    
    // Limpiar certificados
    const certificates = this.getCertificates();
    const filteredCertificates = certificates.filter(c => c.moduloId !== moduleId);
    this._setData(this.STORAGE_KEYS.certificates, filteredCertificates);
  }

  // ==================== PROGRESO ====================

  getProgress() {
    return this._getData(this.STORAGE_KEYS.progress);
  }

  getEmployeeProgress(employeeId) {
    const progress = this.getProgress();
    return progress.filter(p => p.empleadoId === employeeId);
  }

  getModuleProgress(moduleId) {
    const progress = this.getProgress();
    return progress.filter(p => p.moduloId === moduleId);
  }

  getProgressRecord(employeeId, moduleId) {
    const progress = this.getProgress();
    return progress.find(p => p.empleadoId === employeeId && p.moduloId === moduleId);
  }

  updateProgress(employeeId, moduleId, progressData) {
    const progress = this.getProgress();
    const existingIndex = progress.findIndex(
      p => p.empleadoId === employeeId && p.moduloId === moduleId
    );
    
    const progressRecord = {
      empleadoId,
      moduloId,
      estado: progressData.estado || 'pendiente',
      fechaInicio: progressData.fechaInicio,
      fechaCompletado: progressData.fechaCompletado,
      horasReales: progressData.horasReales,
      certificadoId: progressData.certificadoId
    };
    
    if (existingIndex >= 0) {
      progress[existingIndex] = { ...progress[existingIndex], ...progressRecord };
    } else {
      progress.push(progressRecord);
    }
    
    this._setData(this.STORAGE_KEYS.progress, progress);
    return progressRecord;
  }

  // ==================== VENCIMIENTOS ====================

  getDeadlines() {
    return this._getData(this.STORAGE_KEYS.deadlines);
  }

  getEmployeeDeadlines(employeeId) {
    const deadlines = this.getDeadlines();
    return deadlines.filter(d => d.empleadoId === employeeId);
  }

  addDeadline(deadline) {
    const deadlines = this.getDeadlines();
    const newDeadline = {
      empleadoId: deadline.empleadoId,
      moduloId: deadline.moduloId,
      fechaLimite: deadline.fechaLimite,
      tipo: deadline.tipo || 'obligatorio',
      notificado: deadline.notificado || false
    };
    
    // Verificar si ya existe
    const existingIndex = deadlines.findIndex(
      d => d.empleadoId === deadline.empleadoId && d.moduloId === deadline.moduloId
    );
    
    if (existingIndex >= 0) {
      deadlines[existingIndex] = newDeadline;
    } else {
      deadlines.push(newDeadline);
    }
    
    this._setData(this.STORAGE_KEYS.deadlines, deadlines);
    return newDeadline;
  }

  // ==================== CERTIFICADOS ====================

  getCertificates() {
    return this._getData(this.STORAGE_KEYS.certificates);
  }

  getEmployeeCertificates(employeeId) {
    const certificates = this.getCertificates();
    return certificates.filter(c => c.empleadoId === employeeId);
  }

  addCertificate(certificate) {
    const certificates = this.getCertificates();
    const newCertificate = {
      id: certificate.id || `cert-${Date.now()}`,
      empleadoId: certificate.empleadoId,
      moduloId: certificate.moduloId,
      fechaGeneracion: certificate.fechaGeneracion || new Date().toISOString().split('T')[0],
      validador: certificate.validador || 'Sistema Automático',
      pdfPath: certificate.pdfPath
    };
    
    certificates.push(newCertificate);
    this._setData(this.STORAGE_KEYS.certificates, certificates);
    return newCertificate;
  }

  // ==================== CONFIGURACIÓN ====================

  getSettings() {
    const defaultSettings = {
      version: '3.0.0',
      lastMigration: null,
      roles: ['Técnico', 'Comercial', 'Administrativo'],
      areas: ['Ventas', 'Técnico', 'Administración']
    };
    
    const settings = localStorage.getItem(this.STORAGE_KEYS.settings);
    return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
  }

  updateSettings(updates) {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    localStorage.setItem(this.STORAGE_KEYS.settings, JSON.stringify(newSettings));
    return newSettings;
  }

  // ==================== CÁLCULOS MEMOIZADOS ====================

  /**
   * Calcula métricas del equipo con memoización
   */
  getTeamMetrics() {
    const cacheKey = 'calc_team_metrics';
    const now = Date.now();
    
    // Verificar cache
    if (this._cache.has(cacheKey)) {
      const timestamp = this._cacheTimestamps.get(cacheKey);
      if (now - timestamp < this.CACHE_TTL) {
        return this._cache.get(cacheKey);
      }
    }

    // Calcular métricas
    const employees = this.getEmployees().filter(emp => emp.activo);
    const modules = this.getModules();
    const progress = this.getProgress();
    const deadlines = this.getDeadlines();

    const metrics = this._calculateTeamMetrics(employees, modules, progress, deadlines);
    
    // Guardar en cache
    this._cache.set(cacheKey, metrics);
    this._cacheTimestamps.set(cacheKey, now);
    
    return metrics;
  }

  _calculateTeamMetrics(employees, modules, progress, deadlines) {
    const totalEmployees = employees.length;
    
    if (totalEmployees === 0) {
      return {
        completionPercentage: 0,
        pendingModules: 0,
        upToDateEmployees: 0,
        totalEmployees: 0,
        urgentModules: 0,
        completionTrend: 0
      };
    }

    // Calcular módulos obligatorios por empleado
    let totalMandatoryModules = 0;
    let completedMandatoryModules = 0;
    let upToDateEmployees = 0;

    employees.forEach(employee => {
      const mandatoryModules = modules.filter(module => 
        module.obligatorioPorRol.includes(employee.rol)
      );
      
      const employeeProgress = progress.filter(p => p.empleadoId === employee.id);
      const completedModules = employeeProgress.filter(p => p.estado === 'completado');
      
      const employeeMandatoryCompleted = mandatoryModules.filter(module =>
        completedModules.some(p => p.moduloId === module.id)
      ).length;
      
      totalMandatoryModules += mandatoryModules.length;
      completedMandatoryModules += employeeMandatoryCompleted;
      
      // Empleado al día si completó todos sus módulos obligatorios
      if (employeeMandatoryCompleted === mandatoryModules.length) {
        upToDateEmployees++;
      }
    });

    // Calcular módulos pendientes y urgentes
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    let pendingModules = 0;
    let urgentModules = 0;

    deadlines.forEach(deadline => {
      const progressRecord = progress.find(p => 
        p.empleadoId === deadline.empleadoId && p.moduloId === deadline.moduloId
      );
      
      if (!progressRecord || progressRecord.estado !== 'completado') {
        pendingModules++;
        
        const deadlineDate = new Date(deadline.fechaLimite);
        if (deadlineDate <= sevenDaysFromNow) {
          urgentModules++;
        }
      }
    });

    return {
      completionPercentage: totalMandatoryModules > 0 
        ? Math.round((completedMandatoryModules / totalMandatoryModules) * 100)
        : 0,
      pendingModules,
      upToDateEmployees,
      totalEmployees,
      urgentModules,
      completionTrend: 0 // Se calculará comparando con datos históricos
    };
  }

  /**
   * Obtiene próximos vencimientos con memoización
   */
  getUpcomingDeadlines(days = 7) {
    const cacheKey = `calc_upcoming_deadlines_${days}`;
    const now = Date.now();
    
    // Verificar cache
    if (this._cache.has(cacheKey)) {
      const timestamp = this._cacheTimestamps.get(cacheKey);
      if (now - timestamp < this.CACHE_TTL) {
        return this._cache.get(cacheKey);
      }
    }

    // Calcular vencimientos
    const deadlines = this.getDeadlines();
    const progress = this.getProgress();
    const employees = this.getEmployees();
    const modules = this.getModules();
    
    const upcomingDeadlines = this._calculateUpcomingDeadlines(
      deadlines, progress, employees, modules, days
    );
    
    // Guardar en cache
    this._cache.set(cacheKey, upcomingDeadlines);
    this._cacheTimestamps.set(cacheKey, now);
    
    return upcomingDeadlines;
  }

  _calculateUpcomingDeadlines(deadlines, progress, employees, modules, days) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return deadlines
      .filter(deadline => {
        // Solo vencimientos no completados
        const progressRecord = progress.find(p => 
          p.empleadoId === deadline.empleadoId && p.moduloId === deadline.moduloId
        );
        
        if (progressRecord && progressRecord.estado === 'completado') {
          return false;
        }
        
        // Solo vencimientos en el rango de días especificado
        const deadlineDate = new Date(deadline.fechaLimite);
        return deadlineDate >= now && deadlineDate <= futureDate;
      })
      .map(deadline => {
        const employee = employees.find(emp => emp.id === deadline.empleadoId);
        const module = modules.find(mod => mod.id === deadline.moduloId);
        const deadlineDate = new Date(deadline.fechaLimite);
        const daysRemaining = Math.ceil((deadlineDate - now) / (24 * 60 * 60 * 1000));
        
        return {
          ...deadline,
          empleadoNombre: employee?.nombre || 'Desconocido',
          moduloNombre: module?.nombre || 'Desconocido',
          diasRestantes: daysRemaining,
          urgente: daysRemaining <= 3
        };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  // ==================== UTILIDADES ====================

  /**
   * Limpia todos los datos (para testing)
   */
  clearAllData() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this._cache.clear();
    this._cacheTimestamps.clear();
  }

  /**
   * Exporta todos los datos
   */
  exportAllData() {
    const data = {};
    Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = this._getData(key);
    });
    return data;
  }

  /**
   * Importa todos los datos
   */
  importAllData(data) {
    Object.entries(data).forEach(([name, values]) => {
      if (this.STORAGE_KEYS[name]) {
        this._setData(this.STORAGE_KEYS[name], values);
      }
    });
  }
}

// Exportar instancia singleton
const dataService = new DataService();
export default dataService;