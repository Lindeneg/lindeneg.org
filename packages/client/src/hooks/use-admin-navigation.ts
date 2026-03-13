import { useCallback } from 'react';
import {
  getNavigation,
  updateNavigation,
  createNavItem,
  updateNavItem,
  deleteNavItem,
} from '@/api/navigation';
import type { CreateNavItemInput, UpdateNavItemInput, UpdateNavigationInput } from '@shared';
import { useQuery } from './use-query';
import { useMutation } from './use-mutation';

export function useNavigationData() {
  return useQuery(() => getNavigation(), []);
}

export function useUpdateNavigation() {
  return useMutation(
    useCallback((id: string, input: UpdateNavigationInput) => updateNavigation(id, input), []),
  );
}

export function useCreateNavItem() {
  return useMutation(useCallback((input: CreateNavItemInput) => createNavItem(input), []));
}

export function useUpdateNavItem() {
  return useMutation(
    useCallback((id: string, input: UpdateNavItemInput) => updateNavItem(id, input), []),
  );
}

export function useDeleteNavItem() {
  return useMutation(useCallback((id: string) => deleteNavItem(id), []));
}
