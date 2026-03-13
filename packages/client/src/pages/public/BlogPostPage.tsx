import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePost } from '@/hooks/use-posts';
import { formatDate, readingTime } from '@/lib/utils';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import AuthorAvatar from '@/components/shared/AuthorAvatar';
import ErrorState from '@/components/shared/ErrorState';
import { BlogPostSkeleton } from '@/components/shared/PageSkeleton';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, loading, error, refetch } = usePost(slug!);
  useDocumentTitle(post ? `${post.title} — Lindeneg` : 'Blog — Lindeneg');

  if (loading) return <BlogPostSkeleton />;

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        notFoundTitle="Post not found"
        notFoundMessage="This blog post doesn't exist or has been removed."
        notFoundLink={{ to: '/blog', label: 'Back to blog' }}
      />
    );
  }

  if (!post) return null;

  return (
    <article>
      <Link
        to="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to blog
      </Link>

      <header className="mb-10">
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {post.title}
        </h1>
        <div className="flex items-center gap-3">
          <AuthorAvatar name={post.author.name} photo={post.author.photo} />
          <div>
            <p className="text-sm font-medium capitalize">{post.author.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(post.createdAt, 'long')} &middot; {readingTime(post.content)}
            </p>
          </div>
        </div>
      </header>

      <MarkdownRenderer content={post.content} />
    </article>
  );
}
