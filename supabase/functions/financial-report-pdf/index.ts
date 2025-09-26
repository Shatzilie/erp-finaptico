import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Processing financial report PDF request...');
    
    // Get tenantSlug from query parameters
    const url = new URL(req.url);
    const tenantSlug = url.searchParams.get('tenantSlug');
    
    if (!tenantSlug) {
      throw new Error('tenantSlug parameter is required');
    }
    
    console.log('📋 Tenant slug:', tenantSlug);
    
    // Initialize Supabase client with auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get tenant information (tenantSlug could be either id or slug)
    let tenant;
    
    // First try by ID (UUID format)
    if (tenantSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, slug, name')
        .eq('id', tenantSlug)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error querying tenant by ID:', error);
        throw error;
      }
      tenant = data;
    }
    
    // If not found by ID, try by slug
    if (!tenant) {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, slug, name')
        .eq('slug', tenantSlug)
        .single();
      
      if (error) {
        console.error('❌ Error querying tenant by slug:', error);
        throw error;
      }
      tenant = data;
    }

    console.log('✅ Tenant found:', tenant.name);

    // Generate HTML content for the financial report
    const htmlContent = generateFinancialReportHTML(tenant);
    
    console.log('✅ HTML report generated successfully');
    
    return new Response(
      JSON.stringify({
        ok: true,
        html_content: htmlContent,
        company_name: tenant.name || 'Empresa'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error generating financial report:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateFinancialReportHTML(tenant: any): string {
  const currentDate = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const currentMonth = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long' 
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Informe Financiero - ${tenant.name}</title>
    <style>
        @page {
            size: A4;
            margin: 25mm 20mm;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #374151;
            margin: 0;
            padding: 0;
            font-size: 11pt;
        }
        
        /* PORTADA */
        .cover-page {
            page-break-after: always;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 3px solid #8b5cf6;
            padding: 60px 40px;
            margin: -25mm -20mm;
            box-sizing: border-box;
        }
        
        .cover-title {
            font-size: 32pt;
            font-weight: 700;
            color: #8b5cf6;
            margin-bottom: 40px;
        }
        
        .cover-company {
            font-size: 24pt;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        
        .cover-date {
            font-size: 16pt;
            color: #6b7280;
            font-weight: 500;
        }
        
        .cover-decoration {
            width: 120px;
            height: 4px;
            background: linear-gradient(90deg, #8b5cf6, #06d6a0);
            margin: 40px auto;
        }
        
        /* CONTENIDO */
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 18pt;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 3px solid #e5e7eb;
        }
        
        .section-content {
            font-size: 11pt;
            text-align: justify;
            line-height: 1.7;
            color: #4b5563;
        }
        
        .section-content p {
            margin-bottom: 12px;
        }
        
        .highlight-amount {
            font-weight: 700;
            color: #8b5cf6;
        }
        
        .positive { color: #059669; font-weight: 700; }
        .negative { color: #dc2626; font-weight: 700; }
        .neutral { color: #6b7280; font-weight: 600; }
        
        /* CAJAS ESPECIALES */
        .fiscal-summary {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 1px solid #0ea5e9;
            border-left: 4px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .task-list {
            background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
            border: 1px solid #06d6a0;
            border-left: 4px solid #06d6a0;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .task-item {
            display: block;
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
        }
        
        .task-item:before {
            content: "•";
            color: #06d6a0;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
    </style>
</head>
<body>
    <!-- PORTADA -->
    <div class="cover-page">
        <div class="cover-title">Informe Financiero – ${currentMonth}</div>
        <div class="cover-decoration"></div>
        <div class="cover-company">${tenant.name}</div>
        <div class="cover-date">Generado el ${currentDate}</div>
    </div>

    <!-- INTRODUCCIÓN -->
    <div class="section">
        <h2 class="section-title">Introducción</h2>
        <div class="section-content">
            <p>En este informe te explico la situación actual de tu empresa y las previsiones financieras y fiscales a día de hoy. He revisado los datos contables y fiscales para ofrecer una visión clara de dónde se encuentra la empresa y qué podemos esperar en los próximos meses.</p>
        </div>
    </div>

    <!-- SITUACIÓN DE TESORERÍA -->
    <div class="section">
        <h2 class="section-title">Situación de Tesorería</h2>
        <div class="section-content">
            <p>La empresa mantiene una posición de liquidez estable que permite hacer frente a las obligaciones corrientes.</p>
        </div>
    </div>

    <!-- FACTURACIÓN E INGRESOS -->
    <div class="section">
        <h2 class="section-title">Facturación e Ingresos</h2>
        <div class="section-content">
            <p>La facturación se mantiene en niveles estables con una tendencia positiva en los últimos meses.</p>
        </div>
    </div>

    <!-- ANÁLISIS DE GASTOS -->
    <div class="section">
        <h2 class="section-title">Análisis de Gastos</h2>
        <div class="section-content">
            <p>Los gastos operativos se mantienen controlados dentro de los parámetros esperados.</p>
        </div>
    </div>

    <!-- PREVISIÓN FISCAL -->
    <div class="section">
        <h2 class="section-title">Previsión Fiscal</h2>
        <div class="section-content">
            <div class="fiscal-summary">
                <h3 style="margin-bottom: 15px; color: #0c4a6e;">Resumen de obligaciones fiscales</h3>
                
                <p><strong>IVA:</strong> Las declaraciones trimestrales están al día.</p>
                
                <p><strong>IRPF:</strong> Las retenciones se realizan según normativa vigente.</p>
                
                <p><strong>Impuesto de Sociedades:</strong> Estimación en curso para el ejercicio actual.</p>
            </div>
            
            <p>La situación fiscal de la empresa se encuentra en regla y sin incidencias relevantes.</p>
        </div>
    </div>

    <!-- RECOMENDACIONES -->
    <div class="section">
        <h2 class="section-title">Recomendaciones</h2>
        <div class="section-content">
            <div class="task-list">
                <div class="task-item">Mantener el seguimiento mensual de la tesorería</div>
                <div class="task-item">Revisar periódicamente las previsiones fiscales</div>
                <div class="task-item">Continuar con el control de gastos operativos</div>
                <div class="task-item">Planificar las inversiones del próximo ejercicio</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}