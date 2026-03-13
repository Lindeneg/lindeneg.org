import { useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { DEFAULT_PAGE_SIZE } from '@shared';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorState from '@/components/shared/ErrorState';
import MessageList from '@/components/admin/MessageList';
import Pagination from '@/components/admin/Pagination';
import { useMessages } from '@/hooks/use-messages';
import { useDocumentTitle } from '@/hooks/use-document-title';

function MessagesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
    </div>
  );
}

export default function MessagesPage() {
  useDocumentTitle('Admin — Messages — Lindeneg');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const { data: paginated, loading, error, refetch } = useMessages(page, DEFAULT_PAGE_SIZE);

  if (loading) return <MessagesSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!paginated) return null;

  if (paginated.data.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <div className="py-16 text-center">
          <Mail className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No messages yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      <MessageList messages={paginated.data} onChanged={refetch} />
      <Pagination page={page} totalPages={paginated.totalPages} onPageChange={(p) => setSearchParams({ page: String(p) })} />
    </div>
  );
}
