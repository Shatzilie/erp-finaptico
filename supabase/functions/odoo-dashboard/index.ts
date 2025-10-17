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

Deno.serve(async (req) => {
  const requestStartTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📊 odoo-dashboard request started');
    
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

    const serverSupabase = serverClient();

    // Get tenant
    const { data: tenant, error: tenantError } = await serverSupabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    // Get cached widget data
    const { data: widgetData } = await serverSupabase
      .from('widget_data')
      .select('key, payload, computed_at, freshness_seconds')
      .eq('tenant_id', tenant.id)
      .in('key', ['revenue_month', 'expenses_month', 'invoices_month_count']);

    const result: any = {
      cache_status: 'cached',
      cached_at: new Date().toISOString(),
      age_minutes: 0
    };

    widgetData?.forEach(w => {
      if (w.key === 'revenue_month') result.revenue = w.payload.amount || 0;
      if (w.key === 'expenses_month') result.expenses = w.payload.amount || 0;
      if (w.key === 'invoices_month_count') result.invoice_count = w.payload.count || 0;
    });

    result.profit = (result.revenue || 0) - (result.expenses || 0);

    const executionTime = Date.now() - requestStartTime;

    await serverSupabase.from('audit_log').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      action: 'fetch',
      resource_type: 'odoo-dashboard',
      status_code: 200,
      execution_time_ms: executionTime,
      data_summary: { tenant_slug: tenantSlug },
      details: { source: 'widget_data' }
    });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in odoo-dashboard:', error.message);
    
    const executionTime = Date.now() - requestStartTime;
    
    try {
      const serverSupabase = serverClient();
      await serverSupabase.from('audit_log').insert({
        user_id: null,
        action: 'fetch',
        resource_type: 'odoo-dashboard',
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
