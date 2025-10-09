import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TenantAccessResult {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  role: string | null;
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para obtener el tenant al que el usuario autenticado tiene acceso.
 * Consulta la tabla user_tenant_access para obtener dinámicamente el tenant
 * asignado al usuario actual.
 * 
 * @returns {TenantAccessResult} Información del tenant y estado de carga
 */
export function useTenantAccess(): TenantAccessResult {
  const { user, isAuthenticated } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no está autenticado, resetear todo
    if (!isAuthenticated || !user) {
      setTenantId(null);
      setTenantSlug(null);
      setTenantName(null);
      setRole(null);
      setHasAccess(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchTenantAccess = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Consultar user_tenant_access con JOIN a tenants
        const { data, error: queryError } = await (supabase as any)
          .from('user_tenant_access')
          .select(`
            tenant_id,
            role,
            tenants (
              id,
              slug,
              name
            )
          `)
          .eq('user_id', user.id)
          .single();

        console.log('🔍 DEBUG useTenantAccess:', {
          userId: user.id,
          queryError,
          data,
          hasData: !!data,
          hasTenants: !!data?.tenants
        });

        if (queryError) {
          setError('No se pudo obtener el acceso al tenant');
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        if (!data || !data.tenants) {
          setError('Usuario sin tenant asignado');
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Manejar posible array o objeto
        const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;

        setTenantId(tenant.id);
        setTenantSlug(tenant.slug);
        setTenantName(tenant.name || null);
        setRole(data.role || null);
        setHasAccess(true);

      } catch (err: any) {
        setError(err.message || 'Error desconocido');
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantAccess();
  }, [user, isAuthenticated]);

  return {
    tenantId,
    tenantSlug,
    tenantName,
    role,
    hasAccess,
    isLoading,
    error
  };
}
