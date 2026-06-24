import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { AuditLog, PaginatedResponse } from '@/types';

interface AuditFilters {
  page?: number;
  limit?: number;
  action?: string;
  category?: string;
  userId?: string;
  from?: string;
  to?: string;
}

/**
 * useAudit — paginated, filtered audit-log query with 30-second polling.
 *
 * @example
 * const { data, isLoading } = useAudit({ page: 1, category: 'FILE' });
 */
export function useAudit(filters: AuditFilters = {}) {
  const { page = 1, limit = 20, ...rest } = filters;

  return useQuery({
    queryKey: ['audit', page, limit, rest],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<AuditLog>>('/v1/audit', {
        params: { page, limit, ...rest },
      });
      return res.data;
    },
    // Near-real-time feel: refresh every 30 s, consider data stale after 20 s
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

/**
 * exportAuditCsv — triggers a browser download of the filtered audit log.
 *
 * @example
 * await exportAuditCsv({ category: 'AUTH', from: '2025-01-01' });
 */
export async function exportAuditCsv(
  filters: Omit<AuditFilters, 'page' | 'limit'>,
): Promise<void> {
  const res = await api.get('/v1/audit/export', {
    params: filters,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
