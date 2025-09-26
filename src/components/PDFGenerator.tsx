import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Extend window interface for html2pdf
declare global {
  interface Window {
    html2pdf: any;
  }
}

interface PDFGeneratorProps {
  tenantSlug: string;
  className?: string;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({ 
  tenantSlug, 
  className = "" 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Alternativa usando html2pdf.js si está disponible
  const generateFinancialReportWithLibrary = async () => {
    try {
      // Verificar si html2pdf está disponible
      if (typeof window.html2pdf === 'undefined') {
        // Cargar html2pdf dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => generateFinancialReportWithLibrary();
        document.head.appendChild(script);
        return;
      }
      
      // Obtener HTML del informe
      const response = await fetch('/api/v1/financial-report-pdf', {
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
        throw new Error(`Error: ${response.status}`);
      }

      const htmlContent = await response.text();
      
      // Crear elemento temporal
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);
      
      // Configuración del PDF
      const options = {
        margin: [20, 20, 20, 20],
        filename: `Informe_Financiero_${new Date().toISOString().slice(0, 7)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true 
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      // Generar PDF
      await window.html2pdf().set(options).from(tempDiv).save();
      
      // Limpiar
      document.body.removeChild(tempDiv);
      
      toast({
        title: "✅ Informe generado",
        description: "PDF descargado correctamente.",
      });
      
    } catch (error) {
      console.error('Error generando PDF con librería:', error);
      
      // Fallback a método de impresión simple
      await generateFinancialReport();
    }
  };

  // Función fallback para generar el PDF
  const generateFinancialReport = async () => {
    try {
      // 1. Obtener HTML del informe
      const response = await fetch('/api/v1/financial-report-pdf', {
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
        throw new Error(`Error: ${response.status}`);
      }

      // 2. Obtener HTML
      const htmlContent = await response.text();
      
      // 3. Crear iframe oculto para generar PDF
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);
      
      // 4. Cargar contenido en iframe
      iframe.onload = () => {
        try {
          // 5. Imprimir como PDF
          setTimeout(() => {
            iframe.contentWindow?.print();
            
            // 6. Limpiar
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          }, 500);
        } catch (error) {
          console.error('Error al imprimir:', error);
          document.body.removeChild(iframe);
        }
      };
      
      // Escribir HTML en iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
      }
      
      toast({
        title: "✅ Informe generado",
        description: "PDF se abrirá en una nueva ventana para imprimir.",
      });
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      
      toast({
        title: "❌ Error",
        description: "Se ha producido un error al generar el informe PDF. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🔄 Generando PDF para tenant:', tenantSlug);
      
      // Primero intenta con la librería html2pdf
      await generateFinancialReportWithLibrary();
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "❌ Error",
        description: `No se pudo generar el informe: ${errorMessage}`,
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

export default PDFGenerator;