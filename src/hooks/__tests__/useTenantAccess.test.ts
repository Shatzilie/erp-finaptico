import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTenantAccess } from '../useTenantAccess';
import { mockSupabaseClient, mockAuthContext } from '../../test/mocks/supabase';

// Mock dependencies
vi.mock('../../integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('useTenantAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return tenant data when user has access', async () => {
    const mockTenantData = {
      tenant_id: 'tenant-123',
      tenant_slug: 'young-minds',
      tenant_name: 'Young Minds',
    };

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockTenantData, error: null }),
        })),
      })),
    });

    const { result } = renderHook(() => useTenantAccess());

    // Esperar a que el hook termine de cargar
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.tenantSlug).toBe('young-minds');
    expect(result.current.tenantName).toBe('Young Minds');
    expect(result.current.error).toBeNull();
  });

  it('should return error when user has no tenant access', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'No tenant access' } 
          }),
        })),
      })),
    });

    const { result } = renderHook(() => useTenantAccess());

    // Esperar a que el hook termine de cargar
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.tenantSlug).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('should not fetch when user is not authenticated', () => {
    mockAuthContext.isAuthenticated = false;

    const { result } = renderHook(() => useTenantAccess());

    expect(result.current.tenantSlug).toBeNull();
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();

    // Reset for other tests
    mockAuthContext.isAuthenticated = true;
  });
});
