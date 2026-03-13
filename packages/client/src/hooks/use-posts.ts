import { listPublicPosts } from '@/api/posts';
import { getPost } from '@/api/posts';
import { useQuery } from './use-query';

export function usePublicPosts(page: number, pageSize: number) {
  return useQuery(() => listPublicPosts({ page, pageSize }), [page, pageSize]);
}

export function usePost(slug: string) {
  return useQuery(() => getPost(slug), [slug]);
}
