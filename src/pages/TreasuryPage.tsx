import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type TreasuryBalance = {
  total: number;
  currency: string;
  accounts: Array<{
    journal_id: number;
    journal_name: string;
    iban?: string | null;
    account_id: number;
    account_code?: string;
    account_name?: string;
    balance: number;
  }>;
};

type Movement = {
  date: string;
  concept: string;
  partner?: string | null;
  amount: number; // + entrada / - salida
};

function useTenantSlug() {
  const params = useParams();
  const location = useLocation();
  let slug =
    (params as any)?.tenant ||
    (params as any)?.tenantSlug ||
    location.pathname.split("/").filter(Boolean)[0] ||
    "";
  return slug;
}

function formatEUR(n: number, currency = "EUR") {
  return Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n ?? 0);
}

export default function TreasuryPage() {
  const slug = useTenantSlug();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [balance, setBalance] = useState<TreasuryBalance | null>(null);
  const [movs, setMovs] = useState<Movement[]>([]);

  const currency = useMemo(() => balance?.currency || "EUR", [balance]);

  async function fetchData() {
    if (!slug) return;
    setLoading(true);

    // 1) tenant_id
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

    // 2) treasury_balance
    const { data: w1, error: e1 } = await (supabase as any)
      .from("widget_data")
      .select("payload")
      .eq("tenant_id", tenant.id)
      .eq("key", "treasury_balance")
      .single();

    // 3) treasury_movements_30d
    const { data: w2, error: e2 } = await (supabase as any)
      .from("widget_data")
      .select("payload")
      .eq("tenant_id", tenant.id)
      .eq("key", "treasury_movements_30d")
      .single();

    if (!e1 && w1?.payload) {
      setBalance(w1.payload as TreasuryBalance);
    } else {
      setBalance(null);
    }

    if (!e2 && w2?.payload?.items) {
      setMovs(w2.payload.items as Movement[]);
    } else {
      setMovs([]);
    }

    setLoading(false);
  }

  async function handleSync() {
    if (!slug) return;
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("odoo-sync", {
      body: { tenant: slug },
    });
    if (error) console.error("sync error", error);
    else console.log("sync ok", data);
    await fetchData();
    setSyncing(false);
  }

  useEffect(() => {
    fetchData();
  }, [slug]);

  return (
    <div className="space-y-6">
      {/* Header + botón */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tesorería</h1>
          <p className="text-sm text-muted-foreground">
            Saldo bancario y movimientos (últimos 30 días)
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {syncing ? "Sincronizando..." : "Sincronizar ahora"}
        </button>
      </div>

      {/* Cards de saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 shadow-sm bg-white">
          <div className="text-sm text-muted-foreground">Saldo total</div>
          <div className="mt-2 text-2xl font-semibold">
            {loading ? "—" : formatEUR(balance?.total || 0, currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {loading ? "" : `${balance?.accounts?.length ?? 0} cuentas conectadas`}
          </div>
        </div>

        {/* Detalle por cuenta */}
        <div className="md:col-span-2 rounded-2xl border p-4 shadow-sm bg-white">
          <div className="text-sm font-medium mb-2">Cuentas / Bancos</div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : (balance?.accounts?.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">Sin cuentas disponibles.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Banco / Journal</th>
                    <th className="py-2 pr-4">Cuenta</th>
                    <th className="py-2 pr-4">IBAN</th>
                    <th className="py-2 pr-4 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {balance!.accounts.map((a) => (
                    <tr key={a.account_id} className="border-t">
                      <td className="py-2 pr-4">{a.journal_name}</td>
                      <td className="py-2 pr-4">
                        {a.account_code ? `${a.account_code} — ` : ""}
                        {a.account_name || "-"}
                      </td>
                      <td className="py-2 pr-4">{a.iban || "-"}</td>
                      <td className="py-2 pr-4 text-right">
                        {formatEUR(a.balance, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Movimientos 30 días */}
      <div className="rounded-2xl border p-4 shadow-sm bg-white">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Movimientos últimos 30 días</div>
          <div className="text-xs text-muted-foreground">
            {loading ? "" : `${movs.length} movimientos`}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground mt-2">Cargando…</div>
        ) : movs.length === 0 ? (
          <div className="text-sm text-muted-foreground mt-2">Sin movimientos.</div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Concepto</th>
                  <th className="py-2 pr-4">Tercero</th>
                  <th className="py-2 pr-4 text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m, idx) => (
                  <tr key={`${m.date}-${idx}`} className="border-t">
                    <td className="py-2 pr-4">
                      {new Date(m.date).toLocaleDateString("es-ES")}
                    </td>
                    <td className="py-2 pr-4">{m.concept || "-"}</td>
                    <td className="py-2 pr-4">{m.partner || "-"}</td>
                    <td
                      className={`py-2 pr-4 text-right ${
                        m.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formatEUR(m.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}