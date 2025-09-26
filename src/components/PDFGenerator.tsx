import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PDFGeneratorProps {
  tenantSlug: string;
  className?: string;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({ 
  tenantSlug, 
  className = "" 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // 1. Llamar al endpoint para obtener HTML
      const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/generate-pdf-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: tenantSlug
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok || !result.html_content) {
        throw new Error(result.error || 'No se pudo generar el HTML del informe');
      }

      // 2. Convertir HTML a PDF usando jsPDF (más compatible que html2pdf)
      await convertHTMLToPDF(result.html_content, tenantSlug);
      
      toast({
        title: "✅ Informe generado",
        description: "El informe PDF se ha descargado correctamente.",
      });

    } catch (error) {
      console.error('Error generando PDF:', error);
      toast({
        title: "❌ Error",
        description: `No se pudo generar el informe: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      className={`${className} bg-violet-600 hover:bg-violet-700 text-white`}
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="h-5 w-5 mr-2" />
          Descargar Informe PDF
        </>
      )}
    </Button>
  );
};

// Función para convertir HTML a PDF usando una solución más simple
async function convertHTMLToPDF(htmlContent: string, tenantSlug: string) {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  
  const filename = `informe-financiero-${tenantSlug}-${currentDate}.pdf`;

  // Crear una nueva ventana/iframe para imprimir
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresión');
  }

  // Escribir el HTML en la nueva ventana
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);

  printWindow.document.close();

  // Esperar a que cargue y luego imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
}

export default PDFGenerator;