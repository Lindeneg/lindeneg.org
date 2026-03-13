import { useCallback } from 'react';
import { getPhoto, uploadPhoto, deletePhoto, bustCache } from '@/api/user';
import { useQuery } from './use-query';
import { useMutation } from './use-mutation';

export function useUserPhoto() {
  const { data, loading, error, refetch } = useQuery(() => getPhoto(), []);
  return { photo: data?.photo ?? null, loading, error, refetch };
}

export function useUploadPhoto() {
  return useMutation(useCallback((image: string) => uploadPhoto(image), []));
}

export function useDeletePhoto() {
  return useMutation(useCallback(() => deletePhoto(), []));
}

export function useBustCache() {
  return useMutation(useCallback(() => bustCache(), []));
}
