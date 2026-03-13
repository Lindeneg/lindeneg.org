import {useSearchParams} from "react-router-dom";
import {DEFAULT_PAGE_SIZE} from "@shared";
import {usePublicPosts} from "@/hooks/use-posts";
import {Button} from "@/components/ui/button";
import PostCard from "@/components/shared/PostCard";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import {BlogGridSkeleton} from "@/components/shared/PageSkeleton";
import {useDocumentTitle} from "@/hooks/use-document-title";

export default function BlogPage() {
    useDocumentTitle("Blog — Lindeneg");
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;
    const {data: paginated, loading, error, refetch} = usePublicPosts(page, DEFAULT_PAGE_SIZE);

    if (loading) return <BlogGridSkeleton />;
    if (error) return <ErrorState error={error} onRetry={refetch} />;
    if (!paginated) return null;

    return (
        <div>
            <h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>

            {paginated.data.length === 0 ? (
                <EmptyState message="No posts yet. Check back soon." />
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {paginated.data.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {paginated.totalPages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setSearchParams({page: String(page - 1)})}>
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {paginated.page} of {paginated.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= paginated.totalPages}
                                onClick={() => setSearchParams({page: String(page + 1)})}>
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
