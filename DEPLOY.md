# 🚀 Guía de Despliegue - Gestor de Horarios

## Opciones de Despliegue

### Opción 1: Vercel (Recomendado) - GRATIS

Vercel es la plataforma oficial de Next.js con un plan gratuito generoso.

#### Paso 1: Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con GitHub, GitLab, Bitbucket o tu email

#### Paso 2: Conectar repositorio Git

1. Crea un repositorio en GitHub/GitLab
2. Sube todo el código del proyecto a ese repositorio
3. En Vercel, haz clic en "Add New Project"
4. Importa tu repositorio

#### Paso 3: Configurar variables de entorno

En Vercel, agrega estas variables de entorno:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="tu-secret-aqui"
NEXTAUTH_URL="https://tu-app.vercel.app"
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
CORPORATE_DOMAIN="tuempresa.com"
```

#### Paso 4: Configurar Base de Datos

**Opción A: Neon (Gratis y recomendado)**
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto PostgreSQL
4. Copia el string de conexión

**Opción B: Supabase (Gratis)**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > Database
4. Copia el connection string

**Opción C: Railway (Gratis)**
1. Ve a [railway.app](https://railway.app)
2. Crea un nuevo proyecto PostgreSQL

#### Paso 5: Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita "Google+ API"
4. Ve a "Credentials" > "Create credentials" > "OAuth client ID"
5. Tipo: "Web application"
6. Agrega los URIs autorizados:
   - `https://tu-app.vercel.app/api/auth/callback/google`
7. Copia Client ID y Client Secret

#### Paso 6: Deploy

Vercel hará deploy automático cada vez que hagas push a tu repositorio.

### Opción 2: Render (Gratis)

1. Ve a [render.com](https://render.com)
2. Crea cuenta con GitHub
3. "New Web Service"
4. Conecta tu repositorio
5. Configura:
   - Build Command: `npm run build`
   - Start Command: `npm start`
6. Agrega variables de entorno

### Opción 3: Railway (Gratis)

1. Ve a [railway.app](https://railway.app)
2. "New Project"
3. Agrega un servicio "PostgreSQL"
4. Agrega un servicio "Dockerfile" o "Nix"
5. Conecta el repositorio

### Opción 4: Deploy local (Para pruebas)

Si quieres probar localmente:

```bash
cd franco-manager
npm install

# Configurar .env con tus credenciales
cp .env.example .env

# Inicializar base de datos
npx prisma migrate dev --name init
npx prisma generate

# Cargar datos de prueba (opcional)
npm run seed

# Iniciar servidor
npm run dev
```

## Variables de Entorno Necesarias

```env
DATABASE_URL="postgresql://usuario:password@host:puerto/database?schema=public"
NEXTAUTH_SECRET="generar-con: openssl rand -base64 32"
NEXTAUTH_URL="https://tu-dominio.com"
GOOGLE_CLIENT_ID="obtener-desde-google-cloud"
GOOGLE_CLIENT_SECRET="obtener-desde-google-cloud"
CORPORATE_DOMAIN="tu-empresa.com"
```

## Configurar Google OAuth paso a paso

### 1. Crear Proyecto en Google Cloud

```bash
# Instalar gcloud CLI (opcional)
gcloud init
```

O desde la consola web:
1. https://console.cloud.google.com/apis/dashboard
2. "Select a project" > "New Project"
3. Nombre: "franco-manager"
4. Crear

### 2. Habilitar APIs

Habilita:
- Google+ API
- People API (opcional, para datos del usuario)

### 3. Crear OAuth Client ID

1. Ve a: https://console.cloud.google.com/apis/credentials
2. "Create credentials" > "OAuth client ID"
3. "Web application"
4. Nombre: "Franco Manager"
5. Authorized JavaScript origins:
   - `http://localhost:3001` (para desarrollo)
   - `https://tu-app.vercel.app` (para producción)
6. Authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google`
   - `https://tu-app.vercel.app/api/auth/callback/google`
7. "Create"

### 4. Configurar pantalla de consentimiento

1. Ve a: https://console.cloud.google.com/apis/credentials/consent
2. Selecciona tu proyecto
3. OAuth consent screen
4. App name: "Gestor de Horarios"
5. User support email: tu-email@empresa.com
6. Authorized domains: tuempresa.com
7. Developer contact: tu-email@empresa.com
8. Scopes para Google+ API:
   - `email`
   - `profile`
   - `openid`

## Base de Datos

### Configurar PostgreSQL con Prisma

```bash
# Configurar DATABASE_URL en .env
DATABASE_URL="postgresql://postgres:password@ep-purple-forest.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Ejecutar migraciones
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# (Opcional) Ver y editar datos
npx prisma studio
```

## Troubleshooting

### Error "MissingSecret"

Solución: Agregar NEXTAUTH_SECRET en las variables de entorno.

### Error de conexión a BD

Solución: Verificar que DATABASE_URL sea correcta y que la base de datos esté accesible.

### Error de Google OAuth

Solución:
- Verificar que el dominio esté autorizado en Google Cloud
- Verificar que las URIs de callback sean correctas
- Verificar que el Client ID y Secret sean correctos

### Deploy falla

Solución:
- Verificar que todas las dependencias estén en package.json
- Verificar que `npm run build` funcione localmente
- Verificar logs de Vercel en la pestaña "Deployments"

## URLs Post-Deploy

- Aplicación: `https://tu-app.vercel.app`
- Login: `https://tu-app.vercel.app/login`
- Dashboard Líder: `https://tu-app.vercel.app/leader/dashboard`
- Dashboard Agente: `https://tu-app.vercel.app/agent/dashboard`

## Mantenimiento

### Actualizar la aplicación

```bash
# Hacer cambios en código local
git add .
git commit -m "Descripción del cambio"
git push origin main

# Vercel hará deploy automático
```

### Ver logs

En Vercel:
1. Ve a tu proyecto
2. Pestaña "Deployments"
3. Clic en un deployment específico
4. Clic en "View logs"

### Base de datos en producción

```bash
# Ver datos
npx prisma studio --schema-url $DATABASE_URL

# Hacer migraciones
npx prisma migrate deploy --schema-url $DATABASE_URL

# Reset (CUIDADO - borra todos los datos)
npx prisma migrate reset
```

## Seguridad en Producción

1. ✅ Cambiar NEXTAUTH_SECRET a un valor seguro único
2. ✅ Configurar HTTPS (Vercel lo hace automáticamente)
3. ✅ Usar variables de entorno, no credenciales en código
4. ✅ Restringir por dominio corporativo (CORPORATE_DOMAIN)
5. ✅ Regular backups de la base de datos
6. ✅ Monitorear errores y logs

## Costos Estimados

**Vercel (Plan gratuito):**
- Hosting: $0
- Ancho de banda: 100 GB/mes
- Funciones serverless: 100 GB-horas/mes
- Build minutes: 6,000/mes

**Neon (Plan gratuito):**
- Base de datos: $0
- Storage: 0.5 GB
- RAM: 256 MB por conexión
- 3 proyectos activos

**Total:** $0/mes (suficiente para uso MVP)

## Soporte

Para problemas:
- Docs de Vercel: https://vercel.com/docs
- Docs de Prisma: https://www.prisma.io/docs
- Docs de NextAuth: https://authjs.dev

---

**¡Buena suerte con tu despliegue! 🎉**
