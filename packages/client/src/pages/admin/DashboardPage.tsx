import { Link } from 'react-router-dom';
import { FileText, PenLine, Mail, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ErrorState from '@/components/shared/ErrorState';
import StatCard from '@/components/admin/StatCard';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useDocumentTitle } from '@/hooks/use-document-title';

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  useDocumentTitle('Admin — Dashboard — Lindeneg');
  const { data: stats, loading, error, refetch } = useDashboardStats();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {loading ? (
        <StatsSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={FileText} label="Pages" count={stats.pageCount} />
          <StatCard icon={PenLine} label="Posts" count={stats.postCount} />
          <StatCard icon={Mail} label="Messages" count={stats.messageCount} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button asChild size="sm">
          <Link to="/admin/pages"><Plus className="mr-1.5 h-4 w-4" />New Page</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/blog"><Plus className="mr-1.5 h-4 w-4" />New Post</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-4 w-4" />View Site
          </a>
        </Button>
      </div>
    </div>
  );
}
