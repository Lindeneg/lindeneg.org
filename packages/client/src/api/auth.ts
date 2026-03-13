import type { LoginInput, UserResponse } from '@shared';
import api from './client';

export async function login(input: LoginInput): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>('/auth/login', input);
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<UserResponse> {
  const { data } = await api.get<UserResponse>('/auth/me');
  return data;
}
