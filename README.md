# SONEPAR TOOLS

> Suite de herramientas internas con IA para operaciones de distribución eléctrica

**Autor:** Iago Robo  
**Contexto:** Prácticas del Ciclo Formativo de Automatización y Robótica Industrial — Sonepar España, A Coruña, 2026  
**Estado:** Fase 2 completada — 7/7 herramientas en v2.0

---

## Sobre el proyecto

Sonepar Tools es una suite de 7 herramientas web desarrolladas como proyecto de prácticas en Sonepar España. Cada herramienta está construida como un artefacto React independiente con inteligencia artificial integrada (Claude Sonnet de Anthropic), pensada para resolver necesidades reales de las delegaciones: desde el mostrador técnico hasta la gestión logística interna.

El proyecto nace de un análisis directo del contexto operativo de Sonepar: empresa en plena transformación digital, con más de 135 delegaciones, integrando múltiples sistemas de gestión y expandiendo su oferta hacia automatización, vehículo eléctrico y energías renovables.

---

## Estructura del repositorio

```
proyectos-sonepar/
├── README.md
├── docs/
│   ├── SONEPAR-TOOLS-README.docx
│   └── SONEPAR-TOOLS-ROADMAP.docx
├── simulador-almacen/
│   ├── sonepar-almacen-simulador-v2.jsx
│   └── docs/
│       ├── CHANGELOG-v1.docx
│       ├── PLAN-v2.docx
│       └── CHANGELOG-v2.docx
├── fichas-tecnicas/
│   ├── sonepar-fichas-tecnicas-v2.jsx
│   └── docs/
│       ├── CHANGELOG-v1.docx
│       ├── PLAN-v2.docx
│       └── CHANGELOG-v2.docx
├── dashboard-incidencias/
│   ├── sonepar-dashboard-incidencias-v2.jsx
│   └── docs/
│       ├── CHANGELOG-v1.docx
│       ├── PLAN-v2.docx
│       └── CHANGELOG-v2.docx
├── kpi-logistico/
│   ├── sonepar-kpi-logistico-v2.jsx
│   └── docs/
│       ├── CHANGELOG-v1.docx
│       ├── PLAN-v2.docx
│       └── CHANGELOG-v2.docx
├── presupuestos/
│   ├── sonepar-generador-presupuestos-v2.jsx
│   └── docs/
│       ├── CHANGELOG-v1.docx
│       ├── PLAN-v2.docx
│       └── CHANGELOG-v2.docx
├── formacion-interna/
│   ├── sonepar-formacion-interna-v2.jsx
│   └── docs/
│       ├── CHANGELOG-v1.docx
│       ├── PLAN-v2.docx
│       └── CHANGELOG-v2.docx
└── chatbot-tecnico/
    ├── sonepar-chatbot-tecnico-v2.jsx
    └── docs/
        ├── CHANGELOG-v1.docx
        ├── PLAN-v2.docx
        └── CHANGELOG-v2.docx
```

---

## Herramientas

### 01 — Simulador de Flujo de Almacén
Reproduce el ciclo completo de un pedido desde recepción hasta expedición. Cronómetro por etapa con semáforo de estándar en tiempo real. Útil para formación de operarios y análisis de cuellos de botella. La IA analiza los tiempos reales de la simulación y genera recomendaciones específicas por etapa.

`v2.0` · Completado ✓

---

### 02 — Asistente de Fichas Técnicas
El técnico de mostrador introduce una referencia o descripción y obtiene la ficha técnica completa: características, aplicaciones, compatibilidades, normativas, precio orientativo y consejo práctico. Valida consultas vagas con sugerencias clicables. Modo comparativa para elegir entre dos productos. Historial persistente de 10 fichas. Exportación a PDF y copia al portapapeles.

`v2.0` · Completado ✓

---

### 03 — Dashboard de Incidencias Técnicas
Sistema de registro y seguimiento de fallos en equipos del almacén. La IA diagnostica la incidencia a partir del síntoma: causa probable, pasos de verificación, solución y prevención. Alerta automática para incidencias críticas abiertas más de 2 horas. Persistencia completa en localStorage. Campo de observaciones y estadísticas de resolución por equipo.

`v2.0` · Completado ✓

---

### 04 — Calculadora de KPIs Logísticos
Transforma los datos de un turno en 6 indicadores clave con semáforo visual comparado con benchmarks del sector. Historial de los últimos 30 turnos con gráficos dinámicos sobre datos reales. Comparativa lado a lado entre dos turnos. Botón de ejemplo con datos de referencia. Exportación a PDF del informe ejecutivo generado con IA.

`v2.0` · Completado ✓

---

### 05 — Generador de Presupuestos
El instalador selecciona el tipo de instalación, introduce los parámetros y obtiene un presupuesto detallado con partidas, precios, IVA desglosado y normativas aplicables. Numeración automática SNP-AAAAMM-XXX. Historial de 20 presupuestos. Datos del instalador persistentes. Exportación a PDF y copia de resumen.

`v2.0` · Completado ✓

---

### 06 — Sistema de Formación Interna
Tracker de progreso formativo por empleado. Vista Matriz con semáforo de estado para visibilidad global del equipo. Alerta automática de módulos obligatorios pendientes tras 30 días de alta. Módulos personalizables y alta de empleados desde la interfaz. Fechas de completado registradas. Genera planes de desarrollo personalizados con IA usando el progreso real de cada empleado.

`v2.0` · Completado ✓

---

### 07 — SONEX — Chatbot Técnico
Asistente conversacional especializado en material eléctrico e industrial. Historial de 10 conversaciones persistidas con naming automático. Indicador de confianza por respuesta (alta / media / verificar). Modo consulta rápida para preguntas puntuales. 4 modos de contexto: General, Avería, Selección, Normativa. Límite de 20 turnos por conversación con aviso.

`v2.0` · Completado ✓

---

## Stack técnico

| Tecnología | Uso |
|---|---|
| React 18 | Framework UI — hooks, estado, efectos |
| Anthropic API (Claude Sonnet 4) | Motor de IA en todos los artefactos |
| Recharts | Gráficos y visualizaciones (KPI Logístico) |
| localStorage | Persistencia de datos entre sesiones |
| window.print() | Exportación a PDF con @media print |
| docx (npm) | Generación de documentación Word |
| GitHub + Vercel | Control de versiones y despliegue |

---

## Documentación

Cada herramienta tiene su propia carpeta `/docs` con:

- **CHANGELOG-v1.docx** — Registro de la versión inicial
- **PLAN-v2.docx** — Planificación previa al desarrollo de v2
- **CHANGELOG-v2.docx** — Registro detallado de todos los cambios de v2

La documentación global del proyecto está en `/docs`:

- **SONEPAR-TOOLS-README.docx** — Descripción completa del proyecto, stack y contexto
- **SONEPAR-TOOLS-ROADMAP.docx** — Hojas de ruta globales por herramienta

---

## Fases del proyecto

- [x] Fase 1 — Desarrollo de los 7 prototipos funcionales (v1.0)
- [x] Fase 2 — Revisión y pulido de todos los artefactos (v2.0)
- [ ] Fase 3 — Publicación en Vercel con URLs independientes
- [ ] Fase 4 — Presentación interna en Sonepar A Coruña
- [ ] Fase 5 — Evaluación de implantación real

---

> Este proyecto se desarrolla como iniciativa personal durante las prácticas. No está afiliado oficialmente a Sonepar España.
