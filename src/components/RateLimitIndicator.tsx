import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
}

export function RateLimitIndicator() {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Escuchar eventos de rate limit emitidos por useAuthenticatedFetch
    const handleRateLimit = (event: CustomEvent<RateLimitInfo>) => {
      const info = event.detail;
      setRateLimitInfo(info);

      // Solo mostrar si quedan menos de 20 requests
      setIsVisible(info.remaining < 20);
    };

    window.addEventListener('ratelimit' as any, handleRateLimit);

    return () => {
      window.removeEventListener('ratelimit' as any, handleRateLimit);
    };
  }, []);

  if (!isVisible || !rateLimitInfo) {
    return null;
  }

  const percentage = ((rateLimitInfo.limit - rateLimitInfo.remaining) / rateLimitInfo.limit) * 100;
  const isWarning = rateLimitInfo.remaining <= 10;
  const isCritical = rateLimitInfo.remaining <= 5;

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border-2 transition-all duration-300 z-50 ${
        isCritical ? 'border-red-500' : isWarning ? 'border-orange-500' : 'border-blue-500'
      }`}
      style={{ minWidth: '280px' }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className={`w-5 h-5 mt-0.5 ${
            isCritical ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-blue-500'
          }`}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-2">
            {isCritical ? '⚠️ Límite casi alcanzado' : isWarning ? '⏳ Acercándose al límite' : '📊 Uso de API'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Requests restantes: <strong>{rateLimitInfo.remaining}</strong> de {rateLimitInfo.limit}
          </p>
          <Progress
            value={percentage}
            className={`w-full h-2 ${
              isCritical ? 'bg-red-100' : isWarning ? 'bg-orange-100' : 'bg-blue-100'
            }`}
          />
          {isCritical && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              ⛔ Muy pocas peticiones restantes. Espera unos minutos.
            </p>
          )}
          {isWarning && !isCritical && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              ⚠️ Te estás acercando al límite de peticiones.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
