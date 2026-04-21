# Migración de Firebase a Supabase

## Resumen de Cambios

Esta implementación integra Supabase como reemplazo de Firebase para:

1. **Autenticación de usuarios** (Firebase Auth → Supabase Auth)
2. **Base de datos** (Firestore → Supabase PostgreSQL)
3. **Datos del catálogo de productos** (catalog_products)
4. **Datos de usuario** (historiales, preferencias, etc.)

## Archivos Modificados

### Archivos Nuevos Creados

```
app/src/supabase/
  └── supabaseConfig.js                    # Configuración del cliente de Supabase

app/src/services/
  ├── supabaseCatalogService.js            # Servicio de catálogo (reemplaza catalogService.js)
  └── supabaseAuthService.js               # Servicio de autenticación

app/src/hooks/
  └── useSupabaseSync.js                   # Hook de sincronización (reemplaza useFirestoreSync.js)

app/src/contexts/
  └── SupabaseAuthContext.jsx              # Contexto de autenticación (reemplaza AuthContext.jsx)

app/
  └── .env.example                         # Plantilla de variables de entorno

documentation/
  └── SUPABASE_SETUP.md                    # Guía de configuración detallada

supabase_setup.sql                         # Script SQL para crear tablas
```

### Archivos Modificados

```
app/src/hooks/useFichasTecnicas.js         # Actualizado para usar Supabase
app/package.json                           # Agregada dependencia @supabase/supabase-js
```

## Pasos para la Migración

### 1. Configurar Supabase

Sigue la guía completa en `documentation/SUPABASE_SETUP.md`

Resumen rápido:
1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia las credenciales (URL y anon key)
3. Ejecuta el script `supabase_setup.sql` en el SQL Editor de Supabase
4. Configura Google OAuth en Supabase Authentication

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en `app/`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

En Vercel, configura las mismas variables en Settings → Environment Variables

### 3. Actualizar el Código

#### Opción A: Migración Completa (Recomendado)

Reemplaza las importaciones de Firebase por Supabase:

**En tu archivo principal (App.jsx o main.jsx):**
```jsx
// Antes (Firebase)
import { AuthProvider } from './contexts/AuthContext'

// Después (Supabase)
import { AuthProvider } from './contexts/SupabaseAuthContext'
```

**En useFichasTecnicas.js:**
```javascript
// Ya actualizado automáticamente
import useSupabaseSync from './useSupabaseSync'
import catalogService from '../services/supabaseCatalogService'
```

#### Opción B: Migración Gradual (Ambas en paralelo)

Mantén ambos sistemas y usa una bandera de entorno:

```javascript
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true'

const catalogService = USE_SUPABASE
  ? await import('../services/supabaseCatalogService')
  : await import('../services/catalogService')
```

### 4. Migrar Datos Existentes

#### Opción A: Automática (Al iniciar sesión)

El sistema detectará datos en `localStorage` y los migrará automáticamente la primera vez que un usuario inicie sesión.

Las tablas afectadas son:
- `user_fichas_history`
- `user_budgets_history`
- `user_incidents`
- `user_kpi_entries`
- `user_simulator_data`
- `user_training_data`
- `user_preferences`

#### Opción B: Manual (Exportar/Importar)

1. **Exportar desde Firestore:**
```bash
# Usa Firebase Console o firebase-export
firebase firestore:export --output firestore-export
```

2. **Convertir a formato Supabase:**
```javascript
// Script de conversión (ejemplo)
const convertToSupabase = (firestoreData) => {
  return {
    user_id: firestoreData.userId,
    id: firestoreData.id || 'default',
    data: firestoreData.data,
    created_at: firestoreData.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}
```

3. **Importar en Supabase:**
- Ve al Table Editor en Supabase
- Importa los datos convertidos

### 5. Verificar la Migración

1. **Inicia localmente:**
```bash
cd app
npm run dev
```

2. **Verifica en la consola del navegador:**
```
✅ Conexión a Supabase establecida correctamente
```

3. **Prueba la autenticación:**
- Inicia sesión con Google
- Verifica que se cree el perfil en `user_profiles`

4. **Prueba las fichas técnicas:**
- Navega por las categorías
- Busca productos
- Verifica el historial

### 6. Desplegar a Producción

```bash
# Hacer commit de los cambios
git add .
git commit -m "feat: migrate from Firebase to Supabase"
git push origin feature/connect-supabase-to-vercel-app-iMsZys

# Crear Pull Request
gh pr create --title "feat: migrate from Firebase to Supabase" \
  --body "Migrate authentication and database from Firebase to Supabase"
```

## Tablas de Equivalencia

| Firestore | Supabase | Descripción |
|-----------|----------|-------------|
| `catalog_products` | `catalog_products` | Productos del catálogo |
| `catalog_metadata` | `catalog_metadata` | Metadatos del catálogo |
| `users/{uid}/fichas/history` | `user_fichas_history` | Historial de fichas |
| `users/{uid}/budgets` | `user_budgets_history` | Historial de presupuestos |
| `users/{uid}/incidents` | `user_incidents` | Incidencias |
| `users/{uid}/kpi/entries` | `user_kpi_entries` | Entradas de KPI |
| `users/{uid}/simulator/*` | `user_simulator_data` | Datos del simulador |
| `users/{uid}/training/*` | `user_training_data` | Datos de formación |
| `users/{uid}/preferences/*` | `user_preferences` | Preferencias |

## Beneficios de la Migración

1. **Costo**: Supabase tiene un generoso plan gratuito
2. **Performance**: PostgreSQL es más rápido que Firestore
3. **SQL**: Consultas más potentes con SQL
4. **Relaciones**: Mejor manejo de datos relacionales
5. **Dashboard**: Interfaz web más completa
6. **OAuth**: Configuración más simple de autenticación

## Rollback (Volver a Firebase)

Si necesitas revertir los cambios:

1. **Restaurar importaciones:**
```jsx
// En App.jsx o main.jsx
import { AuthProvider } from './contexts/AuthContext'  // Firebase

// En useFichasTecnicas.js
import useFirestoreSync from './useFirestoreSync'
import catalogService from '../services/catalogService'
```

2. **Eliminar variables de entorno de Supabase**

3. **Conservar datos de Supabase** si es necesario

## Soporte

- Guía detallada: `documentation/SUPABASE_SETUP.md`
- Script SQL: `supabase_setup.sql`
- Documentación de Supabase: https://supabase.com/docs

## Próximos Pasos

1. ✅ Configurar proyecto en Supabase
2. ✅ Ejecutar script SQL
3. ✅ Configurar variables de entorno
4. ✅ Probar localmente
5. ✅ Migrar datos de usuarios
6. ✅ Desplegar a Vercel
7. 🔄 Monitorear performance
8. 🔄 Optimizar consultas si es necesario
