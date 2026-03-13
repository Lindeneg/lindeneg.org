import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ApiError } from '@/lib/errors';

interface ErrorStateProps {
  error: ApiError;
  onRetry?: () => void;
  notFoundTitle?: string;
  notFoundMessage?: string;
  notFoundLink?: { to: string; label: string };
}

export default function ErrorState({
  error,
  onRetry,
  notFoundTitle = 'Page not found',
  notFoundMessage = "The page you're looking for doesn't exist.",
  notFoundLink = { to: '/', label: 'Go home' },
}: ErrorStateProps) {
  if (error.isNotFound) {
    return (
      <div className="py-24 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">{notFoundTitle}</h1>
        <p className="mb-8 text-muted-foreground">{notFoundMessage}</p>
        <Link
          to={notFoundLink.to}
          className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          {notFoundLink.label}
        </Link>
      </div>
    );
  }

  return (
    <div className="py-24 text-center">
      <AlertCircle className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
      <p className="mb-6 text-muted-foreground">{error.message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
