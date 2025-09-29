import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
// 🔧 CORRECCIÓN: Import correcto de autoTable
import autoTable from "jspdf-autotable";

// Si el error persiste, usa este import alternativo:
// import "jspdf-autotable";
// declare module "jspdf" {
//   interface jsPDF {
//     autoTable: (options: any) => jsPDF;
//   }
// }

interface DashboardData {
  treasury: {
    total: number;
    accounts: number;
    currency: string;
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
}

interface PDFGeneratorProps {
  data: DashboardData;
  tenantSlug: string;
  tenantName: string;
}

export const PDFGenerator = ({ data, tenantSlug, tenantName }: PDFGeneratorProps) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Informe Financiero", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(tenantName, pageWidth / 2, 28, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 35, { align: "center" });
    
    let yPos = 45;

    // Treasury
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Tesorería", 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Concepto", "Valor"]],
      body: [
        ["Saldo Total", `${data.treasury.total.toLocaleString('es-ES')} ${data.treasury.currency}`],
        ["Cuentas Activas", data.treasury.accounts.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Revenue
    doc.setFontSize(14);
    doc.text("Facturación", 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Período", "Importe"]],
      body: [
        ["Mensual", `${data.revenue.monthly.toLocaleString('es-ES')} €`],
        ["Trimestral", `${data.revenue.quarterly.toLocaleString('es-ES')} €`],
        ["Anual", `${data.revenue.yearly.toLocaleString('es-ES')} €`],
        ["Facturas Pendientes", data.revenue.pendingCount.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [92, 184, 92] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Expenses
    doc.setFontSize(14);
    doc.text("Gastos", 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Período", "Importe"]],
      body: [
        ["Mensual", `${data.expenses.monthly.toLocaleString('es-ES')} €`],
        ["Trimestral", `${data.expenses.quarterly.toLocaleString('es-ES')} €`],
        ["Anual", `${data.expenses.yearly.toLocaleString('es-ES')} €`],
        ["Facturas por Pagar", data.expenses.pendingCount.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [217, 83, 79] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Profitability
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text("Rentabilidad", 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Concepto", "Valor"]],
      body: [
        ["Margen Mensual", `${data.profitability.monthlyMargin.toLocaleString('es-ES')} €`],
        ["Margen Trimestral", `${data.profitability.quarterlyMargin.toLocaleString('es-ES')} €`],
        ["Margen Anual", `${data.profitability.yearlyMargin.toLocaleString('es-ES')} €`],
        ["Porcentaje Margen", `${data.profitability.marginPercentage.toFixed(2)}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [240, 173, 78] },
    });

    // Alerts
    if (data.alerts.length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text("Alertas", 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [["Tipo", "Mensaje", "Módulo"]],
        body: data.alerts.map(alert => [
          alert.type,
          alert.message,
          alert.module
        ]),
        theme: "grid",
        headStyles: { fillColor: [217, 83, 79] },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    const fileName = `informe-${tenantSlug}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <Button onClick={generatePDF} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Descargar PDF
    </Button>
  );
};