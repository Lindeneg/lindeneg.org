import { createContext } from 'react';
import type { AuthState } from '@/hooks/use-auth';

export const AuthContext = createContext<AuthState | null>(null);
