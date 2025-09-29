import { supabase } from "@/integrations/supabase/client";

const LOVABLE_SECRET = 'lovable_sync_2024_LP%#tGxa@Q';

// 🔴 VALIDACIÓN OBLIGATORIA DE TENANT
const validateTenant = (tenantSlug?: string): string => {
  if (!tenantSlug || tenantSlug.trim() === '') {
    throw new Error('tenant_slug is required for all operations');
  }
  return tenantSlug;
};

// 🌐 HELPER PARA LLAMADAS CON TENANT OBLIGATORIO
const callEdgeFunction = async (
  functionName: string,
  tenantSlug: string,
  additionalParams: Record<string, any> = {}
) => {
  const validatedTenant = validateTenant(tenantSlug);

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: {
      tenant_slug: validatedTenant,
      ...additionalParams
    },
    headers: {
      'x-lovable-secret': LOVABLE_SECRET
    }
  });

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'Request failed');
  
  return data;
};

// 🎯 ADAPTER EXPORTADO
export const backendAdapter = {
  // ===== DASHBOARD =====
  async getDashboard(tenantSlug: string) {
    const data = await callEdgeFunction('odoo-dashboard', tenantSlug);
    return data.widget_data.dashboard.payload;
  },

  // ===== TREASURY (TESORERÍA) =====
  async syncTreasury(tenantSlug: string) {
    const data = await callEdgeFunction('odoo-sync', tenantSlug, {
      include_movements: true
    });
    return data.widget_data.treasury_balance.payload;
  },

  async getTreasuryBalance(tenantSlug: string) {
    return this.syncTreasury(tenantSlug);
  },

  // ===== REVENUE (FACTURACIÓN) =====
  async getRevenue(tenantSlug: string, dateFrom?: string, dateTo?: string) {
    const data = await callEdgeFunction('odoo-revenue', tenantSlug, {
      date_from: dateFrom,
      date_to: dateTo
    });
    return data.widget_data.revenue.payload;
  },

  // ===== EXPENSES (GASTOS) =====
  async getExpenses(tenantSlug: string, dateFrom?: string, dateTo?: string) {
    const data = await callEdgeFunction('odoo-expenses', tenantSlug, {
      date_from: dateFrom,
      date_to: dateTo
    });
    return data.widget_data.expenses.payload;
  },

  // ===== IVA =====
  async getIVA(tenantSlug: string, quarter?: number, year?: number) {
    const currentDate = new Date();
    const data = await callEdgeFunction('odoo-iva', tenantSlug, {
      quarter: quarter || Math.ceil((currentDate.getMonth() + 1) / 3),
      year: year || currentDate.getFullYear()
    });
    return data.widget_data.iva.payload;
  },

  // ===== IRPF =====
  async getIRPF(tenantSlug: string, quarter?: number, year?: number) {
    const currentDate = new Date();
    const data = await callEdgeFunction('odoo-irpf', tenantSlug, {
      quarter: quarter || Math.ceil((currentDate.getMonth() + 1) / 3),
      year: year || currentDate.getFullYear()
    });
    return data.widget_data.irpf.payload;
  },

  // ===== SOCIEDADES =====
  async getSociedades(tenantSlug: string, year?: number) {
    const data = await callEdgeFunction('odoo-sociedades', tenantSlug, {
      year: year || new Date().getFullYear()
    });
    return data.widget_data.sociedades.payload;
  },

  // ===== MÉTODOS AUXILIARES =====
  async testConnection(tenantSlug: string) {
    try {
      await this.getTreasuryBalance(tenantSlug);
      return { ok: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        ok: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }
};