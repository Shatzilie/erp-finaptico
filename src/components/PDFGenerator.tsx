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
      
      // 1. Llamar al endpoint para obtener PDF binario
      const response = await fetch(`https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/financial-report-pdf?tenantSlug=${tenantSlug}`, {
        method: 'GET'
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ PDF obtenido, iniciando descarga...');

      // 2. Crear blob del PDF y descargar automáticamente
      const pdfBlob = await response.blob();
      const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      
      const filename = `informe-financiero-${currentDate}.pdf`;
      
      // Crear URL del blob y trigger descarga
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup blob URL
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: "✅ Informe generado",
        description: "PDF descargado correctamente.",
      });

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
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

export default PDFGenerator;