import { Link } from 'react-router-dom';
import type { PostSummaryResponse } from '@shared';
import { formatDate } from '@/lib/utils';

export default function PostCard({ post }: { post: PostSummaryResponse }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group overflow-hidden rounded-lg border border-border transition-all hover:border-border/80 hover:shadow-md"
    >
      {post.thumbnail && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={post.thumbnail}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <h2 className="mb-1 font-semibold leading-snug group-hover:text-foreground/80">
          {post.title}
        </h2>
        <p className="text-sm text-muted-foreground capitalize">{post.author.name}</p>
        <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
      </div>
    </Link>
  );
}
