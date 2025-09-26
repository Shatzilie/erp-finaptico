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

      console.log('✅ HTML obtenido, abriendo para imprimir...');

      // 2. Abrir en nueva ventana optimizada para PDF
      openPrintWindow(result.html_content);
      
      toast({
        title: "✅ Informe listo",
        description: "Se ha abierto la ventana para descargar el PDF. Usa Ctrl+P y 'Guardar como PDF'.",
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

// Función para abrir ventana optimizada para imprimir/PDF
function openPrintWindow(htmlContent: string) {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  
  const filename = `informe-financiero-${currentDate}`;

  // Crear nueva ventana
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana. Verifica que no estén bloqueadas las ventanas emergentes.');
  }

  // HTML optimizado para PDF
  const fullHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <style>
        /* Reset y configuración para PDF */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A4;
            margin: 15mm;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            .no-print {
                display: none !important;
            }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1f2937;
            background: white;
            width: 210mm;
            margin: 0 auto;
            padding: 0;
        }
        
        /* Instrucciones para el usuario */
        .print-instructions {
            background: #3b82f6;
            color: white;
            padding: 15px;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 8px;
            font-weight: bold;
        }
        
        .print-button {
            background: #059669;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
        }
        
        .print-button:hover {
            background: #047857;
        }
    </style>
</head>
<body>
    <!-- Instrucciones (no se imprimen) -->
    <div class="print-instructions no-print">
        <div>📄 <strong>Informe listo para descargar</strong></div>
        <div style="margin: 10px 0;">
            Pulsa <strong>Ctrl+P</strong> (o Cmd+P en Mac) y selecciona <strong>"Guardar como PDF"</strong>
        </div>
        <button class="print-button" onclick="window.print()">
            🖨️ Imprimir / Guardar PDF
        </button>
        <button class="print-button" onclick="window.close()" style="background: #dc2626;">
            ❌ Cerrar
        </button>
    </div>
    
    <!-- Contenido del informe -->
    ${htmlContent}
    
    <script>
        // Auto-abrir diálogo de impresión después de cargar
        window.onload = function() {
            setTimeout(function() {
                // Comentamos el auto-print para que el usuario pueda revisar primero
                // window.print();
            }, 500);
        };
    </script>
</body>
</html>
  `;

  // Escribir HTML en la nueva ventana
  printWindow.document.write(fullHTML);
  printWindow.document.close();
  
  // Enfocar la nueva ventana
  printWindow.focus();
}

export default PDFGenerator;