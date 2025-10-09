# Finaptico - Sistema de Gestión Financiera Multi-Tenant

Sistema ERP financiero para asesorías fiscales que integra Odoo v18.4 con un dashboard interactivo. Permite gestionar múltiples empresas cliente desde una única plataforma con segregación total de datos.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐
│   React App     │ ← Frontend (Lovable)
│  (TypeScript)   │
└────────┬────────┘
         │ JWT Auth
         ▼
┌─────────────────┐
│  Supabase Auth  │ ← Autenticación
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      Edge Functions (Deno)          │
│  • JWT Validation                   │
│  • Rate Limiting (100 req/hora)     │
│  • Tenant Validation                │
│  • Audit Logging                    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Supabase DB    │────▶│  Vault       │
│  • RLS Activo   │     │  (Secretos)  │
│  • Multi-tenant │     └──────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Odoo v18.4    │ ← ERP Backend
│  Multi-company  │
└─────────────────┘
```

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Routing**: React Router v6

### Backend
- **BaaS**: Supabase (PostgreSQL + Edge Functions)
- **Runtime**: Deno (Edge Functions)
- **Auth**: Supabase Auth (JWT)
- **Storage**: Supabase Vault (credenciales)

### Integración
- **ERP**: Odoo v18.4 Enterprise (Multicompany SaaS)
- **API**: XML-RPC

### Testing
- **Unit Tests**: Vitest
- **E2E Tests**: Playwright
- **Coverage**: ~70-80%

## 📋 Requisitos Previos

- Node.js 18+ (solo para desarrollo local)
- Cuenta de Supabase
- Acceso a Odoo v18.4 con API habilitada

## 🔧 Variables de Entorno

### Supabase Dashboard
Configurar en `Edge Functions > Secrets`:

```env
ODOO_BASE_URL=https://your-odoo.odoo.com
ODOO_DB=your-database-name
ODOO_USERNAME=user@example.com
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MINUTES=60
```

### Vault Secrets
Configurar en `Supabase Vault`:

```
odoo_shared_password = "your_odoo_password"
```

### Frontend (.env en Lovable)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🎯 Funcionalidades Principales

### Para Usuarios (Clientes)
- ✅ Dashboard fiscal con KPIs en tiempo real
- ✅ Visualización de tesorería (gráficos interactivos)
- ✅ Calendario fiscal automático
- ✅ Gestión de facturas (emitidas y recibidas)
- ✅ Gestión de gastos
- ✅ Control de IVA, IRPF y sociedades
- ✅ Exportación de informes a PDF
- ✅ Sincronización manual con Odoo

### Para Administradores
- ✅ Multi-tenant con segregación total de datos
- ✅ Gestión de usuarios y permisos
- ✅ Audit log completo
- ✅ Rate limiting por usuario
- ✅ Monitoreo de accesos

## 🔐 Seguridad

El sistema implementa múltiples capas de seguridad:

1. **Autenticación**: JWT de Supabase Auth
2. **Autorización**: Row Level Security (RLS) en todas las tablas
3. **Rate Limiting**: 100 peticiones/hora por usuario
4. **Audit Log**: Registro completo de todas las acciones
5. **Encriptación**: Credenciales en Supabase Vault
6. **Validación**: Tenant validation en cada request

Ver [SECURITY.md](./SECURITY.md) para más detalles.

## 📦 Estructura del Proyecto

```
src/
├── components/
│   ├── dashboard/          # Componentes del dashboard
│   ├── ui/                 # Componentes shadcn/ui
│   └── *.tsx               # Componentes compartidos
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación
├── hooks/
│   ├── useTenantAccess.ts  # Hook para obtener tenant
│   ├── useAuthenticatedFetch.ts  # Fetch con JWT
│   └── useClientRateLimit.ts  # Rate limit cliente
├── pages/
│   ├── Dashboard.tsx       # Dashboard principal
│   ├── CalendarioFiscal.tsx
│   ├── TreasuryPage.tsx
│   └── ...                 # Otras páginas
├── lib/
│   ├── backendAdapter.ts   # Adaptador para edge functions
│   ├── apiErrorHandler.ts  # Manejo centralizado de errores
│   └── utils.ts
└── integrations/
    └── supabase/
        ├── client.ts       # Cliente de Supabase
        └── types.ts

supabase/
└── functions/
    ├── odoo-dashboard/     # Dashboard data
    ├── odoo-treasury/      # Treasury data
    ├── odoo-invoices/      # Invoices data
    ├── odoo-expenses/      # Expenses data
    ├── odoo-vat/           # VAT data
    ├── odoo-irpf/          # IRPF data
    ├── odoo-sociedades/    # Company tax data
    ├── odoo-sync/          # Manual sync
    └── financial-report-pdf/  # PDF generation

tests/
├── unit/                   # Tests unitarios (Vitest)
└── e2e/                    # Tests E2E (Playwright)
```

## 📚 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Testing (requiere proyecto local)
npm run test             # Unit tests
npm run test:ui          # Unit tests con UI
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests (headless)
npm run test:e2e:headed  # E2E tests (con navegador)
npm run test:e2e:ui      # Playwright UI

# Build
npm run build            # Build para producción
npm run preview          # Preview del build
```

## 🚀 Deploy

### Supabase (Backend)
1. Edge Functions ya están desplegadas en Supabase
2. Configurar variables de entorno en Dashboard
3. Configurar secretos en Vault

### Lovable (Frontend)
1. El frontend se despliega automáticamente en Lovable
2. Configurar variables de entorno en Settings
3. Conectar dominio personalizado (opcional)

## 📊 Modelo de Datos

### Tablas Principales

**tenants**
- Empresas cliente
- Información fiscal y legal

**users** (Supabase Auth)
- Usuarios del sistema

**user_tenant_access**
- Relación usuario-empresa (1:1)

**tenant_odoo_config**
- Configuración de Odoo por tenant
- Credenciales encriptadas en Vault

**widget_data**
- Datos cacheados del dashboard
- Actualización automática cada 6 horas

**sync_runs**
- Historial de sincronizaciones
- Estado y errores

**audit_log**
- Registro completo de acciones
- Retención 2 años (GDPR)

**rate_limit**
- Control de peticiones por usuario

## 🔄 Flujo de Sincronización

1. **Automática**: Cada 6 horas vía pg_cron
2. **Manual**: Botón "Sincronizar Ahora"
3. **Proceso**:
   - Edge function → Odoo API
   - Transformación de datos
   - Almacenamiento en widget_data
   - Registro en sync_runs
   - Audit log

## 🐛 Troubleshooting

### Error: "No tenant access"
- Verificar que el usuario tiene entrada en `user_tenant_access`
- Verificar que el tenant existe en `tenants`

### Error: "Odoo connection failed"
- Verificar credenciales en `tenant_odoo_config`
- Verificar que la password está en Vault
- Verificar conectividad con Odoo

### Error: "Rate limit exceeded"
- El usuario ha excedido 100 peticiones/hora
- Esperar o aumentar límite en variables de entorno

### Tests E2E fallan
- Verificar que `.env.test` existe
- Verificar credenciales del usuario de test
- Verificar que tenant de test tiene config en `tenant_odoo_config`

## 📝 Licencia

Propietario: [Tu Empresa]
Todos los derechos reservados.

## 👥 Soporte

Para soporte técnico, contactar a: [tu-email@example.com]
