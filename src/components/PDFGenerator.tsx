import jsPDF from 'jspdf';

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
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Título principal
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

  // Función helper para dibujar línea separadora
  const drawLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 8;
  };

  // ==================== TESORERÍA ====================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(66, 139, 202);
  doc.text('TESORERÍA', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Balance Total: ${data.treasury.total.toLocaleString('es-ES')} ${data.treasury.currency}`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(`Número de cuentas: ${data.treasury.accounts.length}`, 14, yPosition);
  yPosition += 8;

  // Lista de cuentas
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Cuentas:', 14, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  data.treasury.accounts.forEach((account, index) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(`${index + 1}. ${account.name}`, 18, yPosition);
    yPosition += 5;
    doc.text(
      `   Balance: ${account.balance.toLocaleString('es-ES')} €`,
      18,
      yPosition
    );
    yPosition += 5;
    if (account.iban) {
      doc.text(`   IBAN: ${account.iban}`, 18, yPosition);
      yPosition += 5;
    }
    yPosition += 2;
  });

  yPosition += 5;
  drawLine();

  // ==================== INGRESOS ====================
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34);
  doc.text('INGRESOS', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
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

  drawLine();

  // ==================== GASTOS ====================
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text('GASTOS', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
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

  drawLine();

  // ==================== RENTABILIDAD ====================
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 193, 7);
  doc.text('RENTABILIDAD', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
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
  yPosition += 10;

  // ==================== RESUMEN FINAL ====================
  drawLine();

  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RESUMEN EJECUTIVO', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const netProfit = data.revenue.annual_revenue - data.expenses.annual_expenses;
  const profitColor = netProfit >= 0 ? [34, 139, 34] : [220, 53, 69];
  
  doc.text(`Ingresos Anuales: ${data.revenue.annual_revenue.toLocaleString('es-ES')} €`, 14, yPosition);
  yPosition += 6;
  doc.text(`Gastos Anuales: ${data.expenses.annual_expenses.toLocaleString('es-ES')} €`, 14, yPosition);
  yPosition += 6;
  
  doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Beneficio Neto: ${netProfit.toLocaleString('es-ES')} €`, 14, yPosition);
  yPosition += 6;
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Margen de Beneficio: ${data.profitability.marginPercentage.toFixed(2)}%`, 14, yPosition);

  // Pie de página
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generado por ERP Multi-tenant - Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Guardar PDF
  const fileName = `dashboard-${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(fileName);
}