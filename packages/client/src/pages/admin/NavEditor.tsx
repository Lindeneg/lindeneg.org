import { Skeleton } from '@/components/ui/skeleton';
import ErrorState from '@/components/shared/ErrorState';
import BrandNameEditor from '@/components/admin/BrandNameEditor';
import NavItemsTable from '@/components/admin/NavItemsTable';
import { useNavigationData } from '@/hooks/use-admin-navigation';
import { useDocumentTitle } from '@/hooks/use-document-title';

function NavSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function NavEditor() {
  useDocumentTitle('Admin — Navigation — Lindeneg');
  const { data: navigation, loading, error, refetch } = useNavigationData();

  if (loading) return <NavSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!navigation) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
      <BrandNameEditor
        navigationId={navigation.id}
        currentName={navigation.brandName}
        onSaved={refetch}
      />
      <NavItemsTable navigation={navigation} onRefetch={refetch} />
    </div>
  );
}
