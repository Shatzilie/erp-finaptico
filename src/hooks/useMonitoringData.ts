import { useQuery } from '@tanstack/react-query';
import { backendAdapter } from '@/lib/backendAdapter';

interface UseMonitoringDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useMonitoringData(options: UseMonitoringDataOptions = {}) {
  const { enabled = true, refetchInterval = 30000 } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['monitoring-data'],
    queryFn: () => backendAdapter.getMonitoringData(),
    enabled,
    refetchInterval,
    retry: 2,
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
