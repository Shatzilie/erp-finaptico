import { toast } from '@/hooks/use-toast';

export function handleApiError(error: any, context?: string) {
  // Log seguro (NUNCA incluir tokens, credenciales, o respuestas completas)
  const errorInfo = {
    context: context || 'API',
    type: error.name || 'Unknown',
    message: error.message || 'Unknown error',
    timestamp: new Date().toISOString()
  };

  console.error('[API Error]', errorInfo);

  // Detectar tipo de error y mostrar mensaje apropiado

  // 1. Rate Limiting
  if (error.message.startsWith('RATE_LIMIT:')) {
    const seconds = error.message.split(':')[1];
    const minutes = Math.ceil(parseInt(seconds) / 60);

    toast({
      title: "⏳ Demasiadas peticiones",
      description: `Has alcanzado el límite de peticiones. Por favor espera ${minutes} minuto${minutes > 1 ? 's' : ''} antes de volver a intentar.`,
      variant: "destructive",
      duration: 5000
    });
    return;
  }

  // 2. Timeout
  if (error.name === 'AbortError') {
    toast({
      title: "⏱️ Tiempo de espera agotado",
      description: "La operación tardó demasiado tiempo. Por favor, intenta de nuevo.",
      variant: "destructive",
      duration: 5000
    });
    return;
  }

  // 3. Sin sesión
  if (error.message === 'NO_SESSION') {
    toast({
      title: "🔒 Sesión expirada",
      description: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
      variant: "destructive",
      duration: 5000
    });
    // Opcional: redirigir a login después de 2 segundos
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    return;
  }

  // 4. Errores HTTP específicos
  if (error.message.startsWith('HTTP_')) {
    const [, statusCode, message] = error.message.match(/HTTP_(\d+):(.*)/) || [];

    switch (statusCode) {
      case '401':
      case '403':
        toast({
          title: "🚫 Acceso denegado",
          description: "No tienes permisos para realizar esta acción.",
          variant: "destructive",
          duration: 5000
        });
        break;

      case '404':
        toast({
          title: "🔍 No encontrado",
          description: `No se encontró el recurso solicitado${context ? ` en ${context}` : ''}.`,
          variant: "destructive",
          duration: 5000
        });
        break;

      case '500':
      case '502':
      case '503':
        toast({
          title: "⚠️ Error del servidor",
          description: "El servidor está teniendo problemas. Por favor, intenta más tarde.",
          variant: "destructive",
          duration: 5000
        });
        break;

      default:
        toast({
          title: "❌ Error inesperado",
          description: "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
          variant: "destructive",
          duration: 5000
        });
    }
    return;
  }

  // 5. Error genérico (fallback)
  toast({
    title: "❌ Error del servidor",
    description: `No se pudo completar la operación${context ? ` en ${context}` : ''}. Por favor, intenta más tarde.`,
    variant: "destructive",
    duration: 5000
  });
}
