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