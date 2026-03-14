# Gestor de Horarios

> Sistema corporativo de gestión de horarios, francos y solicitudes de cambios

![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38-blue?style=for-the-badge&logo=tailwindcss)

## 📋 Descripción

Sistema web interno diseñado para la gestión eficiente de horarios, francos y solicitudes de cambios dentro de equipos de trabajo corporativos.

### Características Principales

- 🔐 **Autenticación Corporativa**: Login con Google Workspace
- 👥 **Roles Diferenciados**: Líder y Agente con permisos específicos
- 📊 **Dashboard Interactivo**: Panel de control con estadísticas en tiempo real
- 📥 **Carga Masiva Excel**: Importación de horarios con validación completa
- 🔄 **Solicitudes de Cambio**: Flujo completo de solicitud y aprobación
- 📬 **Notificaciones**: Alertas automáticas para solicitudes pendientes
- 📱 **Diseño Responsive**: Funciona en cualquier dispositivo
- 🎨 **Interfaz Corporativa**: Diseño profesional y sobrio

## 🏗️ Arquitectura Técnica

| Componente | Tecnología |
|------------|------------|
| **Frontend** | Next.js 14 (App Router) |
| **Lenguaje** | TypeScript |
| **Backend** | Next.js API Routes |
| **Base de Datos** | PostgreSQL |
| **ORM** | Prisma |
| **UI Framework** | Tailwind CSS |
| **Autenticación** | NextAuth.js + Google OAuth |
| **Procesamiento Excel** | SheetJS (xlsx) |

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- PostgreSQL 14+ (o servicio compatible)
- Cuenta de Google Cloud
- Dominio corporativo en Google Workspace

### Instalación

```bash
# 1. Clonar o navegar al proyecto
cd franco-manager

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Configurar base de datos
npx prisma migrate dev --name init
npx prisma generate

# 5. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## 📖 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/franco_manager?schema=public"

# Autenticación
NEXTAUTH_SECRET="tu-secreto-unico-generar-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# Dominio Corporativo
CORPORATE_DOMAIN="tuempresa.com"
```

### Configurar Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto o seleccionar existente
3. Habilitar "Google+ API"
4. Crear OAuth Client ID:
   - Tipo: Web application
   - Nombre: Gestor de Horarios
   - URIs autorizadas: `http://localhost:3000/api/auth/callback/google`
5. Copiar Client ID y Client Secret

## 🌐 Despliegue

### Opción 1: Vercel (Recomendado - Gratis)

[Vercel](DEPLOY.md) contiene la guía completa.

**Rápido:**
1. Crear cuenta en [vercel.com](https://vercel.com)
2. Conectar repositorio GitHub
3. Configurar variables de entorno
4. Deploy automático en cada push

### Opción 2: Render (Gratis)

1. Crear cuenta en [render.com](https://render.com)
2. Crear nuevo Web Service
3. Conectar repositorio
4. Configurar build y start commands
5. Agregar base de datos PostgreSQL

### Opción 3: Railway (Gratis)

1. Crear cuenta en [railway.app](https://railway.app)
2. Crear nuevo proyecto
3. Agregar servicio PostgreSQL
4. Agregar servicio con el repositorio
5. Deploy automático

## 📚 Documentación

- [Guía de Despliegue](DEPLOY.md)
- [Arquitectura del Sistema](ARCHITECTURE.md)
- [Diagrama de Base de Datos](docs/ER_DIAGRAM.md)

## 📱 Roles y Permisos

### Líder

- Ver dashboard con estadísticas del equipo
- Cargar horarios desde Excel (formato estándar o TELEFONICO)
- Ver todos los miembros del equipo
- Gestionar solicitudes (aprobar/rechazar)
- Agregar comentarios a las resoluciones

### Agente

- Ver su horario, franco y break
- Crear solicitudes de cambio
- Ver historial de solicitudes
- Recibir notificaciones de resolución

## 🔒 Seguridad

- ✅ Autenticación por dominio corporativo
- ✅ Tokens de sesión seguros (HTTP-only cookies)
- ✅ Validación de permisos en cada endpoint
- ✅ Logs de auditoría completa
- ✅ Protección CSRF integrada

## 📄 Formatos de Excel Soportados

### Formato Estándar

| Columna | Descripción | Ejemplo |
|----------|-------------|---------|
| nombre | Nombre del agente | Juan |
| apellido | Apellido del agente | Pérez |
| email | Email corporativo | juan.perez@empresa.com |
| equipo | Nombre del equipo | Soporte Nivel 1 |
| lider | Email del líder | lider@empresa.com |
| dia_franco | Día de franco | Lunes |
| horario_break | Horario de break | 15:00-15:15 |
| fecha_vigencia_desde | Fecha inicio | 2024-01-01 |

### Formato TELEFONICO

Estructura específica del archivo de programación con:
- Hoja: `TELEFONICO`
- Horarios en formato decimal (0.3333 = 08:00)
- Días de la semana para detectar francos
- Breaks por cada día

## 🧪 Scripts Disponibles

```bash
# Desarrollar
npm run dev

# Compilar para producción
npm run build

# Iniciar producción
npm start

# Verificar código
npm run lint

# Base de datos
npx prisma studio              # Interfaz visual
npx prisma migrate dev          # Crear migración
npx prisma db push             # Sincronizar sin migración
npm run seed                   # Datos de prueba
```

## 🐛 Solución de Problemas

### Error: "MissingSecret"

Configura `NEXTAUTH_SECRET` en `.env`:
```bash
openssl rand -base64 32
```

### Error: Conexión a base de datos

Verifica que `DATABASE_URL` sea correcta y la base de datos esté accesible.

### Error: Google OAuth falla

- Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctos
- Verifica que las URIs de callback estén configuradas en Google Cloud Console
- Verifica que el dominio está autorizado

## 📄 Estructura del Proyecto

```
franco-manager/
├── src/
│   ├── app/              # Páginas y API routes
│   ├── components/       # Componentes React
│   ├── lib/            # Utilidades y servicios
│   └── types/           # Tipos TypeScript
├── prisma/
│   ├── schema.prisma   # Modelo de datos
│   └── seed.ts         # Datos de prueba
├── public/            # Archivos estáticos
└── docs/              # Documentación adicional
```

## 📄 Licencia

Este proyecto es software interno para uso corporativo.

## 👥 Soporte

Para reportar issues o solicitar características:
- Crea un issue en el repositorio del proyecto
- Contacta al equipo de soporte de tu empresa

---

**Versión:** 1.0.0
**Última Actualización:** Marzo 2026
