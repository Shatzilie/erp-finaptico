import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { tenantSlug, hasAccess, isLoading: tenantLoading, error } = useTenantAccess();
  const location = useLocation();
  const { tenant: tenantParam } = useParams<{ tenant: string }>();

  console.log("🛡️ ProtectedRoute:", {
    authLoading,
    isAuthenticated,
    tenantLoading,
    hasAccess,
  });

  // 1️⃣ CRÍTICO: Esperar a que termine de cargar la sesión
  if (authLoading) {
    console.log("⏳ Esperando carga de sesión...");
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
    console.log("❌ No autenticado, redirigiendo a login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3️⃣ Esperar validación de tenant
  if (tenantLoading) {
    console.log("⏳ Verificando permisos de tenant...");
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
    console.log("❌ Sin acceso al tenant");
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
    console.log("⚠️ Tenant incorrecto en URL, redirigiendo a:", tenantSlug);
    return <Navigate to={`/${tenantSlug}/dashboard`} replace />;
  }

  // 6️⃣ Todo OK
  console.log("✅ Acceso concedido");
  return <>{children}</>;
};
