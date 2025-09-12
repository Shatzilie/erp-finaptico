import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  const slug = useSlug();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [features, setFeatures] = useState<TenantFeatures | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);

      const { data: tenant, error: terr } = await (supabase as any)
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .single();

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
        .single();

      if (ferr) {
        console.error("tenant_features error", ferr);
      } else {
        setFeatures(feat as TenantFeatures);
      }
      setLoading(false);
    })();
  }, [slug]);

  return { slug, tenantId, features, loading };
}