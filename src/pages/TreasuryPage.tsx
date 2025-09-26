import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const ALLOWED_ACCOUNTS_BY_TENANT: Record<string, number[]> = {
  'young-minds': [32, 40, 31, 39], // 4 cuentas específicas
  'blacktar': [], // Por ahora vacío, más adelante tendrá su cuenta
  // Futuros clientes aquí
};

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
  amount: number; // + entrada / - salida
  journal_id?: [number, string]; // [id, name] del journal/cuenta
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
  const [selectedAccountId, setSelectedAccountId] = useState<number>(40); // BBVA YMBI por defecto

  const currency = useMemo(() => balance?.currency || "EUR", [balance]);

  const filterMovementsByAccount = (accountId: number) => {
    console.log(`Filtering movements for account ID: ${accountId}`);
    const filtered = movs.filter(movement => {
      console.log('Movement journal_id:', movement.journal_id, 'Looking for:', accountId);
      return movement.journal_id && movement.journal_id[0] === accountId;
    });
    console.log(`Found ${filtered.length} movements for account ${accountId}`);
    return filtered;
  };

  const filteredMovements = useMemo(() => {
    console.log('Selected account ID:', selectedAccountId);
    console.log('All movements:', movs);
    console.log('Movements length:', movs.length);
    
    const filtered = filterMovementsByAccount(selectedAccountId).slice(0, 5);
    console.log(`Filtered movements for account ${selectedAccountId}:`, filtered);
    console.log('Filtered length:', filtered.length);
    
    return filtered;
  }, [movs, selectedAccountId]);

  const accountButtons = [
    { id: 40, name: "BBVA YMBI" },
    { id: 31, name: "Caixa Enginyers" }
  ];

  const fetchTreasuryData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/functions/v1/odoo-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: slug
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Treasury API Response:', result);

      if (result.ok && result.widget_data?.treasury_balance?.payload) {
        const treasuryData = result.widget_data.treasury_balance.payload;
        const accounts = treasuryData.accounts || [];
        
        // Filter accounts for young-minds tenant
        const allowedAccountIds = [32, 40, 31, 39];
        const filteredAccounts = accounts.filter(account => allowedAccountIds.includes(account.id));
        
        setBalance({
          ...treasuryData,
          accounts: filteredAccounts,
          total: filteredAccounts.reduce((sum, account) => sum + account.balance, 0)
        });

        // Set movements if available
        if (result.widget_data?.treasury_movements_30d?.payload?.items) {
          setMovs(result.widget_data.treasury_movements_30d.payload.items);
        } else if (treasuryData.movements) {
          setMovs(treasuryData.movements);
        }
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching treasury data:', error);
      setBalance(null);
      setMovs([]);
    } finally {
      setLoading(false);
    }
  };

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
      const balance = w1.payload as TreasuryBalance;
      const accounts = balance.accounts || [];
      
      // Debug logs
      console.log('Todas las cuentas antes del filtro:', accounts);
      console.log('IDs de cuentas encontradas:', accounts.map(acc => acc.id));
      
      const allowedAccountIds = [32, 40, 31, 39]; // IDs específicos para young-minds
      const filteredAccounts = accounts.filter(account => allowedAccountIds.includes(account.id));
      
      console.log('Cuentas después del filtro:', filteredAccounts);
      console.log('IDs filtrados:', filteredAccounts.map(acc => acc.id));
      
      setBalance({
        ...balance,
        accounts: filteredAccounts,
        total: filteredAccounts.reduce((sum, account) => sum + account.balance, 0)
      });
    } else {
      setBalance(null);
    }

    if (!e2 && w2?.payload?.items) {
      console.log('Movements from fetchData:', w2.payload.items);
      setMovs(w2.payload.items as Movement[]);
    } else {
      console.log('No movements found in fetchData:', e2, w2?.payload);
      setMovs([]);
    }

    setLoading(false);
  }

  async function handleSync() {
    if (!slug) return;
    setSyncing(true);
    const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sync-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
      },
      body: JSON.stringify({
        tenant_slug: slug  // Usar tenant_slug en lugar de credenciales hardcodeadas
      })
    });

    const data = await response.json();
    
    // Debug logs
    console.log('Raw response from odoo-sync:', data);
    console.log('Accounts array:', data?.widget_data?.treasury_balance?.payload?.accounts);
    
    if (!data.ok) {
      console.error("sync error", data.error);
    } else {
      console.log("sync ok", data);
      
      // Debug logs para movimientos
      console.log('Raw treasury data:', data?.widget_data?.treasury_balance?.payload);
      console.log('Movements from API:', data?.widget_data?.treasury_movements_30d?.payload?.items);
      console.log('Treasury movements in payload:', data?.widget_data?.treasury_balance?.payload?.movements);
      
      // Process treasury data directly from function response
      if (data?.widget_data?.treasury_balance?.payload) {
        const treasuryData = data.widget_data.treasury_balance.payload;
        const accounts = treasuryData.accounts || [];
        
        // Debug logs
        console.log('Todas las cuentas antes del filtro:', accounts);
        console.log('IDs de cuentas encontradas:', accounts.map(acc => acc.id));
        
        const allowedAccountIds = [32, 40, 31, 39]; // IDs específicos para young-minds
        const filteredAccounts = accounts.filter(account => allowedAccountIds.includes(account.id));
        
        console.log('Cuentas después del filtro:', filteredAccounts);
        console.log('IDs filtrados:', filteredAccounts.map(acc => acc.id));
        
        const filteredTreasuryData = {
          ...treasuryData,
          accounts: filteredAccounts,
          total: filteredAccounts.reduce((sum, account) => sum + account.balance, 0)
        };
        
        console.log('Component state after sync:', filteredTreasuryData);
        setBalance(filteredTreasuryData);
      }
      
      // Also fetch movements if available
      if (data?.widget_data?.treasury_movements_30d?.payload?.items) {
        console.log('Setting movements from sync response:', data.widget_data.treasury_movements_30d.payload.items);
        setMovs(data.widget_data.treasury_movements_30d.payload.items);
      } else {
        console.log('No movements in sync response treasury_movements_30d');
        console.log('Checking other possible movement locations...');
        if (data?.widget_data?.treasury_balance?.payload?.movements) {
          console.log('Found movements in treasury_balance:', data.widget_data.treasury_balance.payload.movements);
          setMovs(data.widget_data.treasury_balance.payload.movements);
        }
      }
    }
    
    setSyncing(false);
  }

  useEffect(() => {
    console.log('TreasuryPage useEffect - fetchData called');
    fetchData();
  }, [slug]);

  return (
    <div className="space-y-6">
      {/* Header + botón */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Saldo disponible en bancos</h1>
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
                  <p className="text-lg font-semibold mt-1">
                    {formatEUR(account.balance, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    IBAN: {account.iban || "No disponible"}
                  </p>
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
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              }`}
            >
              {account.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : filteredMovements.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No hay movimientos para esta cuenta (Debug: {movs?.length || 0} movimientos totales, 
            Account ID: {selectedAccountId})
          </div>
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