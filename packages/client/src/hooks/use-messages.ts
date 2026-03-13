import { useCallback } from 'react';
import { listMessages, updateMessage, deleteMessage } from '@/api/contact';
import type { UpdateContactInput } from '@shared';
import { useQuery } from './use-query';
import { useMutation } from './use-mutation';

export function useMessages(page: number, pageSize: number) {
  return useQuery(() => listMessages({ page, pageSize }), [page, pageSize]);
}

export function useUpdateMessage() {
  return useMutation(
    useCallback((id: string, input: UpdateContactInput) => updateMessage(id, input), []),
  );
}

export function useDeleteMessage() {
  return useMutation(useCallback((id: string) => deleteMessage(id), []));
}
