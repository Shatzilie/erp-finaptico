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

    // Get payroll data from database
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data: payslips, error: payslipsError } = await serverSupabase
      .from('payroll_payslips')
      .select(`
        *,
        employee:payroll_employees(employee_name, employee_nif)
      `)
      .eq('tenant_id', tenant.id)
      .eq('period_year', year)
      .eq('period_month', month)
      .order('created_at', { ascending: false });

    if (payslipsError) throw new Error('Error fetching payroll data');

    const totalCost = payslips?.reduce((sum, p) => sum + (p.total_cost || 0), 0) || 0;
    const totalIRPF = payslips?.reduce((sum, p) => sum + (p.irpf_amount || 0), 0) || 0;
    const totalSS = payslips?.reduce((sum, p) => sum + (p.ss_employer || 0), 0) || 0;

    const executionTime = Date.now() - requestStartTime;

    await serverSupabase.from('audit_log').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      action: 'fetch',
      resource_type: 'odoo-payroll',
      status_code: 200,
      execution_time_ms: executionTime,
      data_summary: { tenant_slug: tenantSlug },
      details: { count: payslips?.length || 0, period: `${year}-${month}` }
    });

    return new Response(
      JSON.stringify({
        payslips: payslips || [],
        summary: {
          total_cost: totalCost,
          total_irpf: totalIRPF,
          total_ss: totalSS,
          count: payslips?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in odoo-payroll:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
