import type {
  PaginationParams,
  Paginated,
  CreateContactInput,
  ContactMessageResponse,
  UpdateContactInput,
} from '@shared';
import api from './client';

export async function sendContact(input: CreateContactInput): Promise<void> {
  await api.post('/contact', input);
}

export async function listMessages(
  params: PaginationParams,
): Promise<Paginated<ContactMessageResponse>> {
  const { data } = await api.get<Paginated<ContactMessageResponse>>('/admin/messages', { params });
  return data;
}

export async function updateMessage(
  id: string,
  input: UpdateContactInput,
): Promise<ContactMessageResponse> {
  const { data } = await api.patch<ContactMessageResponse>(`/admin/messages/${id}`, input);
  return data;
}

export async function deleteMessage(id: string): Promise<void> {
  await api.delete(`/admin/messages/${id}`);
}
