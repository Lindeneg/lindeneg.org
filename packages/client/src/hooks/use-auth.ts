import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginInput, UserResponse } from '@shared';
import * as authApi from '@/api/auth';
import { ApiError } from '@/lib/errors';

export interface AuthState {
  user: UserResponse | null;
  loading: boolean;
  error: ApiError | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

export function useAuth(): AuthState {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const checkAuth = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    authApi.getMe().then(
      (data) => { if (!cancelled) { setUser(data); setLoading(false); } },
      (err: unknown) => {
        if (cancelled) return;
        const apiError = err instanceof ApiError ? err : new ApiError('Something went wrong', 500);
        if (apiError.isUnauthorized) {
          setUser(null);
        } else {
          setError(apiError);
        }
        setLoading(false);
      },
    );

    return () => { cancelled = true; };
  }, []);

  useEffect(() => checkAuth(), [checkAuth]);

  const login = useCallback(async (input: LoginInput) => {
    await authApi.login(input);
    const me = await authApi.getMe();
    setUser(me);
    navigate('/admin');
  }, [navigate]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    navigate('/admin/login');
  }, [navigate]);

  return { user, loading, error, login, logout, refetch: checkAuth };
}
