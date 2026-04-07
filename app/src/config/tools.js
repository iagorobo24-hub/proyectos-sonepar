/**
 * Configuración centralizada de herramientas para SoneparTools
 * Define el array único TOOLS para usar en Sidebar.jsx y Topbar.jsx
 */

export const TOOLS = [
  {
    path: '/fichas',
    icon: 'FileText',
    nombre: 'Fichas Técnicas',
    descripcion: 'Escribe el nombre, referencia o descripción de cualquier producto del catálogo Sonepar. La IA genera una ficha técnica completa con características, aplicaciones, compatibilidades y consejo de instalación.',
    consejo: 'Útil para dar respuesta rápida al técnico de mostrador.',
  },
  {
    path: '/almacen',
    icon: 'Warehouse',
    nombre: 'Simulador Almacén',
    descripcion: 'Reproduce el ciclo completo de un pedido — recepción, ubicación, picking, verificación y expedición — con cronómetro real. Se presentan incidencias reales durante el proceso.',
    consejo: 'Al terminar, la IA analiza el rendimiento por etapa.',
  },
  {
    path: '/incidencias',
    icon: 'ShieldAlert',
    nombre: 'Dashboard Incidencias',
    descripcion: 'Registra fallos en equipos industriales con zona, severidad y síntoma. La IA genera un diagnóstico automático con causa probable, solución y pasos de verificación.',
    consejo: 'El dashboard muestra KPIs en tiempo real y tabla filtrable.',
  },
  {
    path: '/kpi',
    icon: 'TrendingUp',
    nombre: 'KPI Logístico',
    descripcion: 'Introduce los datos del turno y la herramienta calcula 6 KPIs logísticos clave: pedidos/hora, error de picking, tiempo de ciclo, ocupación, devoluciones y productividad.',
    consejo: 'Semáforo de estado e informe ejecutivo generado por IA.',
  },
  {
    path: '/presupuestos',
    icon: 'Euro',
    nombre: 'Presupuestos',
    descripcion: 'Selecciona la categoría de instalación, introduce los parámetros técnicos y la IA genera un presupuesto detallado con referencias del catálogo Sonepar.',
    consejo: 'Editable línea a línea y exportable a PDF.',
  },
  {
    path: '/formacion',
    icon: 'GraduationCap',
    nombre: 'Formación Interna',
    descripcion: 'Gestiona la formación del equipo por empleado. Matriz de competencias visual, registro de módulos completados y plan de formación personalizado generado por IA.',
    consejo: 'Plan adaptado al perfil y nivel de cada trabajador.',
  },
  {
    path: '/sonex',
    icon: 'Bot',
    nombre: 'Sonex',
    descripcion: 'Chatbot técnico especializado en material eléctrico e industrial. Responde consultas técnicas, ayuda a seleccionar productos y genera documentación de apoyo.',
    consejo: 'Historial exportable y múltiples modos de consulta.',
  },
];

// Mapeo de rutas a configuración detallada para Sidebar
export const TOOLS_BY_PATH = Object.fromEntries(
  TOOLS.map(tool => [tool.path, tool])
);

// Solo path y label para navegación simple
export const NAV_TOOLS = TOOLS.map(({ path, nombre }) => ({ path, label: nombre }));

export default { TOOLS, TOOLS_BY_PATH, NAV_TOOLS };
