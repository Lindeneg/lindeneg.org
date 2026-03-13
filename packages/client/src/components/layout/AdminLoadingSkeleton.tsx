import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoadingSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 border-r border-border p-4 md:block">
        <Skeleton className="mb-8 h-6 w-32" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="mb-3 h-8 w-full" />
        ))}
      </div>
      <div className="flex-1 p-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-4 w-full" />
        <Skeleton className="mb-4 h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
