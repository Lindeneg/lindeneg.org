import { getPage } from '@/api/pages';
import { useQuery } from './use-query';

export function usePage(slug: string) {
  return useQuery(() => getPage(slug), [slug]);
}
