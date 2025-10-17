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

type JsonRpcPayload = {
  jsonrpc: '2.0';
  method: 'call';
  params: any;
  id: number;
};

let rpcId = 1;

async function rpcCall<T>(baseUrl: string, params: any): Promise<T> {
  const payload: JsonRpcPayload = {
    jsonrpc: '2.0',
    method: 'call',
    params,
    id: rpcId++,
  };

  const res = await fetch(`${baseUrl}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Odoo RPC error: ${JSON.stringify(json.error)}`);
  }
  return json.result as T;
}

async function odooLogin(baseUrl: string, db: string, username: string, password: string): Promise<number> {
  const params = { service: 'common', method: 'login', args: [db, username, password] };
  const uid = await rpcCall<number>(baseUrl, params);
  if (!uid) throw new Error('Login Odoo fallido');
  return uid;
}

async function executeKw<T>(
  baseUrl: string, db: string, uid: number, password: string,
  model: string, method: string, args: any[] = [], kwargs: Record<string, any> = {}
): Promise<T> {
  const params = {
    service: 'object',
    method: 'execute_kw',
    args: [db, uid, password, model, method, args, kwargs],
  };
  return await rpcCall<T>(baseUrl, params);
}

Deno.serve(async (req) => {
  const requestStartTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuario no autenticado');

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const tenantSlug = pathParts[pathParts.length - 1];
    if (!tenantSlug) throw new Error('Tenant slug required');

    const serverSupabase = serverClient();
    
    const { data: configData, error: configError } = await serverSupabase
      .rpc('get_odoo_config_decrypted', { p_tenant_id: null })
      .eq('tenant_slug', tenantSlug)
      .single();

    if (configError || !configData) throw new Error('Tenant config not found');

    const { odoo_url, odoo_db, odoo_username, odoo_password, company_id } = configData;
    const uid = await odooLogin(odoo_url, odoo_db, odoo_username, odoo_password);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${endDate.getDate()}`;

    const domain = [
      ['company_id', '=', company_id],
      ['state', '=', 'posted'],
      ['move_type', '=', 'in_invoice'],
      ['invoice_date', '>=', startDate],
      ['invoice_date', '<=', endDateStr],
    ];

    const expenses = await executeKw<any[]>(
      odoo_url, odoo_db, uid, odoo_password,
      'account.move',
      'search_read',
      [domain],
      { fields: ['id', 'name', 'partner_id', 'amount_total', 'invoice_date'], limit: 500 }
    );

    const total = expenses.reduce((sum, e) => sum + (e.amount_total || 0), 0);
    const executionTime = Date.now() - requestStartTime;

    await serverSupabase.from('audit_log').insert({
      tenant_id: configData.tenant_id,
      user_id: user.id,
      action: 'fetch',
      resource_type: 'odoo-expenses',
      status_code: 200,
      execution_time_ms: executionTime,
      data_summary: { tenant_slug: tenantSlug },
      details: { count: expenses.length }
    });

    return new Response(
      JSON.stringify({ expenses, total, count: expenses.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in odoo-expenses:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
