import jsPDF from 'jspdf';

// Declaración de tipos para jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface AutoTableOptions {
  head?: string[][];
  body?: (string | number)[][];
  startY?: number;
  theme?: 'striped' | 'grid' | 'plain';
  headStyles?: {
    fillColor?: number[];
    textColor?: number[];
    fontSize?: number;
    fontStyle?: string;
  };
  styles?: {
    fontSize?: number;
    cellPadding?: number;
  };
  columnStyles?: Record<number, { cellWidth?: number | 'auto' }>;
  margin?: { top?: number; left?: number };
}

// Importación dinámica de autoTable
const loadAutoTable = async () => {
  try {
    // @ts-ignore - Importación dinámica
    const autoTable = (await import('jspdf-autotable')).default;
    return autoTable;
  } catch (error) {
    console.warn('jspdf-autotable no disponible, usando funcionalidad básica');
    return null;
  }
};

interface DashboardData {
  treasury: {
    total: number;
    currency: string;
    accounts: Array<{
      name: string;
      balance: number;
      iban?: string;
    }>;
  };
  revenue: {
    monthly_revenue: number;
    quarterly_revenue: number;
    annual_revenue: number;
    outstanding_invoices_count: number;
    outstanding_invoices_amount: number;
  };
  expenses: {
    monthly_expenses: number;
    quarterly_expenses: number;
    annual_expenses: number;
    pending_invoices_count: number;
    total_pending_amount: number;
  };
  profitability: {
    monthlyMargin: number;
    quarterlyMargin: number;
    yearlyMargin: number;
    marginPercentage: number;
  };
}

export async function generateDashboardPDF(
  data: DashboardData,
  companyName: string
): Promise<void> {
  const doc = new jsPDF();
  
  // Cargar autoTable si está disponible
  await loadAutoTable();

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Dashboard Financiero', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(
    `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  yPosition += 15;

  // Sección Tesorería
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Tesorería', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Balance Total: ${data.treasury.total.toLocaleString('es-ES')} ${data.treasury.currency}`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(`Número de cuentas: ${data.treasury.accounts.length}`, 14, yPosition);
  yPosition += 10;

  // Tabla de cuentas si autoTable está disponible
  if (doc.autoTable) {
    const accountsData = data.treasury.accounts.map((acc) => [
      acc.name,
      `${acc.balance.toLocaleString('es-ES')} €`,
      acc.iban || 'N/A',
    ]);

    doc.autoTable({
      head: [['Cuenta', 'Balance', 'IBAN']],
      body: accountsData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 9 },
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 10;
  }
  yPosition += 10;

  // Sección Ingresos
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ingresos', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Mensual: ${data.revenue.monthly_revenue.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Trimestral: ${data.revenue.quarterly_revenue.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Anual: ${data.revenue.annual_revenue.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Facturas pendientes: ${data.revenue.outstanding_invoices_count} (${data.revenue.outstanding_invoices_amount.toLocaleString('es-ES')} €)`,
    14,
    yPosition
  );
  yPosition += 10;

  // Sección Gastos
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Gastos', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Mensual: ${data.expenses.monthly_expenses.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Trimestral: ${data.expenses.quarterly_expenses.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Anual: ${data.expenses.annual_expenses.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Facturas pendientes: ${data.expenses.pending_invoices_count} (${data.expenses.total_pending_amount.toLocaleString('es-ES')} €)`,
    14,
    yPosition
  );
  yPosition += 10;

  // Sección Rentabilidad
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Rentabilidad', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Margen Mensual: ${data.profitability.monthlyMargin.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Margen Trimestral: ${data.profitability.quarterlyMargin.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Margen Anual: ${data.profitability.yearlyMargin.toLocaleString('es-ES')} €`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Porcentaje de Margen: ${data.profitability.marginPercentage.toFixed(2)}%`,
    14,
    yPosition
  );

  // Guardar PDF
  doc.save(`dashboard-${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}