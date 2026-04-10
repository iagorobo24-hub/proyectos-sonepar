# QWEN.md — Proyectos Sonepar

## Project Overview

**Proyectos Sonepar** is a centralized suite of business tools built for Sonepar, a company focused on industrial automation and electrical distribution. The application provides an integrated ecosystem covering technical datasheets, warehouse simulation, incident dashboards, logistics KPIs, budgeting, internal training, and an AI-powered assistant (SONEX).

### Architecture

- **Frontend:** Single-page application (SPA) built with **React 19** and **Vite 7**
- **Routing:** `react-router-dom` v7 with nested routes under a shared `AppShell`
- **Styling:** CSS Modules with a consistent design system (IBM Plex Sans typography, unified color variables)
- **AI Integration:** Anthropic Claude API via a Vercel Edge Function proxy
- **Deployment:** Vercel (proyectos-sonepar.vercel.app)

### Modules / Tools (7 routes)

| Route | Tool | Description |
|-------|------|-------------|
| `/fichas` | Fichas Técnicas | Technical datasheet catalog with 65+ product references, integrated with SONEX navigation |
| `/almacen` | Simulador Almacén | Warehouse simulation and optimization tool |
| `/incidencias` | Dashboard Incidencias | Incident tracking and monitoring dashboard |
| `/kpi` | KPI Logístico | Logistics key performance indicators with charts (Recharts) |
| `/presupuestos` | Presupuestos | Budget/quote generation tool, linked from Fichas Técnicas |
| `/formacion` | Formación Interna | Internal training and knowledge base |
| `/sonex` | SONEX | AI-powered technical assistant using Anthropic Claude |

### Key Design Decisions

- **Unified catalog:** All 65 product references live in a single `catalogoSonepar.js` file to avoid duplication
- **Dynamic sidebar:** Navigation sidebar powered by route metadata (name, description, lucide-react icons)
- **Markdown processing:** SONEX responses are processed to render markdown symbols properly (no raw symbols)
- **URL params flow:** Navigation between tools uses URL params (e.g., SONEX → Fichas Técnicas → Presupuestos)

## Building and Running

### Prerequisites
- Node.js (latest LTS recommended)
- `VITE_ANTHROPIC_API_KEY` environment variable for SONEX AI features

### Commands

All commands should be run from the `app/` directory:

```bash
cd app

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Vercel Deployment

- Root-level `vercel.json` configures the build to run inside `app/`
- Output directory: `app/dist`
- API function: `api/anthropic.js` (Edge runtime)
- All routes rewrite to `index.html` for SPA behavior

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_ANTHROPIC_API_KEY` | `app/.env` / Vercel settings | Anthropic Claude API access |

## Project Structure

```
proyectos-sonepar/
├── api/
│   └── anthropic.js          # Vercel Edge Function — Anthropic API proxy
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # AppShell, Sidebar, Topbar (CSS Modules)
│   │   │   ├── ui/           # Reusable UI components (buttons, inputs, badges)
│   │   │   └── fichas/       # Fichas Técnicas-specific components
│   │   ├── data/
│   │   │   └── catalogoSonepar.js  # Unified 65-reference product catalog
│   │   ├── hooks/            # Custom React hooks (e.g., useDocumentTitle)
│   │   ├── contexts/         # React contexts
│   │   ├── styles/           # Global styles, variables.css
│   │   ├── tools/            # Main tool pages (7 modules, each with .jsx + .module.css)
│   │   ├── App.jsx           # Router setup, 7 routes
│   │   ├── App.css
│   │   ├── index.css         # Global reset, typography
│   │   └── main.jsx          # React entry point
│   ├── package.json
│   ├── vite.config.js        # Vite + React plugin, API proxy for dev
│   └── ...
├── vercel.json               # Vercel deployment configuration
├── PROGRESO.md               # Detailed development progress log
└── README.md                 # High-level project overview
```

## Development Conventions

- **CSS Modules:** Every component has its own `.module.css` file for scoped styling
- **Component naming:** PascalCase for React components, camelCase for hooks/utilities
- **No default exports for shared utilities;** default exports for page/route components
- **Route titles:** Use `useDocumentTitle` hook to set dynamic document titles per page
- **Design system:** Colors, typography, and spacing defined in global `variables.css` and `styles/`
- **Icons:** `lucide-react` for consistent icon usage across the sidebar and UI

## Version History

- **v2.0.0** (March 2026) — Complete redesign with 5 phases (F1–F5):
  - F1: Foundation (routing, shell, sidebar, typography)
  - F2: Base UI components (buttons, inputs, badges)
  - F3: Fichas Técnicas refactor (unified catalog, SONEX integration)
  - F4: All remaining tools with consistent UI
  - F5: Responsive design, SONEX loading indicator, markdown processing

## Key Integration Flows

1. **SONEX → Fichas Técnicas → Presupuestos:** Users can ask SONEX about a product, view its technical sheet, and create a budget quote — all linked via URL parameters
2. **Anthropic API:** Dev server proxies `/api/anthropic` to Anthropic; in production, Vercel Edge Function handles the proxy with the API key from environment variables
