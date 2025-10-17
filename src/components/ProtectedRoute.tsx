import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading: tenantLoading, error } = useTenantAccess();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute:', { 
    authLoading, 
    isAuthenticated, 
    tenantLoading, 
    hasAccess 
  });

  // 1️⃣ CRÍTICO: Esperar a que termine de cargar la sesión
  if (authLoading) {
    console.log('⏳ Esperando carga de sesión...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // 2️⃣ Solo DESPUÉS de cargar, validar autenticación
  if (!isAuthenticated) {
    console.log('❌ No autenticado, redirigiendo a login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3️⃣ Esperar validación de tenant
  if (tenantLoading) {
    console.log('⏳ Verificando permisos de tenant...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // 4️⃣ Validar acceso a tenant
  if (error || !hasAccess) {
    console.log('❌ Sin acceso al tenant');
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            {error || 'No tienes permisos para acceder a esta empresa.'}
            <br />
            <br />
            Por favor, contacta con el administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 5️⃣ Todo OK
  console.log('✅ Acceso concedido');
  return <>{children}</>;
};
```

---

## 📋 Prompt para Lovable (copia y pega completo)
```
# A1: Arreglar sesión persistente - IMPLEMENTACIÓN COMPLETA

Reemplazar COMPLETAMENTE estos dos archivos:

## 1. src/contexts/AuthContext.tsx

- Añadir `isLoading: boolean` al interface AuthContextType
- Inicializar `isLoading` en `true` en el useState
- En el useEffect, ejecutar `getSession()` primero y setear `isLoading = false` después
- En el `onAuthStateChange`, también setear `isLoading = false` 
- Añadir `isLoading` al value del Provider
- Añadir console.logs para debugging (como en el código que te pasé)

## 2. src/components/ProtectedRoute.tsx

- Destructurar `isLoading: authLoading` del useAuth hook
- PRIMERO verificar si `authLoading` es true → mostrar loader "Cargando sesión..."
- SOLO si `authLoading` es false, entonces validar `isAuthenticated`
- Si no está autenticado, redirigir a login
- Mantener la lógica de tenant después
- Añadir console.logs para debugging (como en el código que te pasé)

## 3. Verificar src/integrations/supabase/client.ts

Asegurarse de que tenga:
```
auth: {
  storage: localStorage,
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
}
```

IMPORTANTE: El problema actual es que ProtectedRoute evalúa isAuthenticated ANTES de que AuthContext termine de cargar la sesión desde localStorage. Con isLoading resolvemos esto.
```

---

## ✅ Qué deberías ver después del cambio

**En consola al hacer login:**
```
🔐 AuthProvider: Inicializando...
📦 Sesión inicial: NO EXISTE
🛡️ ProtectedRoute: { authLoading: false, isAuthenticated: false, ... }
🔄 Auth state change: SIGNED_IN
✅ Usuario inició sesión
🛡️ ProtectedRoute: { authLoading: false, isAuthenticated: true, ... }
✅ Acceso concedido
```

**En consola al hacer refresh (F5):**
```
🔐 AuthProvider: Inicializando...
📦 Sesión inicial: EXISTE
🛡️ ProtectedRoute: { authLoading: true, ... }
⏳ Esperando carga de sesión...
🛡️ ProtectedRoute: { authLoading: false, isAuthenticated: true, ... }
✅ Acceso concedido