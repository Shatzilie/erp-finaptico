import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function serverClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

// Odoo RPC Client
type JsonRpcPayload = {
  jsonrpc: '2.0';
  method: 'call';
  params: any;
  id: number;
};

const ODOO_BASE_URL = Deno.env.get('ODOO_BASE_URL')!;
const ODOO_DB = Deno.env.get('ODOO_DB')!;
const ODOO_USERNAME = Deno.env.get('ODOO_USERNAME')!;
const ODOO_PASSWORD = Deno.env.get('ODOO_PASSWORD')!;

let rpcId = 1;

async function rpcCall<T>(params: any): Promise<T> {
  const payload: JsonRpcPayload = {
    jsonrpc: '2.0',
    method: 'call',
    params,
    id: rpcId++,
  };

  const res = await fetch(`${ODOO_BASE_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Odoo HTTP ${res.status} ${txt}`);
  }
  const json = await res.json();
  if (json.error) {
    const msg =
      json.error?.data?.message ||
      json.error?.message ||
      JSON.stringify(json.error);
    throw new Error(`Odoo RPC error: ${msg}`);
  }
  return json.result as T;
}

async function odooLogin(): Promise<number> {
  // service: common.login(db, username, password) -> uid
  const params = {
    service: 'common',
    method: 'login',
    args: [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD],
  };
  const uid = await rpcCall<number>(params);
  if (!uid) throw new Error('Login Odoo fallido: uid vacío');
  return uid;
}

async function executeKw<T>(
  uid: number,
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {}
): Promise<T> {
  // service: object.execute_kw(db, uid, password, model, method, args, kwargs)
  const params = {
    service: 'object',
    method: 'execute_kw',
    args: [ODOO_DB, uid, ODOO_PASSWORD, model, method, args, kwargs],
  };
  return await rpcCall<T>(params);
}

type Invoice = {
  id: number;
  name: string;
  move_type: 'out_invoice' | 'in_invoice' | string;
  amount_total: number;
  invoice_date: string | null;
  currency_id: [number, string] | number[]; // [id, name]
  state: string;
};

async function fetchMonthInvoicesByCompany(
  companyId: number,
  y: number,
  m: number
) {
  const uid = await odooLogin();

  // Primer día del mes (incl.) y primer día del siguiente (excl.)
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1));

  const startISO = start.toISOString().slice(0, 10);
  const endISO = end.toISOString().slice(0, 10);

  // Dominio: facturas posteadas del mes, por compañía, ventas o compras
  const domain = [
    ['company_id', '=', companyId],
    ['state', '=', 'posted'],
    ['move_type', 'in', ['out_invoice', 'in_invoice']],
    ['invoice_date', '>=', startISO],
    ['invoice_date', '<', endISO],
  ];

  // search_read
  const fields = [
    'id',
    'name',
    'move_type',
    'amount_total',
    'invoice_date',
    'currency_id',
    'state',
  ];

  const res = await executeKw<Invoice[]>(
    uid,
    'account.move',
    'search_read',
    [domain],
    { fields, limit: 1000 } // ajusta si hace falta
  );

  return res;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const tenantSlug = pathParts[pathParts.length - 1]; // Get tenant from path

    if (!tenantSlug) {
      return new Response(JSON.stringify({ error: 'Tenant slug required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting Odoo sync for tenant: ${tenantSlug}`);

    const supabase = serverClient();

    // 1) Resolver tenant
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('id, odoo_company_id')
      .eq('slug', tenantSlug)
      .single();
    
    if (tErr || !tenant) {
      console.error('Tenant not found:', tErr);
      return new Response(JSON.stringify({ error: 'Tenant not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found tenant: ${tenant.id}, company_id: ${tenant.odoo_company_id}`);

    // 2) Crear sync_run
    const { data: run, error: rErr } = await supabase
      .from('sync_runs')
      .insert({ tenant_id: tenant.id, provider: 'odoo', status: 'running' })
      .select('id')
      .single();
    
    if (rErr) {
      console.error('Error creating sync run:', rErr);
      return new Response(JSON.stringify({ error: rErr.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Created sync run: ${run.id}`);

    try {
      // 3) MOCK: aquí iría tu lectura real a Odoo filtrando por company_id
      //    const invoices = await odooFetchInvoices(tenant.odoo_company_id, since)
      //    const cash = computeCashBalance(invoices, ...)
      const cash = 125430.5; // mock €
      const freshness = 30 * 60;

      console.log(`Computed cash balance: ${cash}`);

      // 4) Upsert widget_data (ejemplo: tesorería)
      const { error: wErr } = await supabase
        .from('widget_data')
        .upsert({
          tenant_id: tenant.id,
          key: 'cash_balance',
          payload: { amount: cash, currency: 'EUR' },
          freshness_seconds: freshness,
          computed_at: new Date().toISOString()
        }, { onConflict: 'tenant_id,key' });
      
      if (wErr) {
        console.error('Error upserting widget data:', wErr);
        throw new Error(wErr.message);
      }

      console.log('Widget data updated successfully');

      // 5) Cerrar sync_run OK
      await supabase
        .from('sync_runs')
        .update({ 
          status: 'ok', 
          finished_at: new Date().toISOString(), 
          stats: { widgets_updated: 1 } 
        })
        .eq('id', run.id);

      console.log('Sync run completed successfully');

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (e: any) {
      console.error('Sync error:', e.message);
      
      await supabase
        .from('sync_runs')
        .update({ 
          status: 'error', 
          finished_at: new Date().toISOString(), 
          error_text: e.message 
        })
        .eq('id', run.id);

      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Unexpected error:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});