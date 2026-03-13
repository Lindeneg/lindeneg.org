import api from './client';

export async function getPhoto(): Promise<{ photo: string | null }> {
  const { data } = await api.get<{ photo: string | null }>('/admin/user/photo');
  return data;
}

export async function uploadPhoto(image: string): Promise<{ photo: string }> {
  const { data } = await api.post<{ photo: string }>('/admin/user/photo', { image });
  return data;
}

export async function deletePhoto(): Promise<void> {
  await api.delete('/admin/user/photo');
}

export async function bustCache(): Promise<void> {
  await api.post('/admin/bust-cache');
}
