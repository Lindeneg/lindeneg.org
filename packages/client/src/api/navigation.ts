import type {
  NavigationResponse,
  UpdateNavigationInput,
  NavigationItemResponse,
  CreateNavItemInput,
  UpdateNavItemInput,
} from '@shared';
import api from './client';

export async function getNavigation(): Promise<NavigationResponse> {
  const { data } = await api.get<NavigationResponse>('/navigation');
  return data;
}

export async function updateNavigation(
  id: string,
  input: UpdateNavigationInput,
): Promise<NavigationResponse> {
  const { data } = await api.patch<NavigationResponse>(`/admin/navigation/${id}`, input);
  return data;
}

export async function createNavItem(input: CreateNavItemInput): Promise<NavigationItemResponse> {
  const { data } = await api.post<NavigationItemResponse>('/admin/nav-items', input);
  return data;
}

export async function updateNavItem(
  id: string,
  input: UpdateNavItemInput,
): Promise<NavigationItemResponse> {
  const { data } = await api.patch<NavigationItemResponse>(`/admin/nav-items/${id}`, input);
  return data;
}

export async function deleteNavItem(id: string): Promise<void> {
  await api.delete(`/admin/nav-items/${id}`);
}
