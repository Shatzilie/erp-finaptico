// src/lib/fiscalCalendar.ts
// ============================
// SISTEMA DE CALENDARIO FISCAL AUTOMÁTICO
// Detecta obligaciones fiscales según perfil de empresa y fechas

export interface FiscalObligation {
  id: string;
  model: string; // "303", "115", "200", etc.
  name: string; // "Declaración IVA", "Retenciones IRPF", etc.
  frequency: 'monthly' | 'quarterly' | 'yearly';
  dueDate: Date;
  period: {
    type: 'month' | 'quarter' | 'year';
    value: number; // Mes, trimestre o año
    year: number;
  };
  status: 'pending' | 'upcoming' | 'overdue' | 'completed';
  priority: 'high' | 'medium' | 'low';
  amount?: number; // Estimado si disponible
  description: string;
  penalties?: {
    lateFee: number;
    interestRate: number;
  };
}

export interface CompanyProfile {
  regime: 'general' | 'simplified' | 'sii'; // Régimen fiscal
  vatQuarter: 1 | 2 | 3 | 4; // Trimestre de declaración IVA
  hasEmployees: boolean; // Determina obligaciones IRPF
  annualRevenue: number; // Para determinar tipo de declaraciones
  sector: 'services' | 'commerce' | 'industry' | 'other';
}

// 📅 CALENDARIO FISCAL ESPAÑOL 2025
const FISCAL_CALENDAR_2025 = {
  // IVA - Modelo 303 (Trimestral)
  vat: {
    Q1: { dueDate: '2025-04-20', period: { quarter: 1, year: 2025 } },
    Q2: { dueDate: '2025-07-20', period: { quarter: 2, year: 2025 } },
    Q3: { dueDate: '2025-10-20', period: { quarter: 3, year: 2025 } },
    Q4: { dueDate: '2026-01-30', period: { quarter: 4, year: 2025 } }
  },
  
  // IRPF Retenciones - Modelo 115 (Trimestral)
  irpf: {
    Q1: { dueDate: '2025-04-20', period: { quarter: 1, year: 2025 } },
    Q2: { dueDate: '2025-07-20', period: { quarter: 2, year: 2025 } },
    Q3: { dueDate: '2025-10-20', period: { quarter: 3, year: 2025 } },
    Q4: { dueDate: '2026-01-30', period: { quarter: 4, year: 2025 } }
  },
  
  // Impuesto Sociedades - Modelo 200 (Anual)
  corporateTax: {
    annual: { 
      dueDate: '2025-07-25', 
      period: { year: 2024 },
      fractionalPayments: [
        { dueDate: '2025-04-20', period: '1st fractional' },
        { dueDate: '2025-10-20', period: '2nd fractional' }
      ]
    }
  },
  
  // Resumen Anual IVA - Modelo 390 (Anual)
  vatSummary: {
    annual: { dueDate: '2026-01-30', period: { year: 2025 } }
  },
  
  // Retenciones Anuales - Modelo 190 (Anual)
  irpfSummary: {
    annual: { dueDate: '2026-01-31', period: { year: 2025 } }
  }
};

export class FiscalCalendarService {
  private companyProfile: CompanyProfile;

  constructor(profile: CompanyProfile) {
    this.companyProfile = profile;
  }

  // 🔍 DETECTAR OBLIGACIONES PENDIENTES
  getPendingObligations(currentDate: Date = new Date()): FiscalObligation[] {
    const obligations: FiscalObligation[] = [];
    const today = new Date(currentDate);
    
    // 🧾 IVA - Siempre obligatorio para empresas
    if (this.companyProfile.regime !== 'simplified') {
      obligations.push(...this.getVATObligations(today));
    }
    
    // 📊 IRPF - Solo si tiene empleados o hace retenciones
    if (this.companyProfile.hasEmployees) {
      obligations.push(...this.getIRPFObligations(today));
    }
    
    // 🏢 Impuesto de Sociedades - Empresas con beneficios
    if (this.companyProfile.annualRevenue > 0) {
      obligations.push(...this.getCorporateTaxObligations(today));
    }
    
    // Ordenar por fecha de vencimiento
    return obligations.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  // 🧾 OBLIGACIONES IVA
  private getVATObligations(currentDate: Date): FiscalObligation[] {
    const obligations: FiscalObligation[] = [];
    const currentYear = currentDate.getFullYear();
    
    Object.entries(FISCAL_CALENDAR_2025.vat).forEach(([quarter, info]) => {
      const dueDate = new Date(info.dueDate);
      const status = this.calculateStatus(dueDate, currentDate);
      
      if (status !== 'completed') {
        obligations.push({
          id: `vat-${quarter}-${currentYear}`,
          model: '303',
          name: `Declaración IVA ${quarter} ${info.period.year}`,
          frequency: 'quarterly',
          dueDate,
          period: {
            type: 'quarter',
            value: info.period.quarter,
            year: info.period.year
          },
          status,
          priority: status === 'overdue' ? 'high' : 'medium',
          description: `Declaración trimestral del Impuesto sobre el Valor Añadido`,
          penalties: {
            lateFee: 200,
            interestRate: 3.75
          }
        });
      }
    });
    
    return obligations;
  }

  // 📊 OBLIGACIONES IRPF
  private getIRPFObligations(currentDate: Date): FiscalObligation[] {
    const obligations: FiscalObligation[] = [];
    const currentYear = currentDate.getFullYear();
    
    Object.entries(FISCAL_CALENDAR_2025.irpf).forEach(([quarter, info]) => {
      const dueDate = new Date(info.dueDate);
      const status = this.calculateStatus(dueDate, currentDate);
      
      if (status !== 'completed') {
        obligations.push({
          id: `irpf-${quarter}-${currentYear}`,
          model: '115',
          name: `Retenciones IRPF ${quarter} ${info.period.year}`,
          frequency: 'quarterly',
          dueDate,
          period: {
            type: 'quarter',
            value: info.period.quarter,
            year: info.period.year
          },
          status,
          priority: status === 'overdue' ? 'high' : 'medium',
          description: `Retenciones e ingresos a cuenta del IRPF`,
          penalties: {
            lateFee: 150,
            interestRate: 3.75
          }
        });
      }
    });
    
    return obligations;
  }

  // 🏢 OBLIGACIONES IMPUESTO SOCIEDADES
  private getCorporateTaxObligations(currentDate: Date): FiscalObligation[] {
    const obligations: FiscalObligation[] = [];
    const currentYear = currentDate.getFullYear();
    
    // Declaración anual
    const annualDueDate = new Date(FISCAL_CALENDAR_2025.corporateTax.annual.dueDate);
    const annualStatus = this.calculateStatus(annualDueDate, currentDate);
    
    if (annualStatus !== 'completed') {
      obligations.push({
        id: `corporate-annual-${currentYear}`,
        model: '200',
        name: `Impuesto de Sociedades ${FISCAL_CALENDAR_2025.corporateTax.annual.period.year}`,
        frequency: 'yearly',
        dueDate: annualDueDate,
        period: {
          type: 'year',
          value: FISCAL_CALENDAR_2025.corporateTax.annual.period.year,
          year: FISCAL_CALENDAR_2025.corporateTax.annual.period.year
        },
        status: annualStatus,
        priority: annualStatus === 'overdue' ? 'high' : 'low',
        description: `Declaración anual del Impuesto sobre Sociedades`,
        penalties: {
          lateFee: 300,
          interestRate: 3.75
        }
      });
    }
    
    // Pagos fraccionados (solo empresas grandes)
    if (this.companyProfile.annualRevenue > 6000000) {
      FISCAL_CALENDAR_2025.corporateTax.annual.fractionalPayments.forEach((payment, index) => {
        const dueDate = new Date(payment.dueDate);
        const status = this.calculateStatus(dueDate, currentDate);
        
        if (status !== 'completed') {
          obligations.push({
            id: `corporate-fractional-${index + 1}-${currentYear}`,
            model: '202',
            name: `Pago fraccionado IS ${payment.period} ${currentYear}`,
            frequency: 'quarterly',
            dueDate,
            period: {
              type: 'quarter',
              value: index + 1,
              year: currentYear
            },
            status,
            priority: status === 'overdue' ? 'high' : 'low',
            description: `Pago fraccionado del Impuesto sobre Sociedades`,
            penalties: {
              lateFee: 200,
              interestRate: 3.75
            }
          });
        }
      });
    }
    
    return obligations;
  }

  // 📊 CALCULAR ESTADO DE OBLIGACIÓN
  private calculateStatus(dueDate: Date, currentDate: Date): FiscalObligation['status'] {
    const today = new Date(currentDate);
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'overdue'; // Vencido
    } else if (diffDays <= 15) {
      return 'pending'; // Próximo a vencer
    } else {
      return 'upcoming'; // Futuro
    }
  }

  // 🚨 OBTENER ALERTAS CRÍTICAS
  getCriticalAlerts(currentDate: Date = new Date()): Array<{
    type: 'overdue' | 'due_soon' | 'high_amount';
    message: string;
    obligation: FiscalObligation;
    severity: 'high' | 'medium' | 'low';
  }> {
    const obligations = this.getPendingObligations(currentDate);
    const alerts = [];

    obligations.forEach(obligation => {
      if (obligation.status === 'overdue') {
        alerts.push({
          type: 'overdue' as const,
          message: `⚠️ VENCIDO: ${obligation.name} - Presenta antes de acumular más recargos`,
          obligation,
          severity: 'high' as const
        });
      } else if (obligation.status === 'pending') {
        const daysLeft = Math.ceil((obligation.dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'due_soon' as const,
          message: `📅 PRÓXIMO: ${obligation.name} - ${daysLeft} días restantes`,
          obligation,
          severity: daysLeft <= 7 ? 'high' : 'medium'
        });
      }

      if (obligation.amount && obligation.amount > 5000) {
        alerts.push({
          type: 'high_amount' as const,
          message: `💰 IMPORTE ALTO: ${obligation.name} - ${obligation.amount.toLocaleString()}€`,
          obligation,
          severity: 'medium' as const
        });
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // 📅 OBTENER PRÓXIMAS FECHAS IMPORTANTES
  getUpcomingDeadlines(days: number = 30, currentDate: Date = new Date()): FiscalObligation[] {
    const obligations = this.getPendingObligations(currentDate);
    const futureDate = new Date(currentDate);
    futureDate.setDate(futureDate.getDate() + days);

    return obligations.filter(obligation => 
      obligation.dueDate >= currentDate && 
      obligation.dueDate <= futureDate
    );
  }

  // 💡 GENERAR RECOMENDACIONES
  getRecommendations(fiscalData: { iva?: number; irpf?: number; societies?: number }): Array<{
    type: 'planning' | 'optimization' | 'compliance';
    message: string;
    impact: 'high' | 'medium' | 'low';
  }> {
    const recommendations = [];

    // Recomendación de planificación fiscal
    if (fiscalData.iva && fiscalData.iva > 3000) {
      recommendations.push({
        type: 'planning' as const,
        message: 'Considera fraccionar el pago del IVA para mejorar el flujo de caja',
        impact: 'medium' as const
      });
    }

    // Optimización IRPF
    if (fiscalData.irpf && fiscalData.irpf < 0) {
      recommendations.push({
        type: 'optimization' as const,
        message: 'Tu IRPF está a favor. Solicita la devolución cuanto antes',
        impact: 'high' as const
      });
    }

    // Planificación Sociedades
    if (fiscalData.societies === 0) {
      recommendations.push({
        type: 'planning' as const,
        message: 'Sin impuesto de sociedades por pérdidas. Considera inversiones deducibles',
        impact: 'low' as const
      });
    }

    return recommendations;
  }
}

// 🏭 FACTORY PARA CREAR PERFIL DE EMPRESA
export function createCompanyProfile(data: {
  annualRevenue: number;
  hasEmployees: boolean;
  sector?: string;
}): CompanyProfile {
  return {
    regime: data.annualRevenue > 6000000 ? 'sii' : 'general',
    vatQuarter: Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4,
    hasEmployees: data.hasEmployees,
    annualRevenue: data.annualRevenue,
    sector: (data.sector as any) || 'services'
  };
}

// 📤 EXPORTAR INSTANCIA CONFIGURADA
export function createFiscalCalendar(companyProfile: CompanyProfile): FiscalCalendarService {
  return new FiscalCalendarService(companyProfile);
}