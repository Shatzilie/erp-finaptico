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
        description: "No se pudo identificar el tenant",
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

      console.log('📄 Generando PDF para:', tenantSlug);

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
        throw new Error(`Error ${response.status}`);
      }

      // Backend devuelve JSON con HTML en base64
      const result = await response.json();
      
      if (!result.success || !result.html_base64) {
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('✅ HTML recibido (base64), tamaño:', result.length, 'bytes');

      // Decodificar base64 a HTML
      const htmlContent = decodeURIComponent(escape(atob(result.html_base64)));

      console.log('✅ HTML decodificado, longitud:', htmlContent.length);

      // Abrir en nueva ventana
      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write(htmlContent);
        pdfWindow.document.close();
        
        toast({
          title: "✅ PDF generado",
          description: "Usa Ctrl+P para guardar como PDF",
        });
      } else {
        throw new Error('Habilita popups para abrir el PDF');
      }

    } catch (error: any) {
      console.error('❌ Error PDF:', error);
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
          className={`${className} bg-violet-600 hover:bg-violet-700`}
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
          <AlertDialogTitle>¿Generar reporte financiero?</AlertDialogTitle>
          <AlertDialogDescription>
            PDF con datos de {tenantName || 'la empresa'}
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
