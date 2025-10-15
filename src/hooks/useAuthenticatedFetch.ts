import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClientRateLimit } from '@/hooks/useClientRateLimit';

interface FetchOptions {
  timeout?: number;  // Default 30 segundos
  retries?: number;  // Default 0
  retryDelay?: number; // Default 1000ms
  responseType?: 'json' | 'text'; // Tipo de respuesta esperada
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
}

export function useAuthenticatedFetch() {
  const { toast } = useToast();
  const { canMakeRequest, getRemainingRequests } = useClientRateLimit();

  const fetchWithTimeout = async <T = any>(
    endpoint: string,
    body: any,
    options: FetchOptions = {}
  ): Promise<T> => {
    const { timeout = 30000, retries = 0, retryDelay = 1000, responseType = 'json' } = options;

    // Implementar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Validar rate limit del cliente ANTES de hacer el fetch
      if (!canMakeRequest(endpoint)) {
        throw new Error('CLIENT_RATE_LIMIT:Demasiadas peticiones. Espera un momento.');
      }

      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('NO_SESSION');
      }

      // Usar URLs directas sin variables de entorno
      const supabaseUrl = 'https://dtmrywilxpilpzokxxif.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bXJ5d2lseHBpbHB6b2t4eGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTQ3NDcsImV4cCI6MjA3MzA5MDc0N30.2oV-SA1DS-nM72udb-I_IGYM1vIRxRp66np3N_ZVYbY';

      // Realizar fetch con signal para abortar
      const response = await fetch(
        `${supabaseUrl}/functions/v1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
            'X-Rate-Limit-Remaining': getRemainingRequests(endpoint).toString()
          },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      // Extraer headers de rate limiting ANTES de parsear body
      const rateLimitInfo: RateLimitInfo | null = response.headers.get('X-RateLimit-Limit') ? {
        limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
        remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
        reset: response.headers.get('X-RateLimit-Reset') || ''
      } : null;

      // Emitir evento global con info de rate limit
      if (rateLimitInfo) {
        window.dispatchEvent(new CustomEvent('ratelimit', {
          detail: rateLimitInfo
        }));
      }

      // Manejar rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`RATE_LIMIT:${retryAfter || '60'}`);
      }

      // Manejar otros errores HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP_${response.status}:${errorData.error || 'Unknown error'}`);
      }

      if (responseType === 'text') {
        const data = await response.text();
        return data as T;
      } else {
        const data = await response.json();
        return data as T;
      }

    } catch (error: any) {
      clearTimeout(timeoutId);

      // Retry logic (solo para errores recuperables, NO para rate limit o auth)
      if (retries > 0 && 
          error.name !== 'AbortError' && 
          !error.message.startsWith('RATE_LIMIT') &&
          !error.message.startsWith('CLIENT_RATE_LIMIT') &&
          !error.message.startsWith('NO_SESSION')) {

        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchWithTimeout<T>(endpoint, body, { 
          ...options, 
          retries: retries - 1 
        });
      }

      throw error;
    }
  };

  return { fetchWithTimeout };
}
