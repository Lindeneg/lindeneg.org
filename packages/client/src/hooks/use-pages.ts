import {
  listPages,
  createPage,
  updatePage,
  deletePage,
  createSection,
  updateSection,
  deleteSection,
} from '@/api/pages';
import type {
  CreatePageInput,
  UpdatePageInput,
  CreateSectionInput,
  UpdateSectionInput,
} from '@shared';
import { useQuery } from './use-query';
import { useMutation } from './use-mutation';

export function usePageList(page: number, pageSize: number) {
  return useQuery(() => listPages({ page, pageSize }), [page, pageSize]);
}

export function useCreatePage() {
  return useMutation((input: CreatePageInput) => createPage(input));
}

export function useUpdatePage() {
  return useMutation((id: string, input: UpdatePageInput) => updatePage(id, input));
}

export function useDeletePage() {
  return useMutation((id: string) => deletePage(id));
}

export function useCreateSection() {
  return useMutation((input: CreateSectionInput) => createSection(input));
}

export function useUpdateSection() {
  return useMutation((id: string, input: UpdateSectionInput) => updateSection(id, input));
}

export function useDeleteSection() {
  return useMutation((id: string) => deleteSection(id));
}
