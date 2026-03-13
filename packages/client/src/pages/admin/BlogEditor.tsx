import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { PostSummaryResponse, PostResponse, CreatePostInput } from '@shared';
import { DEFAULT_PAGE_SIZE } from '@shared';
import { ApiError } from '@/lib/errors';
import { getAdminPost } from '@/api/posts';
import { Button } from '@/components/ui/button';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import PostTable from '@/components/admin/PostTable';
import PostFormPanel from '@/components/admin/PostFormPanel';
import ConfirmDeleteDialog from '@/components/admin/ConfirmDeleteDialog';
import Pagination from '@/components/admin/Pagination';
import { useAdminPosts, useCreatePost, useUpdatePost, useDeletePost } from '@/hooks/use-admin-posts';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function BlogEditor() {
  useDocumentTitle('Admin — Blog — Lindeneg');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const { data: paginated, loading, error, refetch } = useAdminPosts(page, DEFAULT_PAGE_SIZE);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostSummaryResponse | null>(null);

  const { mutate: create, loading: creating } = useCreatePost();
  const { mutate: update, loading: updating } = useUpdatePost();
  const { mutate: remove, loading: deleting } = useDeletePost();

  const openCreate = () => { setEditingPost(null); setPanelOpen(true); };

  const openEdit = async (post: PostSummaryResponse) => {
    try { const full = await getAdminPost(post.slug); setEditingPost(full); setPanelOpen(true); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  const handleSubmit = async (input: CreatePostInput) => {
    if (editingPost) { await update(editingPost.id, input); toast.success('Post updated'); }
    else { await create(input); toast.success('Post created'); }
    setPanelOpen(false);
    refetch();
  };

  const handleToggle = async (post: PostSummaryResponse) => {
    try { await update(post.id, { published: !post.published }); refetch(); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget.id); toast.success('Post deleted'); setDeleteTarget(null); refetch(); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!paginated) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />New Post</Button>
      </div>
      {paginated.data.length === 0 ? (
        <EmptyState message="No posts yet. Create your first post." />
      ) : (
        <PostTable posts={paginated.data} onEdit={openEdit} onDelete={setDeleteTarget} onTogglePublished={handleToggle} />
      )}
      <Pagination page={page} totalPages={paginated.totalPages} onPageChange={(p) => setSearchParams({ page: String(p) })} />
      <PostFormPanel open={panelOpen} onOpenChange={setPanelOpen} post={editingPost} loading={creating || updating} onSubmit={handleSubmit} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} itemName={deleteTarget?.title ?? ''} loading={deleting} onConfirm={handleDelete} />
    </div>
  );
}
