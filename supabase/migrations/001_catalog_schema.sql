-- ============================================================
-- SONEPAR CATALOG — Esquema completo para Supabase
-- Diseñado para almacenar TODAS las referencias de tienda.sonepar.es
-- con datos oficiales, documentación y precios.
--
-- Jerarquía: Familia (N1) → Subfamilia (N2) → Tipo (N3)
-- Cada producto pertenece a una marca y a un nodo hoja de la jerarquía.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. MARCAS / FABRICANTES
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  color       TEXT,            -- hex color for UI (#3DCD58)
  website_url TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_slug ON brands (slug);

-- ──────────────────────────────────────────────────────────
-- 2. CATEGORÍAS (jerarquía autorreferencial)
--    level 1 = Familia   (CABLES, ILUMINACION, ...)
--    level 2 = Subfamilia (CABLES DE BAJA TENSION, ...)
--    level 3 = Tipo       (CABLES DE ENERGÍA 500/750 V, ...)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  level       INT NOT NULL CHECK (level BETWEEN 1 AND 3),
  parent_id   UUID REFERENCES categories(id) ON DELETE CASCADE,
  icon        TEXT,            -- emoji or icon name
  description TEXT,
  tip         TEXT,            -- usage/selection tip for the UI
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, parent_id)
);

CREATE INDEX idx_categories_parent  ON categories (parent_id);
CREATE INDEX idx_categories_level   ON categories (level);
CREATE INDEX idx_categories_slug    ON categories (slug);

-- ──────────────────────────────────────────────────────────
-- 3. PRODUCTOS (referencia principal)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_fabricante  TEXT NOT NULL,           -- referencia del fabricante (ej. LC1D09M7)
  ref_sonepar     TEXT,                    -- referencia interna Sonepar
  ean             TEXT,                    -- código de barras EAN-13
  name            TEXT NOT NULL,           -- nombre / descripción corta
  description     TEXT,                    -- descripción extendida
  brand_id        UUID NOT NULL REFERENCES brands(id),
  category_id     UUID REFERENCES categories(id),  -- nodo hoja del árbol (tipo)
  familia         TEXT,                    -- desnormalizado para queries rápidas
  subfamilia      TEXT,                    -- desnormalizado
  tipo            TEXT,                    -- desnormalizado
  unit            TEXT DEFAULT 'ud',       -- unidad de venta (ud, m, bobina, rollo, kg)
  weight_kg       NUMERIC(10,3),
  image_url       TEXT,
  thumbnail_url   TEXT,
  sonepar_url     TEXT,                    -- enlace a tienda.sonepar.es
  manufacturer_url TEXT,                   -- enlace a página del fabricante
  is_active       BOOLEAN NOT NULL DEFAULT true,
  scraped_at      TIMESTAMPTZ,             -- última vez que se scrapeó
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ref_fabricante)
);

CREATE INDEX idx_products_ref_sonepar   ON products (ref_sonepar);
CREATE INDEX idx_products_ean           ON products (ean);
CREATE INDEX idx_products_brand         ON products (brand_id);
CREATE INDEX idx_products_category      ON products (category_id);
CREATE INDEX idx_products_familia       ON products (familia);
CREATE INDEX idx_products_active        ON products (is_active) WHERE is_active = true;

-- Full-text search index
ALTER TABLE products ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(ref_fabricante, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(ref_sonepar, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(name, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(familia, '')), 'D') ||
    setweight(to_tsvector('spanish', coalesce(tipo, '')), 'D')
  ) STORED;

CREATE INDEX idx_products_fts ON products USING gin(fts);

-- Trigram index for fuzzy/partial matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_ref_trgm  ON products USING gin(ref_fabricante gin_trgm_ops);

-- ──────────────────────────────────────────────────────────
-- 4. PRECIOS (historial)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  precio_tarifa   NUMERIC(12,4),   -- PVP / precio de tarifa
  precio_neto     NUMERIC(12,4),   -- precio neto (con descuentos)
  descuento_pct   NUMERIC(5,2),    -- % descuento aplicado
  currency        TEXT NOT NULL DEFAULT 'EUR',
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until     TIMESTAMPTZ,
  source          TEXT DEFAULT 'scraper',  -- 'scraper', 'manual', 'api'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prices_product    ON product_prices (product_id);
CREATE INDEX idx_prices_valid      ON product_prices (product_id, valid_from DESC);

-- ──────────────────────────────────────────────────────────
-- 5. DOCUMENTACIÓN TÉCNICA
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL,  -- 'ficha_tecnica', 'manual', 'certificado', 'declaracion_ce', 'esquema', 'catalogo', 'hoja_datos'
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  file_format TEXT,           -- 'pdf', 'dwg', 'step', 'jpg'
  file_size   INT,            -- bytes
  language    TEXT DEFAULT 'es',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_docs_product ON product_documents (product_id);
CREATE INDEX idx_docs_type    ON product_documents (product_id, doc_type);

-- ──────────────────────────────────────────────────────────
-- 6. ESPECIFICACIONES TÉCNICAS (key-value)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_specifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_group  TEXT,           -- agrupación: 'Eléctricas', 'Dimensiones', 'Ambientales', 'Normativa'
  spec_key    TEXT NOT NULL,  -- clave: 'seccion_mm2', 'numero_conductores', 'tension_nominal_v'
  spec_value  TEXT NOT NULL,
  spec_unit   TEXT,           -- unidad: 'mm²', 'V', 'A', 'kg/m', '°C'
  sort_order  INT DEFAULT 0,
  UNIQUE (product_id, spec_key)
);

CREATE INDEX idx_specs_product ON product_specifications (product_id);
CREATE INDEX idx_specs_group   ON product_specifications (product_id, spec_group);

-- ──────────────────────────────────────────────────────────
-- 7. STOCK / DISPONIBILIDAD
--    ⚠️ Tabla vacía por ahora. Preparada para conexión futura
--    con software oficial de almacén (SAP, AS/400, etc.).
--    No se alimenta desde el scraper.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_stock (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  almacen     TEXT NOT NULL DEFAULT 'central',  -- 'central', 'madrid', 'barcelona', etc.
  cantidad    INT DEFAULT 0,
  disponible  BOOLEAN NOT NULL DEFAULT true,
  plazo_dias  INT,            -- plazo de entrega estimado
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, almacen)
);

CREATE INDEX idx_stock_product ON product_stock (product_id);

-- ──────────────────────────────────────────────────────────
-- 8. PRODUCTOS RELACIONADOS / ACCESORIOS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_relations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  relation_type   TEXT NOT NULL DEFAULT 'accesorio',  -- 'accesorio', 'complemento', 'alternativa', 'repuesto'
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, related_id, relation_type),
  CHECK (product_id <> related_id)
);

CREATE INDEX idx_relations_product ON product_relations (product_id);

-- ──────────────────────────────────────────────────────────
-- 9. SCRAPE RUNS (tracking de sesiones de scraping)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  total_products  INT DEFAULT 0,
  new_products    INT DEFAULT 0,
  updated_products INT DEFAULT 0,
  errors          INT DEFAULT 0,
  categories_scraped TEXT[],
  config          JSONB,           -- configuración del scraper usada
  error_log       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- 10. VIEWS para la app
-- ──────────────────────────────────────────────────────────

-- Vista: producto con precio actual
CREATE OR REPLACE VIEW v_products_with_prices AS
SELECT
  p.*,
  pp.precio_tarifa,
  pp.precio_neto,
  pp.descuento_pct,
  pp.currency,
  b.name  AS brand_name,
  b.slug  AS brand_slug,
  b.logo_url AS brand_logo,
  b.color AS brand_color
FROM products p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN LATERAL (
  SELECT precio_tarifa, precio_neto, descuento_pct, currency
  FROM product_prices
  WHERE product_id = p.id
  ORDER BY valid_from DESC
  LIMIT 1
) pp ON true
WHERE p.is_active = true;

-- Vista: árbol de categorías completo
CREATE OR REPLACE VIEW v_category_tree AS
SELECT
  c3.id          AS tipo_id,
  c3.name        AS tipo,
  c3.slug        AS tipo_slug,
  c2.id          AS subfamilia_id,
  c2.name        AS subfamilia,
  c2.slug        AS subfamilia_slug,
  c1.id          AS familia_id,
  c1.name        AS familia,
  c1.slug        AS familia_slug,
  c1.icon        AS familia_icon,
  c1.description AS familia_desc,
  c1.tip         AS familia_tip
FROM categories c3
JOIN categories c2 ON c2.id = c3.parent_id AND c2.level = 2
JOIN categories c1 ON c1.id = c2.parent_id AND c1.level = 1
WHERE c3.level = 3;

-- Vista: conteo de productos por familia
CREATE OR REPLACE VIEW v_category_counts AS
SELECT
  c.id,
  c.name,
  c.level,
  c.parent_id,
  COUNT(DISTINCT p.id) AS product_count
FROM categories c
LEFT JOIN products p ON (
  (c.level = 1 AND p.familia = c.name) OR
  (c.level = 2 AND p.subfamilia = c.name) OR
  (c.level = 3 AND p.category_id = c.id)
)
WHERE p.is_active = true OR p.id IS NULL
GROUP BY c.id, c.name, c.level, c.parent_id;

-- ──────────────────────────────────────────────────────────
-- 11. FUNCIONES RPC
-- ──────────────────────────────────────────────────────────

-- Búsqueda full-text de productos
CREATE OR REPLACE FUNCTION search_products(search_query TEXT, max_results INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  ref_fabricante TEXT,
  ref_sonepar TEXT,
  name TEXT,
  brand_name TEXT,
  brand_logo TEXT,
  familia TEXT,
  precio_tarifa NUMERIC,
  precio_neto NUMERIC,
  rank REAL
) LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.ref_fabricante,
    p.ref_sonepar,
    p.name,
    b.name AS brand_name,
    b.logo_url AS brand_logo,
    p.familia,
    pp.precio_tarifa,
    pp.precio_neto,
    ts_rank(p.fts, websearch_to_tsquery('spanish', search_query)) AS rank
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  LEFT JOIN LATERAL (
    SELECT precio_tarifa, precio_neto
    FROM product_prices
    WHERE product_id = p.id
    ORDER BY valid_from DESC
    LIMIT 1
  ) pp ON true
  WHERE p.is_active = true
    AND (
      p.fts @@ websearch_to_tsquery('spanish', search_query)
      OR p.ref_fabricante ILIKE '%' || search_query || '%'
      OR p.ref_sonepar ILIKE '%' || search_query || '%'
      OR similarity(p.name, search_query) > 0.2
    )
  ORDER BY
    CASE WHEN p.ref_fabricante ILIKE search_query THEN 0
         WHEN p.ref_sonepar ILIKE search_query THEN 1
         ELSE 2 END,
    ts_rank(p.fts, websearch_to_tsquery('spanish', search_query)) DESC
  LIMIT max_results;
$$;

-- Obtener jerarquía completa para navegación (formato compatible con hierarchy.json)
CREATE OR REPLACE FUNCTION get_catalog_hierarchy()
RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT jsonb_object_agg(
    familia,
    marcas_obj
  )
  FROM (
    SELECT
      c1.name AS familia,
      jsonb_object_agg(
        b.name,
        subfamilias_obj
      ) AS marcas_obj
    FROM categories c1
    JOIN (
      SELECT DISTINCT p.familia, p.brand_id, p.subfamilia, p.tipo
      FROM products p
      WHERE p.is_active = true
    ) p_agg ON p_agg.familia = c1.name
    JOIN brands b ON b.id = p_agg.brand_id
    JOIN LATERAL (
      SELECT jsonb_object_agg(
        subfamilia,
        tipos_arr
      ) AS subfamilias_obj
      FROM (
        SELECT
          p2.subfamilia,
          jsonb_agg(DISTINCT p2.tipo ORDER BY p2.tipo) AS tipos_arr
        FROM products p2
        WHERE p2.is_active = true
          AND p2.familia = c1.name
          AND p2.brand_id = b.id
        GROUP BY p2.subfamilia
      ) sub
    ) subs ON true
    WHERE c1.level = 1
    GROUP BY c1.name
  ) top;
$$;

-- Obtener ficha completa de un producto (con docs, specs, precio)
CREATE OR REPLACE FUNCTION get_product_detail(product_ref TEXT)
RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'product', row_to_json(p),
    'brand', jsonb_build_object(
      'name', b.name,
      'logo_url', b.logo_url,
      'color', b.color,
      'website_url', b.website_url
    ),
    'price', (
      SELECT row_to_json(pp)
      FROM product_prices pp
      WHERE pp.product_id = p.id
      ORDER BY pp.valid_from DESC
      LIMIT 1
    ),
    'documents', (
      SELECT coalesce(jsonb_agg(row_to_json(d) ORDER BY d.doc_type, d.name), '[]'::jsonb)
      FROM product_documents d
      WHERE d.product_id = p.id
    ),
    'specifications', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'group', s.spec_group,
          'key', s.spec_key,
          'value', s.spec_value,
          'unit', s.spec_unit
        ) ORDER BY s.spec_group, s.sort_order
      ), '[]'::jsonb)
      FROM product_specifications s
      WHERE s.product_id = p.id
    ),
    'stock', (
      SELECT coalesce(jsonb_agg(row_to_json(st)), '[]'::jsonb)
      FROM product_stock st
      WHERE st.product_id = p.id
    ),
    'related', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'ref', rp.ref_fabricante,
          'name', rp.name,
          'relation_type', pr.relation_type
        )
      ), '[]'::jsonb)
      FROM product_relations pr
      JOIN products rp ON rp.id = pr.related_id
      WHERE pr.product_id = p.id
    )
  )
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  WHERE upper(p.ref_fabricante) = upper(product_ref)
     OR upper(p.ref_sonepar) = upper(product_ref)
  LIMIT 1;
$$;

-- ──────────────────────────────────────────────────────────
-- 12. ROW-LEVEL SECURITY (RLS)
-- Catálogo público de lectura, escritura solo para service_role
-- ──────────────────────────────────────────────────────────
ALTER TABLE brands              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_runs         ENABLE ROW LEVEL SECURITY;

-- Lectura pública para el catálogo
CREATE POLICY "Catálogo lectura pública" ON brands            FOR SELECT USING (true);
CREATE POLICY "Catálogo lectura pública" ON categories        FOR SELECT USING (true);
CREATE POLICY "Catálogo lectura pública" ON products          FOR SELECT USING (true);
CREATE POLICY "Catálogo lectura pública" ON product_prices    FOR SELECT USING (true);
CREATE POLICY "Catálogo lectura pública" ON product_documents FOR SELECT USING (true);
CREATE POLICY "Catálogo lectura pública" ON product_specifications FOR SELECT USING (true);
CREATE POLICY "Catálogo lectura pública" ON product_stock     FOR SELECT USING (true);
CREATE POLICY "Catálogo lectura pública" ON product_relations FOR SELECT USING (true);

-- Scrape runs solo lectura para anon, escritura solo service_role
CREATE POLICY "Scrape runs lectura" ON scrape_runs FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- 13. TRIGGERS para updated_at
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_brands_updated    BEFORE UPDATE ON brands     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated  BEFORE UPDATE ON products   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
