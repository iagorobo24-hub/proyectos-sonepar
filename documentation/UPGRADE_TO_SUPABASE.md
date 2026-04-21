# Instrucciones para Actualizar la Aplicación a Supabase

## Pasos para Activar Supabase en la Aplicación

### 1. Actualizar el Contexto de Autenticación

En **`app/src/main.jsx`** (o `App.jsx` si está allí):

```jsx
// ANTES (Firebase)
// import { AuthProvider } from './contexts/AuthContext'

// DESPUÉS (Supabase)
import { AuthProvider } from './contexts/SupabaseAuthContext'
```

### 2. Opcional: Actualizar Otros Archivos que Usen Firestore

Si tienes otros archivos que usan `useFirestoreSync`, actualízalos:

```javascript
// ANTES
import useFirestoreSync from './hooks/useFirestoreSync'

// DESPUÉS
import useSupabaseSync from './hooks/useSupabaseSync'
```

Y cambia las llamadas:
```javascript
// ANTES
const { data, saveData } = useFirestoreSync('collection', 'id', [], 'localStorage_key')

// DESPUÉS
const { data, saveData } = useSupabaseSync('table_name', 'id', [], 'localStorage_key')
```

### 3. Verificar que las Importaciones del Catálogo sean Correctas

En **`app/src/hooks/useFichasTecnicas.js`** ya está actualizado:

```javascript
✓ import useSupabaseSync from './useSupabaseSync'
✓ import catalogService from '../services/supabaseCatalogService'
```

### 4. Configurar Variables de Entorno

1. Crea el archivo `.env` en `app/`:
```bash
cp .env.example .env
```

2. Edita `.env` y agrega tus credenciales de Supabase:
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

3. Configura las mismas variables en Vercel:
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

### 5. Probar Localmente

```bash
cd app
npm run dev
```

Deberías ver en la consola:
```
✅ Conexión a Supabase establecida correctamente
```

### 6. Verificar la Integración

1. **Autenticación:**
   - Haz clic en "Iniciar sesión con Google"
   - Verifica que funcione correctamente

2. **Fichas Técnicas:**
   - Navega por las categorías
   - Busca productos por referencia
   - Verifica que se muestren los resultados

3. **Historial:**
   - Realiza algunas búsquedas
   - Verifica que el historial se guarde correctamente

## Archivos que Usan Supabase

✅ **Ya actualizados:**
- `src/hooks/useFichasTecnicas.js` - Usa `useSupabaseSync` y `supabaseCatalogService`

🔄 **Necesitan actualización manual:**
- `src/main.jsx` o `src/App.jsx` - Cambiar `AuthProvider` a `SupabaseAuthContext`
- Cualquier otro archivo que use `useFirestoreSync` - Cambiar a `useSupabaseSync`

## Troubleshooting

### Error: "Supabase client is not initialized"

**Causa:** Faltan las variables de entorno

**Solución:**
```bash
# Verifica que .env exista
ls app/.env

# Verifica el contenido
cat app/.env

# Debe contener:
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Error: "Table not found"

**Causa:** No se ha ejecutado el script SQL

**Solución:**
1. Ve a Supabase Dashboard
2. SQL Editor
3. Ejecuta el contenido de `supabase_setup.sql`

### Error: "Permission denied"

**Causa:** Las políticas RLS no están configuradas correctamente

**Solución:**
1. Verifica que el script SQL se haya ejecutado completamente
2. Ve a Authentication → Policies en Supabase
3. Verifica que las políticas existan

## Checklist de Migración

- [ ] Proyecto creado en Supabase
- [ ] Script SQL ejecutado
- [ ] Variables de entorno configuradas localmente
- [ ] Variables de entorno configuradas en Vercel
- [ ] Google OAuth configurado en Supabase
- [ ] `main.jsx` actualizado con `SupabaseAuthContext`
- [ ] Aplicación probada localmente
- [ ] Autenticación funciona
- [ ] Fichas técnicas funcionan
- [ ] Historial se guarda correctamente
- [ ] Desplegado a Vercel

## Archivos de Referencia

- **Guía de configuración:** `documentation/SUPABASE_SETUP.md`
- **Script SQL:** `supabase_setup.sql`
- **Guía de migración:** `SUPABASE_MIGRATION.md`
- **Configuración de Supabase:** `app/src/supabase/supabaseConfig.js`
- **Servicio de catálogo:** `app/src/services/supabaseCatalogService.js`
- **Hook de sincronización:** `app/src/hooks/useSupabaseSync.js`
- **Contexto de auth:** `app/src/contexts/SupabaseAuthContext.jsx`

## Soporte

Si encuentras algún problema:

1. Revisa la guía completa: `documentation/SUPABASE_SETUP.md`
2. Verifica el script SQL: `supabase_setup.sql`
3. Consulta la documentación de Supabase: https://supabase.com/docs
