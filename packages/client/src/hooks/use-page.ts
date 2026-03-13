import { getPage } from '@/api/pages';
import { useAsync } from './use-async';

export function usePage(slug: string) {
  return useAsync(() => getPage(slug), [slug]);
}
