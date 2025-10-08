import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClientRateLimit } from '../useClientRateLimit';

describe('useClientRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', () => {
    const { result } = renderHook(() => useClientRateLimit());

    for (let i = 0; i < 50; i++) {
      expect(result.current.canMakeRequest('/test-endpoint')).toBe(true);
    }

    expect(result.current.getRemainingRequests('/test-endpoint')).toBe(0);
  });

  it('should block requests after exceeding limit', () => {
    const { result } = renderHook(() => useClientRateLimit());

    // Hacer 50 requests (límite)
    for (let i = 0; i < 50; i++) {
      result.current.canMakeRequest('/test-endpoint');
    }

    // La request 51 debería ser bloqueada
    expect(result.current.canMakeRequest('/test-endpoint')).toBe(false);
    expect(result.current.getRemainingRequests('/test-endpoint')).toBe(0);
  });

  it('should reset after time window expires', () => {
    const { result } = renderHook(() => useClientRateLimit());

    // Hacer 50 requests
    for (let i = 0; i < 50; i++) {
      result.current.canMakeRequest('/test-endpoint');
    }

    expect(result.current.canMakeRequest('/test-endpoint')).toBe(false);

    // Avanzar 5 minutos
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    // Ahora debería permitir nuevamente
    expect(result.current.canMakeRequest('/test-endpoint')).toBe(true);
    expect(result.current.getRemainingRequests('/test-endpoint')).toBe(49);
  });

  it('should track different endpoints separately', () => {
    const { result } = renderHook(() => useClientRateLimit());

    result.current.canMakeRequest('/endpoint-1');
    result.current.canMakeRequest('/endpoint-2');

    expect(result.current.getRemainingRequests('/endpoint-1')).toBe(49);
    expect(result.current.getRemainingRequests('/endpoint-2')).toBe(49);
  });

  it('should return full limit for new endpoint', () => {
    const { result } = renderHook(() => useClientRateLimit());

    expect(result.current.getRemainingRequests('/new-endpoint')).toBe(50);
  });
});
