import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Tipos locales para evitar dependencia de types.ts
type TenantRow = {
  id: string;
  slug: string;
  name: string;
  odoo_company_id: number;
  currency: string | null;
  created_at: string | null;
  company_legal_name: string | null;
  company_tax_id: string | null;
  company_logo_url: string | null;
};

type UserTenantAccessRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  created_at: string | null;
  tenants: TenantRow;
};

interface TenantAccessResult {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para obtener el tenant al que el usuario autenticado tiene acceso.
 */
export function useTenantAccess(): TenantAccessResult {
  const { user, isAuthenticated } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log("⚠️ No authenticated user");
      setTenantId(null);
      setTenantSlug(null);
      setTenantName(null);
      setHasAccess(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchTenantAccess = async () => {
      try {
        console.log("🔍 Buscando tenant para usuario:", user.id);
        setIsLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("user_tenant_access")
          .select(`
            tenant_id,
            tenants (
              id,
              slug,
              name
            )
          `)
          .eq("user_id", user.id)
          .single();

        if (queryError) {
          console.error("❌ Error consultando tenant:", queryError);
          setError("No se pudo obtener el acceso al tenant");
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        if (!data || !data.tenants) {
          console.error("❌ Usuario sin tenant asignado");
          setError("Usuario sin tenant asignado");
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        const tenant = data.tenants as TenantRow;
        console.log("✅ Tenant encontrado:", tenant.slug);
        
        setTenantId(tenant.id);
        setTenantSlug(tenant.slug);
        setTenantName(tenant.name || null);
        setHasAccess(true);
      } catch (err: any) {
        console.error("❌ Error en fetchTenantAccess:", err);
        setError(err.message || "Error desconocido");
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
    hasAccess,
    isLoading,
    error,
  };
}
