import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/hooks/use-auth-context';
import ErrorState from '@/components/shared/ErrorState';
import AdminLayout from './AdminLayout';
import AdminLoadingSkeleton from './AdminLoadingSkeleton';

export default function AuthGuard() {
  const { user, loading, error, refetch } = useAuthContext();

  if (loading) return <AdminLoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
