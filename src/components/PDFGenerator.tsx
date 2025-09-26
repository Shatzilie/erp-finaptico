import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';

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
      
      // 1. Llamar al endpoint para obtener HTML
      const response = await fetch(`https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/financial-report-pdf?tenantSlug=${tenantSlug}`, {
        method: 'GET'
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📋 Result:', result);
      
      if (!result.ok || !result.html_content) {
        throw new Error(result.error || 'No se pudo generar el HTML del informe');
      }

      console.log('✅ HTML obtenido, generando PDF...');

      // 2. Convertir HTML a PDF usando html2pdf.js
      const filename = `Informe_Financiero_${result.company_name || 'Empresa'}_${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit' })}.pdf`;
      
      const options = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
      };
      
      await html2pdf().set(options).from(result.html_content).save();
      
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