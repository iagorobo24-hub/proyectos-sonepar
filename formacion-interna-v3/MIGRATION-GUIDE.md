# 🔄 Guía de Migración Automática v2 → v3

## Descripción General

El sistema de migración automática transforma los datos existentes de la versión 2 a la nueva estructura de la versión 3, manteniendo la integridad de los datos y proporcionando mecanismos de rollback en caso de error.

## Características Principales

### ✅ Detección Automática
- Detecta automáticamente datos v2 existentes en localStorage
- Valida la estructura y integridad de los datos antes de migrar
- Filtra empleados inválidos o corruptos

### 🔒 Backup Automático
- Crea backup completo de datos v2 antes de la migración
- Incluye checksum para validar integridad del backup
- Almacena metadatos (timestamp, versión, cantidad de empleados)

### 🔄 Transformación Inteligente
- Convierte estructura v2 monolítica a v3 modular
- Extrae módulos únicos evitando duplicados
- Infiere categorías y roles obligatorios automáticamente
- Preserva todo el progreso y fechas existentes

### 🛡️ Rollback Automático
- Rollback automático en caso de fallo en la migración
- Validación de integridad del backup antes del rollback
- Limpieza completa de datos v3 durante rollback

### 📊 Logging Completo
- Log detallado de todos los pasos de migración
- Timestamps y mensajes descriptivos
- Almacenamiento persistente para debugging

## Estructura de Datos

### Datos v2 (Estructura Original)
```javascript
localStorage['sonepar-formacion-empleados'] = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    area: 'Ventas',
    rol: 'Comercial',
    fechaAlta: '2024-01-15',
    modulos: [
      {
        nombre: 'Seguridad Industrial',
        completado: true,
        fechaCompletado: '2024-01-25',
        horasReales: 5
      }
    ]
  }
]
```

### Datos v3 (Estructura Modular)
```javascript
localStorage: {
  'sonepar-formacion-v3-employees': [
    {
      id: 'emp-1',
      nombre: 'Juan Pérez',
      area: 'Ventas',
      rol: 'Comercial',
      fechaAlta: '2024-01-15',
      activo: true
    }
  ],
  'sonepar-formacion-v3-modules': [
    {
      id: 'mod-seguridad-industrial',
      nombre: 'Seguridad Industrial',
      horasEstimadas: 4,
      obligatorioPorRol: ['Técnico', 'Comercial'],
      categoria: 'Seguridad'
    }
  ],
  'sonepar-formacion-v3-progress': [
    {
      empleadoId: 'emp-1',
      moduloId: 'mod-seguridad-industrial',
      estado: 'completado',
      fechaCompletado: '2024-01-25',
      horasReales: 5
    }
  ],
  'sonepar-formacion-v3-settings': {
    version: '3.0.0',
    lastMigration: '2024-03-13T10:30:00.000Z',
    roles: ['Técnico', 'Comercial', 'Administrativo']
  }
}
```

## Uso del Sistema

### Inicialización Automática
```javascript
import migrationService from './services/migrationService.js';

// La aplicación detecta y migra automáticamente al cargar
const result = await migrationService.initializeApp();

if (result.success) {
  console.log('✅ Aplicación inicializada correctamente');
  if (result.migratedEmployees) {
    console.log(`🔄 Migrados ${result.migratedEmployees} empleados`);
  }
} else {
  console.error('❌ Error:', result.message);
}
```

### Migración Manual
```javascript
// Verificar si necesita migración
if (migrationService.needsMigration()) {
  const result = await migrationService.migrateFromV2ToV3();
  
  if (result.success) {
    console.log('✅ Migración exitosa');
    console.log(`- Empleados: ${result.migratedEmployees}`);
    console.log(`- Módulos: ${result.migratedModules}`);
    console.log(`- Progreso: ${result.migratedProgress}`);
  } else {
    console.error('❌ Error en migración:', result.message);
  }
}
```

### Rollback
```javascript
// Rollback a datos v2 (en caso de problemas)
try {
  const result = await migrationService.rollbackToV2();
  console.log('✅ Rollback exitoso');
  console.log(`Restaurados ${result.restoredEmployees} empleados`);
} catch (error) {
  console.error('❌ Error en rollback:', error.message);
}
```

### Verificar Estado
```javascript
const status = migrationService.getMigrationStatus();
console.log('Estado:', {
  hasV2Data: status.hasV2Data,
  hasV3Data: status.hasV3Data,
  needsMigration: status.needsMigration,
  canRollback: status.canRollback,
  lastMigration: status.lastMigration
});
```

## Validaciones Implementadas

### Validación de Datos v2
- ✅ Verificar que sea un array válido
- ✅ Filtrar empleados sin nombre o ID
- ✅ Validar estructura básica de módulos
- ✅ Manejar datos corruptos o inválidos

### Validación de Migración
- ✅ Conservación del número de empleados
- ✅ Todos los empleados tienen ID y nombre válidos
- ✅ Todos los módulos tienen ID y nombre válidos
- ✅ Referencias válidas en registros de progreso
- ✅ Campos obligatorios presentes en todas las entidades

### Validación de Backup
- ✅ Integridad de datos mediante checksum
- ✅ Estructura válida del backup
- ✅ Metadatos completos (timestamp, versión, conteo)

## Manejo de Errores

### Errores de Detección
- Datos v2 no encontrados → No ejecuta migración
- Datos v2 corruptos → Filtra datos válidos y continúa
- localStorage no disponible → Error controlado

### Errores de Migración
- Fallo en backup → Aborta migración
- Fallo en transformación → Rollback automático
- Fallo en validación → Rollback automático
- Fallo en guardado → Rollback automático

### Errores de Rollback
- Backup no encontrado → Error informativo
- Backup corrupto → Advertencia pero continúa
- Fallo en limpieza v3 → Error parcial

## Testing

### Tests Unitarios
```bash
npm test migrationService.test.js
```

### Tests Incluidos
- ✅ Detección de datos v2
- ✅ Necesidad de migración
- ✅ Transformación de empleados
- ✅ Transformación de módulos
- ✅ Transformación de progreso
- ✅ Migración completa
- ✅ Backup y rollback
- ✅ Inicialización de aplicación

### Demo Interactivo
Abrir `demo-migration.html` en el navegador para probar:
- Crear datos v2 de ejemplo
- Ejecutar migración paso a paso
- Verificar datos transformados
- Probar rollback
- Ver logs de migración

## Datos de Ejemplo

### Cargar Datos v2 de Prueba
```javascript
// En consola del navegador
loadSampleV2Data(); // Carga 3 empleados con módulos variados
showCurrentState(); // Muestra estado actual
```

### Limpiar Todos los Datos
```javascript
clearAllData(); // Limpia localStorage completamente
```

## Logs y Debugging

### Ver Log de Migración
```javascript
const log = migrationService.getMigrationLog();
console.log(log);
```

### Limpiar Log
```javascript
migrationService.clearMigrationLog();
```

### Ejemplo de Log
```
[2024-03-13T10:30:15.123Z] Iniciando migración v2 → v3
[2024-03-13T10:30:15.125Z] Detectados 3 empleados en v2
[2024-03-13T10:30:15.127Z] Backup creado: 3 empleados, checksum: a1b2c3d4
[2024-03-13T10:30:15.130Z] Datos transformados a estructura v3
[2024-03-13T10:30:15.132Z] Validación exitosa
[2024-03-13T10:30:15.135Z] Datos v3 guardados
[2024-03-13T10:30:15.137Z] Migración completada exitosamente
```

## Consideraciones de Rendimiento

### Optimizaciones
- Memoización de cálculos de ID de módulos
- Uso de Map para evitar duplicados
- Validación incremental durante transformación
- Backup asíncrono para no bloquear UI

### Límites Recomendados
- ✅ Hasta 100 empleados: < 2 segundos
- ✅ Hasta 500 módulos únicos: < 5 segundos
- ✅ Hasta 1000 registros de progreso: < 3 segundos

## Troubleshooting

### Problema: Migración no se ejecuta
**Solución:** Verificar que hay datos v2 válidos
```javascript
const v2Data = migrationService.detectV2Data();
console.log('Datos v2:', v2Data);
```

### Problema: Migración falla constantemente
**Solución:** Verificar integridad de datos v2
```javascript
// Limpiar y recargar datos v2
clearAllData();
loadSampleV2Data();
```

### Problema: No se puede hacer rollback
**Solución:** Verificar que existe backup
```javascript
const status = migrationService.getMigrationStatus();
console.log('Puede rollback:', status.canRollback);
```

### Problema: Datos perdidos después de migración
**Solución:** Verificar log de migración y ejecutar rollback si es necesario
```javascript
console.log(migrationService.getMigrationLog());
await migrationService.rollbackToV2();
```

## Próximos Pasos

Una vez completada la migración, el sistema v3 estará listo para:
- ✅ Dashboard de equipo con métricas
- ✅ Matriz de progreso empleado × módulo
- ✅ Gestión de vencimientos
- ✅ Generación de certificados PDF
- ✅ Itinerarios de incorporación con IA
- ✅ Análisis inteligente de equipo

La migración es un proceso único que se ejecuta automáticamente la primera vez que se accede a la aplicación v3 con datos v2 existentes.