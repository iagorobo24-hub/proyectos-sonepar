# Formación Interna Sonepar v3

Aplicación de gestión de formación interna que evoluciona de un tracker individual a una herramienta completa de gestión de equipo.

## Características Principales

- Dashboard de equipo con métricas clave
- Matriz de progreso empleado × módulo
- Sistema de certificados PDF
- Itinerarios de incorporación con IA
- Gestión de vencimientos y alertas
- Importación CSV de empleados
- Análisis inteligente de equipo

## Estructura del Proyecto

```
FormacionApp/
├── components/     # Componentes React modulares
├── hooks/         # Custom hooks para lógica de estado
├── services/      # Servicios de datos y APIs
├── utils/         # Utilidades y helpers
└── styles/        # Estilos y tema Sonepar
```

## Tecnologías

- React con hooks funcionales
- LocalStorage para persistencia
- jsPDF para certificados
- Claude API para IA
- fast-check para property-based testing

## Migración desde v2

La aplicación detecta automáticamente datos v2 y los migra a la nueva estructura v3 manteniendo compatibilidad completa.