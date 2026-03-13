import { listMessages } from '@/api/contact';
import { useQuery } from './use-query';

export function useUnreadCount() {
  const { data, refetch } = useQuery(() => listMessages({ page: 1, pageSize: 100 }), []);
  const count = data?.data.filter((m) => !m.read).length ?? 0;
  return { count, refetch };
}
