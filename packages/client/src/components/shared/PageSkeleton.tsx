import { Skeleton } from '@/components/ui/skeleton';

export function HeroSkeleton() {
  return (
    <div className="mb-16 space-y-4">
      <Skeleton className="mx-auto h-12 w-3/4 sm:h-16" />
      <Skeleton className="mx-auto h-6 w-1/2" />
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-5/6" />
      <Skeleton className="h-5 w-4/6" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
    </div>
  );
}

export function PageSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      {Array.from({ length: sections }, (_, i) => (
        <SectionSkeleton key={i} />
      ))}
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Skeleton className="aspect-video w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

export function BlogGridSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-24" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function BlogPostSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-3/4" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}
