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

// 🌐 CLIENTE API CON FALLBACK AUTOMÁTICO
export class DashboardApiClient {
  private readonly NEW_ENDPOINT = 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard';
  private readonly LEGACY_ENDPOINTS = {
    treasury: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sync',
    revenue: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-revenue',
    expenses: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-expenses'
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