// src/lib/backendAdapter.ts - VERSIÓN EXTENDIDA
// =================================================
// ADAPTADOR CON DATOS OPERATIVOS + FISCALES

import React from 'react';

// 📋 INTERFACES EXTENDIDAS
export interface FiscalData {
  iva: {
    quarter: number;
    year: number;
    iva_repercutido: number;
    iva_soportado: number;
    iva_diferencia: number;
    status: 'A INGRESAR' | 'A COMPENSAR' | 'NEUTRO';
    base_imponible_ventas: number;
    base_imponible_compras: number;
  };
  irpf: {
    quarter: number; 
    year: number;
    retenciones_practicadas: number;
    retenciones_soportadas: number;
    diferencia: number;
    status: 'A INGRESAR' | 'A COMPENSAR' | 'NEUTRO';
  };
  sociedades: {
    year: number;
    resultado_ejercicio: number;
    base_imponible: number;
    cuota_diferencial: number;
    status: 'A PAGAR' | 'A DEVOLVER' | 'NEUTRO';
    empresa_tipo: 'PYME' | 'GRANDE';
    tipo_impositivo: number;
  };
}

export interface SmartAlert {
  type: 'fiscal' | 'operational' | 'deadline';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionable?: boolean;
  action?: string;
}

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

export interface ExtendedDashboardData extends LegacyDashboardData {
  fiscal?: FiscalData;
  smartAlerts?: SmartAlert[];
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

// 🔥 CLIENTE API EXTENDIDO
export class ExtendedDashboardApiClient {
  private readonly NEW_ENDPOINT = 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard';
  private readonly FISCAL_ENDPOINTS = {
    iva: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-iva',
    irpf: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-irpf',
    sociedades: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sociedades'
  };
  private readonly LEGACY_ENDPOINTS = {
    treasury: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sync',
    revenue: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-revenue',
    expenses: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-expenses'
  };

  // 🗺️ MAPEO DE SLUGS A UUIDs
  private mapTenantSlugToId(slug?: string): string {
    const tenantMapping = {
      'young-minds': 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd',
      'blacktar': 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd', // Temporal
    };

    if (!slug) return 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd';
    if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return slug;
    return tenantMapping[slug] || 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd';
  }

  // 🎯 FUNCIÓN PRINCIPAL - DATOS COMPLETOS
  async fetchExtendedDashboardData(tenantSlug?: string): Promise<ExtendedDashboardData> {
    const tenant = this.mapTenantSlugToId(tenantSlug);
    
    try {
      console.log('🎯 Obteniendo datos completos del dashboard (operativo + fiscal)...');
      
      // PASO 1: Intentar obtener datos operativos del nuevo backend
      let operationalData: LegacyDashboardData;
      
      try {
        const operationalResponse = await this.fetchOperationalData(tenant);
        operationalData = operationalResponse;
        console.log('✅ Datos operativos obtenidos del nuevo backend');
      } catch (error) {
        console.warn('🔄 Fallback para datos operativos...');
        operationalData = await this.fallbackToLegacyOperationalData(tenant);
      }

      // PASO 2: Obtener datos fiscales en paralelo
      console.log('📊 Obteniendo datos fiscales...');
      const fiscalDataPromises = [
        this.fetchFiscalEndpoint(this.FISCAL_ENDPOINTS.iva, { tenant_slug: tenant }),
        this.fetchFiscalEndpoint(this.FISCAL_ENDPOINTS.irpf, { tenant_slug: tenant }),
        this.fetchFiscalEndpoint(this.FISCAL_ENDPOINTS.sociedades, { tenant_slug: tenant, year: new Date().getFullYear() })
      ];

      const [ivaRes, irpfRes, sociedadesRes] = await Promise.allSettled(fiscalDataPromises);

      // PASO 3: Procesar datos fiscales
      const fiscalData: FiscalData = {
        iva: this.extractIvaData(ivaRes),
        irpf: this.extractIrpfData(irpfRes),
        sociedades: this.extractSociedadesData(sociedadesRes)
      };

      // PASO 4: Generar alertas inteligentes
      const extendedData: ExtendedDashboardData = {
        ...operationalData,
        fiscal: fiscalData,
        smartAlerts: []
      };

      extendedData.smartAlerts = this.generateSmartAlerts(extendedData);

      console.log('✅ Dashboard completo obtenido:', {
        operational: !!operationalData.totalCash,
        iva: !!fiscalData.iva.iva_diferencia,
        irpf: !!fiscalData.irpf.diferencia,
        sociedades: !!fiscalData.sociedades.resultado_ejercicio,
        alerts: extendedData.smartAlerts?.length || 0
      });

      return extendedData;

    } catch (error) {
      console.error('❌ Error obteniendo dashboard extendido:', error);
      throw error;
    }
  }

  // 🏢 OBTENER DATOS OPERATIVOS
  private async fetchOperationalData(tenant: string): Promise<LegacyDashboardData> {
    const response = await fetch(this.NEW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
      },
      body: JSON.stringify({ tenant_slug: tenant })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const newData = await response.json();
    return adaptNewToLegacy(newData);
  }

  // 🔄 FALLBACK OPERATIVO
  private async fallbackToLegacyOperationalData(tenant: string): Promise<LegacyDashboardData> {
    const promises = [
      this.fetchEndpoint(this.LEGACY_ENDPOINTS.treasury, { tenant_slug: tenant }),
      this.fetchEndpoint(this.LEGACY_ENDPOINTS.revenue, { tenant_slug: tenant }),
      this.fetchEndpoint(this.LEGACY_ENDPOINTS.expenses, { tenant_slug: tenant })
    ];

    const [treasuryRes, revenueRes, expensesRes] = await Promise.allSettled(promises);
    const treasuryData = treasuryRes.status === 'fulfilled' ? treasuryRes.value : null;
    const revenueData = revenueRes.status === 'fulfilled' ? revenueRes.value : null;
    const expensesData = expensesRes.status === 'fulfilled' ? expensesRes.value : null;

    return {
      totalCash: treasuryData?.widget_data?.treasury_balance?.payload?.total || 0,
      monthlyRevenue: revenueData?.widget_data?.revenue?.payload?.monthly_revenue || 0,
      quarterlyRevenue: revenueData?.widget_data?.revenue?.payload?.quarterly_revenue || 0,
      yearlyRevenue: revenueData?.widget_data?.revenue?.payload?.annual_revenue || 0,
      pendingInvoices: revenueData?.widget_data?.revenue?.payload?.outstanding_invoices_count || 0,
      monthlyExpenses: expensesData?.widget_data?.expenses?.payload?.monthly_expenses || 0,
      quarterlyExpenses: expensesData?.widget_data?.expenses?.payload?.quarterly_expenses || 0,
      yearlyExpenses: expensesData?.widget_data?.expenses?.payload?.annual_expenses || 0,
      pendingPayments: expensesData?.widget_data?.expenses?.payload?.pending_invoices_count || 0,
      monthlyMargin: (revenueData?.widget_data?.revenue?.payload?.monthly_revenue || 0) - (expensesData?.widget_data?.expenses?.payload?.monthly_expenses || 0),
      quarterlyMargin: (revenueData?.widget_data?.revenue?.payload?.quarterly_revenue || 0) - (expensesData?.widget_data?.expenses?.payload?.quarterly_expenses || 0),
      yearlyMargin: (revenueData?.widget_data?.revenue?.payload?.annual_revenue || 0) - (expensesData?.widget_data?.expenses?.payload?.annual_expenses || 0),
      marginPercentage: 0, // Se calculará después
      alerts: []
    };
  }

  // 📊 EXTRAER DATOS FISCALES
  private extractIvaData(result: PromiseSettledResult<any>) {
    if (result.status === 'fulfilled' && result.value?.ok) {
      const payload = result.value.widget_data?.iva?.payload;
      return {
        quarter: payload?.period?.quarter || Math.ceil(new Date().getMonth() / 3),
        year: payload?.period?.year || new Date().getFullYear(),
        iva_repercutido: payload?.iva_repercutido || 0,
        iva_soportado: payload?.iva_soportado || 0,
        iva_diferencia: payload?.iva_diferencia || 0,
        status: payload?.status || 'NEUTRO',
        base_imponible_ventas: payload?.base_imponible_ventas || 0,
        base_imponible_compras: payload?.base_imponible_compras || 0,
      };
    }
    return {
      quarter: Math.ceil((new Date().getMonth() + 1) / 3),
      year: new Date().getFullYear(),
      iva_repercutido: 0,
      iva_soportado: 0,
      iva_diferencia: 0,
      status: 'NEUTRO' as const,
      base_imponible_ventas: 0,
      base_imponible_compras: 0,
    };
  }

  private extractIrpfData(result: PromiseSettledResult<any>) {
    if (result.status === 'fulfilled' && result.value?.ok) {
      const payload = result.value.widget_data?.irpf?.payload;
      return {
        quarter: payload?.period?.quarter || Math.ceil(new Date().getMonth() / 3),
        year: payload?.period?.year || new Date().getFullYear(),
        retenciones_practicadas: payload?.retenciones_practicadas || 0,
        retenciones_soportadas: payload?.retenciones_soportadas || 0,
        diferencia: payload?.diferencia || 0,
        status: payload?.status || 'NEUTRO',
      };
    }
    return {
      quarter: Math.ceil((new Date().getMonth() + 1) / 3),
      year: new Date().getFullYear(),
      retenciones_practicadas: 0,
      retenciones_soportadas: 0,
      diferencia: 0,
      status: 'NEUTRO' as const,
    };
  }

  private extractSociedadesData(result: PromiseSettledResult<any>) {
    if (result.status === 'fulfilled' && result.value?.ok) {
      const payload = result.value.widget_data?.sociedades?.payload;
      return {
        year: payload?.period?.year || new Date().getFullYear(),
        resultado_ejercicio: payload?.resultado_ejercicio || 0,
        base_imponible: payload?.base_imponible || 0,
        cuota_diferencial: payload?.cuota_diferencial || 0,
        status: payload?.status || 'NEUTRO',
        empresa_tipo: payload?.empresa_tipo || 'PYME',
        tipo_impositivo: payload?.tipo_impositivo || 15,
      };
    }
    return {
      year: new Date().getFullYear(),
      resultado_ejercicio: 0,
      base_imponible: 0,
      cuota_diferencial: 0,
      status: 'NEUTRO' as const,
      empresa_tipo: 'PYME' as const,
      tipo_impositivo: 15,
    };
  }

  // 🤖 GENERAR ALERTAS INTELIGENTES
  private generateSmartAlerts(data: ExtendedDashboardData): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    
    // ALERTAS IVA
    if (data.fiscal?.iva?.iva_diferencia && data.fiscal.iva.iva_diferencia > 2000) {
      alerts.push({
        type: 'fiscal',
        severity: 'warning', 
        title: 'IVA Alto a Ingresar',
        message: `IVA trimestral: ${data.fiscal.iva.iva_diferencia.toFixed(0)}€. Considera adelantar gastos deducibles.`,
        actionable: true,
        action: 'Ver gastos deducibles'
      });
    }
    
    // ALERTAS IRPF
    if (data.fiscal?.irpf?.diferencia && data.fiscal.irpf.diferencia < -1000) {
      alerts.push({
        type: 'fiscal',
        severity: 'info',
        title: 'IRPF Favorable',
        message: `Tienes ${Math.abs(data.fiscal.irpf.diferencia).toFixed(0)}€ a compensar en IRPF.`,
        actionable: false
      });
    }
    
    // ALERTAS SOCIEDADES
    if (data.fiscal?.sociedades?.resultado_ejercicio && data.fiscal.sociedades.resultado_ejercicio > 200000 && data.fiscal.sociedades.empresa_tipo === 'PYME') {
      alerts.push({
        type: 'fiscal', 
        severity: 'warning',
        title: 'Cerca del límite PYME',
        message: 'Te acercas al límite de 300k€ para tributar al 15%. Planifica gastos.',
        actionable: true,
        action: 'Planificar inversiones'
      });
    }
    
    // ALERTAS OPERACIONALES
    if (data.monthlyExpenses && data.monthlyExpenses < 200) {
      alerts.push({
        type: 'operational',
        severity: 'warning',
        title: 'Gastos Bajos',
        message: 'Pocos gastos este mes. ¿Faltan facturas por registrar?',
        actionable: true,
        action: 'Revisar gastos pendientes'
      });
    }
    
    if (data.pendingPayments && data.pendingPayments > 10) {
      alerts.push({
        type: 'operational',
        severity: 'info',
        title: 'Facturas Pendientes',
        message: `${data.pendingPayments} facturas pendientes de pago.`,
        actionable: true,
        action: 'Gestionar pagos'
      });
    }
    
    return alerts;
  }

  // 🔧 MÉTODOS AUXILIARES
  private async fetchFiscalEndpoint(url: string, body: any): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Fiscal endpoint ${url} failed: ${response.status}`);
    return await response.json();
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

    if (!response.ok) throw new Error(`Endpoint ${url} failed: ${response.status}`);
    return await response.json();
  }
}

// 🌐 CLIENTE API CON FALLBACK AUTOMÁTICO
export class DashboardApiClient {
  private readonly NEW_ENDPOINT = 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard';
  private readonly LEGACY_ENDPOINTS = {
    treasury: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sync',
    revenue: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-revenue',
    expenses: 'https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-expenses'
  };

  // 🗺️ MAPEO DE SLUGS A UUIDs
  private mapTenantSlugToId(slug?: string): string {
    const tenantMapping = {
      'young-minds': 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd',
      'blacktar': 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd', // Temporal, cambiar cuando tengamos el UUID real
    };

    if (!slug) {
      return 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd';
    }

    // Si ya es un UUID, devolverlo tal cual
    if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return slug;
    }

    // Si es un slug, mapearlo al UUID
    return tenantMapping[slug] || 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd';
  }

  async fetchDashboardData(tenantSlug?: string): Promise<LegacyDashboardData> {
    const tenant = this.mapTenantSlugToId(tenantSlug);
    
    try {
      console.log('🎯 Intentando NUEVO backend consolidado con UUID:', tenant);
      
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

// 🔄 ADAPTADOR PRINCIPAL
export function adaptNewToLegacy(newData: NewBackendResponse): LegacyDashboardData {
  console.log('🔄 Adaptando respuesta del nuevo backend...');
  
  if (!newData.ok || !newData.widget_data?.dashboard?.payload) {
    console.warn('⚠️ Datos del backend inválidos');
    return {};
  }

  const payload = newData.widget_data.dashboard.payload;
  
  const adapted: LegacyDashboardData = {
    totalCash: payload.treasury?.total || 0,
    monthlyRevenue: payload.revenue?.monthly || 0,
    quarterlyRevenue: payload.revenue?.quarterly || 0,
    yearlyRevenue: payload.revenue?.yearly || 0,
    pendingInvoices: payload.revenue?.pendingCount || 0,
    monthlyExpenses: payload.expenses?.monthly || 0,
    quarterlyExpenses: payload.expenses?.quarterly || 0,
    yearlyExpenses: payload.expenses?.yearly || 0,
    pendingPayments: payload.expenses?.pendingCount || 0,
    monthlyMargin: payload.profitability?.monthlyMargin || 0,
    quarterlyMargin: payload.profitability?.quarterlyMargin || 0,
    yearlyMargin: payload.profitability?.yearlyMargin || 0,
    marginPercentage: payload.profitability?.marginPercentage || 0,
    alerts: payload.alerts || []
  };

  console.log('✅ Adaptación completada:', {
    totalCash: adapted.totalCash,
    monthlyRevenue: adapted.monthlyRevenue,
    alertsCount: adapted.alerts?.length || 0
  });
  
  return adapted;
}

// 🔄 MANTENER COMPATIBILIDAD CON ADAPTADOR ANTERIOR