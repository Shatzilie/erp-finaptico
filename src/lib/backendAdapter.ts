import { supabase } from '@/integrations/supabase/client';

// ==================== TIPOS EXPORTADOS ====================
export interface FiscalData {
  period: {
    quarter: number;
    year: number;
    date_from: string;
    date_to: string;
  };
  iva_repercutido?: number;
  iva_soportado?: number;
  iva_diferencia?: number;
  retenciones_practicadas?: number;
  retenciones_soportadas?: number;
  diferencia?: number;
  resultado_ejercicio?: number;
  base_imponible?: number;
  cuota_integra?: number;
  cuota_diferencial?: number;
  status: string;
}

export interface SmartAlert {
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  module: string;
}

export interface TreasuryData {
  total: number;
  currency: string;
  accounts: Array<{
    id: number;
    name: string;
    balance: number;
    currency: string;
    iban?: string;
  }>;
  movements?: Array<{
    id: number;
    name: string;
    amount: number;
    date: string;
    partner_name?: string;
  }>;
}

export interface RevenueData {
  monthly_revenue: number;
  quarterly_revenue: number;
  annual_revenue: number;
  outstanding_invoices_count: number;
  outstanding_invoices_amount: number;
  total_invoices: number;
  period: {
    from: string;
    to: string;
  };
}

export interface ExpensesData {
  monthly_expenses: number;
  quarterly_expenses: number;
  annual_expenses: number;
  pending_invoices_count: number;
  total_pending_amount: number;
  total_invoices: number;
  period?: {
    from: string;
    to: string;
  };
}

export interface DashboardData {
  treasury: TreasuryData;
  revenue: RevenueData;
  expenses: ExpensesData;
  profitability: {
    monthlyMargin: number;
    quarterlyMargin: number;
    yearlyMargin: number;
    marginPercentage: number;
  };
  alerts: SmartAlert[];
  message?: string;
}

// ==================== FUNCIONES DE LLAMADA A EDGE FUNCTIONS ====================

const LOVABLE_SECRET = 'lovable_sync_2024_LP%#tGxa@Q';

async function callEdgeFunction<T>(
  functionName: string,
  payload: Record<string, unknown>
): Promise<T> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      headers: {
        'x-lovable-secret': LOVABLE_SECRET,
      },
    });

    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw new Error(error.message || `Failed to call ${functionName}`);
    }

    if (!data.ok) {
      throw new Error(data.error || `${functionName} returned error`);
    }

    return data;
  } catch (err) {
    console.error(`Exception in ${functionName}:`, err);
    throw err;
  }
}

// ==================== FUNCIONES PÚBLICAS ====================

export async function fetchDashboardData(tenantSlug: string): Promise<DashboardData> {
  const response = await callEdgeFunction<{
    widget_data: { dashboard: { payload: DashboardData } };
  }>('odoo-dashboard', { tenant_slug: tenantSlug });

  return response.widget_data.dashboard.payload;
}

export async function fetchTreasuryData(tenantSlug: string): Promise<TreasuryData> {
  const response = await callEdgeFunction<{
    widget_data: { treasury_balance: { payload: TreasuryData } };
  }>('odoo-sync', { tenant_slug: tenantSlug, include_movements: true });

  return response.widget_data.treasury_balance.payload;
}

export async function fetchRevenueData(
  tenantSlug: string,
  dateFrom?: string,
  dateTo?: string
): Promise<RevenueData> {
  const response = await callEdgeFunction<{
    widget_data: { revenue: { payload: RevenueData } };
  }>('odoo-revenue', {
    tenant_slug: tenantSlug,
    date_from: dateFrom,
    date_to: dateTo,
  });

  return response.widget_data.revenue.payload;
}

export async function fetchExpensesData(
  tenantSlug: string,
  dateFrom?: string,
  dateTo?: string
): Promise<ExpensesData> {
  const response = await callEdgeFunction<{
    widget_data: { expenses: { payload: ExpensesData } };
  }>('odoo-expenses', {
    tenant_slug: tenantSlug,
    date_from: dateFrom,
    date_to: dateTo,
  });

  return response.widget_data.expenses.payload;
}

export async function fetchIVAData(
  tenantSlug: string,
  quarter?: number,
  year?: number
): Promise<FiscalData> {
  const response = await callEdgeFunction<{
    widget_data: { iva: { payload: FiscalData } };
  }>('odoo-iva', {
    tenant_slug: tenantSlug,
    quarter,
    year,
  });

  return response.widget_data.iva.payload;
}

export async function fetchIRPFData(
  tenantSlug: string,
  quarter?: number,
  year?: number
): Promise<FiscalData> {
  const response = await callEdgeFunction<{
    widget_data: { irpf: { payload: FiscalData } };
  }>('odoo-irpf', {
    tenant_slug: tenantSlug,
    quarter,
    year,
  });

  return response.widget_data.irpf.payload;
}

export async function fetchSociedadesData(
  tenantSlug: string,
  year?: number
): Promise<FiscalData> {
  const response = await callEdgeFunction<{
    widget_data: { sociedades: { payload: FiscalData } };
  }>('odoo-sociedades', {
    tenant_slug: tenantSlug,
    year,
  });

  return response.widget_data.sociedades.payload;
}