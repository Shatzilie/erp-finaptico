import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthenticatedFetch } from '../useAuthenticatedFetch';
import { mockSupabaseClient } from '../../test/mocks/supabase';

vi.mock('../../integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

const mockCanMakeRequest = vi.fn(() => true);
const mockGetRemainingRequests = vi.fn(() => 50);

vi.mock('../useClientRateLimit', () => ({
  useClientRateLimit: () => ({
    canMakeRequest: mockCanMakeRequest,
    getRemainingRequests: mockGetRemainingRequests,
  }),
}));

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useAuthenticatedFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    mockCanMakeRequest.mockReturnValue(true);
    mockGetRemainingRequests.mockReturnValue(50);
  });

  it('should add JWT token to request headers', async () => {
    const mockSession = { access_token: 'test-jwt-token' };
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useAuthenticatedFetch());

    await result.current.fetchWithTimeout('test-endpoint', { test: 'data' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-jwt-token',
        }),
      })
    );
  });

  it('should throw error when no session exists', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuthenticatedFetch());

    await expect(
      result.current.fetchWithTimeout('test-endpoint', {})
    ).rejects.toThrow('NO_SESSION');
  });

  it('should block request when client rate limit exceeded', async () => {
    mockCanMakeRequest.mockReturnValue(false);

    const { result } = renderHook(() => useAuthenticatedFetch());

    await expect(
      result.current.fetchWithTimeout('test-endpoint', {})
    ).rejects.toThrow('CLIENT_RATE_LIMIT');
  });

  it('should include rate limit remaining in headers', async () => {
    const mockSession = { access_token: 'test-jwt-token' };
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockGetRemainingRequests.mockReturnValue(42);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useAuthenticatedFetch());

    await result.current.fetchWithTimeout('test-endpoint', {});

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Rate-Limit-Remaining': '42',
        }),
      })
    );
  });

  it('should handle 429 rate limit error', async () => {
    const mockSession = { access_token: 'test-jwt-token' };
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const headers = new Headers();
    headers.set('Retry-After', '60');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers,
      json: async () => ({ error: 'Too Many Requests' }),
    });

    const { result } = renderHook(() => useAuthenticatedFetch());

    await expect(
      result.current.fetchWithTimeout('test-endpoint', {})
    ).rejects.toThrow('RATE_LIMIT:60');
  });
});
