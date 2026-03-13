import { useMemo } from 'react';
import type { NavigationItemResponse } from '@shared';
import { getNavigation } from '@/api/navigation';
import { useAsync } from './use-async';

export function useNavigation() {
  const { data, loading, error, refetch } = useAsync(() => getNavigation(), []);

  const brandName = data?.brandName ?? 'John Doe';

  const { leftItems, rightItems } = useMemo(() => {
    if (!data) return { leftItems: [] as NavigationItemResponse[], rightItems: [] as NavigationItemResponse[] };
    const sorted = [...data.items].sort((a, b) => a.position - b.position);
    return {
      leftItems: sorted.filter((i) => i.alignment === 'LEFT'),
      rightItems: sorted.filter((i) => i.alignment === 'RIGHT'),
    };
  }, [data]);

  return { brandName, leftItems, rightItems, loading, error, refetch };
}
