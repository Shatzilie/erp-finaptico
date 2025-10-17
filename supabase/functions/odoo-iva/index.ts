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
    
    const { data: tenant, error: tenantError } = await serverSupabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) throw new Error('Tenant not found');

    // Mock IVA data - replace with real Odoo integration
    const ivaData = {
      quarter: Math.ceil((new Date().getMonth() + 1) / 3),
      year: new Date().getFullYear(),
      iva_repercutido: 8450.00,
      iva_soportado: 3200.00,
      iva_a_ingresar: 5250.00,
      base_imponible: 42250.00
    };

    const executionTime = Date.now() - requestStartTime;

    await serverSupabase.from('audit_log').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      action: 'fetch',
      resource_type: 'odoo-iva',
      status_code: 200,
      execution_time_ms: executionTime,
      data_summary: { tenant_slug: tenantSlug },
      details: { quarter: ivaData.quarter, year: ivaData.year }
    });

    return new Response(
      JSON.stringify(ivaData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in odoo-iva:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
