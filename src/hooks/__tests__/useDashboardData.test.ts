import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData } from '../useDashboardData';
import { createElement } from 'react';
import type { ReactNode } from 'react';

// Mock backendAdapter
vi.mock('@/lib/backendAdapter', () => ({
  backendAdapter: {
    fetchDashboardData: vi.fn().mockResolvedValue({
      totalCash: 50000,
      monthlyRevenue: 10000,
      alerts: []
    })
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }

  return Wrapper;
};

describe('useDashboardData', () => {
  it('should fetch dashboard data successfully', async () => {
    const { result } = renderHook(() => useDashboardData('test-tenant'), {
      wrapper: createWrapper()
    });

    // Wait for query to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.totalCash).toBe(50000);
  });

  it('should not fetch when tenantSlug is undefined', async () => {
    const { result } = renderHook(() => useDashboardData(undefined), {
      wrapper: createWrapper()
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.data).toBeUndefined();
  });

  it('should provide refresh function', async () => {
    const { result } = renderHook(() => useDashboardData('test-tenant'), {
      wrapper: createWrapper()
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.refresh).toBeDefined();
    expect(typeof result.current.refresh).toBe('function');
  });
});
