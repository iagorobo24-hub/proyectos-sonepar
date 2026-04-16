export const FULL_CATEGORY_INFO = {
  "CABLES": {
    icon: '🧶',
    desc: 'Cables de baja, media y alta tensión, mangueras y conductores especiales.',
    tip: 'Selecciona según la sección (mm²), el número de conductores y el aislamiento (PVC, Libre de Halógenos, etc.).'
  },
  "DISTRIBUCION DE POTENCIA": {
    icon: '⚡',
    desc: 'Aparamenta modular, envolventes, cuadros eléctricos y sistemas de gestión de cableado.',
    tip: 'Verifica la intensidad nominal (A), el poder de corte (kA) y el número de polos necesario.'
  },
  "CONTROL Y AUTOMATIZACION INDUSTRIAL": {
    icon: '⚙️',
    desc: 'Variadores de frecuencia, contactores, guardamotores, PLCs y sensores industriales.',
    tip: 'Dimensiona según la potencia del motor (kW), el tipo de carga y los protocolos de comunicación.'
  },
  "AUTOMATIZACION DE EDIFICIOS": {
    icon: '🏘️',
    desc: 'Domótica, sistemas KNX, videoporteros y mecanismos de control inteligente.',
    tip: 'Asegura la compatibilidad entre dispositivos y el protocolo de control (cableado o inalámbrico).'
  },
  "ILUMINACION": {
    icon: '💡',
    desc: 'Luminarias LED para interior, exterior, industrial, decorativa y alumbrado de emergencia.',
    tip: 'Calcula el nivel de iluminación requerido (lux) y elige la temperatura de color adecuada (K).'
  },
  "HVAC": {
    icon: '❄️',
    desc: 'Sistemas de climatización, ventilación, calefacción y aire acondicionado.',
    tip: 'Calcula las frigorías o calorías necesarias según el volumen de la estancia y su aislamiento.'
  },
  "SEGURIDAD Y HERRAMIENTAS": {
    icon: '🛡️',
    desc: 'Equipos de protección individual (EPIs), herramientas manuales, eléctricas y de medida.',
    tip: 'Usa herramientas con certificación VDE (1000V) para trabajos en tensión y EPIs homologados.'
  },
  "FONTANERIA": {
    icon: '🚿',
    desc: 'Sistemas de conducción de agua, sanitarios, grifería y accesorios de conexión.',
    tip: 'Verifica el material (cobre, multicapa, PVC) y el diámetro de las roscas o conexiones.'
  },
  "ENERGIAS RENOVABLES": {
    icon: '☀️',
    desc: 'Paneles solares, inversores, baterías y puntos de recarga para vehículo eléctrico.',
    tip: 'Dimensiona el campo fotovoltaico según el consumo anual y la superficie disponible en cubierta.'
  },
  "SERVICIOS": {
    icon: '🚚',
    desc: 'Gestión de bobinas, palets, portes y otros servicios logísticos especializados.',
    tip: 'Consulta las condiciones de retorno de envases y los plazos de entrega especiales.'
  }
}

// Mapeo amigable para los IDs de categoría usados en la URL/Navegación
export const CATEGORY_IDS = {
  "cables": "CABLES",
  "potencia": "DISTRIBUCION DE POTENCIA",
  "control": "CONTROL Y AUTOMATIZACION INDUSTRIAL",
  "domotica": "AUTOMATIZACION DE EDIFICIOS",
  "iluminacion": "ILUMINACION",
  "clima": "HVAC",
  "seguridad": "SEGURIDAD Y HERRAMIENTAS",
  "fontaneria": "FONTANERIA",
  "solar": "ENERGIAS RENOVABLES",
  "servicios": "SERVICIOS"
}
