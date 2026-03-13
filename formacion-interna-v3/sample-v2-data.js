/**
 * Datos de ejemplo v2 para testing de migración
 * Ejecutar en consola del navegador para simular datos existentes
 */

const sampleV2Data = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    area: 'Ventas',
    rol: 'Comercial',
    fechaAlta: '2024-01-15',
    email: 'juan.perez@sonepar.com',
    modulos: [
      {
        nombre: 'Seguridad Industrial',
        descripcion: 'Módulo básico de seguridad laboral',
        completado: true,
        fechaCompletado: '2024-01-25',
        fechaInicio: '2024-01-20',
        horasEstimadas: 4,
        horasReales: 5,
        categoria: 'Seguridad'
      },
      {
        nombre: 'Ventas Básicas',
        descripcion: 'Fundamentos de técnicas de venta',
        completado: false,
        enCurso: true,
        fechaInicio: '2024-02-01',
        horasEstimadas: 6,
        categoria: 'Comercial'
      },
      {
        nombre: 'Atención al Cliente',
        descripcion: 'Técnicas de atención y servicio al cliente',
        completado: false,
        horasEstimadas: 3,
        categoria: 'Comercial'
      }
    ]
  },
  {
    id: 2,
    nombre: 'María García',
    area: 'Técnico',
    rol: 'Técnico',
    fechaAlta: '2024-02-01',
    email: 'maria.garcia@sonepar.com',
    modulos: [
      {
        nombre: 'Seguridad Industrial',
        descripcion: 'Módulo básico de seguridad laboral',
        completado: true,
        fechaCompletado: '2024-02-10',
        fechaInicio: '2024-02-05',
        horasEstimadas: 4,
        horasReales: 4,
        categoria: 'Seguridad'
      },
      {
        nombre: 'Instalaciones Eléctricas',
        descripcion: 'Fundamentos de instalaciones eléctricas',
        completado: false,
        enCurso: true,
        fechaInicio: '2024-02-15',
        horasEstimadas: 8,
        categoria: 'Técnico'
      },
      {
        nombre: 'Normativa Eléctrica',
        descripcion: 'Normativas y regulaciones eléctricas',
        completado: false,
        horasEstimadas: 5,
        categoria: 'Técnico'
      }
    ]
  },
  {
    id: 3,
    nombre: 'Carlos López',
    area: 'Administración',
    rol: 'Administrativo',
    fechaAlta: '2024-01-10',
    email: 'carlos.lopez@sonepar.com',
    modulos: [
      {
        nombre: 'Seguridad Industrial',
        descripcion: 'Módulo básico de seguridad laboral',
        completado: true,
        fechaCompletado: '2024-01-30',
        fechaInicio: '2024-01-25',
        horasEstimadas: 4,
        horasReales: 3,
        categoria: 'Seguridad'
      },
      {
        nombre: 'Gestión Administrativa',
        descripcion: 'Procesos administrativos y documentación',
        completado: true,
        fechaCompletado: '2024-02-20',
        fechaInicio: '2024-02-10',
        horasEstimadas: 6,
        horasReales: 7,
        categoria: 'Administrativo'
      },
      {
        nombre: 'Excel Avanzado',
        descripcion: 'Técnicas avanzadas de Excel',
        completado: false,
        enCurso: true,
        fechaInicio: '2024-02-25',
        horasEstimadas: 4,
        categoria: 'Administrativo'
      }
    ]
  }
];

// Función para cargar datos v2 en localStorage
function loadSampleV2Data() {
  localStorage.setItem('sonepar-formacion-empleados', JSON.stringify(sampleV2Data));
  console.log('✅ Datos v2 de ejemplo cargados:', sampleV2Data.length, 'empleados');
  return sampleV2Data;
}

// Función para limpiar todos los datos
function clearAllData() {
  localStorage.clear();
  console.log('🗑️ Todos los datos eliminados');
}

// Función para mostrar estado actual
function showCurrentState() {
  const v2Data = localStorage.getItem('sonepar-formacion-empleados');
  const v3Employees = localStorage.getItem('sonepar-formacion-v3-employees');
  const settings = localStorage.getItem('sonepar-formacion-v3-settings');
  
  console.log('📊 Estado actual:');
  console.log('- Datos v2:', v2Data ? JSON.parse(v2Data).length + ' empleados' : 'No');
  console.log('- Datos v3:', v3Employees ? JSON.parse(v3Employees).length + ' empleados' : 'No');
  console.log('- Configuración v3:', settings ? 'Sí' : 'No');
}

// Exportar funciones para uso en consola
if (typeof window !== 'undefined') {
  window.loadSampleV2Data = loadSampleV2Data;
  window.clearAllData = clearAllData;
  window.showCurrentState = showCurrentState;
  window.sampleV2Data = sampleV2Data;
}

export { sampleV2Data, loadSampleV2Data, clearAllData, showCurrentState };