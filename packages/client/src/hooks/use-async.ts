import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/errors';

export interface AsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

type InternalState<T> =
  | { status: 'loading'; key: string }
  | { status: 'ok'; data: T; key: string }
  | { status: 'error'; error: ApiError; key: string };

export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]): AsyncResult<T> {
  const [retryCount, setRetryCount] = useState(0);
  const key = JSON.stringify([...deps, retryCount]);
  const [state, setState] = useState<InternalState<T>>({ status: 'loading', key });

  useEffect(() => {
    let cancelled = false;

    fn().then(
      (data) => {
        if (!cancelled) setState({ status: 'ok', data, key });
      },
      (err: unknown) => {
        if (cancelled) return;
        const apiError = err instanceof ApiError ? err : new ApiError('Something went wrong', 500);
        setState({ status: 'error', error: apiError, key });
      },
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const refetch = useCallback(() => setRetryCount((c) => c + 1), []);

  if (state.key !== key || state.status === 'loading') {
    return { data: null, loading: true, error: null, refetch };
  }
  if (state.status === 'error') {
    return { data: null, loading: false, error: state.error, refetch };
  }
  return { data: state.data, loading: false, error: null, refetch };
}
