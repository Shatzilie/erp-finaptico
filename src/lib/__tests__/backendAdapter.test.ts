import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardApiClient, adaptNewToLegacy } from '../backendAdapter';
import type { NewBackendResponse } from '../backendAdapter';

// Mock fetch
global.fetch = vi.fn();

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token'
          }
        }
      })
    }
  }
}));

describe('backendAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('adaptNewToLegacy', () => {
    it('should adapt valid backend response', () => {
      const mockResponse: NewBackendResponse = {
        ok: true,
        widget_data: {
          dashboard: {
            success: true,
            payload: {
              treasury: { total: 50000, currency: 'EUR', accounts: 3 },
              revenue: { monthly: 10000, quarterly: 30000, yearly: 120000, pendingCount: 5 },
              expenses: { monthly: 7000, quarterly: 21000, yearly: 84000, pendingCount: 3 },
              profitability: { monthlyMargin: 3000, quarterlyMargin: 9000, yearlyMargin: 36000, marginPercentage: 30 },
              alerts: []
            }
          }
        },
        meta: {
          tenant_slug: 'test-tenant',
          execution_time: '1.2s',
          modules_loaded: ['treasury', 'revenue']
        }
      };

      const result = adaptNewToLegacy(mockResponse);

      expect(result.totalCash).toBe(50000);
      expect(result.monthlyRevenue).toBe(10000);
      expect(result.monthlyExpenses).toBe(7000);
      expect(result.marginPercentage).toBe(30);
    });

    it('should handle invalid backend response', () => {
      const invalidResponse = {
        ok: false
      } as NewBackendResponse;

      const result = adaptNewToLegacy(invalidResponse);

      expect(result).toEqual({});
    });

    it('should preserve cache metadata', () => {
      const mockResponse: NewBackendResponse = {
        ok: true,
        widget_data: {
          dashboard: {
            success: true,
            payload: {
              treasury: { total: 50000, currency: 'EUR', accounts: 3 },
              revenue: { monthly: 10000, quarterly: 30000, yearly: 120000, pendingCount: 5 },
              expenses: { monthly: 7000, quarterly: 21000, yearly: 84000, pendingCount: 3 },
              profitability: { monthlyMargin: 3000, quarterlyMargin: 9000, yearlyMargin: 36000, marginPercentage: 30 },
              alerts: []
            }
          }
        },
        cache_status: 'hit',
        cached_at: '2024-01-01T12:00:00Z',
        age_minutes: 5,
        meta: {
          tenant_slug: 'test-tenant',
          execution_time: '0.5s',
          modules_loaded: []
        }
      };

      const result = adaptNewToLegacy(mockResponse);

      expect(result.cache_status).toBe('hit');
      expect(result.cached_at).toBe('2024-01-01T12:00:00Z');
      expect(result.age_minutes).toBe(5);
    });
  });

  describe('DashboardApiClient', () => {
    it('should fetch dashboard data successfully', async () => {
      const mockResponse: NewBackendResponse = {
        ok: true,
        widget_data: {
          dashboard: {
            success: true,
            payload: {
              treasury: { total: 50000, currency: 'EUR', accounts: 3 },
              revenue: { monthly: 10000, quarterly: 30000, yearly: 120000, pendingCount: 5 },
              expenses: { monthly: 7000, quarterly: 21000, yearly: 84000, pendingCount: 3 },
              profitability: { monthlyMargin: 3000, quarterlyMargin: 9000, yearlyMargin: 36000, marginPercentage: 30 },
              alerts: []
            }
          }
        },
        meta: {
          tenant_slug: 'test-tenant',
          execution_time: '1.0s',
          modules_loaded: []
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new DashboardApiClient();
      const result = await client.fetchDashboardData('test-tenant');

      expect(result.totalCash).toBe(50000);
      expect(result.monthlyRevenue).toBe(10000);
    });

    it('should fallback to legacy endpoints on error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const client = new DashboardApiClient();
      
      // Should not throw, should return fallback data
      await expect(client.fetchDashboardData('test-tenant')).resolves.toBeDefined();
    });
  });
});
