# Sonepar Tools

[![Demo en vivo](https://img.shields.io/badge/Demo-Vercel-black)](https://proyectos-sonepar.vercel.app)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev)

Suite de 7 herramientas web con IA integrada desarrolladas durante las
prácticas en Sonepar España (A Coruña). Proyecto Final de Ciclo —
CFGS Automatización y Robótica Industrial · 2026.

**Demo:** [proyectos-sonepar.vercel.app](https://proyectos-sonepar.vercel.app)

---

## Las 7 herramientas

| # | Herramienta | Área | Descripción |
|---|-------------|------|-------------|
| 01 | **SONEX** | Mostrador técnico | Chatbot técnico especializado con streaming, catálogo de 65+ referencias y navegación a fichas y presupuestos |
| 02 | **Fichas Técnicas** | Mostrador técnico | Generador de fichas técnicas con comparativa de productos via IA |
| 03 | **Presupuestos** | Mostrador técnico | Generador de presupuestos editables con catálogo Sonepar y export PDF |
| 04 | **Dashboard Incidencias** | Operaciones | Registro y diagnóstico IA de fallos en equipos industriales |
| 05 | **KPI Logístico** | Operaciones | Cálculo de 6 KPIs logísticos con semáforo e informe ejecutivo IA |
| 06 | **Simulador Almacén** | Formación | Simulador del ciclo recepción→picking→expedición con cronómetro e incidencias |
| 07 | **Formación Interna** | Formación | Tracker de formación por empleado con matriz y plan personalizado IA |

---

## Stack técnico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.x | Framework principal |
| Vite | 5.x | Build tool y servidor de desarrollo |
| Claude Sonnet | claude-sonnet-4-20250514 | IA en las 7 herramientas |
| react-router-dom | 6.x | Navegación entre herramientas |
| Recharts | Latest | Gráficos en KPI Logístico |
| lucide-react | Latest | Iconografía SVG |
| CSS Modules | Nativo Vite | Estilos con scope por componente |
| Vercel | Free | Deploy automático desde GitHub |

---

## Cómo ejecutar en local
```bash
# 1. Clonar el repositorio
git clone https://github.com/iagorobo24-hub/proyectos-sonepar.git
cd proyectos-sonepar/app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y añadir tu API key de Anthropic

# 4. Arrancar el servidor de desarrollo
npm run dev
```

Abre [localhost:5173](http://localhost:5173) en tu navegador.

> **Nota:** Las llamadas a la API de Anthropic desde localhost están
> bloqueadas por CORS. Para probar la funcionalidad de IA usa el
> deploy de Vercel o configura un proxy local.

---

## Variables de entorno

Crea un archivo `.env` en la carpeta `app/` con:
VITE_ANTHROPIC_API_KEY=tu_api_key_aqui

Obtén una API key en [console.anthropic.com](https://console.anthropic.com).

---

## Arquitectura
Usuario → React SPA (Vercel) → /api/anthropic (Serverless) → Anthropic API
↓
localStorage (historial, preferencias)

La app es un SPA sin backend propio. Las llamadas a la API de
Anthropic pasan por una función serverless en Vercel para evitar
exponer la API key en el navegador.

---

## Deuda técnica documentada

Limitaciones conocidas y aceptadas para el contexto del PFC:

- **localStorage** como única capa de persistencia
- **Sin autenticación** de usuarios
- **Catálogo manual** de ~65 referencias (no conectado al ERP real)

---

## Autor

Iago · Prácticas Sonepar España · A Coruña · 2026
CFGS Automatización y Robótica Industrial
