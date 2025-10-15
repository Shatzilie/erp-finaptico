import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { tenantName } = useTenantAccess();

  const handleGeneratePDF = async () => {
    if (!tenantSlug) {
      toast({
        title: "Error",
        description: "No se pudo identificar el tenant actual",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Obtener el token actual directamente de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('NO_SESSION');
      }

      // 2. Hacer fetch directo SIN pasar por el hook
      const response = await fetch(
        `https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/financial-report-pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tenant_slug: tenantSlug }),
        }
      );

      // 3. Verificar respuesta
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}:Error generando PDF`);
      }

      // 4. Obtener HTML como texto (SIN parsear como JSON)
      const htmlContent = await response.text();

      // 5. Abrir en nueva ventana
      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write(htmlContent);
        pdfWindow.document.close();
      } else {
        toast({
          title: "⚠️ Popup bloqueado",
          description: "Por favor, permite popups para este sitio y vuelve a intentar",
          variant: "destructive",
        });
      }

      toast({
        title: "✅ PDF generado",
        description: "Puedes usar Ctrl+P para imprimir o guardar",
      });

    } catch (error: any) {
      console.error('[PDF Generation Error]', error);
      handleApiError(error, 'Generación de PDF');
    } finally {
      setIsGenerating(false);
    }
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
            onClick={handleGeneratePDF}
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