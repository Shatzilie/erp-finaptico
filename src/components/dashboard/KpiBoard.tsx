import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type KPIData = {
  revenue: number;
  expenses: number;
  invoicesIssued: number;
  invoicesReceived: number;
};

function useTenantSlug() {
  const params = useParams();
  const location = useLocation();

  // compatible con :tenant o :tenantSlug
  let slug = (params as any)?.tenant || (params as any)?.tenantSlug || "";
  if (!slug) {
    // fallback: /young-minds/dashboard -> "young-minds"
    const first = location.pathname.split("/").filter(Boolean)[0];
    slug = first || "";
  }
  return slug;
}

export default function KpiBoard() {
  const slug = useTenantSlug();
  const [kpi, setKpi] = useState<KPIData>({
    revenue: 0,
    expenses: 0,
    invoicesIssued: 0,
    invoicesReceived: 0,
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function fetchKPIs() {
    if (!slug) return;
    setLoading(true);

    // 1) tenant_id por slug
    const { data: tenant, error: terr } = await (supabase as any)
      .from("tenants")
      .select("id, currency")
      .eq("slug", slug)
      .single();

    if (terr || !tenant) {
      console.error("Tenant not found", slug, terr);
      setLoading(false);
      return;
    }

    // 2) leer widgets
    const { data: widgets, error: werr } = await (supabase as any)
      .from("widget_data")
      .select("key, payload")
      .eq("tenant_id", tenant.id)
      .in("key", [
        "revenue_month",
        "expenses_month",
        "invoices_month_count", // emitidas
        "invoices_received_month_count", // recibidas
      ]);

    if (werr) {
      console.error("widget_data error", werr);
      setLoading(false);
      return;
    }

    const revenue =
      (widgets as any)?.find((w: any) => w.key === "revenue_month")?.payload?.amount ?? 0;
    const expenses =
      (widgets as any)?.find((w: any) => w.key === "expenses_month")?.payload?.amount ?? 0;
    const invoicesIssued =
      (widgets as any)?.find((w: any) => w.key === "invoices_month_count")?.payload?.count ??
      0;
    const invoicesReceived =
      (widgets as any)?.find((w: any) => w.key === "invoices_received_month_count")?.payload
        ?.count ?? 0;

    setKpi({ revenue, expenses, invoicesIssued, invoicesReceived });
    setLoading(false);
  }

  async function handleSyncNow() {
    if (!slug) return;
    setSyncing(true);

    // Invoca la Edge Function (el SDK ya mete apikey y auth)
    const { data, error } = await supabase.functions.invoke("odoo-sync", {
      body: { tenant_slug: slug },
    });

    if (error) console.error("sync error", error);
    else console.log("sync ok", data);

    await fetchKPIs();
    setSyncing(false);
  }

  useEffect(() => {
    fetchKPIs();
  }, [slug]);

  return (
    <div className="space-y-6">
      {/* Header + botón */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard Principal</h2>
          <p className="text-sm text-muted-foreground">
            Resumen financiero
          </p>
        </div>
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {syncing ? "Sincronizando..." : "Sincronizar ahora"}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiMoney title="Ingresos (mes)" value={kpi.revenue} loading={loading} positive />
        <KpiMoney title="Gastos (mes)" value={kpi.expenses} loading={loading} />
        <KpiCount title="Nº Facturas emitidas (mes)" value={kpi.invoicesIssued} loading={loading} />
        <KpiCount title="Nº Facturas recibidas (mes)" value={kpi.invoicesReceived} loading={loading} />
      </div>
    </div>
  );
}

/* ---------- Cards ---------- */

function KpiMoney({
  title,
  value,
  loading,
  positive = false,
}: {
  title: string;
  value: number;
  loading?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${positive ? "text-emerald-600" : ""}`}>
        {loading ? "—" : formatEUR(value)}
      </div>
      <div className="text-xs text-muted-foreground mt-1">mes en curso</div>
    </div>
  );
}

function KpiCount({
  title,
  value,
  loading,
}: {
  title: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-semibold">
        {loading ? "—" : Intl.NumberFormat("es-ES").format(value)}
      </div>
      <div className="text-xs text-muted-foreground mt-1">mes en curso</div>
    </div>
  );
}

function formatEUR(n: number) {
  return Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n ?? 0);
}