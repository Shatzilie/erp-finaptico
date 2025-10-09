# 📡 Documentación API - Finaptico Edge Functions

Documentación completa de las 9 Edge Functions del sistema.

## 📋 Índice

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Rate Limiting](#rate-limiting)
4. [Endpoints](#endpoints)
   - [Dashboard](#1-odoo-dashboard)
   - [Treasury](#2-odoo-treasury)
   - [Invoices](#3-odoo-invoices)
   - [Expenses](#4-odoo-expenses)
   - [VAT](#5-odoo-vat)
   - [IRPF](#6-odoo-irpf)
   - [Sociedades](#7-odoo-sociedades)
   - [Sync](#8-odoo-sync)
   - [PDF](#9-financial-report-pdf)
5. [Códigos de Error](#códigos-de-error)
6. [Ejemplos](#ejemplos)

---

## 🌐 Información General

**Base URL**: `https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/`

**Formato**: JSON  
**Protocolo**: HTTPS  
**Runtime**: Deno

### Todas las Edge Functions implementan:

- ✅ Validación JWT
- ✅ Rate Limiting (100 req/hora)
- ✅ Tenant Validation
- ✅ Audit Logging
- ✅ CORS habilitado
- ✅ Timeout 30 segundos

---

## 🔑 Autenticación

**Método**: Bearer Token (JWT de Supabase Auth)

### Headers Requeridos

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Obtener Token

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
```

### Ejemplo de Request

```bash
curl -X POST https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"tenant_slug":"young-minds"}'
```

---

## ⏱️ Rate Limiting

**Límite**: 100 peticiones por hora por usuario  
**Ventana**: Rolling window de 60 minutos

### Headers de Respuesta

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2025-10-09T16:30:00Z
```

### Respuesta cuando se excede el límite

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again later.",
  "resetAt": "2025-10-09T16:30:00Z"
}
```

**Status Code**: `429 Too Many Requests`

---

## 📍 Endpoints

### 1. odoo-dashboard

Obtiene los datos principales del dashboard fiscal.

#### Request

**URL**: `/odoo-dashboard`  
**Method**: `POST`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "tenant_slug": "young-minds"
}
```

#### Response

**Status**: `200 OK`

```json
{
  "summary": {
    "totalIncome": 125000.50,
    "totalExpenses": 87500.25,
    "netProfit": 37500.25,
    "vatBalance": 5250.75,
    "irpfRetentions": 12500.00,
    "taxPayable": 8750.50
  },
  "treasury": {
    "currentBalance": 45000.00,
    "projectedBalance": 52000.00,
    "bankAccounts": [
      {
        "name": "Banco Santander - Principal",
        "balance": 35000.00,
        "currency": "EUR"
      },
      {
        "name": "CaixaBank - Nóminas",
        "balance": 10000.00,
        "currency": "EUR"
      }
    ]
  },
  "recentInvoices": [
    {
      "id": 1523,
      "number": "F2024-001",
      "partner": "Cliente ABC SL",
      "date": "2024-10-01",
      "amount": 1210.00,
      "state": "paid"
    }
  ],
  "upcomingPayments": [
    {
      "id": 2341,
      "number": "P2024-045",
      "partner": "Proveedor XYZ SA",
      "dueDate": "2024-10-15",
      "amount": 850.00,
      "state": "pending"
    }
  ],
  "lastSync": "2024-10-09T14:30:00Z"
}
```

---

### 2. odoo-treasury

Obtiene datos detallados de tesorería con histórico.

#### Request

**URL**: `/odoo-treasury`  
**Method**: `POST`

**Body**:
```json
{
  "tenant_slug": "young-minds",
  "start_date": "2024-01-01",
  "end_date": "2024-10-09"
}
```

#### Response

**Status**: `200 OK`

```json
{
  "currentBalance": 45000.00,
  "historicalData": [
    {
      "date": "2024-01",
      "income": 15000.00,
      "expenses": 10000.00,
      "balance": 25000.00
    },
    {
      "date": "2024-02",
      "income": 18000.00,
      "expenses": 12000.00,
      "balance": 31000.00
    }
  ],
  "projections": {
    "nextMonth": 52000.00,
    "nextQuarter": 58000.00
  },
  "bankAccounts": [
    {
      "id": 32,
      "name": "Banco Santander - Principal",
      "currency": "EUR",
      "balance": 35000.00,
      "transactions": [
        {
          "date": "2024-10-08",
          "description": "Cobro factura F2024-001",
          "amount": 1210.00,
          "balance": 35000.00
        }
      ]
    }
  ]
}
```

---

### 3. odoo-invoices

Obtiene facturas emitidas y recibidas.

#### Request

**URL**: `/odoo-invoices`  
**Method**: `POST`

**Body**:
```json
{
  "tenant_slug": "young-minds",
  "type": "out_invoice",  // "out_invoice" o "in_invoice"
  "state": "posted",       // "draft", "posted", "paid", etc.
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

#### Response

**Status**: `200 OK`

```json
{
  "invoices": [
    {
      "id": 1523,
      "name": "F2024-001",
      "partner_name": "Cliente ABC SL",
      "partner_vat": "B12345678",
      "invoice_date": "2024-10-01",
      "invoice_date_due": "2024-10-31",
      "amount_untaxed": 1000.00,
      "amount_tax": 210.00,
      "amount_total": 1210.00,
      "amount_residual": 0.00,
      "state": "posted",
      "payment_state": "paid",
      "invoice_lines": [
        {
          "name": "Servicios de consultoría",
          "quantity": 10.0,
          "price_unit": 100.00,
          "price_subtotal": 1000.00,
          "tax_ids": [21]
        }
      ]
    }
  ],
  "summary": {
    "total_count": 156,
    "total_amount": 125000.50,
    "paid_amount": 100000.00,
    "pending_amount": 25000.50
  }
}
```

---

### 4. odoo-expenses

Obtiene gastos registrados.

#### Request

**URL**: `/odoo-expenses`  
**Method**: `POST`

**Body**:
```json
{
  "tenant_slug": "young-minds",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "category": null  // null = todos, o nombre de categoría específica
}
```

#### Response

**Status**: `200 OK`

```json
{
  "expenses": [
    {
      "id": 2341,
      "name": "Alquiler oficina - Octubre 2024",
      "date": "2024-10-01",
      "amount": 1500.00,
      "category": "Alquiler",
      "partner_name": "Inmobiliaria XYZ SA",
      "payment_state": "paid",
      "invoice_ref": "P2024-045"
    }
  ],
  "summary": {
    "total_expenses": 87500.25,
    "by_category": [
      {
        "category": "Alquiler",
        "amount": 18000.00,
        "percentage": 20.57
      },
      {
        "category": "Suministros",
        "amount": 5400.00,
        "percentage": 6.17
      }
    ]
  }
}
```

---

### 5. odoo-vat

Obtiene datos de IVA (ingresos, gastos, balance).

#### Request

**URL**: `/odoo-vat`  
**Method**: `POST`

**Body**:
```json
{
  "tenant_slug": "young-minds",
  "period": "2024-Q3"  // Formato: YYYY-QN o YYYY-MM
}
```

#### Response

**Status**: `200 OK`

```json
{
  "period": "2024-Q3",
  "vat_collected": 26250.00,
  "vat_paid": 18375.00,
  "vat_balance": 7875.00,
  "details": {
    "sales": [
      {
        "tax_name": "IVA 21%",
        "base": 125000.00,
        "tax": 26250.00
      }
    ],
    "purchases": [
      {
        "tax_name": "IVA 21%",
        "base": 87500.00,
        "tax": 18375.00
      }
    ]
  },
  "filing_info": {
    "model": "303",
    "due_date": "2024-10-20",
    "status": "pending"
  }
}
```

---

### 6. odoo-irpf

Obtiene datos de retenciones de IRPF.

#### Request

**URL**: `/odoo-irpf`  
**Method**: `POST`

**Body**:
```json
{
  "tenant_slug": "young-minds",
  "year": 2024
}
```

#### Response

**Status**: `200 OK`

```json
{
  "year": 2024,
  "total_retentions": 12500.00,
  "quarterly_summary": [
    {
      "quarter": "Q1",
      "retentions": 3000.00,
      "filing_date": "2024-04-20",
      "status": "filed"
    },
    {
      "quarter": "Q2",
      "retentions": 3200.00,
      "filing_date": "2024-07-20",
      "status": "filed"
    },
    {
      "quarter": "Q3",
      "retentions": 3300.00,
      "filing_date": "2024-10-20",
      "status": "pending"
    }
  ],
  "by_client": [
    {
      "partner_name": "Cliente ABC SL",
      "partner_vat": "B12345678",
      "total_retentions": 4500.00,
      "invoices_count": 12
    }
  ]
}
```

---

### 7. odoo-sociedades

Obtiene datos para el Impuesto de Sociedades.

#### Request

**URL**: `/odoo-sociedades`  
**Method**: `POST`

**Body**:
```json
{
  "tenant_slug": "young-minds",
  "fiscal_year": 2024
}
```

#### Response

**Status**: `200 OK`

```json
{
  "fiscal_year": 2024,
  "total_revenue": 187500.75,
  "total_expenses": 131250.50,
  "profit_before_tax": 56250.25,
  "tax_rate": 25,
  "estimated_tax": 14062.56,
  "breakdown": {
    "operating_income": 187500.75,
    "operating_expenses": 131250.50,
    "financial_income": 125.00,
    "financial_expenses": 375.00,
    "extraordinary_income": 0.00,
    "extraordinary_expenses": 0.00
  },
  "filing_info": {
    "model": "200",
    "due_date": "2025-07-25",
    "status": "not_started"
  }
}
```

---

### 8. odoo-sync

Ejecuta sincronización manual con Odoo.

#### Request

**URL**: `/odoo-sync`  
**Method**: `POST`

**Body**:
```json
{
  "tenant_slug": "young-minds"
}
```

#### Response

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Synchronization completed successfully",
  "sync_id": "a8f3d2c1-4b5e-6789-0abc-def123456789",
  "started_at": "2024-10-09T15:45:00Z",
  "completed_at": "2024-10-09T15:45:12Z",
  "duration_ms": 12000,
  "stats": {
    "invoices_synced": 23,
    "expenses_synced": 12,
    "accounts_synced": 8
  }
}
```

#### Error Response

**Status**: `500 Internal Server Error`

```json
{
  "success": false,
  "error": "Odoo connection failed",
  "message": "Could not connect to Odoo API",
  "sync_id": "a8f3d2c1-4b5e-6789-0abc-def123456789",
  "started_at": "2024-10-09T15:45:00Z",
  "failed_at": "2024-10-09T15:45:02Z"
}
```

---

### 9. financial-report-pdf

Genera PDF del informe financiero.

#### Request

**URL**: `/financial-report-pdf`  
**Method**: `POST`

**Body**:
```json
{
  "tenant_slug": "young-minds",
  "report_type": "monthly",  // "monthly", "quarterly", "annual"
  "period": "2024-10"
}
```

#### Response

**Status**: `200 OK`  
**Content-Type**: `application/pdf`

Body: Binary PDF file

#### Ejemplo con JavaScript

```javascript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_slug: 'young-minds',
    report_type: 'monthly',
    period: '2024-10'
  })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'informe-financiero-2024-10.pdf';
a.click();
```

---

## ❌ Códigos de Error

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Missing required field: tenant_slug"
}
```

**Causas comunes**:
- Falta campo obligatorio
- Formato de fecha inválido
- Tenant slug con formato incorrecto

---

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**Causas comunes**:
- Token JWT ausente
- Token JWT expirado
- Token JWT inválido

**Solución**: Renovar token con refresh_token

---

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Access denied to this tenant"
}
```

**Causas comunes**:
- Usuario no tiene acceso al tenant solicitado
- Tenant no existe

**Solución**: Verificar que el usuario tiene entrada en `user_tenant_access`

---

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Tenant not found"
}
```

**Causas comunes**:
- Tenant slug incorrecto
- Tenant eliminado

---

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again later.",
  "resetAt": "2024-10-09T16:30:00Z"
}
```

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-10-09T16:30:00Z
Retry-After: 3600
```

**Solución**: Esperar hasta `resetAt` o reducir frecuencia de peticiones

---

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Causas comunes**:
- Error en Odoo API
- Error en base de datos
- Timeout de conexión

**Solución**: Reintentar la petición. Si persiste, contactar soporte.

---

### 503 Service Unavailable
```json
{
  "error": "Service unavailable",
  "message": "Odoo service is temporarily unavailable"
}
```

**Causas comunes**:
- Odoo está caído
- Mantenimiento programado

**Solución**: Reintentar después de unos minutos

---

## 💡 Ejemplos

### Ejemplo 1: Obtener Dashboard

```javascript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tenant_slug: 'young-minds'
    })
  }
);

const data = await response.json();
console.log(data.summary.totalIncome);
```

---

### Ejemplo 2: Sincronización Manual con Manejo de Errores

```javascript
const syncOdoo = async (tenantSlug) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sync',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tenant_slug: tenantSlug })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Demasiadas peticiones. Espera unos minutos.');
      }
      throw new Error(data.message || 'Error en la sincronización');
    }

    console.log('✅ Sincronización exitosa:', data.stats);
    return data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
};

// Uso
await syncOdoo('young-minds');
```

---

### Ejemplo 3: Exportar PDF

```javascript
const exportPDF = async (tenantSlug, period) => {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/financial-report-pdf',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_slug: tenantSlug,
        report_type: 'monthly',
        period: period
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  // Descargar PDF
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `informe-${period}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Uso
await exportPDF('young-minds', '2024-10');
```

---

### Ejemplo 4: Obtener Facturas con Paginación

```javascript
const getAllInvoices = async (tenantSlug, startDate, endDate) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-invoices',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_slug: tenantSlug,
        type: 'out_invoice',
        state: 'posted',
        start_date: startDate,
        end_date: endDate
      })
    }
  );

  const data = await response.json();
  
  return {
    invoices: data.invoices,
    summary: data.summary
  };
};

// Uso
const { invoices, summary } = await getAllInvoices(
  'young-minds',
  '2024-01-01',
  '2024-12-31'
);

console.log(`Total facturas: ${summary.total_count}`);
console.log(`Total importe: ${summary.total_amount}€`);
```

---

### Ejemplo 5: Hook useAuthenticatedFetch (React)

```typescript
// Hook reutilizable con retry y timeout
import { useAuth } from '@/contexts/AuthContext';

export function useAuthenticatedFetch() {
  const { session } = useAuth();

  const fetchWithAuth = async (
    url: string,
    options: RequestInit = {},
    retries = 2,
    timeout = 30000
  ) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      // Manejar rate limiting con retry
      if (response.status === 429 && retries > 0) {
        const resetHeader = response.headers.get('X-RateLimit-Reset');
        const waitTime = resetHeader 
          ? new Date(resetHeader).getTime() - Date.now()
          : 60000;

        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 60000)));
        return fetchWithAuth(url, options, retries - 1, timeout);
      }

      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  };

  return { fetchWithAuth };
}

// Uso en componente
const { fetchWithAuth } = useAuthenticatedFetch();

const data = await fetchWithAuth(
  'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard',
  {
    method: 'POST',
    body: JSON.stringify({ tenant_slug: 'young-minds' })
  }
);
```

---

## 🔗 Links Relacionados

- [README.md](./README.md) - Documentación general
- [SECURITY.md](./SECURITY.md) - Documentación de seguridad
- [Supabase Docs](https://supabase.com/docs)
- [Odoo API Docs](https://www.odoo.com/documentation/18.0/developer/reference/backend/orm.html)

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0  
**Mantenedor**: [Tu Empresa]
