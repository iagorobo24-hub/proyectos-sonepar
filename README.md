# SONEPAR TOOLS

<div align="center">

**Suite de herramientas internas con IA para operaciones de distribución eléctrica**

[![Vercel](https://img.shields.io/badge/demo-proyectos--sonepar.vercel.app-003087?style=flat-square&logo=vercel&logoColor=white)](https://proyectos-sonepar.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Claude](https://img.shields.io/badge/Claude_Sonnet-Anthropic-CC785C?style=flat-square)](https://anthropic.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

*Proyecto de prácticas FP · Automatización y Robótica Industrial · Sonepar España · A Coruña · 2026*

</div>

---

## ¿Qué es esto?

**Sonepar Tools** es una suite de **7 herramientas web con IA integrada**, desarrolladas durante las prácticas de FP en Sonepar España (delegación A Coruña). Cada herramienta resuelve un problema real del día a día en las delegaciones: desde el técnico de mostrador que necesita una ficha técnica al instante hasta el responsable de turno que quiere analizar los KPIs logísticos en segundos.

El motor de todas ellas es **Claude Sonnet** (Anthropic), llamado directamente desde el frontend. No hay backend propio — las herramientas funcionan en cualquier navegador.

**Demo en vivo →** [proyectos-sonepar.vercel.app](https://proyectos-sonepar.vercel.app)

---

## Contexto: por qué tiene sentido en Sonepar

Sonepar España opera con **más de 135 delegaciones**, **2.200+ empleados** y **885M€ de ventas en 2024**. La empresa está en plena transformación logística: integrando 7 sistemas de gestión de almacén, expandiendo hacia automatización industrial, vehículo eléctrico y energías renovables, y con un nuevo centro de distribución en Sagunto equipado con AutoStore (35.000 cubetas, 30 robots).

En ese contexto, los técnicos de mostrador resuelven consultas de instaladores sin tiempo que perder, los operarios de almacén gestionan flujos de pedido bajo presión de tiempo, y los responsables necesitan tomar decisiones rápidas con datos del turno. Estas herramientas están pensadas exactamente para esos momentos.

---

## Las 7 herramientas

| # | Herramienta | Qué hace | Versión |
|---|-------------|----------|---------|
| 01 | **Simulador de Almacén** | Reproduce el ciclo recepción→picking→expedición con cronómetro, 15 incidencias reales y modo entrenamiento/evaluación. Análisis IA al terminar. | `v3.0` |
| 02 | **Fichas Técnicas** | El técnico introduce una referencia y obtiene ficha completa: specs, aplicaciones, compatibilidades, normativa y consejo práctico. | `v2.0` |
| 03 | **Dashboard de Incidencias** | Registro y seguimiento de fallos en equipos. La IA diagnostica el síntoma: causa probable, verificaciones, solución, prevención. | `v2.0` |
| 04 | **KPIs Logísticos** | Transforma los datos de un turno en 6 indicadores con semáforo visual y benchmarks del sector. Informe ejecutivo con IA. | `v3.0` |
| 05 | **Generador de Presupuestos** | El instalador define la instalación y obtiene un presupuesto con partidas editables, referencias reales del catálogo Sonepar y exportación a PDF. | `v3.0` |
| 06 | **Formación Interna** | Tracker de progreso formativo por empleado. Módulos por área, fechas de vencimiento y plan de desarrollo personalizado con IA. | `v2.0` |
| 07 | **SONEX** | Chatbot técnico especializado en material eléctrico e industrial. Detección automática de modo, catálogo de ~80 productos, streaming de respuestas, exportación a PDF. | `v7.0` ★ |

> ★ SONEX es la herramienta principal del proyecto y la más desarrollada.

---

## Cómo funciona (en 3 pasos)

```
1. El técnico introduce sus datos
   → referencia, síntoma, parámetros del motor, consulta libre...

2. La IA procesa con contexto de Sonepar
   → system prompt especializado + catálogo real + normativa eléctrica

3. Resultado accionable en segundos
   → ficha técnica, diagnóstico, presupuesto, informe de turno, respuesta técnica
```

Todas las herramientas funcionan en el navegador. No hay servidor intermedio: el frontend llama directamente a la API de Anthropic. En producción (Vercel + claude.ai), la API key se inyecta automáticamente.

---

## Stack técnico

| Tecnología | Versión | Rol en el proyecto |
|---|---|---|
| **React** | 18 | Framework UI — cada herramienta es un componente independiente |
| **Vite** | 5 | Bundler y servidor de desarrollo |
| **Claude Sonnet** (Anthropic) | claude-sonnet-4 | Motor de IA — system prompts especializados por herramienta |
| **Recharts** | 2 | Gráficos en KPI Logístico y Dashboard de Incidencias |
| **localStorage** | — | Persistencia de historial, perfil de usuario y datos del turno |
| **window.print()** | — | Exportación a PDF en Presupuestos y SONEX |
| **GitHub + Vercel** | — | Control de versiones y despliegue continuo (push → deploy en ~90s) |

---

## Estructura del repositorio

```
proyectos-sonepar/
├── README.md
├── app/                                  ← App Vite (lo que se despliega en Vercel)
│   ├── src/
│   │   ├── App.jsx                       # Menú principal con las 7 herramientas
│   │   └── tools/
│   │       ├── SimuladorAlmacen.jsx
│   │       ├── FichasTecnicas.jsx
│   │       ├── DashboardIncidencias.jsx
│   │       ├── KpiLogistico.jsx
│   │       ├── Presupuestos.jsx
│   │       ├── FormacionInterna.jsx
│   │       └── Sonex.jsx                 ★ Herramienta principal
│   ├── docs/
│   │   └── CHANGELOG-v*.docx
│   └── package.json
├── chatbot-tecnico/                      ← Historial de versiones de SONEX
│   ├── sonepar-chatbot-tecnico-v*.jsx
│   └── docs/
│       ├── PLAN-sonex-v*.docx
│       └── CHANGELOG-sonex-v*.docx
├── simulador-almacen/
├── fichas-tecnicas/
├── dashboard-incidencias/
├── kpi-logistico/
├── presupuestos/
├── formacion-interna/
└── docs/
    ├── SONEPAR-TOOLS-README.docx
    └── SONEPAR-TOOLS-ROADMAP.docx
```

---

## Empezar en local

```bash
# 1. Clonar el repositorio
git clone https://github.com/iagorobo24-hub/proyectos-sonepar.git
cd proyectos-sonepar/app

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
echo "VITE_ANTHROPIC_KEY=sk-ant-..." > .env

# 4. Arrancar el servidor de desarrollo
npm run dev
# → http://localhost:5173
```

> ⚠️ La API key solo es necesaria en local. En [proyectos-sonepar.vercel.app](https://proyectos-sonepar.vercel.app) funciona directamente sin configuración.

---

## Estado del proyecto

- [x] **Fase 1** — Desarrollo de los 7 prototipos funcionales (v1–v2)
- [x] **Fase 2** — Revisión y pulido: SONEX v7, KPI v3, Presupuestos v3, Simulador v3
- [ ] **Fase 3** — Completar revisión de Formación, Dashboard e Incidencias (v3)
- [ ] **Fase 4** — Presentación interna en Sonepar A Coruña
- [ ] **Fase 5** — Evaluación de implantación real en delegaciones

**Versiones actuales:** Simulador `v3` · Fichas `v2` · Dashboard `v2` · KPI `v3` · Presupuestos `v3` · Formación `v2` · SONEX `v7`

---

## Documentación

Cada herramienta tiene su propio historial en la carpeta correspondiente:

- `PLAN-*.docx` — objetivos, alcance y decisiones de diseño de cada versión
- `CHANGELOG-*.docx` — cambios implementados con detalle técnico
- `docs/SONEPAR-TOOLS-README.docx` — descripción completa del proyecto
- `docs/SONEPAR-TOOLS-ROADMAP.docx` — hoja de ruta global

---

<div align="center">

*Este proyecto se desarrolla como iniciativa personal durante las prácticas.*  
*No está afiliado oficialmente a Sonepar España ni a Anthropic.*

</div>
