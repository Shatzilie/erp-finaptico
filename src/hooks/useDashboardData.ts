import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendAdapter, LegacyDashboardData } from '@/lib/backendAdapter';

export function useDashboardData(tenantSlug: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard', tenantSlug],
    queryFn: () => backendAdapter.fetchDashboardData(tenantSlug),
    enabled: !!tenantSlug,
  });

  const refreshMutation = useMutation({
    mutationFn: () => backendAdapter.fetchDashboardData(tenantSlug, true),
    onSuccess: (newData) => {
      queryClient.setQueryData(['dashboard', tenantSlug], newData);
    },
  });

  return {
    data,
    isLoading,
    error,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}
