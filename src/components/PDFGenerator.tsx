import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sesión expirada');
      }

      console.log('📄 Generando PDF para tenant:', tenantSlug);

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

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      // CRÍTICO: NO parsear como JSON - obtener como texto plano
      const htmlContent = await response.text();
      
      console.log('✅ HTML recibido, longitud:', htmlContent.length);

      // Abrir en nueva ventana
      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write(htmlContent);
        pdfWindow.document.close();
        
        toast({
          title: "✅ PDF generado",
          description: "Usa Ctrl+P para imprimir o guardar",
        });
      } else {
        throw new Error('Popup bloqueado. Habilita popups para este sitio.');
      }

    } catch (error: any) {
      console.error('❌ Error generando PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
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
            Se generará un documento PDF con información financiera de{' '}
            <span className="font-semibold">{tenantName || 'la empresa'}</span>.
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
