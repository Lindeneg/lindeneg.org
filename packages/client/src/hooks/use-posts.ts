import { listPublicPosts } from '@/api/posts';
import { getPost } from '@/api/posts';
import { useAsync } from './use-async';

export function usePublicPosts(page: number, pageSize: number) {
  return useAsync(() => listPublicPosts({ page, pageSize }), [page, pageSize]);
}

export function usePost(slug: string) {
  return useAsync(() => getPost(slug), [slug]);
}
