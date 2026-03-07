# proyectos-sonepar

**Suite de herramientas internas con IA para distribución de material eléctrico industrial**

Desarrollado durante las prácticas del Ciclo Formativo de Automatización y Robótica Industrial en **Sonepar España** (A Coruña, 2026).

> Estas herramientas nacen de observar procesos reales en delegación y almacén, e identificar dónde la tecnología puede reducir fricción operativa. Todas integran IA generativa (Claude API) para ir más allá de ser simples interfaces estáticas.

---

## Estructura del repositorio

```
proyectos-sonepar/
│
├── README.md                        ← Este archivo
├── ROADMAP.md                       ← Hoja de ruta global del proyecto
│
├── 01-simulador-almacen/
│   ├── README.md                    ← Documentación específica
│   ├── CHANGELOG.md                 ← Historial de versiones
│   └── simulador-almacen.jsx        ← Artefacto React
│
├── 02-fichas-tecnicas/
│   ├── README.md
│   ├── CHANGELOG.md
│   └── fichas-tecnicas.jsx
│
├── 03-dashboard-incidencias/
│   ├── README.md
│   ├── CHANGELOG.md
│   └── dashboard-incidencias.jsx
│
├── 04-kpi-logistico/
│   ├── README.md
│   ├── CHANGELOG.md
│   └── kpi-logistico.jsx
│
├── 05-generador-presupuestos/
│   ├── README.md
│   ├── CHANGELOG.md
│   └── generador-presupuestos.jsx
│
├── 06-formacion-interna/
│   ├── README.md
│   ├── CHANGELOG.md
│   └── formacion-interna.jsx
│
└── 07-sonex-chatbot/
    ├── README.md
    ├── CHANGELOG.md
    └── sonex-chatbot.jsx
```

---

## Las 7 herramientas

| # | Herramienta | Área | Estado | IA |
|---|---|---|---|---|
| 01 | Simulador de Flujo de Almacén | Logística | `v1.0` | Análisis post-ciclo |
| 02 | Asistente de Fichas Técnicas | Mostrador | `v2.0` | Generación de fichas |
| 03 | Dashboard de Incidencias | Mantenimiento | `v1.0` | Diagnóstico técnico |
| 04 | KPI Logístico | Operaciones | `v1.0` | Informe de turno |
| 05 | Generador de Presupuestos | Comercial | `v2.0` | Partidas y precios |
| 06 | Formación Interna | RRHH | `v1.0` | Plan de desarrollo |
| 07 | SONEX — Chatbot Técnico | Mostrador | `v1.0` | Conversacional |

---

## Tecnología

- **Frontend:** React (JSX), CSS-in-JS
- **IA:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Persistencia:** localStorage / `window.storage`
- **Exportación:** `window.print()` para PDF
- **Hosting:** Vercel (próximamente)

---

## Cómo usar cada herramienta

Todas las herramientas son artefactos React autocontenidos. Para ejecutarlas localmente:

```bash
# Opción 1: Directamente en Claude.ai
# Abre el .jsx en Claude y se renderiza automáticamente

# Opción 2: En un proyecto React local
npx create-react-app demo-sonepar
# Copia el contenido del .jsx como componente principal
npm start
```

Para despliegue en producción, ver [ROADMAP.md](./ROADMAP.md).

---

## Autor

**Iago Robo** — Técnico en Automatización y Robótica Industrial  
Prácticas en Sonepar España · A Coruña · 2026  
GitHub: [iagorobo24-hub](https://github.com/iagorobo24-hub)

---

## Licencia

Proyecto de desarrollo personal con fines formativos y demostrativos.  
No afiliado oficialmente a Sonepar España S.A.
