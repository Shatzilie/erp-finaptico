import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { handleApiError } from '@/lib/apiErrorHandler';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTenantAccess } from '@/hooks/useTenantAccess';

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
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { tenantName } = useTenantAccess();

  const generateFinancialReport = async () => {
    try {
      setIsGenerating(true);
      
      console.log('🔍 Iniciando petición con responseType: text');

      const htmlContent = await fetchWithTimeout<string>(
        'financial-report-pdf',
        { tenant_slug: tenantSlug },
        { timeout: 45000, retries: 0, responseType: 'text' }
      );

      console.log('✅ Respuesta recibida, tipo:', typeof htmlContent);
      console.log('📄 Primeros 100 chars:', htmlContent.substring(0, 100));

      if (typeof htmlContent !== 'string') {
        throw new Error('Invalid PDF response');
      }

      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
          }, 1000);
        };
        
        console.log('✅ PDF generated successfully');
      } else {
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
      
      toast({
        title: "PDF generado",
        description: "El informe se ha generado correctamente",
      });
      
    } catch (error: any) {
      handleApiError(error, 'Generación de PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async () => {
    await generateFinancialReport();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
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
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Generar reporte financiero en PDF?</AlertDialogTitle>
          <AlertDialogDescription>
            Se generará un documento PDF con información financiera sensible de{' '}
            <span className="font-semibold">{tenantName || 'la empresa'}</span>. 
            Esta acción quedará registrada en el sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={generatePDF}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Generar PDF
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PDFGenerator;