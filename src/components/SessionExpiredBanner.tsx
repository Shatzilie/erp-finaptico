import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function SessionExpiredBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // No mostrar el banner si estamos en la página de login
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    // Listener para cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Detectar cierre de sesión (expiración automática o manual)
      if (event === 'SIGNED_OUT' && !isLoginPage) {
        setShowBanner(true);
      }

      // Limpiar banner cuando el usuario inicia sesión
      if (event === 'SIGNED_IN') {
        setShowBanner(false);
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [isLoginPage]);

  // Manejar clic en botón de login
  const handleLoginClick = () => {
    setShowBanner(false);
    navigate('/login');
  };

  // No renderizar si no hay que mostrar el banner o estamos en login
  if (!showBanner || isLoginPage) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <Alert className="bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span className="text-yellow-800 dark:text-yellow-200 font-medium">
            Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
          </span>
          <Button
            onClick={handleLoginClick}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700"
          >
            Iniciar sesión
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
