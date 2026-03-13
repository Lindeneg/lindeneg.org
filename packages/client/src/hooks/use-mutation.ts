import { useCallback, useState } from 'react';
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

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        return result;
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError('Something went wrong', 500);
        setError(apiError);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  return { mutate, loading, error };
}
