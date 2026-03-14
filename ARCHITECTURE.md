# Documentación Arquitectónica

## Estructura del Proyecto

```
franco-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── agent/             # Páginas para agentes
│   │   │   ├── dashboard/    # Dashboard del agente
│   │   │   ├── new-request/  # Crear nueva solicitud
│   │   │   └── requests/     # Historial de solicitudes
│   │   ├── leader/            # Páginas para líderes
│   │   │   ├── dashboard/    # Dashboard del líder
│   │   │   ├── team/         # Listado de equipo
│   │   │   ├── requests/     # Gestión de solicitudes
│   │   │   └── upload/       # Carga de Excel
│   │   ├── api/               # API Routes
│   │   │   ├── auth/         # Autenticación
│   │   │   ├── excel/        # Endpoints de Excel
│   │   │   ├── notifications/ # Notificaciones
│   │   │   ├── requests/     # Solicitudes
│   │   │   ├── schedule/     # Horarios
│   │   │   └── team/         # Equipo
│   │   ├── login/             # Página de login
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Home (redirección)
│   │   ├── providers.tsx      # Session provider
│   │   └── globals.css        # Estilos globales
│   │
│   ├── components/            # Componentes React
│   │   ├── agent/             # Componentes para agentes
│   │   │   └── AgentNavigation.tsx
│   │   ├── leader/            # Componentes para líderes
│   │   │   └── LeaderNavigation.tsx
│   │   └── ui/                # Componentes UI genéricos
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       └── Card.tsx
│   │
│   ├── lib/                   # Librerías y utilidades
│   │   ├── auth.ts            # Configuración NextAuth
│   │   ├── excel.ts           # Procesamiento de Excel
│   │   ├── middleware.ts      # Middleware de autorización
│   │   ├── prisma.ts          # Cliente Prisma
│   │   ├── services/          # Servicios de negocio
│   │   │   ├── requestService.ts
│   │   │   └── userService.ts
│   │   └── utils.ts           # Utilidades generales
│   │
│   └── types/                 # Definiciones de tipos TypeScript
│       └── index.ts
│
├── prisma/                    # Prisma ORM
│   ├── schema.prisma         # Schema de base de datos
│   └── seed.ts               # Datos de prueba
│
├── public/                    # Archivos estáticos
├── .env.example              # Ejemplo de variables de entorno
├── .eslintrc.json            # Configuración ESLint
├── .gitignore                # Archivos ignorados por Git
├── next.config.js            # Configuración Next.js
├── package.json              # Dependencias
├── postcss.config.js         # Configuración PostCSS
├── tailwind.config.ts        # Configuración Tailwind CSS
├── tsconfig.json             # Configuración TypeScript
└── README.md                 # Documentación principal
```

## Patrones de Diseño

### 1. Service Layer Pattern

Los servicios encapsulan la lógica de negocio y se comunican con la base de datos a través de Prisma.

```typescript
// services/userService.ts
export class UserService {
  static async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async create(data: UserData) {
    return prisma.user.create({ data });
  }
}
```

**Ventajas:**
- Separación de concerns
- Reutilización de lógica
- Fácil testing
- Lógica centralizada

### 2. Repository Pattern (vía Prisma)

Prisma actúa como el repositorio, proporcionando métodos CRUD type-safe.

```typescript
// Direct query
const users = await prisma.user.findMany({
  where: { teamId },
  include: { team: true }
});
```

### 3. Middleware Pattern

El middleware maneja la autenticación y autorización antes de llegar a la lógica.

```typescript
// middleware.ts
export async function requireRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user) return { error: 'No autenticado' };
  if (!roles.includes(session.user.role)) return { error: 'No autorizado' };
  return { session };
}
```

## Flujo de Datos

### 1. Flujo de Solicitud de Cambio

```
┌──────────┐
│  Agente  │
└────┬─────┘
     │ 1. Crea solicitud
     ▼
┌──────────────────────────────────────────┐
│  API: POST /api/requests                  │
│  - Valida datos                          │
│  - Verifica permisos                     │
│  - Revisa conflictos                     │
└──────┬───────────────────────────────────┘
       │ 2. Llama a servicio
       ▼
┌──────────────────────────────────────────┐
│  RequestService.createRequest()          │
│  - Crea registro en BD                   │
│  - Crea log de auditoría                │
│  - Crea notificación al líder           │
└──────┬───────────────────────────────────┘
       │ 3. Respuesta
       ▼
┌──────────┐
│  Agente  │ ← ID de solicitud creada
└──────────┘

     │ 4. Líder recibe notificación
     ▼
┌──────────┐
│  Líder   │
└────┬─────┘
     │ 5. Aprueba/Rechaza
     ▼
┌──────────────────────────────────────────┐
│  API: POST /api/requests/:id/approve    │
└──────┬───────────────────────────────────┘
       │ 6. Actualiza estado
       ▼
┌──────────────────────────────────────────┐
│  RequestService.approveRequest()         │
│  - Actualiza registro                    │
│  - Crea auditoría                       │
│  - Notifica al agente                   │
└──────┬───────────────────────────────────┘
       │ 7. Confirmación
       ▼
┌──────────┐
│  Líder   │
└──────────┘

     │ 8. Notificación recibida
     ▼
┌──────────┐
│  Agente  │ ← Resultado de solicitud
└──────────┘
```

### 2. Flujo de Autenticación

```
┌──────────┐
│ Usuario  │
└────┬─────┘
     │ 1. Click "Login con Google"
     ▼
┌──────────────────────────────────────────┐
│  NextAuth /api/auth/signin              │
└──────┬───────────────────────────────────┘
       │ 2. Redirige a Google
       ▼
┌──────────────────────────────────────────┐
│  Google OAuth                            │
│  - Usuario autentica                    │
│  - Google genera code                   │
└──────┬───────────────────────────────────┘
       │ 3. Callback con code
       ▼
┌──────────────────────────────────────────┐
│  NextAuth /api/auth/callback             │
│  - Intercambia code por tokens           │
│  - Obtiene perfil de usuario            │
└──────┬───────────────────────────────────┘
       │ 4. Verifica dominio corporativo
       ▼
┌──────────────────────────────────────────┐
│  auth.ts - callback signIn()             │
│  - Valida email @dominio.com             │
│  - Crea/actualiza usuario en BD         │
│  - Extrae nombre/apellido               │
└──────┬───────────────────────────────────┘
       │ 5. Crea sesión
       ▼
┌──────────────────────────────────────────┐
│  NextAuth - crea sesión en DB            │
└──────┬───────────────────────────────────┘
       │ 6. Redirige a home
       ▼
┌──────────────────────────────────────────┐
│  page.tsx - detecta rol                  │
│  - Redirige a /leader/dashboard o       │
│    /agent/dashboard                      │
└──────────────────────────────────────────┘
```

## Estado Global

La aplicación usa NextAuth Session Provider para el estado de autenticación.

```typescript
// providers.tsx
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Uso en componentes:

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session } = useSession();
  // session.user.name, session.user.role, etc.
}
```

## Caching Strategy

Actualmente no hay caching implementado. Para producción considerar:

1. **Redis** para:
   - Sesiones de usuario (si se usa JWT)
   - Cache de horarios frecuentes
   - Contador de notificaciones

2. **Next.js Data Cache** para:
   - Listados de equipos (revalidate en 5min)
   - Estadísticas de dashboard (revalidate en 1min)

## Error Handling

### API Routes

```typescript
try {
  // Lógica
  return NextResponse.json({ success: true, data });
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { success: false, error: 'Mensaje descriptivo' },
    { status: 500 }
  );
}
```

### Client Components

```typescript
try {
  const response = await fetch('/api/endpoint');
  const data = await response.json();

  if (!data.success) {
    alert(data.error);
    return;
  }

  // Procesar data
} catch (error) {
  alert('Error de conexión');
}
```

## Security Considerations

1. **Autenticación**: Google OAuth con dominio restringido
2. **Autorización**: Middleware de roles en cada endpoint
3. **CSRF**: Protegido por NextAuth
4. **XSS**: React sanitiza por defecto
5. **SQL Injection**: Prevenido por Prisma (parametrizado)
6. **File Upload**: Validación de tipo y tamaño

## Performance Optimization

1. **Database Queries**:
   - Use `select` para campos específicos
   - Use `include` con cuidado (evita N+1)
   - Índices apropiados

2. **Client Side**:
   - Lazy loading de componentes
   - Pagination para listados largos
   - Optimistic updates

3. **Build**:
   - Static generation donde sea posible
   - Image optimization de Next.js
   - Code splitting automático

## Testing Strategy

### Unit Tests (por implementar)

```typescript
// services/userService.test.ts
describe('UserService', () => {
  it('should create a user', async () => {
    const user = await UserService.create(userData);
    expect(user.email).toBe(userData.email);
  });
});
```

### Integration Tests (por implementar)

```typescript
// api/requests.test.ts
describe('POST /api/requests', () => {
  it('should create a request', async () => {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(requestData),
    });
    expect(response.status).toBe(201);
  });
});
```

### E2E Tests (por implementar)

Usando Playwright o Cypress para probar flujos completos.

## Monitoring

### Logs

```typescript
console.log('INFO: User logged in', userId);
console.error('ERROR: Database connection failed', error);
```

### Metrics (por implementar)

- Número de solicitudes por día
- Tiempo de respuesta de APIs
- Errores por endpoint
- Usuarios activos

## Deployment

### Vercel (Recomendado)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático en push a main

### Docker (Alternativa)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Database

- **Desarrollo**: PostgreSQL local o Docker
- **Producción**: Supabase, RDS, o Neon (serverless Postgres)
