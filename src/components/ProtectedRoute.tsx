import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading: tenantLoading, error } = useTenantAccess();
  const location = useLocation();

  // 1. Esperar a que se cargue la sesión ANTES de redirigir
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // 2. Validar autenticación DESPUÉS de cargar la sesión
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Mostrar loading mientras valida tenant
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // 4. Mostrar error si no tiene acceso
  if (error || !hasAccess) {
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

  // 5. Si todo OK, renderizar children
  return <>{children}</>;
};
