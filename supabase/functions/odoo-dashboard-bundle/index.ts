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
    const txt = await res.text();
    throw new Error(`Odoo HTTP ${res.status} ${txt}`);
  }
  const json = await res.json();
  if (json.error) {
    const msg = json.error?.data?.message || json.error?.message || JSON.stringify(json.error);
    throw new Error(`Odoo RPC error: ${msg}`);
  }
  return json.result as T;
}

async function odooLogin(baseUrl: string, db: string, username: string, password: string): Promise<number> {
  const params = {
    service: 'common',
    method: 'login',
    args: [db, username, password],
  };
  const uid = await rpcCall<number>(baseUrl, params);
  if (!uid) throw new Error('Login Odoo fallido: uid vacío');
  return uid;
}

async function executeKw<T>(
  baseUrl: string,
  db: string,
  uid: number,
  password: string,
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {}
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
    console.log('📊 odoo-dashboard-bundle request started');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const tenantSlug = pathParts[pathParts.length - 1];

    if (!tenantSlug) {
      throw new Error('Tenant slug required');
    }

    console.log(`🏢 Fetching dashboard bundle for tenant: ${tenantSlug}`);

    const serverSupabase = serverClient();

    // Get tenant and odoo config
    const { data: configData, error: configError } = await serverSupabase
      .rpc('get_odoo_config_decrypted', { p_tenant_id: null })
      .eq('tenant_slug', tenantSlug)
      .single();

    if (configError || !configData) {
      console.error('Tenant config not found:', configError);
      throw new Error('Tenant configuration not found');
    }

    const { odoo_url, odoo_db, odoo_username, odoo_password, company_id, bank_journal_ids } = configData;

    console.log(`🔐 Logging into Odoo for company ${company_id}`);
    const uid = await odooLogin(odoo_url, odoo_db, odoo_username, odoo_password);

    // Get current month data
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    console.log(`📅 Fetching data for period: ${startDate} to ${endDateStr}`);

    // Fetch invoices
    const invoiceDomain = [
      ['company_id', '=', company_id],
      ['state', '=', 'posted'],
      ['move_type', 'in', ['out_invoice', 'in_invoice']],
      ['invoice_date', '>=', startDate],
      ['invoice_date', '<=', endDateStr],
    ];

    const invoices = await executeKw<any[]>(
      odoo_url, odoo_db, uid, odoo_password,
      'account.move',
      'search_read',
      [invoiceDomain],
      { fields: ['id', 'name', 'move_type', 'amount_total', 'invoice_date', 'state'], limit: 1000 }
    );

    console.log(`📄 Retrieved ${invoices.length} invoices`);

    // Calculate KPIs
    const revenue = invoices
      .filter(i => i.move_type === 'out_invoice')
      .reduce((sum, i) => sum + (i.amount_total || 0), 0);

    const expenses = invoices
      .filter(i => i.move_type === 'in_invoice')
      .reduce((sum, i) => sum + (i.amount_total || 0), 0);

    const profit = revenue - expenses;

    // Fetch bank balances
    const bankDomain = [
      ['company_id', '=', company_id],
      ['id', 'in', bank_journal_ids],
    ];

    const banks = await executeKw<any[]>(
      odoo_url, odoo_db, uid, odoo_password,
      'account.journal',
      'search_read',
      [bankDomain],
      { fields: ['id', 'name', 'currency_id', 'current_balance'] }
    );

    const totalBalance = banks.reduce((sum, b) => sum + (b.current_balance || 0), 0);

    console.log(`💰 Total bank balance: ${totalBalance}`);

    const executionTime = Date.now() - requestStartTime;

    // Log to audit_log
    await serverSupabase.from('audit_log').insert({
      tenant_id: configData.tenant_id,
      user_id: user.id,
      action: 'fetch',
      resource_type: 'odoo-dashboard-bundle',
      status_code: 200,
      execution_time_ms: executionTime,
      data_summary: { tenant_slug: tenantSlug, period: `${startDate} to ${endDateStr}` },
      details: { 
        invoice_count: invoices.length,
        bank_count: banks.length 
      }
    });

    console.log(`✅ Dashboard bundle completed in ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        revenue,
        expenses,
        profit,
        balance: totalBalance,
        invoice_count: invoices.length,
        cache_status: 'fresh',
        cached_at: new Date().toISOString(),
        age_minutes: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in odoo-dashboard-bundle:', error.message);
    
    const executionTime = Date.now() - requestStartTime;
    
    // Try to log error
    try {
      const serverSupabase = serverClient();
      await serverSupabase.from('audit_log').insert({
        user_id: null,
        action: 'fetch',
        resource_type: 'odoo-dashboard-bundle',
        status_code: 500,
        execution_time_ms: executionTime,
        details: { error: error.message }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
