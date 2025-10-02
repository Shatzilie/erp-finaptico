// src/lib/backendAdapter.ts
// ============================
// ADAPTADOR BACKEND PARA MIGRACIÓN SEGURA
// Permite compatibilidad total durante la transición

import { supabase } from './supabase';

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL?.replace(
  'supabase.co',
  'supabase.co/functions/v1'
);

const LOVABLE_SECRET = 'lovable_sync_2024_LP%#tGxa@Q';

interface DashboardData {
  totalCash: number;
  monthlyRevenue: number;
  monthlyExpenses?: number;
  yearlyRevenue?: number;
  alertsCount: number;
  revenue_history?: MonthlyData[];
  expenses_history?: MonthlyData[];
  fiscalData?: {
    iva?: any;
    irpf?: any;
    sociedades?: any;
  };
}

interface MonthlyData {
  month: string;
  total: number;
  currency: string;
}

// ===== NUEVO BACKEND CONSOLIDADO =====
async function fetchConsolidatedBackend(tenantSlug: string): Promise<DashboardData> {
  console.log('🎯 Intentando NUEVO backend consolidado...');

  try {
    // Obtener session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No session token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'x-lovable-secret': LOVABLE_SECRET
    };

    // LLAMADA 1: Dashboard básico (tesorería, ingresos, gastos, alertas)
    const dashboardResponse = await fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-dashboard`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenant_slug: tenantSlug })
    });

    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard endpoint failed: ${dashboardResponse.status}`);
    }

    const dashboardData = await dashboardResponse.json();

    // LLAMADA 2: Revenue con historial mensual
    console.log('📊 Cargando historial de ingresos...');
    const revenueResponse = await fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-revenue`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenant_slug: tenantSlug })
    });

    let revenueHistory: MonthlyData[] = [];
    if (revenueResponse.ok) {
      const revenueData = await revenueResponse.json();
      if (revenueData.ok && revenueData.widget_data?.revenue?.payload?.monthly_history) {
        revenueHistory = revenueData.widget_data.revenue.payload.monthly_history;
        console.log('✅ Historial de ingresos cargado:', revenueHistory.length, 'meses');
      }
    } else {
      console.warn('⚠️ No se pudo cargar historial de ingresos:', revenueResponse.status);
    }

    // LLAMADA 3: Expenses con historial mensual
    console.log('📊 Cargando historial de gastos...');
    const expensesResponse = await fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenant_slug: tenantSlug })
    });

    let expensesHistory: MonthlyData[] = [];
    if (expensesResponse.ok) {
      const expensesData = await expensesResponse.json();
      if (expensesData.ok && expensesData.widget_data?.expenses?.payload?.monthly_history) {
        expensesHistory = expensesData.widget_data.expenses.payload.monthly_history;
        console.log('✅ Historial de gastos cargado:', expensesHistory.length, 'meses');
      }
    } else {
      console.warn('⚠️ No se pudo cargar historial de gastos:', expensesResponse.status);
    }

    // LLAMADAS 4-6: Datos fiscales (IVA, IRPF, Sociedades) en paralelo
    console.log('🧾 Cargando datos IVA Q4 2025...');
    console.log('📊 Cargando datos IRPF Q4 2025...');
    console.log('🏢 Cargando datos Sociedades 2025...');

    const [ivaResponse, irpfResponse, sociedadesResponse] = await Promise.all([
      fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-iva`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          tenant_slug: tenantSlug,
          quarter: 4,
          year: 2025
        })
      }),
      fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-irpf`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          tenant_slug: tenantSlug,
          quarter: 4,
          year: 2025
        })
      }),
      fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-sociedades`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          tenant_slug: tenantSlug,
          year: 2025
        })
      })
    ]);

    // Procesar datos fiscales
    const fiscalData: any = {};

    if (ivaResponse.ok) {
      const ivaData = await ivaResponse.json();
      if (ivaData.ok) {
        fiscalData.iva = ivaData.widget_data.iva.payload;
        console.log('✅ Datos IVA cargados:', ivaData);
      }
    } else {
      console.error('❌ Error cargando IVA:', await ivaResponse.text());
    }

    if (irpfResponse.ok) {
      const irpfData = await irpfResponse.json();
      if (irpfData.ok) {
        fiscalData.irpf = irpfData.widget_data.irpf.payload;
        console.log('✅ Datos IRPF cargados:', irpfData);
      }
    } else {
      console.error('❌ Error cargando IRPF:', await irpfResponse.text());
    }

    if (sociedadesResponse.ok) {
      const sociedadesData = await sociedadesResponse.json();
      if (sociedadesData.ok) {
        fiscalData.sociedades = sociedadesData.widget_data.sociedades.payload;
        console.log('✅ Datos Sociedades cargados:', sociedadesData);
      }
    } else {
      console.error('❌ Error cargando Sociedades:', await sociedadesResponse.text());
    }

    // Verificar estructura de respuesta
    if (!dashboardData.ok || !dashboardData.widget_data?.dashboard?.success) {
      throw new Error('Invalid dashboard data structure');
    }

    const payload = dashboardData.widget_data.dashboard.payload;

    console.log('✅ Nuevo backend exitoso');

    // Adaptar respuesta al formato esperado por el frontend
    return {
      totalCash: payload.treasury?.total || 0,
      monthlyRevenue: payload.revenue?.monthly || 0,
      monthlyExpenses: payload.expenses?.monthly || 0,
      yearlyRevenue: payload.revenue?.yearly || 0,
      alertsCount: payload.alerts?.length || 0,
      revenue_history: revenueHistory,
      expenses_history: expensesHistory,
      fiscalData
    };

  } catch (error) {
    console.error('❌ Error en nuevo backend:', error);
    throw error;
  }
}

// ===== FUNCIÓN PRINCIPAL getDashboardData =====
export async function getDashboardData(tenantSlug: string): Promise<DashboardData> {
  try {
    const data = await fetchConsolidatedBackend(tenantSlug);
    
    console.log('🔄 Adaptando respuesta del nuevo backend...');
    console.log('✅ Adaptación completada:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

// ===== FUNCIONES AUXILIARES PARA WIDGETS FISCALES =====
export async function getIVAData(tenantSlug: string, quarter?: number, year?: number) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No session token available');
  }

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-iva`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'x-lovable-secret': LOVABLE_SECRET
    },
    body: JSON.stringify({ 
      tenant_slug: tenantSlug,
      quarter: quarter || 4,
      year: year || 2025
    })
  });

  if (!response.ok) {
    throw new Error(`IVA endpoint failed: ${response.status}`);
  }

  const data = await response.json();
  return data.widget_data.iva.payload;
}

export async function getIRPFData(tenantSlug: string, quarter?: number, year?: number) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No session token available');
  }

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-irpf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'x-lovable-secret': LOVABLE_SECRET
    },
    body: JSON.stringify({ 
      tenant_slug: tenantSlug,
      quarter: quarter || 4,
      year: year || 2025
    })
  });

  if (!response.ok) {
    throw new Error(`IRPF endpoint failed: ${response.status}`);
  }

  const data = await response.json();
  return data.widget_data.irpf.payload;
}

export async function getSociedadesData(tenantSlug: string, year?: number) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No session token available');
  }

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/odoo-sociedades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'x-lovable-secret': LOVABLE_SECRET
    },
    body: JSON.stringify({ 
      tenant_slug: tenantSlug,
      year: year || 2025
    })
  });

  if (!response.ok) {
    throw new Error(`Sociedades endpoint failed: ${response.status}`);
  }

  const data = await response.json();
  return data.widget_data.sociedades.payload;
}