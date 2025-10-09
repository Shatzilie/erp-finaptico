import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TenantAccess {
  tenantId: string | null;
  tenantSlug: string | null;
  role: string | null;
  hasAccess: boolean;
  isLoading: boolean;
}

export function useTenantAccess(): TenantAccess {
  const { user } = useAuth();
  const [access, setAccess] = useState<TenantAccess>({
    tenantId: null,
    tenantSlug: null,
    role: null,
    hasAccess: false,
    isLoading: true
  });

  useEffect(() => {
    if (!user) {
      setAccess({
        tenantId: null,
        tenantSlug: null,
        role: null,
        hasAccess: false,
        isLoading: false
      });
      return;
    }

    async function fetchTenantAccess() {
      try {
        // Consultar user_tenant_access con JOIN a tenants
        const { data, error } = await (supabase as any)
          .from('user_tenant_access')
          .select(`
            tenant_id,
            role,
            tenants!inner (
              slug
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching tenant access:', error);
          setAccess({
            tenantId: null,
            tenantSlug: null,
            role: null,
            hasAccess: false,
            isLoading: false
          });
          return;
        }

        if (data) {
          setAccess({
            tenantId: (data as any).tenant_id,
            tenantSlug: (data as any).tenants.slug,
            role: (data as any).role,
            hasAccess: true,
            isLoading: false
          });
        }
      } catch (err) {
        console.error('Exception in useTenantAccess:', err);
        setAccess({
          tenantId: null,
          tenantSlug: null,
          role: null,
          hasAccess: false,
          isLoading: false
        });
      }
    }

    fetchTenantAccess();
  }, [user]);

  return access;
}
