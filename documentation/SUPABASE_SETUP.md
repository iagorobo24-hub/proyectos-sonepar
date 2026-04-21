# Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para reemplazar Firebase en tu aplicación de Sonepar.

## 1. Crear un Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Configura tu proyecto:
   - **Nombre**: `proyectos-sonepar` (o el que prefieras)
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Region**: Elige la región más cercana a tus usuarios (ej: EU West)
5. Espera a que el proyecto se cree (2-3 minutos)

## 2. Obtener las Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: La clave pública anónima

## 3. Configurar Variables de Entorno

### Localmente (Desarrollo)

Crea un archivo `.env` en la raíz del proyecto `app/`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui

# Anthropic API (opcional, para funcionalidades de IA)
VITE_ANTHROPIC_API_KEY=tu_anthropic_api_key
```

### En Vercel (Producción)

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

4. Asegúrate de aplicar a todos los entornos (Production, Preview, Development)

## 4. Ejecutar el Script SQL en Supabase

### Opción A: Usando el Editor SQL de Supabase

1. En tu dashboard de Supabase, ve a **SQL Editor**
2. Crea una nueva consulta
3. Copia y pega el contenido del archivo `supabase_setup.sql` (ver abajo)
4. Haz clic en **Run** para ejecutar el script

### Opción B: Usando CLI de Supabase

Si tienes la CLI de Supabase instalada:

```bash
supabase db execute -f supabase_setup.sql
```

## 5. Habilitar Google OAuth

1. En Supabase, ve a **Authentication** → **Providers**
2. Habilita **Google** provider
3. Configura el OAuth:
   - **Client ID**: Obtén desde [Google Cloud Console](https://console.cloud.google.com)
   - **Client Secret**: Obtén desde Google Cloud Console
   - **Redirect URL**: Usa la URL proporcionada por Supabase

### Obtener Google OAuth Credentials

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Google+ API**
4. Ve a **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configura:
   - **Application type**: Web application
   - **Authorized redirect URIs**: Agrega la URL de tu proyecto Supabase
6. Copia el **Client ID** y **Client Secret**

## 6. Configurar Row Level Security (RLS)

El script SQL ya incluye las políticas de RLS, pero verifica:

1. Ve a **Database** → **Tables**
2. Para cada tabla, verifica que **RLS enabled** esté activado
3. Revisa las políticas en **Authentication** → **Policies**

## 7. Importar Datos (Opcional)

Si tienes datos existentes en Firebase que quieres migrar:

### Opción A: Exportar desde Firebase a JSON
1. Usa Firebase Console o Firestore export tools
2. Exporta los datos a formato JSON
3. Conviértelos al formato de Supabase
4. Importa usando el Table Editor de Supabase

### Opción B: Usar Script de Migración
```bash
# Este script aún no está implementado, pero puedes usar:
# - Firestore export + Supabase import
# - Scripts personalizados de Node.js
```

## 8. Verificar la Conexión

Una vez configurado todo:

1. Inicia tu aplicación localmente:
```bash
npm run dev
```

2. Abre la consola del navegador
3. Deberías ver: `✅ Conexión a Supabase establecida correctamente`

4. Prueba la autenticación:
   - Haz clic en "Iniciar sesión con Google"
   - Verifica que puedas iniciar sesión correctamente

## 9. Desplegar en Vercel

1. Haz commit de tus cambios:
```bash
git add .
git commit -m "feat: integrate Supabase"
git push origin feature/connect-supabase-to-vercel-app-iMsZys
```

2. Vercel desplegará automáticamente
3. Verifica que las variables de entorno estén configuradas en Vercel

## Troubleshooting

### Error: "Faltan las variables de entorno de Supabase"
- Verifica que `.env` exista en la raíz del proyecto
- Verifica que las variables estén configuradas en Vercel

### Error: "Invalid API Key"
- Verifica que `VITE_SUPABASE_ANON_KEY` sea correcta
- Asegúrate de estar usando la **anon key**, no la service_role key

### Error: "Table not found"
- Ejecuta el script SQL `supabase_setup.sql`
- Verifica que las tablas existan en el Table Editor

### Error de autenticación con Google
- Verifica que las credenciales de OAuth estén correctas
- Asegúrate de que la URL de redirección esté configurada correctamente

## Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Autenticación con Supabase](https://supabase.com/docs/guides/auth)
- [Row Level Security en Supabase](https://supabase.com/docs/guides/auth/row-level-security)

## Script SQL

Copia el contenido del archivo `supabase_setup.sql` (creado en el siguiente paso) y ejecútalo en el SQL Editor de Supabase.
