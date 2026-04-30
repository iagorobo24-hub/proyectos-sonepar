# Sonepar Catalog Scraper & Sync

> Sistema de scraping y sincronización del catálogo de [tienda.sonepar.es](https://tienda.sonepar.es) hacia Supabase.

## Arquitectura

```
                ┌──────────────────┐
                │ tienda.sonepar.es│
                └────────┬─────────┘
                         │ Playwright (headless browser)
                         ▼
              ┌────────────────────┐
              │ sonepar-scraper.mjs│  ← Extrae productos del DOM + XHR
              └────────┬───────────┘
                       │ JSON
                       ▼
            ┌──────────────────────┐
            │ catalogo-sonepar.json│  ← Archivo intermedio (~75K+ productos)
            └────────┬─────────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │ sync-to-supabase.mjs│  ← Upsert a Supabase (brands, categories, products, prices, docs, specs)
           └────────┬────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   Supabase    │
            │  PostgreSQL   │
            └───────────────┘
```

## Requisitos

```bash
# Desde app/
npm install playwright @supabase/supabase-js
npx playwright install chromium
```

## Uso

### 1. Aplicar migraciones (una sola vez)

Copia el contenido de `supabase/migrations/001_catalog_schema.sql` y `002_seed_categories_brands.sql` en el **SQL Editor** de tu proyecto Supabase ([dashboard](https://supabase.com/dashboard)) y ejecútalo.

### 2. Ejecutar el scraper

```bash
cd app/scripts/scraper

# Primera ejecución completa
SONEPAR_USER=tu@email.com SONEPAR_PASS=contraseña node sonepar-scraper.mjs

# Solo una categoría
SONEPAR_USER=tu@email.com SONEPAR_PASS=contraseña node sonepar-scraper.mjs --category CABLES

# Reanudar scrape interrumpido
SONEPAR_USER=tu@email.com SONEPAR_PASS=contraseña node sonepar-scraper.mjs --resume

# Modo visible (no headless) para debug
HEADLESS=false SONEPAR_USER=tu@email.com SONEPAR_PASS=contraseña node sonepar-scraper.mjs
```

El scraper genera:
- `output/catalogo-sonepar.json` — todos los productos
- `output/scrape-progress.json` — progreso (para reanudar)
- `output/scrape.log` — log detallado

### 3. Sincronizar con Supabase

```bash
cd app/scripts/scraper

# Sync completo
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node sync-to-supabase.mjs

# Dry run (ver qué haría sin escribir)
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node sync-to-supabase.mjs --dry-run

# Input alternativo
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node sync-to-supabase.mjs --input ./otro-catalogo.json
```

## Variables de entorno

| Variable | Uso | Requerido |
|----------|-----|-----------|
| `SONEPAR_USER` | Email de cuenta Sonepar | Scraper |
| `SONEPAR_PASS` | Contraseña de cuenta Sonepar | Scraper |
| `SUPABASE_URL` | URL del proyecto Supabase | Sync |
| `SUPABASE_SERVICE_KEY` | service_role key (bypass RLS) | Sync |
| `HEADLESS` | `false` para ver el navegador | Scraper (opcional) |

## Esquema de la base de datos

Ver `supabase/migrations/001_catalog_schema.sql` para el esquema completo.

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `brands` | Marcas/fabricantes (Schneider, ABB, Siemens...) |
| `categories` | Jerarquía: Familia → Subfamilia → Tipo |
| `products` | Productos con ref fabricante, ref Sonepar, nombre, etc. |
| `product_prices` | Historial de precios (tarifa + neto) |
| `product_documents` | Fichas técnicas, manuales, certificados, PDFs |
| `product_specifications` | Specs técnicas (key-value por producto) |
| `product_stock` | ⚠️ Vacía — preparada para conexión futura con software de almacén |
| `product_relations` | Accesorios, complementos, alternativas |
| `scrape_runs` | Registro de cada ejecución del scraper |

### Views y funciones

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `v_products_with_prices` | View | Producto + precio actual + marca |
| `v_category_tree` | View | Árbol completo Familia → Subfamilia → Tipo |
| `v_category_counts` | View | Conteo de productos por categoría |
| `search_products()` | RPC | Búsqueda full-text + fuzzy |
| `get_catalog_hierarchy()` | RPC | Jerarquía en formato JSON (compatible con hierarchy.json) |
| `get_product_detail()` | RPC | Ficha completa de producto (docs, specs, precio, stock, relacionados) |

## Formato del JSON intermedio

Cada producto en `catalogo-sonepar.json`:

```json
{
  "ref": "LC1D09M7",
  "refSonepar": "1234567",
  "nombre": "Contactor TeSys D 9A 220V AC-3 1NO+1NC",
  "marca": "SCHNEIDER ELECTRIC",
  "familia": "CONTROL Y AUTOMATIZACION INDUSTRIAL",
  "precio": 28.50,
  "pvp": 42.00,
  "imageUrl": "https://...",
  "productUrl": "https://tienda.sonepar.es/...",
  "ean": "3606480320...",
  "unit": "ud",
  "documents": [
    { "name": "Ficha técnica", "url": "https://...", "type": "ficha_tecnica", "format": "pdf" }
  ],
  "specifications": [
    { "key": "Corriente nominal", "value": "9", "unit": "A", "group": "Eléctricas" }
  ],
  "scrapedAt": "2026-04-30T08:00:00.000Z"
}
```
