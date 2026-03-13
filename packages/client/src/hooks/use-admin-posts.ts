import { useCallback } from 'react';
import { listAdminPosts, createPost, updatePost, deletePost } from '@/api/posts';
import type { CreatePostInput, UpdatePostInput } from '@shared';
import { useQuery } from './use-query';
import { useMutation } from './use-mutation';

export function useAdminPosts(page: number, pageSize: number) {
  return useQuery(() => listAdminPosts({ page, pageSize }), [page, pageSize]);
}

export function useCreatePost() {
  return useMutation(useCallback((input: CreatePostInput) => createPost(input), []));
}

export function useUpdatePost() {
  return useMutation(
    useCallback((id: string, input: UpdatePostInput) => updatePost(id, input), []),
  );
}

export function useDeletePost() {
  return useMutation(useCallback((id: string) => deletePost(id), []));
}
