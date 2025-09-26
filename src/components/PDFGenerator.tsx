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

  const generateFinancialReport = async () => {
    try {
      setIsGenerating(true);
      
      // Llamar a la Edge Function que devuelve HTML
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
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Obtener el HTML del informe
      const htmlContent = await response.text();
      
      // Abrir en nueva ventana para imprimir como PDF
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        // Esperar a que cargue y luego mostrar diálogo de impresión
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
          }, 1000);
        };
      } else {
        // Fallback si los popups están bloqueados
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Informe_Financiero_${new Date().toISOString().slice(0, 7)}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      setIsGenerating(false);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      setIsGenerating(false);
      
      toast({
        title: "Error al generar informe",
        description: "Se ha producido un error al generar el informe PDF. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const generatePDF = async () => {
    await generateFinancialReport();
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