import type {
  PaginationParams,
  Paginated,
  PageResponse,
  CreatePageInput,
  UpdatePageInput,
  PageSectionResponse,
  CreateSectionInput,
  UpdateSectionInput,
} from '@shared';
import api from './client';

export async function getPage(slug: string): Promise<PageResponse> {
  const { data } = await api.get<PageResponse>(`/pages/${slug}`);
  return data;
}

export async function listPages(params: PaginationParams): Promise<Paginated<PageResponse>> {
  const { data } = await api.get<Paginated<PageResponse>>('/admin/pages', { params });
  return data;
}

export async function createPage(input: CreatePageInput): Promise<PageResponse> {
  const { data } = await api.post<PageResponse>('/admin/pages', input);
  return data;
}

export async function updatePage(id: string, input: UpdatePageInput): Promise<PageResponse> {
  const { data } = await api.patch<PageResponse>(`/admin/pages/${id}`, input);
  return data;
}

export async function deletePage(id: string): Promise<void> {
  await api.delete(`/admin/pages/${id}`);
}

export async function createSection(input: CreateSectionInput): Promise<PageSectionResponse> {
  const { data } = await api.post<PageSectionResponse>('/admin/sections', input);
  return data;
}

export async function updateSection(
  id: string,
  input: UpdateSectionInput,
): Promise<PageSectionResponse> {
  const { data } = await api.patch<PageSectionResponse>(`/admin/sections/${id}`, input);
  return data;
}

export async function deleteSection(id: string): Promise<void> {
  await api.delete(`/admin/sections/${id}`);
}
