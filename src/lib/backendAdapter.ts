// src/lib/backendAdapter.ts
// ============================
// ADAPTADOR BACKEND PARA MIGRACIÓN SEGURA
// Permite compatibilidad total durante la transición

import React from 'react';

export interface LegacyDashboardData {
  totalCash?: number;
  monthlyRevenue?: number;
  quarterlyRevenue?: number;
  yearlyRevenue?: number;
  pendingInvoices?: number;
  monthlyExpenses?: number;
  quarterlyExpenses?: number;
  yearlyExpenses?: number;
  pendingPayments?: number;
  monthlyMargin?: number;
  quarterlyMargin?: number;
  yearlyMargin?: number;
  marginPercentage?: number;
  alerts?: Array<{
    type: string;
    message: string;
    module: string;
  }>;
}

// 🆕 INTERFACES PARA DATOS FISCALES
export interface IVAData {
  iva_repercutido: number;
  iva_soportado: number;
  iva_diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
    date_from: string;
    date_to: string;
  };
  quarterly_summary: {
    total_sales: number;
    total_purchases: number;
    net_result: number;
  };
}

export interface IRPFData {
  retenciones_practicadas: number;
  retenciones_soportadas: number;
  diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
    date_from: string;
    date_to: string;
  };
  quarterly_summary: {
    total_retenciones_practicadas: number;
    total_retenciones_soportadas: number;
    net_result: number;
  };
}

export interface SociedadesData {
  resultado_ejercicio: number;
  cuota_diferencial: number;
  status: string;
  period: {
    year: number;
    date_from: string;
    date_to: string;
  };
  annual_summary: {
    beneficio_bruto: number;
    impuesto_provision: number;
    beneficio_neto: number;
  };
}

export interface NewBackendResponse {
  ok: boolean;
  widget_data: {
    dashboard: {
      success: boolean;
      payload: {
        treasury: { 
          total: number; 
          currency: string; 
          accounts: number;
        };
        revenue: { 
          monthly: number; 
          quarterly: number; 
          yearly: number; 
          pendingCount: number;
        };
        expenses: { 
          monthly: number; 
          quarterly: number; 
          yearly: number; 
          pendingCount: number;
        };
        profitability: { 
          monthlyMargin: number; 
          quarterlyMargin: number; 
          yearlyMargin: number; 
          marginPercentage: number;
        };
        alerts: Array<{
          type: string;
          message: string;
          module: string;
        }>;
      };
    };
  };
  meta: {
    tenant_slug: string;
    execution_time: string;
    modules_loaded: string[];
  };
}

// 🔄 ADAPTADOR PRINCIPAL
export function adaptNewToLegacy(newData: NewBackendResponse): LegacyDashboardData {
  console.log('🔄 Adaptando respuesta del nuevo backend...');
  
  if (!newData.ok || !newData.widget_data?.dashboard?.payload) {
    console.warn('⚠️ Datos del backend inválidos');
    return {};
  }

  const payload = newData.widget_data.dashboard.payload;
  
  const adapted: LegacyDashboardData = {
    // Treasury
    totalCash: payload.treasury?.total || 0,
    
    // Revenue  
    monthlyRevenue: payload.revenue?.monthly || 0,
    quarterlyRevenue: payload.revenue?.quarterly || 0,
    yearlyRevenue: payload.revenue?.yearly || 0,
    pendingInvoices: payload.revenue?.pendingCount || 0,
    
    // Expenses
    monthlyExpenses: payload.expenses?.monthly || 0,
    quarterlyExpenses: payload.expenses?.quarterly || 0,
    yearlyExpenses: payload.expenses?.yearly || 0,
    pendingPayments: payload.expenses?.pendingCount || 0,
    
    // Profitability
    monthlyMargin: payload.profitability?.monthlyMargin || 0,
    quarterlyMargin: payload.profitability?.quarterlyMargin || 0,
    yearlyMargin: payload.profitability?.yearlyMargin || 0,
    marginPercentage: payload.profitability?.marginPercentage || 0,
    
    // Alerts
    alerts: payload.alerts || []
  };

  console.log('✅ Adaptación completada:', {
    totalCash: adapted.totalCash,
    monthlyRevenue: adapted.monthlyRevenue,
    alertsCount: adapted.alerts?.length || 0
  });
  
  return adapted;
}

// 🌐 CLIENTE API CON FALLBACK AUTOMÁTICO + MÉTODOS FISCALES
export class DashboardApiClient {
  private readonly NEW_ENDPOINT = 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard';
  private readonly LEGACY_ENDPOINTS = {
    treasury: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sync',
    revenue: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-revenue',
    expenses: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-expenses'
  };

  // 🆕 ENDPOINTS FISCALES
  private readonly FISCAL_ENDPOINTS = {
    iva: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-iva',
    irpf: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-irpf',
    sociedades: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sociedades'
  };

  private readonly DEFAULT_TENANT = 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd';

  async fetchDashboardData(tenantSlug?: string): Promise<LegacyDashboardData> {
    const tenant = tenantSlug || this.DEFAULT_TENANT;
    
    try {
      console.log('🎯 Intentando NUEVO backend consolidado...');
      
      const response = await fetch(this.NEW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({ tenant_slug: tenant })
      });

      if (response.ok) {
        const newData: NewBackendResponse = await response.json();
        console.log('✅ Nuevo backend exitoso');
        return adaptNewToLegacy(newData);
      } else {
        console.warn(`⚠️ Nuevo backend falló: ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.warn('🔄 Fallback a endpoints legacy...', error);
      return await this.fallbackToLegacyEndpoints(tenant);
    }
  }

  // 🆕 MÉTODO IVA
  async fetchIVAData(quarter?: number, year?: number, tenantSlug?: string): Promise<{ ok: boolean; widget_data: { iva: { payload: IVAData } } }> {
    const tenant = tenantSlug || this.DEFAULT_TENANT;
    const currentDate = new Date();
    const currentQuarter = quarter || Math.ceil((currentDate.getMonth() + 1) / 3);
    const currentYear = year || currentDate.getFullYear();

    console.log(`🧾 Cargando datos IVA Q${currentQuarter} ${currentYear}...`);

    try {
      const response = await fetch(this.FISCAL_ENDPOINTS.iva, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: tenant,
          quarter: currentQuarter,
          year: currentYear
        })
      });

      if (!response.ok) {
        throw new Error(`IVA endpoint failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Datos IVA cargados:', result);
      return result;
    } catch (error) {
      console.error('❌ Error cargando IVA:', error);
      throw error;
    }
  }

  // 🆕 MÉTODO IRPF
  async fetchIRPFData(quarter?: number, year?: number, tenantSlug?: string): Promise<{ ok: boolean; widget_data: { irpf: { payload: IRPFData } } }> {
    const tenant = tenantSlug || this.DEFAULT_TENANT;
    const currentDate = new Date();
    const currentQuarter = quarter || Math.ceil((currentDate.getMonth() + 1) / 3);
    const currentYear = year || currentDate.getFullYear();

    console.log(`📊 Cargando datos IRPF Q${currentQuarter} ${currentYear}...`);

    try {
      const response = await fetch(this.FISCAL_ENDPOINTS.irpf, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: tenant,
          quarter: currentQuarter,
          year: currentYear
        })
      });

      if (!response.ok) {
        throw new Error(`IRPF endpoint failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Datos IRPF cargados:', result);
      return result;
    } catch (error) {
      console.error('❌ Error cargando IRPF:', error);
      throw error;
    }
  }

  // 🆕 MÉTODO SOCIEDADES
  async fetchSociedadesData(year?: number, tenantSlug?: string): Promise<{ ok: boolean; widget_data: { sociedades: { payload: SociedadesData } } }> {
    const tenant = tenantSlug || this.DEFAULT_TENANT;
    const currentYear = year || new Date().getFullYear();

    console.log(`🏢 Cargando datos Sociedades ${currentYear}...`);

    try {
      const response = await fetch(this.FISCAL_ENDPOINTS.sociedades, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: tenant,
          year: currentYear
        })
      });

      if (!response.ok) {
        throw new Error(`Sociedades endpoint failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Datos Sociedades cargados:', result);
      return result;
    } catch (error) {
      console.error('❌ Error cargando Sociedades:', error);
      throw error;
    }
  }

  private async fallbackToLegacyEndpoints(tenantSlug: string): Promise<LegacyDashboardData> {
    console.log('🔄 Ejecutando fallback legacy...');
    
    try {
      // Fetch paralelo de endpoints legacy
      const promises = [
        this.fetchEndpoint(this.LEGACY_ENDPOINTS.treasury, { tenant_slug: tenantSlug }),
        this.fetchEndpoint(this.LEGACY_ENDPOINTS.revenue, { tenant_slug: tenantSlug }),
        this.fetchEndpoint(this.LEGACY_ENDPOINTS.expenses, { tenant_slug: tenantSlug })
      ];

      const [treasuryRes, revenueRes, expensesRes] = await Promise.allSettled(promises);

      // Extraer datos de cada respuesta
      const treasuryData = treasuryRes.status === 'fulfilled' ? treasuryRes.value : null;
      const revenueData = revenueRes.status === 'fulfilled' ? revenueRes.value : null;
      const expensesData = expensesRes.status === 'fulfilled' ? expensesRes.value : null;

      const legacyData: LegacyDashboardData = {
        // Treasury data
        totalCash: treasuryData?.widget_data?.treasury_balance?.payload?.total || 0,
        
        // Revenue data  
        monthlyRevenue: revenueData?.widget_data?.revenue?.payload?.monthly_revenue || 0,
        quarterlyRevenue: revenueData?.widget_data?.revenue?.payload?.quarterly_revenue || 0,
        yearlyRevenue: revenueData?.widget_data?.revenue?.payload?.annual_revenue || 0,
        pendingInvoices: revenueData?.widget_data?.revenue?.payload?.outstanding_invoices_count || 0,
        
        // Expenses data
        monthlyExpenses: expensesData?.widget_data?.expenses?.payload?.monthly_expenses || 0,
        quarterlyExpenses: expensesData?.widget_data?.expenses?.payload?.quarterly_expenses || 0,
        yearlyExpenses: expensesData?.widget_data?.expenses?.payload?.annual_expenses || 0,
        pendingPayments: expensesData?.widget_data?.expenses?.payload?.pending_invoices_count || 0,
        
        // Calculated profitability
        monthlyMargin: (revenueData?.widget_data?.revenue?.payload?.monthly_revenue || 0) - 
                      (expensesData?.widget_data?.expenses?.payload?.monthly_expenses || 0),
        quarterlyMargin: (revenueData?.widget_data?.revenue?.payload?.quarterly_revenue || 0) - 
                        (expensesData?.widget_data?.expenses?.payload?.quarterly_expenses || 0),
        yearlyMargin: (revenueData?.widget_data?.revenue?.payload?.annual_revenue || 0) - 
                     (expensesData?.widget_data?.expenses?.payload?.annual_expenses || 0),
        
        alerts: []
      };

      // Calcular marginPercentage
      const yearlyRevenue = legacyData.yearlyRevenue || 0;
      if (yearlyRevenue > 0) {
        legacyData.marginPercentage = ((legacyData.yearlyMargin || 0) / yearlyRevenue) * 100;
      }

      console.log('✅ Fallback legacy completado:', legacyData);
      return legacyData;

    } catch (fallbackError) {
      console.error('❌ Fallback legacy también falló:', fallbackError);
      // Devolver datos vacíos en lugar de fallar completamente
      return {
        totalCash: 0,
        monthlyRevenue: 0,
        quarterlyRevenue: 0,
        yearlyRevenue: 0,
        pendingInvoices: 0,
        monthlyExpenses: 0,
        quarterlyExpenses: 0,
        yearlyExpenses: 0,
        pendingPayments: 0,
        monthlyMargin: 0,
        quarterlyMargin: 0,
        yearlyMargin: 0,
        marginPercentage: 0,
        alerts: [{
          type: 'error',
          message: 'Error cargando datos. Verificar conectividad.',
          module: 'system'
        }]
      };
    }
  }

  private async fetchEndpoint(url: string, body: any): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Endpoint ${url} failed: ${response.status}`);
    }

    return await response.json();
  }
}

// 🆕 INSTANCIA GLOBAL DEL CLIENTE
export const backendAdapter = new DashboardApiClient();