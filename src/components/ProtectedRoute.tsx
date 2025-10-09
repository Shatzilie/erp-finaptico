import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipTenantCheck?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  skipTenantCheck = false 
}) => {
  const { isAuthenticated } = useAuth();
  const { hasAccess, isLoading } = useTenantAccess();
  const location = useLocation();

  // 1. Validar autenticación
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si skipTenantCheck es true, solo validar autenticación
  if (skipTenantCheck) {
    return <>{children}</>;
  }

  // 3. Mostrar loading mientras valida tenant
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permisos de acceso...</p>
        </div>
      </div>
    );
  }

  // 4. Mostrar error si no tiene acceso al tenant
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Sin Acceso al Tenant</AlertTitle>
          <AlertDescription>
            No tienes acceso a ningún tenant asignado.
            <br />
            <br />
            Por favor, contacta con el administrador para que te asigne permisos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 5. Si todo OK, renderizar children
  return <>{children}</>;
};
