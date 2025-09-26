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
      console.log('🔄 Generando PDF para tenant:', tenantSlug);
      
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

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // IMPORTANTE: No parsear como JSON, es un PDF binario
      const pdfBlob = await response.blob();
      
      // Crear URL temporal para el PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Descargar automáticamente
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Informe_Financiero_${new Date().toISOString().slice(0, 7)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL temporal
      URL.revokeObjectURL(pdfUrl);
      
      toast({
        title: "✅ Informe generado",
        description: "PDF descargado correctamente.",
      });

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