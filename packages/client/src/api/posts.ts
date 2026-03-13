import type {
  PaginationParams,
  Paginated,
  PostSummaryResponse,
  PostResponse,
  CreatePostInput,
  UpdatePostInput,
} from '@shared';
import api from './client';

export async function listPublicPosts(
  params: PaginationParams,
): Promise<Paginated<PostSummaryResponse>> {
  const { data } = await api.get<Paginated<PostSummaryResponse>>('/blog/posts', { params });
  return data;
}

export async function getPost(slug: string): Promise<PostResponse> {
  const { data } = await api.get<PostResponse>(`/blog/posts/${slug}`);
  return data;
}

export async function listAdminPosts(
  params: PaginationParams,
): Promise<Paginated<PostSummaryResponse>> {
  const { data } = await api.get<Paginated<PostSummaryResponse>>('/admin/posts', { params });
  return data;
}

export async function getAdminPost(slug: string): Promise<PostResponse> {
  const { data } = await api.get<PostResponse>(`/admin/posts/${slug}`);
  return data;
}

export async function createPost(input: CreatePostInput): Promise<PostResponse> {
  const { data } = await api.post<PostResponse>('/admin/posts', input);
  return data;
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<PostResponse> {
  const { data } = await api.patch<PostResponse>(`/admin/posts/${id}`, input);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/admin/posts/${id}`);
}
