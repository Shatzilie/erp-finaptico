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
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { id: 'test-user-id', email: 'test@example.com' };
  });

  it('should return tenant data when user has access', async () => {
    const mockTenantData = {
      tenant_id: 'tenant-123',
      role: 'admin',
      tenants: {
        slug: 'young-minds',
      },
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
    expect(result.current.tenantId).toBe('tenant-123');
    expect(result.current.role).toBe('admin');
    expect(result.current.hasAccess).toBe(true);
  });

  it('should return no access when user has no tenant', async () => {
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
    expect(result.current.hasAccess).toBe(false);
  });

  it('should not fetch when user is not authenticated', () => {
    mockAuthContext.user = null;

    const { result } = renderHook(() => useTenantAccess());

    expect(result.current.tenantSlug).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasAccess).toBe(false);
  });
});
