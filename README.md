# Proyectos Sonepar

> **Ecosistema de herramientas web para automatización industrial y logística.**

Aplicación SPA con **7 módulos funcionales**, autenticación con Google, diseño responsive y asistente técnico impulsado por IA.

**Demo:** [proyectos-sonepar.vercel.app](https://proyectos-sonepar.vercel.app)

---

## Módulos

| Ruta | Módulo | Descripción |
|------|--------|-------------|
| `/login` | **Login** | Autenticación con Google (Firebase Auth) |
| `/fichas` | **Fichas Técnicas** | Catálogo de productos con navegación jerárquica |
| `/almacen` | **Simulador Almacén** | Simulación de ciclo completo de pedido |
| `/incidencias` | **Dashboard Incidencias** | Registro y diagnóstico de fallos industriales |
| `/kpi` | **KPI Logístico** | 6 KPIs con semáforo e informe ejecutivo |
| `/presupuestos` | **Presupuestos** | Generador de presupuestos con referencias del catálogo |
| `/formacion` | **Formación Interna** | Matriz de competencias y planes personalizados |
| `/sonex` | **SONEX** | Asistente técnico con IA (OpenRouter) |

---

## Stack Tecnológico

### Frontend
- **React 19** + **Vite 7**
- **React Router DOM v7** — Routing anidado
- **CSS Modules** — Estilos scoped por componente
- **Recharts** — Visualización de datos
- **lucide-react** — Iconografía
- **Tipografía:** IBM Plex Sans

### Autenticación y Backend
- **Firebase Auth** — Google Sign-In
- **Firestore** — Base de datos (datos por usuario)
- **OpenRouter API** — Gateway IA gratuito (Claude 3.5 Haiku, DeepSeek, Qwen) via Vercel Functions

### Deploy
- **Vercel** — Build automático + Serverless Functions

---

## Arquitectura

```
proyectos-sonepar/
├── app/
│   ├── api/
│   │   └── ai.js                  # Vercel Function — gateway IA (OpenRouter/Groq)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/              # LoginPage, ProtectedRoute
│   │   │   ├── HeroSection/       # Landing page (14 componentes + estilos)
│   │   │   ├── layout/            # AppShell, Topbar, Sidebar (responsive)
│   │   │   ├── fichas/            # TarjetaFicha
│   │   │   └── ui/                # Button, Badge, Input, Card, Spinner...
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx    # Estado de autenticación
│   │   │   ├── ThemeContext.jsx   # Modo claro/oscuro
│   │   │   └── ToastContext.jsx   # Notificaciones
│   │   ├── firebase/
│   │   │   └── firebaseConfig.js  # Inicialización Firebase
│   │   ├── data/                  # Catálogo, jerarquía, logos
│   │   ├── hooks/                 # 10 custom hooks (uno por módulo)
│   │   ├── pages/                 # LandingPage
│   │   ├── services/              # anthropicService, brandLogoService, catalogService, firestoreService
│   │   ├── styles/                # Variables CSS, animaciones
│   │   ├── tools/                 # 7 módulos (componentes de página)
│   │   ├── App.jsx                # Router + rutas protegidas
│   │   └── main.jsx               # Entry point + providers
│   ├── scripts/
│   │   └── sync-catalog-enhanced.mjs  # Script de sincronización de catálogo a Firestore
│   ├── public/
│   │   ├── logos/                  # Logos de 14 fabricantes
│   │   └── screenshots/           # Capturas para la landing page
│   ├── eslint.config.js
│   ├── firestore.rules            # Reglas de seguridad Firestore
│   ├── firebase.json
│   ├── playwright.config.js
│   ├── vercel.json                # Configuración de deploy
│   ├── vite.config.js
│   └── package.json
├── CLAUDE.md                      # Índice de skills para agentes IA
├── EVOLUCION.md                   # Guía cronológica de la evolución del proyecto
├── LICENSE                        # MIT
├── .gitignore
└── README.md
```

---

## Inicio Rápido

### Prerrequisitos
- Node.js (último LTS)
- Variables de entorno (ver sección [Configuración](#configuración))

### Desarrollo local

```bash
cd app
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`.

### Build de producción

```bash
cd app
npm run build
npm run preview
```

---

## Configuración

### Variables de entorno

Crea `app/.env`:

```env
OPENROUTER_API_KEY=sk-or-...
```

| Variable | Descripción |
|----------|-------------|
| `OPENROUTER_API_KEY` | API key de OpenRouter (para SONEX y funciones IA) |

Obtén una API key gratuita en [openrouter.ai](https://openrouter.ai/).

Las credenciales de Firebase están en `app/src/firebase/firebaseConfig.js` y son **públicas por diseño** (las Firebase API keys no son secretas). La seguridad real se gestiona con las **Firebase Security Rules** (`app/firestore.rules`).

### Firebase Console

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. **Authentication → Sign-in method** → Activar **Google**
3. **Firestore Database** → Crear base de datos
4. Añadir `localhost` y `proyectos-sonepar.vercel.app` como **Authorized Domains**

### Vercel

1. Conectar repo a Vercel (root directory: `app`)
2. Añadir variable `OPENROUTER_API_KEY` en settings del proyecto
3. Deploy automático en cada push a `main`

---

## Responsive Design

| Breakpoint | Comportamiento |
|------------|----------------|
| **> 1024px** (Desktop) | Navegación inline en topbar + sidebar lateral visible |
| **≤ 1024px** (Tablet/Mobile) | Botón hamburguesa con dropdown + sidebar oculto |

El menú hamburguesa incluye:
- Atributos ARIA (`aria-expanded`, `aria-haspopup`, `aria-label`)
- Cierre con tecla Escape
- Navegación por teclado compatible

---

## Autenticación

- **Google Sign-In** vía Firebase Auth
- **Rutas protegidas:** Todo el AppShell requiere autenticación
- **Página de login:** Pantalla dedicada fuera del layout principal
- **Estado de usuario:** Avatar con foto o iniciales, nombre/email, botón logout
- **Feedback de errores:** Toast notifications en login/logout

---

## Catálogo de Productos (Supabase)

El catálogo de productos se almacena en **Supabase** (PostgreSQL) con un esquema relacional completo:

- **`brands`** — Marcas / fabricantes
- **`categories`** — Jerarquía: Familia → Subfamilia → Tipo
- **`products`** — Todas las referencias (ref fabricante + ref Sonepar)
- **`product_prices`** — Historial de precios (tarifa + neto)
- **`product_documents`** — Fichas técnicas, manuales, certificados
- **`product_specifications`** — Specs técnicas (key-value)
- **`product_stock`** — _Vacía, preparada para conexión futura con software de almacén_

Para configurar Supabase, añade en `app/.env`:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Si no se configura Supabase, la app usa **Firestore** como fallback automático.

### Scraper & Sync

```bash
# 1. Scraping de tienda.sonepar.es
cd app/scripts/scraper
SONEPAR_USER=email SONEPAR_PASS=pass node sonepar-scraper.mjs

# 2. Sync a Supabase
SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node sync-to-supabase.mjs
```

Ver [app/scripts/scraper/README.md](app/scripts/scraper/README.md) para documentación completa.

### Sincronización Legacy (Firestore)

El script `app/scripts/sync-catalog-enhanced.mjs` sincroniza productos desde un JSON a Firestore:

```bash
cd app
node scripts/sync-catalog-enhanced.mjs
```

Requiere:
- `service-account.json` (Firebase Admin SDK)
- `sonepar-catalog-scraper/catalogo-final-v12.json` (datos del catálogo)

---

## Historial de Versiones

### v3.0.0 (Abril 2026)
- Autenticación con Google (Firebase Auth)
- Menú hamburguesa responsive (tablet + mobile)
- Avatar con iniciales cuando no hay foto
- Spinner de carga durante autenticación
- Accesibilidad ARIA en menú hamburguesa

### v2.0.0 (Marzo 2026)
- Rediseño completo en 5 fases (F1–F5)
- Catálogo unificado de 65+ referencias
- SONEX con procesamiento de markdown
- Sidebar dinámico con iconos lucide-react

### v1.0.0 (Marzo 2026)
- 7 herramientas como artefactos React independientes
- Integración inicial con Claude API

---

Para una guía detallada de la evolución del proyecto, ver [EVOLUCION.md](./EVOLUCION.md).

---

© 2024–2026 **iagorobo24-hub** · MIT License
