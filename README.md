# SONEPAR TOOLS

> Suite de herramientas internas con IA para operaciones de distribución eléctrica

**Autor:** Iago Robo  
**Contexto:** Prácticas del Ciclo Formativo de Automatización y Robótica Industrial — Sonepar España, A Coruña, 2026  
**Estado:** Prototipo funcional en desarrollo activo  

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
│   ├── SONEPAR-TOOLS-README.docx       # Documentación completa del proyecto
│   └── SONEPAR-TOOLS-ROADMAP.docx      # Hojas de ruta por herramienta
├── simulador-almacen/
│   └── sonepar-almacen-simulador.jsx
├── fichas-tecnicas/
│   └── sonepar-fichas-tecnicas.jsx
├── dashboard-incidencias/
│   └── sonepar-dashboard-incidencias.jsx
├── kpi-logistico/
│   └── sonepar-kpi-logistico.jsx
├── presupuestos/
│   └── sonepar-generador-presupuestos-v2.jsx
├── formacion-interna/
│   └── sonepar-formacion-interna.jsx
└── chatbot-tecnico/
    └── sonepar-chatbot-tecnico.jsx
```

---

## Herramientas

### 01 — Simulador de Flujo de Almacén
Visualiza el ciclo completo de un pedido desde recepción hasta expedición. Útil para formación de operarios y análisis de procesos. La IA analiza el pedido completado y sugiere optimizaciones.

`v1.0` · En revisión

---

### 02 — Asistente de Fichas Técnicas
El técnico de mostrador introduce una referencia o descripción y obtiene la ficha técnica completa: características, aplicaciones, compatibilidades, normativas y consejo práctico.

`v1.0` · En revisión

---

### 03 — Dashboard de Incidencias Técnicas
Sistema de registro y seguimiento de fallos en equipos del almacén. La IA diagnostica la incidencia a partir del síntoma: causa probable, pasos de verificación, solución y prevención.

`v1.0` · En revisión

---

### 04 — Calculadora de KPIs Logísticos
Transforma los datos de un turno en 6 indicadores clave con semáforo visual comparado con benchmarks del sector. Genera un informe ejecutivo del turno con IA.

`v1.0` · En revisión

---

### 05 — Generador de Presupuestos
El instalador selecciona el tipo de instalación, introduce los parámetros y obtiene un presupuesto detallado con partidas, precios, normativas y exportación a PDF.

`v2.0` · Revisado ✓

---

### 06 — Sistema de Formación Interna
Tracker de progreso formativo por empleado. Gestiona módulos por área, permite marcar avances y genera planes de desarrollo personalizados con IA.

`v1.0` · En revisión

---

### 07 — SONEX — Chatbot Técnico
Asistente conversacional especializado en material eléctrico e industrial. Mantiene contexto completo de la conversación y actúa como técnico de mostrador experto.

`v1.0` · En revisión

---

## Stack técnico

| Tecnología | Uso |
|---|---|
| React 18 | Framework UI |
| Anthropic API (Claude Sonnet) | Motor de IA en todos los artefactos |
| Recharts | Gráficos y visualizaciones |
| localStorage | Persistencia de datos |
| window.print() | Exportación a PDF |
| GitHub + Vercel | Control de versiones y despliegue |

---

## Documentación

La documentación completa está en la carpeta `/docs`:

- **SONEPAR-TOOLS-README.docx** — Descripción detallada del proyecto, stack técnico y hoja de ruta global
- **SONEPAR-TOOLS-ROADMAP.docx** — Historial de versiones y mejoras planificadas por cada herramienta

---

## Fases del proyecto

- [x] Fase 1 — Desarrollo de los 7 prototipos funcionales
- [ ] Fase 2 — Revisión y pulido de todos los artefactos
- [ ] Fase 3 — Publicación en Vercel con URLs independientes
- [ ] Fase 4 — Presentación interna en Sonepar A Coruña
- [ ] Fase 5 — Evaluación de implantación real

---

> Este proyecto se desarrolla como iniciativa personal durante las prácticas. No está afiliado oficialmente a Sonepar España.
