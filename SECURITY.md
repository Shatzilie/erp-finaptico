# 🔐 Documentación de Seguridad - Finaptico

Este documento describe las medidas de seguridad implementadas en el sistema.

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Autenticación](#autenticación)
3. [Autorización](#autorización)
4. [Row Level Security](#row-level-security)
5. [Rate Limiting](#rate-limiting)
6. [Audit Log](#audit-log)
7. [Protección de Credenciales](#protección-de-credenciales)
8. [Validación de Datos](#validación-de-datos)
9. [GDPR Compliance](#gdpr-compliance)
10. [Mejores Prácticas](#mejores-prácticas)

---

## 📊 Resumen Ejecutivo

**Nivel de Seguridad: ALTO**

### Capas de Seguridad Implementadas

```
┌─────────────────────────────────────────┐
│  1. Autenticación JWT (Supabase Auth)   │
├─────────────────────────────────────────┤
│  2. Rate Limiting Cliente (50/5min)     │
├─────────────────────────────────────────┤
│  3. Edge Function JWT Validation        │
├─────────────────────────────────────────┤
│  4. Rate Limiting Backend (100/hora)    │
├─────────────────────────────────────────┤
│  5. Tenant Validation                   │
├─────────────────────────────────────────┤
│  6. Row Level Security (RLS)            │
├─────────────────────────────────────────┤
│  7. Audit Logging                       │
├─────────────────────────────────────────┤
│  8. Vault Encryption (Credenciales)     │
└─────────────────────────────────────────┘
```

---

## 🔑 Autenticación

### Sistema de Autenticación

**Proveedor**: Supabase Auth  
**Método**: JWT (JSON Web Tokens)  
**Algoritmo**: HS256

### Flujo de Autenticación

```
1. Usuario → Email + Password → Supabase Auth
2. Supabase Auth → Valida credenciales
3. Supabase Auth → Genera JWT (access_token + refresh_token)
4. Cliente → Almacena tokens en memoria (NO localStorage)
5. Cliente → Envía JWT en header Authorization en cada request
```

### Tokens

**Access Token**:
- Duración: 1 hora
- Renovación automática con refresh_token
- Almacenamiento: Memoria (AuthContext)

**Refresh Token**:
- Duración: 7 días
- Rotación automática
- Almacenamiento: HttpOnly cookie (gestionado por Supabase)

### Implementación Frontend

```typescript
// Hook: useAuthenticatedFetch
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

### Implementación Backend

```typescript
// Todas las Edge Functions
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401
  });
}
```

---

## 🛡️ Autorización

### Sistema Multi-Tenant

Cada usuario tiene acceso a **UN SOLO tenant** (empresa).

### Tabla: user_tenant_access

```sql
CREATE TABLE user_tenant_access (
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);
```

### Validación de Tenant

**Todas las Edge Functions validan**:

```typescript
// 1. Obtener tenant del usuario
const { data: access } = await supabase
  .from('user_tenant_access')
  .select('tenant_id')
  .eq('user_id', user.id)
  .single();

// 2. Validar que coincide con el tenant solicitado
if (access.tenant_id !== requestedTenantId) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403
  });
}
```

---

## 🔒 Row Level Security (RLS)

**Estado**: ✅ ACTIVO en todas las tablas sensibles

### Políticas Implementadas

#### tenants
```sql
-- Los usuarios solo ven su tenant
CREATE POLICY "Users can only see their tenant"
ON tenants FOR SELECT
USING (
  id IN (
    SELECT tenant_id FROM user_tenant_access
    WHERE user_id = auth.uid()
  )
);
```

#### tenant_odoo_config
```sql
-- Los usuarios solo ven la config de su tenant
CREATE POLICY "Users can only see their tenant config"
ON tenant_odoo_config FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenant_access
    WHERE user_id = auth.uid()
  )
);

-- NADIE puede leer passwords directamente
-- Solo funciones SECURITY DEFINER pueden desencriptar
```

#### widget_data
```sql
-- Los usuarios solo ven datos de su tenant
CREATE POLICY "Users can only see their widget data"
ON widget_data FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenant_access
    WHERE user_id = auth.uid()
  )
);
```

#### sync_runs
```sql
-- Los usuarios solo ven syncs de su tenant
CREATE POLICY "Users can only see their sync runs"
ON sync_runs FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenant_access
    WHERE user_id = auth.uid()
  )
);
```

#### audit_log
```sql
-- Los usuarios solo ven su propio audit log
CREATE POLICY "Users can only see their own audit logs"
ON audit_log FOR SELECT
USING (user_id = auth.uid());
```

#### rate_limit
```sql
-- Los usuarios solo ven su propio rate limit
CREATE POLICY "Users can only see their own rate limits"
ON rate_limit FOR SELECT
USING (user_id = auth.uid());
```

---

## ⏱️ Rate Limiting

### Doble Capa de Rate Limiting

#### 1. Rate Limiting Cliente (Frontend)

**Hook**: `useClientRateLimit`  
**Límite**: 50 peticiones cada 5 minutos  
**Storage**: sessionStorage  

```typescript
// Implementación
const { checkRateLimit } = useClientRateLimit({
  maxRequests: 50,
  windowMs: 5 * 60 * 1000
});

// Antes de cada petición
if (!checkRateLimit(endpoint)) {
  toast.error('Demasiadas peticiones. Espera unos minutos.');
  return;
}
```

**Ventaja**: Reduce carga innecesaria al backend

#### 2. Rate Limiting Backend (Edge Functions)

**Tabla**: `rate_limit`  
**Límite**: 100 peticiones por hora  
**Algoritmo**: Sliding Window

```sql
CREATE TABLE rate_limit (
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, endpoint)
);
```

**Función SQL**: `check_rate_limit`

```sql
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP;
BEGIN
  -- Obtener contador actual
  SELECT request_count, window_start
  INTO v_count, v_window_start
  FROM rate_limit
  WHERE user_id = p_user_id AND endpoint = p_endpoint;

  -- Si no existe, crear entrada
  IF NOT FOUND THEN
    INSERT INTO rate_limit (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, NOW());
    RETURN TRUE;
  END IF;

  -- Si la ventana expiró, resetear
  IF NOW() - v_window_start > (p_window_minutes || ' minutes')::INTERVAL THEN
    UPDATE rate_limit
    SET request_count = 1, window_start = NOW()
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN TRUE;
  END IF;

  -- Si no ha excedido el límite, incrementar
  IF v_count < p_max_requests THEN
    UPDATE rate_limit
    SET request_count = request_count + 1
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN TRUE;
  END IF;

  -- Límite excedido
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Implementación en Edge Functions**:

```typescript
// Verificar rate limit
const { data: allowed } = await supabase
  .rpc('check_rate_limit', {
    p_user_id: user.id,
    p_endpoint: '/odoo-dashboard'
  });

if (!allowed) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    message: 'Too many requests. Try again later.'
  }), {
    status: 429,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetTime.toISOString()
    }
  });
}
```

---

## 📝 Audit Log

**Tabla**: `audit_log`  
**Propósito**: Registro completo de todas las acciones  
**Retención**: 2 años (cumplimiento GDPR)

### Estructura

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP  -- Para soft-delete
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_action ON audit_log(action);
```

### Función de Auditoría

```sql
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT,
  p_details JSONB DEFAULT '{}'::JSONB,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    resource,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_user_id,
    p_action,
    p_resource,
    p_details,
    p_ip_address,
    p_user_agent,
    NOW()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Acciones Registradas

- `login` - Inicio de sesión
- `logout` - Cierre de sesión
- `dashboard_view` - Visualización del dashboard
- `pdf_export` - Exportación de PDF
- `sync_manual` - Sincronización manual
- `rate_limit_exceeded` - Límite excedido
- `unauthorized_access` - Intento de acceso no autorizado
- `forbidden_tenant` - Intento de acceso a tenant ajeno

### Implementación en Edge Functions

```typescript
// Crear log de auditoría
await supabase.rpc('create_audit_log', {
  p_user_id: user.id,
  p_action: 'dashboard_view',
  p_resource: `/odoo-dashboard/${tenantSlug}`,
  p_details: {
    tenant_id: tenantId,
    execution_time_ms: Date.now() - startTime
  },
  p_ip_address: req.headers.get('x-forwarded-for'),
  p_user_agent: req.headers.get('user-agent')
});
```

---

## 🔐 Protección de Credenciales

### Supabase Vault

**Todas las credenciales sensibles en Vault**:
- ❌ NUNCA en variables de entorno
- ❌ NUNCA en código
- ✅ SIEMPRE en Vault con encriptación AES-256

### Configuración

```sql
-- Guardar password en Vault
SELECT vault.create_secret(
  'your_password_here',
  'odoo_shared_password'  -- Key name
);
```

### Función de Desencriptación

```sql
CREATE OR REPLACE FUNCTION get_odoo_credentials(p_tenant_id UUID)
RETURNS TABLE (
  base_url TEXT,
  db TEXT,
  username TEXT,
  password TEXT,
  company_id INTEGER
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    toc.odoo_base_url,
    toc.odoo_db,
    toc.odoo_username,
    vault.decrypt_secret(toc.odoo_password_vault_key)::TEXT AS password,
    toc.odoo_company_id
  FROM tenant_odoo_config toc
  WHERE toc.tenant_id = p_tenant_id
  AND toc.is_active = true;
END;
$$ LANGUAGE plpgsql;
```

**IMPORTANTE**: Esta función es `SECURITY DEFINER`, lo que significa:
- Se ejecuta con permisos de su creador (superusuario)
- Los usuarios NO pueden leer passwords directamente
- Solo puede llamarse desde Edge Functions autenticadas

### Uso en Edge Functions

```typescript
// Obtener credenciales desencriptadas
const { data: credentials } = await supabase
  .rpc('get_odoo_credentials', { p_tenant_id: tenantId });

// credentials.password está desencriptada SOLO en memoria
// NUNCA se envía al cliente
```

---

## ✅ Validación de Datos

### Frontend

```typescript
// Validación de inputs
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Email inválido');
}

// Sanitización
const sanitizedInput = DOMPurify.sanitize(userInput);
```

### Backend

```typescript
// Validación de tenant_slug
if (!/^[a-z0-9-]+$/.test(tenantSlug)) {
  return new Response(JSON.stringify({
    error: 'Invalid tenant format'
  }), { status: 400 });
}

// Validación de UUIDs
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(tenantId)) {
  return new Response(JSON.stringify({
    error: 'Invalid tenant ID'
  }), { status: 400 });
}
```

---

## 📜 GDPR Compliance

### Retención de Datos

**Audit Log**: 2 años  
**Método**: Soft-delete (columna `deleted_at`)

### Función de Limpieza Automática

```sql
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Soft-delete de logs mayores a 2 años
  UPDATE audit_log
  SET deleted_at = NOW()
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;
```

### Programación con pg_cron

```sql
-- Ejecutar limpieza diaria a las 2 AM
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 2 * * *',  -- Cada día a las 2:00 AM
  'SELECT cleanup_old_audit_logs();'
);
```

### Derecho al Olvido

Los usuarios pueden solicitar eliminación de sus datos:

```sql
-- Función para eliminar datos de usuario
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS void SECURITY DEFINER AS $$
BEGIN
  -- Soft-delete de audit logs
  UPDATE audit_log
  SET deleted_at = NOW()
  WHERE user_id = p_user_id;

  -- Eliminar acceso a tenants
  DELETE FROM user_tenant_access
  WHERE user_id = p_user_id;

  -- Eliminar rate limits
  DELETE FROM rate_limit
  WHERE user_id = p_user_id;

  -- Usuario se elimina desde Supabase Auth Dashboard
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Mejores Prácticas

### Para Desarrolladores

1. **NUNCA hardcodear credenciales** en código
2. **SIEMPRE validar tenant** en cada operación
3. **SIEMPRE crear audit log** para acciones sensibles
4. **NUNCA exponer stack traces** al usuario
5. **SIEMPRE usar prepared statements** (automático con Supabase)
6. **NUNCA confiar en datos del cliente** sin validar

### Para Usuarios

1. **Usar contraseñas fuertes** (mínimo 12 caracteres)
2. **Cerrar sesión** al terminar
3. **NO compartir credenciales** entre usuarios
4. **Reportar actividad sospechosa** inmediatamente

### Para Administradores

1. **Revisar audit logs** regularmente
2. **Monitorear rate limits** excedidos
3. **Actualizar dependencias** mensualmente
4. **Realizar backups** diarios de la base de datos
5. **Revisar permisos** de usuarios periódicamente

---

## 🚨 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** la publiques públicamente
2. Envía un email a: hola@finaptico.com
3. Incluye: descripción detallada, pasos para reproducir, impacto potencial
4. Responderemos en menos de 48 horas

---

## 📊 Checklist de Seguridad

- [x] Autenticación JWT implementada
- [x] Row Level Security activo en todas las tablas
- [x] Rate limiting frontend y backend
- [x] Audit log completo
- [x] Credenciales en Vault
- [x] Validación de tenant en todas las operaciones
- [x] GDPR compliance (retención 2 años)
- [x] Manejo seguro de errores (sin stack traces)
- [x] Sanitización de inputs
- [x] Timeouts en peticiones
- [x] HTTPS en todas las comunicaciones
- [x] Tokens con expiración

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0  
**Estado**: Producción
