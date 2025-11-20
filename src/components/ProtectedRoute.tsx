import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { logger } from "@/lib/logger";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { tenantSlug, hasAccess, isLoading: tenantLoading, error } = useTenantAccess();
  const location = useLocation();
  const { tenant: tenantParam } = useParams<{ tenant: string }>();

  logger.debug('ProtectedRoute check', {
    component: 'ProtectedRoute',
    authLoading,
    isAuthenticated,
    tenantLoading,
    hasAccess,
  });

  // 1️⃣ CRÍTICO: Esperar a que termine de cargar la sesión
  if (authLoading) {
    logger.debug('Waiting for session load', { component: 'ProtectedRoute' });
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
    logger.info('User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3️⃣ Esperar validación de tenant
  if (tenantLoading) {
    logger.debug('Verifying tenant permissions', { component: 'ProtectedRoute' });
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
    logger.warn('Tenant access denied', { error, hasAccess });
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            {error || "No tienes permisos para acceder a esta empresa."}
            <br />
            <br />
            Por favor, contacta con el administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 5️⃣ Validar que el tenant de la URL coincide con el tenant del usuario
  if (tenantParam && tenantSlug && tenantParam !== tenantSlug) {
    logger.info('Tenant mismatch, redirecting', { tenantParam, tenantSlug });
    return <Navigate to={`/${tenantSlug}/dashboard`} replace />;
  }

  // 6️⃣ Todo OK - wrap con ErrorBoundary
  logger.debug('Access granted', { tenantSlug });
  return (
    <ErrorBoundary fallbackMessage="Error en el contenido protegido">
      {children}
    </ErrorBoundary>
  );
};
