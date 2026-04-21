-- ==========================================
-- SCRIPT DE CONFIGURACIÓN DE SUPABASE
-- Para proyectos-sonepar
-- ==========================================

-- 1. CREAR TABLAS PRINCIPALES

-- Tabla de productos del catálogo (equivalente a catalog_products en Firestore)
CREATE TABLE IF NOT EXISTS catalog_products (
  ref TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  marca TEXT NOT NULL,
  familia TEXT NOT NULL,
  gama TEXT,
  tipo TEXT,
  descripcion TEXT,
  precio NUMERIC,
  pvp NUMERIC,
  stock TEXT,
  pdf TEXT,
  pdf_url TEXT,
  ref_sonepar TEXT,
  search_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de metadatos del catálogo (equivalente a catalog_metadata)
CREATE TABLE IF NOT EXISTS catalog_metadata (
  id TEXT PRIMARY KEY,
  tree JSONB NOT NULL DEFAULT '{}',
  total_products INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR TABLAS DE USUARIO

-- Perfil de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY REFERENCES (auth.users) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de fichas técnicas
CREATE TABLE IF NOT EXISTS user_fichas_history (
  user_id TEXT REFERENCES (auth.users) ON DELETE CASCADE,
  id TEXT NOT NULL DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '[]',
  source_key TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Historial de presupuestos
CREATE TABLE IF NOT EXISTS user_budgets_history (
  user_id TEXT REFERENCES (auth.users) ON DELETE CASCADE,
  id TEXT NOT NULL DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '[]',
  source_key TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Incidencias de usuario
CREATE TABLE IF NOT EXISTS user_incidents (
  user_id TEXT REFERENCES (auth.users) ON DELETE CASCADE,
  id TEXT NOT NULL DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '[]',
  source_key TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Entradas de KPI
CREATE TABLE IF NOT EXISTS user_kpi_entries (
  user_id TEXT REFERENCES (auth.users) ON DELETE CASCADE,
  id TEXT NOT NULL DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '[]',
  source_key TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Datos del simulador
CREATE TABLE IF NOT EXISTS user_simulator_data (
  user_id TEXT REFERENCES (auth.users) ON DELETE CASCADE,
  id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  source_key TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Datos de formación
CREATE TABLE IF NOT EXISTS user_training_data (
  user_id TEXT REFERENCES (auth.users) ON DELETE CASCADE,
  id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  source_key TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT REFERENCES (auth.users) ON DELETE CASCADE,
  id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  source_key TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- 3. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO

-- Índices para catálogo de productos
CREATE INDEX IF NOT EXISTS idx_catalog_products_ref ON catalog_products(ref);
CREATE INDEX IF NOT EXISTS idx_catalog_products_marca ON catalog_products(marca);
CREATE INDEX IF NOT EXISTS idx_catalog_products_familia ON catalog_products(familia);
CREATE INDEX IF NOT EXISTS idx_catalog_products_gama ON catalog_products(gama);
CREATE INDEX IF NOT EXISTS idx_catalog_products_tipo ON catalog_products(tipo);
CREATE INDEX IF NOT EXISTS idx_catalog_products_search ON catalog_products USING GIN (search_keywords);

-- Índices para tablas de usuario
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_fichas_history_user_id ON user_fichas_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_budgets_history_user_id ON user_budgets_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_incidents_user_id ON user_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kpi_entries_user_id ON user_kpi_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_simulator_data_user_id ON user_simulator_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_data_user_id ON user_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 4. CREAR FUNCIONES Y TRIGGERS

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_catalog_products_updated_at
  BEFORE UPDATE ON catalog_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_metadata_updated_at
  BEFORE UPDATE ON catalog_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_fichas_history_updated_at
  BEFORE UPDATE ON user_fichas_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_budgets_history_updated_at
  BEFORE UPDATE ON user_budgets_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_incidents_updated_at
  BEFORE UPDATE ON user_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_kpi_entries_updated_at
  BEFORE UPDATE ON user_kpi_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_simulator_data_updated_at
  BEFORE UPDATE ON user_simulator_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_training_data_updated_at
  BEFORE UPDATE ON user_training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)

ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fichas_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_budgets_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kpi_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_simulator_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLÍTICAS DE SEGURIDAD (RLS POLICIES)

-- Políticas para catalog_products (lectura pública, escritura restringida)
CREATE POLICY "Allow public read access on catalog_products"
  ON catalog_products FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on catalog_products"
  ON catalog_products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on catalog_products"
  ON catalog_products FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Políticas para catalog_metadata (lectura pública, escritura restringida)
CREATE POLICY "Allow public read access on catalog_metadata"
  ON catalog_metadata FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated update on catalog_metadata"
  ON catalog_metadata FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Políticas para user_profiles (los usuarios solo pueden ver/perfectar su propio perfil)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para user_fichas_history
CREATE POLICY "Users can view own fichas history"
  ON user_fichas_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fichas history"
  ON user_fichas_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fichas history"
  ON user_fichas_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fichas history"
  ON user_fichas_history FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_budgets_history
CREATE POLICY "Users can view own budgets history"
  ON user_budgets_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets history"
  ON user_budgets_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets history"
  ON user_budgets_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets history"
  ON user_budgets_history FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_incidents
CREATE POLICY "Users can view own incidents"
  ON user_incidents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incidents"
  ON user_incidents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incidents"
  ON user_incidents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incidents"
  ON user_incidents FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_kpi_entries
CREATE POLICY "Users can view own kpi entries"
  ON user_kpi_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kpi entries"
  ON user_kpi_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kpi entries"
  ON user_kpi_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kpi entries"
  ON user_kpi_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_simulator_data
CREATE POLICY "Users can view own simulator data"
  ON user_simulator_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulator data"
  ON user_simulator_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulator data"
  ON user_simulator_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulator data"
  ON user_simulator_data FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_training_data
CREATE POLICY "Users can view own training data"
  ON user_training_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training data"
  ON user_training_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training data"
  ON user_training_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training data"
  ON user_training_data FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 7. INSERTAR DATOS INICIALES (METADATA)

-- Insertar metadata del catálogo si no existe
INSERT INTO catalog_metadata (id, tree, total_products)
VALUES (
  'hierarchy',
  '{}',
  0
)
ON CONFLICT (id) DO NOTHING;

-- 8. CREAR VISTAS ÚTILES (OPTIONAL)

-- Vista para buscar productos fácilmente
CREATE OR REPLACE VIEW catalog_search AS
SELECT
  ref,
  nombre,
  marca,
  familia,
  gama,
  tipo,
  descripcion,
  precio,
  pvp,
  stock,
  pdf_url,
  search_keywords
FROM catalog_products;

-- 9. COMENTARIOS EN LAS TABLAS

COMMENT ON TABLE catalog_products IS 'Catálogo de productos de Sonepar';
COMMENT ON TABLE catalog_metadata IS 'Metadatos del catálogo (jerarquía, totales, etc.)';
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario';
COMMENT ON TABLE user_fichas_history IS 'Historial de búsqueda de fichas técnicas';
COMMENT ON TABLE user_budgets_history IS 'Historial de presupuestos';
COMMENT ON TABLE user_incidents IS 'Incidencias reportadas por usuarios';
COMMENT ON TABLE user_kpi_entries IS 'Entradas de KPI de usuarios';
COMMENT ON TABLE user_simulator_data IS 'Datos del simulador';
COMMENT ON TABLE user_training_data IS 'Datos de formación';
COMMENT ON TABLE user_preferences IS 'Preferencias de usuario (tema, sidebar, etc.)';

-- ==========================================
-- SCRIPT COMPLETADO
-- ==========================================
