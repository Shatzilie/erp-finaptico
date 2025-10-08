import { useRef } from 'react';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const REQUESTS_PER_WINDOW = 50;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutos

export function useClientRateLimit() {
  // Map en memoria - se resetea al recargar la página
  const limitsRef = useRef<Map<string, RateLimitEntry>>(new Map());

  const canMakeRequest = (endpoint: string): boolean => {
    const now = Date.now();
    const limits = limitsRef.current;
    const entry = limits.get(endpoint);

    // Si no hay entrada o el tiempo expiró, resetear
    if (!entry || now >= entry.resetTime) {
      limits.set(endpoint, {
        count: 1,
        resetTime: now + WINDOW_MS
      });
      return true;
    }

    // Si ya alcanzó el límite
    if (entry.count >= REQUESTS_PER_WINDOW) {
      return false;
    }

    // Incrementar contador
    entry.count++;
    return true;
  };

  const getRemainingRequests = (endpoint: string): number => {
    const now = Date.now();
    const limits = limitsRef.current;
    const entry = limits.get(endpoint);

    // Si no hay entrada o el tiempo expiró
    if (!entry || now >= entry.resetTime) {
      return REQUESTS_PER_WINDOW;
    }

    return Math.max(0, REQUESTS_PER_WINDOW - entry.count);
  };

  return { canMakeRequest, getRemainingRequests };
}
