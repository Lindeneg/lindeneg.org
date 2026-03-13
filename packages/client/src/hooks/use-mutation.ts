import { useCallback, useRef, useState } from 'react';
import { ApiError } from '@/lib/errors';

export interface MutationResult<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: ApiError | null;
}

export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): MutationResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fnRef.current(...args);
        return result;
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError('Something went wrong', 500);
        setError(apiError);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, loading, error };
}
