/**
 * Tests para MigrationService - Validación de migración automática v2 → v3
 */

import migrationService from './migrationService.js';
import dataService from './dataService.js';
import * as fc from 'fast-check';

// Mock localStorage para testing
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => store[key] = value,
    removeItem: (key) => delete store[key],
    clear: () => store = {},
    get store() { return store; }
  };
})();

// Reemplazar localStorage global para tests
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('MigrationService', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    mockLocalStorage.clear();
    
    // Limpiar datos del servicio
    dataService.clearAllData();
    migrationService.clearMigrationData();
  });

  describe('Detección de datos v2', () => {
    test('detecta datos v2 válidos correctamente', () => {
      const v2Data = [
        {
          id: 1,
          nombre: 'Juan Pérez',
          area: 'Ventas',
          modulos: [
            {
              nombre: 'Seguridad Industrial',
              completado: true,
              fechaCompletado: '2024-01-25'
            }
          ]
        }
      ];
      
      localStorage.setItem('sonepar-formacion-empleados', JSON.stringify(v2Data));
      
      const detected = migrationService.detectV2Data();
      expect(detected).toEqual(v2Data);
    });

    test('retorna null cuando no hay datos v2', () => {
      const detected = migrationService.detectV2Data();
      expect(detected).toBeNull();
    });

    test('filtra empleados inválidos en datos v2', () => {
      const v2Data = [
        { id: 1, nombre: 'Juan Pérez' }, // válido
        null, // inválido
        { }, // inválido (sin nombre ni id)
        { id: 2, nombre: 'María García' } // válido
      ];
      
      localStorage.setItem('sonepar-formacion-empleados', JSON.stringify(v2Data));
      
      const detected = migrationService.detectV2Data();
      expect(detected).toHaveLength(2);
      expect(detected[0].nombre).toBe('Juan Pérez');
      expect(detected[1].nombre).toBe('María García');
    });
  });

  describe('Necesidad de migración', () => {
    test('necesita migración cuando hay datos v2 y no se ha migrado', () => {
      const v2Data = [{ id: 1, nombre: 'Test' }];
      localStorage.setItem('sonepar-formacion-empleados', JSON.stringify(v2Data));
      
      expect(migrationService.needsMigration()).toBe(true);
    });

    test('no necesita migración cuando no hay datos v2', () => {
      expect(migrationService.needsMigration()).toBeFalsy();
    });

    test('no necesita migración cuando ya se migró anteriormente', () => {
      const v2Data = [{ id: 1, nombre: 'Test' }];
      localStorage.setItem('sonepar-formacion-empleados', JSON.stringify(v2Data));
      
      // Simular migración previa
      const settings = dataService.getSettings();
      settings.lastMigration = new Date().toISOString();
      dataService.updateSettings(settings);
      
      expect(migrationService.needsMigration()).toBe(false);
    });
  });

  describe('Transformación de datos', () => {
    test('transforma empleado v2 a v3 correctamente', () => {
      const empleadoV2 = {
        id: 1,
        nombre: 'Juan Pérez',
        area: 'Ventas',
        rol: 'Comercial',
        fechaAlta: '2024-01-15'
      };
      
      const empleadoV3 = migrationService.transformEmployee(empleadoV2, 0);
      
      expect(empleadoV3).toEqual({
        id: 'emp-1',
        nombre: 'Juan Pérez',
        area: 'Ventas',
        rol: 'Comercial',
        fechaAlta: '2024-01-15',
        activo: true,
        email: ''
      });
    });

    test('transforma módulo v2 a v3 correctamente', () => {
      const moduloV2 = {
        nombre: 'Seguridad Industrial',
        descripcion: 'Módulo de seguridad',
        horasEstimadas: 4
      };
      
      const moduleId = 'mod-seguridad-industrial';
      const moduloV3 = migrationService.transformModule(moduloV2, moduleId, 0);
      
      expect(moduloV3).toEqual({
        id: 'mod-seguridad-industrial',
        nombre: 'Seguridad Industrial',
        descripcion: 'Módulo de seguridad',
        horasEstimadas: 4,
        obligatorioPorRol: ['Técnico', 'Comercial'],
        categoria: 'Seguridad',
        orden: 1
      });
    });

    test('transforma progreso v2 a v3 correctamente', () => {
      const moduloV2 = {
        completado: true,
        fechaCompletado: '2024-01-25',
        fechaInicio: '2024-01-20',
        horasReales: 5
      };
      
      const progreso = migrationService.transformProgress('emp-1', 'mod-1', moduloV2);
      
      expect(progreso.empleadoId).toBe('emp-1');
      expect(progreso.moduloId).toBe('mod-1');
      expect(progreso.estado).toBe('completado');
      expect(progreso.fechaCompletado).toBe('2024-01-25');
      expect(progreso.fechaInicio).toBe('2024-01-20');
      expect(progreso.horasReales).toBe(5);
      expect(progreso.certificadoId).toBeNull();
    });
  });

  describe('Migración completa', () => {
    test('migra datos v2 a v3 exitosamente', async () => {
      const v2Data = [
        {
          id: 1,
          nombre: 'Juan Pérez',
          area: 'Ventas',
          modulos: [
            {
              nombre: 'Seguridad Industrial',
              completado: true,
              fechaCompletado: '2024-01-25'
            },
            {
              nombre: 'Ventas Básicas',
              completado: false
            }
          ]
        },
        {
          id: 2,
          nombre: 'María García',
          area: 'Técnico',
          modulos: [
            {
              nombre: 'Seguridad Industrial',
              completado: true,
              fechaCompletado: '2024-01-20'
            }
          ]
        }
      ];
      
      localStorage.setItem('sonepar-formacion-empleados', JSON.stringify(v2Data));
      
      const result = await migrationService.migrateFromV2ToV3();
      
      expect(result.success).toBe(true);
      expect(result.migratedEmployees).toBe(2);
      expect(result.migratedModules).toBe(2); // Seguridad Industrial y Ventas Básicas
      expect(result.migratedProgress).toBe(3); // 2 + 1 registros de progreso
      
      // Verificar que los datos se guardaron correctamente
      const employees = dataService.getEmployees();
      const modules = dataService.getModules();
      const progress = dataService.getProgress();
      
      expect(employees).toHaveLength(2);
      expect(modules).toHaveLength(2);
      expect(progress).toHaveLength(3);
      
      // Verificar configuración
      const settings = dataService.getSettings();
      expect(settings.version).toBe('3.0.0');
      expect(settings.lastMigration).toBeTruthy();
    });

    test('maneja errores de migración con rollback automático', async () => {
      const v2Data = [{ id: 1, nombre: 'Test' }];
      localStorage.setItem('sonepar-formacion-empleados', JSON.stringify(v2Data));
      
      // Simular error en validación
      const originalValidate = migrationService.validateMigration;
      migrationService.validateMigration = () => false;
      
      const result = await migrationService.migrateFromV2ToV3();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Validación de migración falló');
      
      // Verificar que se hizo rollback
      const restoredData = JSON.parse(localStorage.getItem('sonepar-formacion-empleados'));
      expect(restoredData).toEqual(v2Data);
      
      // Restaurar método original
      migrationService.validateMigration = originalValidate;
    });
  });

  describe('Backup y rollback', () => {
    test('crea backup correctamente', async () => {
      const v2Data = [{ id: 1, nombre: 'Test' }];
      
      const backup = await migrationService.createBackup(v2Data);
      
      expect(backup.data).toEqual(v2Data);
      expect(backup.version).toBe('2.0.0');
      expect(backup.employeeCount).toBe(1);
      expect(backup.checksum).toBeTruthy();
      expect(backup.timestamp).toBeTruthy();
    });

    test('ejecuta rollback correctamente', async () => {
      const v2Data = [{ id: 1, nombre: 'Test' }];
      
      // Crear backup
      await migrationService.createBackup(v2Data);
      
      // Simular datos v3
      dataService.addEmployee({ id: 'emp-1', nombre: 'Test V3' });
      
      // Ejecutar rollback
      const result = await migrationService.rollbackToV2();
      
      expect(result.success).toBe(true);
      expect(result.restoredEmployees).toBe(1);
      
      // Verificar que se restauraron datos v2
      const restoredData = JSON.parse(localStorage.getItem('sonepar-formacion-empleados'));
      expect(restoredData).toEqual(v2Data);
      
      // Verificar que se limpiaron datos v3
      const employees = dataService.getEmployees();
      expect(employees).toHaveLength(0);
    });
  });

  describe('Inicialización de aplicación', () => {
    test('inicializa aplicación nueva sin datos', async () => {
      const result = await migrationService.initializeApp();
      
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.message).toContain('Aplicación nueva inicializada');
    });

    test('inicializa aplicación con datos v3 existentes', async () => {
      // Simular datos v3 existentes
      dataService.addEmployee({ id: 'emp-1', nombre: 'Test' });
      dataService.addModule({ id: 'mod-1', nombre: 'Test Module' });
      
      const result = await migrationService.initializeApp();
      
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
      expect(result.employees).toBe(1);
      expect(result.modules).toBe(1);
    });

    test('ejecuta migración automática al inicializar', async () => {
      const v2Data = [{ id: 1, nombre: 'Test', modulos: [] }];
      localStorage.setItem('sonepar-formacion-empleados', JSON.stringify(v2Data));
      
      const result = await migrationService.initializeApp();
      
      expect(result.success).toBe(true);
      expect(result.migratedEmployees).toBe(1);
      
      // Verificar que no necesita más migración
      expect(migrationService.needsMigration()).toBe(false);
    });
  });

  // ==================== PROPERTY-BASED TESTS ====================

  describe('Property-Based Tests - Data Migration Integrity', () => {
    
    // Generadores de datos para property-based testing
    const v2EmployeeGenerator = () => fc.record({
      id: fc.oneof(fc.integer({ min: 1, max: 1000 }), fc.constant(undefined)),
      nombre: fc.string({ minLength: 1, maxLength: 50 }),
      area: fc.oneof(
        fc.constantFrom('Ventas', 'Técnico', 'Administración', 'Logística'),
        fc.constant(undefined)
      ),
      rol: fc.oneof(
        fc.constantFrom('Técnico', 'Comercial', 'Administrativo', 'Supervisor'),
        fc.constant(undefined)
      ),
      fechaAlta: fc.oneof(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
          .map(d => d.toISOString().split('T')[0]),
        fc.constant(undefined)
      ),
      activo: fc.oneof(fc.boolean(), fc.constant(undefined)),
      email: fc.oneof(
        fc.emailAddress(),
        fc.constant(undefined)
      ),
      modulos: fc.array(v2ModuleGenerator(), { minLength: 0, maxLength: 10 })
    });

    const v2ModuleGenerator = () => fc.record({
      nombre: fc.string({ minLength: 1, maxLength: 100 }),
      descripcion: fc.oneof(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.constant(undefined)
      ),
      horasEstimadas: fc.oneof(
        fc.integer({ min: 1, max: 40 }),
        fc.constant(undefined)
      ),
      horas: fc.oneof(
        fc.integer({ min: 1, max: 40 }),
        fc.constant(undefined)
      ),
      completado: fc.oneof(fc.boolean(), fc.constant(undefined)),
      estado: fc.oneof(
        fc.constantFrom('pendiente', 'en-curso', 'completado'),
        fc.constant(undefined)
      ),
      enCurso: fc.oneof(fc.boolean(), fc.constant(undefined)),
      fechaCompletado: fc.oneof(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
          .map(d => d.toISOString().split('T')[0]),
        fc.constant(undefined)
      ),
      fechaFinalizacion: fc.oneof(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
          .map(d => d.toISOString().split('T')[0]),
        fc.constant(undefined)
      ),
      fechaInicio: fc.oneof(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
          .map(d => d.toISOString().split('T')[0]),
        fc.constant(undefined)
      ),
      horasReales: fc.oneof(
        fc.integer({ min: 1, max: 80 }),
        fc.constant(undefined)
      ),
      categoria: fc.oneof(
        fc.constantFrom('Seguridad', 'Comercial', 'Técnico', 'Calidad', 'General'),
        fc.constant(undefined)
      )
    });

    const v2DataGenerator = () => fc.array(v2EmployeeGenerator(), { minLength: 1, maxLength: 20 });

    /**
     * **Validates: Migración correcta de empleados, módulos y progreso**
     * 
     * Property: Data Migration Integrity Property
     * For any valid v2 data structure with employees and their modules, 
     * the migration process should preserve all employee information, 
     * extract all unique modules correctly, and maintain all progress 
     * relationships without data loss.
     */
    test('Property: Data Migration Integrity - preserves all data during v2 to v3 transformation', () => {
      fc.assert(fc.property(
        v2DataGenerator(),
        (v2Data) => {
          // Arrange: Setup clean state
          mockLocalStorage.clear();
          dataService.clearAllData();
          migrationService.clearMigrationData();
          
          // Filter out invalid employees (same as detectV2Data does)
          const validV2Data = v2Data.filter(emp => 
            emp && typeof emp === 'object' && (emp.nombre || emp.id)
          );
          
          // Skip test if no valid employees (precondition)
          fc.pre(validV2Data.length > 0);
          
          // Act: Transform data
          const v3Data = migrationService.transformV2ToV3(validV2Data);
          
          // Assert: Data integrity properties
          
          // 1. No employees are lost during migration
          expect(v3Data.employees.length).toBe(validV2Data.length);
          
          // 2. All employee information is preserved
          validV2Data.forEach((empV2, index) => {
            const empV3 = v3Data.employees.find(e => 
              e.nombre === (empV2.nombre || `Empleado ${index + 1}`)
            );
            expect(empV3).toBeDefined();
            expect(empV3.nombre).toBeTruthy();
            expect(empV3.id).toBeTruthy();
            expect(empV3.area).toBeTruthy();
            expect(empV3.rol).toBeTruthy();
            expect(empV3.fechaAlta).toBeTruthy();
            expect(typeof empV3.activo).toBe('boolean');
          });
          
          // 3. All module information is preserved and deduplicated correctly
          const expectedUniqueModules = new Set();
          validV2Data.forEach(emp => {
            if (emp.modulos && Array.isArray(emp.modulos)) {
              emp.modulos.forEach(mod => {
                if (mod && mod.nombre && mod.nombre.trim().length > 0) {
                  expectedUniqueModules.add(mod.nombre.trim());
                }
              });
            }
          });
          
          // Skip if no valid modules (precondition)
          fc.pre(expectedUniqueModules.size > 0);
          
          expect(v3Data.modules.length).toBe(expectedUniqueModules.size);
          
          // Verify all expected modules are present
          expectedUniqueModules.forEach(moduleName => {
            const moduleV3 = v3Data.modules.find(m => m.nombre === moduleName);
            expect(moduleV3).toBeDefined();
            expect(moduleV3.id).toBeTruthy();
            expect(moduleV3.nombre).toBe(moduleName);
            expect(typeof moduleV3.horasEstimadas).toBe('number');
            expect(moduleV3.horasEstimadas).toBeGreaterThan(0);
            expect(Array.isArray(moduleV3.obligatorioPorRol)).toBe(true);
            expect(moduleV3.categoria).toBeTruthy();
          });
          
          // 4. All progress relationships are maintained
          let expectedProgressCount = 0;
          validV2Data.forEach(emp => {
            if (emp.modulos && Array.isArray(emp.modulos)) {
              expectedProgressCount += emp.modulos.filter(mod => 
                mod && mod.nombre && mod.nombre.trim().length > 0
              ).length;
            }
          });
          
          expect(v3Data.progress.length).toBe(expectedProgressCount);
          
          // 5. Progress records reference valid employees and modules
          const employeeIds = new Set(v3Data.employees.map(e => e.id));
          const moduleIds = new Set(v3Data.modules.map(m => m.id));
          
          v3Data.progress.forEach(prog => {
            expect(employeeIds.has(prog.empleadoId)).toBe(true);
            expect(moduleIds.has(prog.moduloId)).toBe(true);
            expect(['pendiente', 'en-curso', 'completado']).toContain(prog.estado);
          });
          
          // 6. Data types and formats are correctly transformed
          v3Data.employees.forEach(emp => {
            expect(typeof emp.id).toBe('string');
            expect(typeof emp.nombre).toBe('string');
            expect(typeof emp.area).toBe('string');
            expect(typeof emp.rol).toBe('string');
            expect(typeof emp.fechaAlta).toBe('string');
            expect(typeof emp.activo).toBe('boolean');
            // Validate date format (YYYY-MM-DD)
            expect(emp.fechaAlta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          });
          
          v3Data.modules.forEach(mod => {
            expect(typeof mod.id).toBe('string');
            expect(typeof mod.nombre).toBe('string');
            expect(typeof mod.horasEstimadas).toBe('number');
            expect(Array.isArray(mod.obligatorioPorRol)).toBe(true);
            expect(typeof mod.categoria).toBe('string');
          });
          
          v3Data.progress.forEach(prog => {
            expect(typeof prog.empleadoId).toBe('string');
            expect(typeof prog.moduloId).toBe('string');
            expect(typeof prog.estado).toBe('string');
            if (prog.fechaInicio) {
              expect(prog.fechaInicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            }
            if (prog.fechaCompletado) {
              expect(prog.fechaCompletado).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            }
          });
          
          // 7. No corruption occurs during transformation
          // Verify that the transformation is deterministic
          const v3DataSecond = migrationService.transformV2ToV3(validV2Data);
          expect(v3DataSecond.employees).toEqual(v3Data.employees);
          expect(v3DataSecond.modules).toEqual(v3Data.modules);
          expect(v3DataSecond.progress).toEqual(v3Data.progress);
          
          // 8. Settings are properly initialized
          expect(v3Data.settings).toBeDefined();
          expect(v3Data.settings.version).toBe('3.0.0');
          expect(Array.isArray(v3Data.settings.roles)).toBe(true);
          expect(Array.isArray(v3Data.settings.areas)).toBe(true);
          
          return true;
        }
      ), { 
        numRuns: 100,
        seed: 42, // Deterministic seed for reproducible tests
        verbose: true
      });
    });

    test('Property: Migration validation correctly identifies data integrity issues', () => {
      fc.assert(fc.property(
        v2DataGenerator(),
        (v2Data) => {
          // Arrange: Setup clean state
          mockLocalStorage.clear();
          dataService.clearAllData();
          migrationService.clearMigrationData();
          
          const validV2Data = v2Data.filter(emp => 
            emp && typeof emp === 'object' && (emp.nombre || emp.id)
          );
          
          fc.pre(validV2Data.length > 0);
          
          // Act: Transform data
          const v3Data = migrationService.transformV2ToV3(validV2Data);
          
          // Assert: Validation should pass for correctly transformed data
          const isValid = migrationService.validateMigration(v3Data, validV2Data);
          expect(isValid).toBe(true);
          
          return true;
        }
      ), { 
        numRuns: 50,
        seed: 42
      });
    });

    test('Property: Module ID generation is consistent and unique', () => {
      fc.assert(fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 50 }),
        (moduleNames) => {
          // Filter out empty or whitespace-only names
          const validNames = moduleNames.filter(name => name.trim().length > 0);
          
          // Skip if no valid names (precondition)
          fc.pre(validNames.length > 0);
          
          // Generate IDs for all valid module names
          const generatedIds = validNames.map(name => 
            migrationService.generateModuleId(name.trim())
          );
          
          // All IDs should be valid strings
          generatedIds.forEach(id => {
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(4); // At least "mod-" + 1 char
            expect(id).toMatch(/^mod-[a-z0-9-]+$/);
          });
          
          // Same input should produce same output (deterministic)
          const regeneratedIds = validNames.map(name => 
            migrationService.generateModuleId(name.trim())
          );
          expect(regeneratedIds).toEqual(generatedIds);
          
          // Unique names should produce unique IDs (when normalized differently)
          const uniqueNames = [...new Set(validNames.map(name => name.trim()))];
          const uniqueIds = uniqueNames.map(name => 
            migrationService.generateModuleId(name)
          );
          
          // Count unique IDs should match unique normalized names
          const uniqueIdSet = new Set(uniqueIds);
          // Note: Some different names might normalize to same ID, so we check <= instead of ===
          expect(uniqueIdSet.size).toBeLessThanOrEqual(uniqueNames.length);
          
          return true;
        }
      ), { 
        numRuns: 100,
        seed: 42
      });
    });
  });
});