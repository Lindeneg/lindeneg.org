import { toast } from 'sonner';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { useBustCache } from '@/hooks/use-user-photo';

export default function CacheSection() {
  const { mutate: bust, loading } = useBustCache();

  const handleClear = async () => {
    try {
      await bust();
      toast.success('Cache cleared');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Cache</h2>
      <p className="text-sm text-muted-foreground">
        Clear the server response cache. Use after making changes that should be immediately visible.
      </p>
      <Button variant="outline" size="sm" disabled={loading} onClick={handleClear}>
        {loading ? 'Clearing...' : 'Clear Cache'}
      </Button>
    </div>
  );
}
