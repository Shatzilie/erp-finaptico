import { useEffect, useMemo, useState } from "react";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { handleApiError } from "@/lib/apiErrorHandler";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type TreasuryBalance = {
  total: number;
  currency: string;
  accounts: Array<{
    id: number;
    account_code?: string;
    account_name?: string;
    name?: string;
    currency: string;
    balance: number;
    iban?: string | null;
  }>;
};

type Movement = {
  date: string;
  concept: string;
  partner?: string | null;
  amount: number;
  journal_id?: [number, string];
};

export default function TreasuryPage() {
  const { tenantSlug, isLoading: isTenantLoading, hasAccess } = useTenantAccess();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [balance, setBalance] = useState<TreasuryBalance | null>(null);
  const [movs, setMovs] = useState<Movement[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(40);
  const { fetchWithTimeout } = useAuthenticatedFetch();

  const currency = useMemo(() => balance?.currency || "EUR", [balance]);

  const filterMovementsByAccount = (accountId: number) => {
    return movs.filter((movement) => {
      return movement.journal_id && movement.journal_id[0] === accountId;
    });
  };

  const filteredMovements = useMemo(() => {
    const filtered = filterMovementsByAccount(selectedAccountId).slice(0, 5);
    return filtered;
  }, [movs, selectedAccountId]);

  const accountButtons = [
    { id: 40, name: "BBVA YMBI" },
    { id: 31, name: "Caixa Enginyers" },
  ];

  const fetchTreasuryData = async () => {
    if (!tenantSlug) {
      return;
    }

    setLoading(true);
    try {
      const result = await fetchWithTimeout("odoo-treasury", { tenant_slug: tenantSlug }, { timeout: 60000, retries: 0 });

      console.log("✅ Treasury data loaded");

      if (result.ok && result.widget_data?.treasury_balance?.payload) {
        const treasuryData = result.widget_data.treasury_balance.payload;
        const accounts = treasuryData.accounts || [];

        setBalance({
          ...treasuryData,
          accounts: accounts,
          total: accounts.reduce((sum, account) => sum + account.balance, 0),
        });

        // Movimientos
        if (result.widget_data?.treasury_movements_30d?.payload?.items) {
          setMovs(result.widget_data.treasury_movements_30d.payload.items);
        } else if (treasuryData.movements) {
          setMovs(treasuryData.movements);
        } else {
          setMovs([]);
        }
      } else {
        throw new Error(result.error || "Invalid response format");
      }
    } catch (error: any) {
      handleApiError(error, "Tesorería");
      setBalance(null);
      setMovs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!tenantSlug) {
      return;
    }

    setSyncing(true);
    try {
      const data = await fetchWithTimeout("odoo-treasury", { tenant_slug: tenantSlug }, { timeout: 60000, retries: 0 });

      console.log("✅ Treasury sync completed");

      if (!data.ok) {
        throw new Error(data.error || "Sync error");
      }

      // Procesar datos directamente de la función
      if (data?.widget_data?.treasury_balance?.payload) {
        const treasuryData = data.widget_data.treasury_balance.payload;
        const accounts = treasuryData.accounts || [];

        setBalance({
          ...treasuryData,
          accounts: accounts,
          total: accounts.reduce((sum, account) => sum + account.balance, 0),
        });
      }

      // Movimientos
      if (data?.widget_data?.treasury_movements_30d?.payload?.items) {
        setMovs(data.widget_data.treasury_movements_30d.payload.items);
      } else if (data?.widget_data?.treasury_balance?.payload?.movements) {
        setMovs(data.widget_data.treasury_balance.payload.movements);
      } else {
        setMovs([]);
      }

      console.log("✅ Treasury sync completed");
    } catch (error: any) {
      handleApiError(error, "Sincronización");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (tenantSlug && hasAccess) {
      fetchTreasuryData();
    }
  }, [tenantSlug, hasAccess]);

  // Loading state mientras se carga el tenant
  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del tenant...</p>
        </div>
      </div>
    );
  }

  // Error state si no tiene acceso
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>No tienes acceso a este tenant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + botón */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Saldo disponible en bancos</h1>
          <p className="text-sm text-muted-foreground">Saldo bancario y movimientos (últimos 30 días)</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {syncing ? "Sincronizando..." : "Sincronizar ahora"}
        </button>
      </div>

      {/* Cards de saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 shadow-sm bg-white">
          <div className="text-sm text-muted-foreground">Saldo total</div>
          <div className="mt-2 text-2xl font-semibold">{loading ? "—" : formatCurrency(balance?.total || 0, currency)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {loading ? "" : `${balance?.accounts?.length ?? 0} cuentas conectadas`}
          </div>
        </div>

        {/* Detalle por cuenta */}
        <div className="md:col-span-2 rounded-2xl border p-4 shadow-sm bg-white">
          <div className="text-sm font-medium mb-4">Cuentas / Bancos</div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : (balance?.accounts?.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">Sin cuentas disponibles.</div>
          ) : (
            <div className="grid gap-3">
              {balance!.accounts.map((account) => (
                <div key={account.id} className="rounded-xl border p-3 bg-gray-50">
                  <h3 className="font-medium text-sm">{account.account_name || account.name}</h3>
                  <p className="text-lg font-semibold mt-1">{formatCurrency(account.balance, currency)}</p>
                  <p className="text-xs text-muted-foreground mt-1">IBAN: {account.iban || "No disponible"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Movimientos 30 días */}
      <div className="rounded-2xl border p-4 shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">Movimientos por cuenta (últimos 5)</div>
          <div className="text-xs text-muted-foreground">
            {loading ? "" : `${filteredMovements.length} de ${movs.length} movimientos`}
          </div>
        </div>

        {/* Botones de filtro */}
        <div className="flex flex-wrap gap-2 mb-4">
          {accountButtons.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccountId(account.id)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedAccountId === account.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent"
              }`}
            >
              {account.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : filteredMovements.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay movimientos para esta cuenta</div>
        ) : (
          <div className="overflow-x-auto">
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
                {filteredMovements.map((m, idx) => (
                  <tr key={`${m.date}-${idx}`} className="border-t">
                    <td className="py-2 pr-4">{new Date(m.date).toLocaleDateString("es-ES")}</td>
                    <td className="py-2 pr-4">{m.concept || "-"}</td>
                    <td className="py-2 pr-4">{m.partner || "-"}</td>
                    <td className={`py-2 pr-4 text-right ${m.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatCurrency(m.amount, currency)}
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
