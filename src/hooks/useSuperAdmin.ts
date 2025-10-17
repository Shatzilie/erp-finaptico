import { useAuth } from '@/contexts/AuthContext';

export function useSuperAdmin() {
  const { user } = useAuth();
  
  // Verificar si el usuario tiene is_super_admin en user_metadata
  const isSuperAdmin = user?.user_metadata?.is_super_admin === true;
  
  return { isSuperAdmin };
}
