import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TenantFeatures = {
  tenant_id: string;
  show_dashboard: boolean;
  show_invoicing: boolean;
  show_expenses: boolean;
  show_vat: boolean;
  show_irpf: boolean;
  show_is: boolean;
  show_treasury: boolean;
  show_calendar: boolean;
  show_docs: boolean;
  show_advisory: boolean;
  show_company: boolean;
};

function useSlug() {
  const params = useParams();
  const location = useLocation();
  let slug = (params as any)?.tenant || (params as any)?.tenantSlug || "";
  if (!slug) slug = location.pathname.split("/").filter(Boolean)[0] || "";
  return slug;
}

export function useTenantFeatures() {
  const { isLoading: authLoading } = useAuth();
  const slug = useSlug();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [features, setFeatures] = useState<TenantFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si auth está cargando, esperar
    if (authLoading) {
      setLoading(true);
      return;
    }

    // Si no hay slug o es ruta admin, no hacer nada
    if (!slug || slug === 'admin') {
      setLoading(false);
      return;
    }

    // Ejecutar lógica normal de consultas
    (async () => {
      setLoading(true);

      const { data: tenant, error: terr } = await (supabase as any)
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (terr || !tenant) {
        console.error("Tenant not found", slug, terr);
        setLoading(false);
        return;
      }
      setTenantId(tenant.id);

      const { data: feat, error: ferr } = await (supabase as any)
        .from("tenant_features")
        .select("*")
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (ferr) {
        console.error("tenant_features error", ferr);
      } else {
        setFeatures(feat as TenantFeatures);
      }
      setLoading(false);
    })();
  }, [authLoading, slug]);

  return { slug, tenantId, features, loading };
}