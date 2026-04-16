# ⚡ Proyectos Sonepar

> **Ecosistema de herramientas web para automatización industrial y logística.**

Aplicación SPA (Single Page Application) con **7 módulos funcionales**, autenticación con Google, diseño responsive y asistente técnico impulsado por IA.

**🌐 Demo:** [proyectos-sonepar.vercel.app](https://proyectos-sonepar.vercel.app)

---

## 📦 Módulos

| Ruta | Módulo | Descripción |
|------|--------|-------------|
| `/login` | **Login** | Autenticación con Google (Firebase Auth) |
| `/fichas` | **Fichas Técnicas** | Catálogo de 65+ productos con generación IA |
| `/almacen` | **Simulador Almacén** | Simulación de ciclo completo de pedido |
| `/incidencias` | **Dashboard Incidencias** | Registro y diagnóstico de fallos industriales |
| `/kpi` | **KPI Logístico** | 6 KPIs con semáforo e informe ejecutivo |
| `/presupuestos` | **Presupuestos** | Generador de presupuestos con referencias del catálogo |
| `/formacion` | **Formación Interna** | Matriz de competencias y planes personalizados |
| `/sonex` | **SONEX** | Asistente técnico con IA (Anthropic Claude) |

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** + **Vite 7**
- **React Router DOM v7** — Routing anidado
- **CSS Modules** — Estilos scoped por componente
- **Recharts** — Visualización de datos
- **lucide-react** — Iconografía
- **Tipografía:** IBM Plex Sans

### Autenticación & Backend
- **Firebase Auth** — Google Sign-In
- **Firestore** — Base de datos (datos por usuario)
- **Anthropic Claude API** — Asistente SONEX (proxy vía Vercel Edge Functions)

### Testing & Calidad
- **Playwright** — Suite E2E (14 tests visuales)
- **ESLint v9** — react-hooks + react-refresh plugins

### Deploy
- **Vercel** — Build automático + Edge Functions

---

## ️ Arquitectura

```
proyectos-sonepar/
├── api/
│   └── anthropic.js              # Vercel Edge Function — proxy a Anthropic
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # LoginPage, ProtectedRoute
│   │   │   ├── layout/           # AppShell, Topbar, Sidebar (responsive)
│   │   │   └── ui/               # Componentes reutilizables
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx   # Estado de autenticación
│   │   │   ├── ThemeContext.jsx  # Modo claro/oscuro
│   │   │   └── ToastContext.jsx  # Notificaciones
│   │   ├── firebase/
│   │   │   └── firebaseConfig.js # Inicialización Firebase
│   │   ├── data/
│   │   │   └── catalogoSonepar.js  # Catálogo unificado 65+ referencias
│   │   ├── tools/                # 7 módulos (Fichas, Almacén, Incidencias...)
│   │   ├── App.jsx               # Router + rutas protegidas
│   │   └── main.jsx              # Entry point + providers
│   ├── e2e/                      # Tests Playwright (14 tests)
│   └── package.json
├── vercel.json                   # Configuración de despliegue
├── .gitignore
└── README.md
```

---

## 🚀 Inicio Rápido

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

### Tests E2E

```bash
cd app
npx playwright install chromium
npx playwright test
```

14 tests cubren: login, responsive (3 tamaños), navegación, hamburguesa, sidebar, dark mode, performance y errores JS.

---

## 🔐 Configuración

### Variables de entorno

Crea `app/.env`:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

| Variable | Descripción |
|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | API key de Anthropic Claude (para SONEX) |

Las credenciales de Firebase están en `app/src/firebase/firebaseConfig.js` y son **públicas por diseño** (las Firebase API keys no son secretas). La seguridad real se gestiona con las **Firebase Security Rules**.

### Firebase Console

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. **Authentication → Sign-in method** → Activar **Google**
3. **Firestore Database** → Crear base de datos (modo prueba)
4. Añadir `localhost` y `proyectos-sonepar.vercel.app` como **Authorized Domains**

### Vercel

1. Conectar repo a Vercel
2. Añadir variable `VITE_ANTHROPIC_API_KEY` en settings del proyecto
3. Deploy automático en cada push a `main`

---

## 📱 Responsive Design

| Breakpoint | Comportamiento |
|------------|----------------|
| **> 1024px** (Desktop) | Navegación inline en topbar + sidebar lateral visible |
| **≤ 1024px** (Tablet/Mobile) | Botón hamburguesa con dropdown + sidebar oculto |

El menú hamburguesa incluye:
- Atributos ARIA (`aria-expanded`, `aria-haspopup`, `aria-label`)
- Cierre con tecla Escape
- Navegación por teclado compatible

---

## 🔒 Autenticación

- **Google Sign-In** vía Firebase Auth
- **Rutas protegidas:** Todo el AppShell requiere autenticación
- **Página de login:** Pantalla dedicada fuera del layout principal
- **Estado de usuario:** Avatar con foto o iniciales, nombre/email, botón logout
- **Feedback de errores:** Toast notifications en login/logout

---

## 🧪 Testing

Suite E2E con **Playwright** — 14 tests automáticos:

| Test | Cobertura |
|------|-----------|
| `01-login` | Elementos y accesibilidad |
| `02-login` | Responsive (desktop, tablet, mobile) |
| `03-rutas` | Redirección sin auth (7 rutas) |
| `04-vistas` | Screenshots de 7 herramientas (desktop) |
| `05-vistas` | Screenshots de 7 herramientas (tablet) |
| `06-vistas` | Screenshots de 7 herramientas (mobile) |
| `07-navegación` | Navegación entre herramientas |
| `08-sidebar` | Colapsar/expandir |
| `09-topbar` | Usuario con avatar de iniciales |
| `10-dark-mode` | Toggle de tema |
| `11-performance` | Tiempos de carga |
| `12-sin-errores` | Cero errores JS en todas las páginas |
| `13-hamburguesa` | Menú mobile (abrir, navegar, cerrar) |
| `14-hamburguesa` | Menú tablet |

---

## 📝 Historial de Versiones

### v3.0.0 (Abril 2026)
- 🔐 Autenticación con Google (Firebase Auth)
- 📱 Menú hamburguesa responsive (tablet + mobile)
- 🎨 Avatar con iniciales cuando no hay foto
- ⚡ Spinner de carga durante autenticación
- 🧪 Suite de tests E2E con Playwright (14 tests)
- ♿ Accesibilidad ARIA en menú hamburguesa

### v2.0.0 (Marzo 2026)
- Rediseño completo en 5 fases (F1–F5)
- Catálogo unificado de 65+ referencias
- SONEX con procesamiento de markdown
- Sidebar dinámico con iconos lucide-react

---

© 2024–2026 **iagorobo24-hub** | *Powering the Sonepar digital transformation.*
