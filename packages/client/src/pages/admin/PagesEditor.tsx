import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { PageResponse, CreatePageInput } from '@shared';
import { DEFAULT_PAGE_SIZE } from '@shared';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import PageTable from '@/components/admin/PageTable';
import PageFormDialog from '@/components/admin/PageFormDialog';
import ConfirmDeleteDialog from '@/components/admin/ConfirmDeleteDialog';
import SectionList from '@/components/admin/SectionList';
import Pagination from '@/components/admin/Pagination';
import { usePageList, useCreatePage, useUpdatePage, useDeletePage } from '@/hooks/use-pages';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function PagesEditor() {
  useDocumentTitle('Admin — Pages — Lindeneg');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const { data: paginated, loading, error, refetch } = usePageList(page, DEFAULT_PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageResponse | null>(null);
  const [sectionsPage, setSectionsPage] = useState<PageResponse | null>(null);

  const { mutate: create, loading: creating } = useCreatePage();
  const { mutate: update, loading: updating } = useUpdatePage();
  const { mutate: remove, loading: deleting } = useDeletePage();

  const openCreate = () => { setEditingPage(null); setFormOpen(true); };
  const openEdit = (p: PageResponse) => { setEditingPage(p); setFormOpen(true); };

  const handleSubmit = async (input: CreatePageInput) => {
    if (editingPage) { await update(editingPage.id, input); toast.success('Page updated'); }
    else { await create(input); toast.success('Page created'); }
    setFormOpen(false);
    refetch();
  };

  const handleToggle = async (p: PageResponse) => {
    try { await update(p.id, { published: !p.published }); refetch(); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget.id); toast.success('Page deleted'); setDeleteTarget(null); refetch(); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  const handleSectionRefetch = useCallback(() => {
    refetch();
    // Update sectionsPage from fresh data after refetch settles
    setSectionsPage((current) => {
      if (!current || !paginated) return current;
      const fresh = paginated.data.find((p) => p.id === current.id);
      return fresh ?? current;
    });
  }, [refetch, paginated]);

  if (!sectionsPage && loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!paginated) return null;

  if (sectionsPage) {
    const freshPage = paginated.data.find((p) => p.id === sectionsPage.id) ?? sectionsPage;
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setSectionsPage(null)}>Back to Pages</Button>
        <SectionList page={freshPage} onRefetch={handleSectionRefetch} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />New Page</Button>
      </div>
      {paginated.data.length === 0 ? (
        <EmptyState message="No pages yet. Create your first page." />
      ) : (
        <PageTable pages={paginated.data} onEdit={openEdit} onDelete={setDeleteTarget} onTogglePublished={handleToggle} onManageSections={setSectionsPage} />
      )}
      <Pagination page={page} totalPages={paginated.totalPages} onPageChange={(p) => setSearchParams({ page: String(p) })} />
      <PageFormDialog open={formOpen} onOpenChange={setFormOpen} page={editingPage} loading={creating || updating} onSubmit={handleSubmit} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} itemName={deleteTarget?.name ?? ''} loading={deleting} onConfirm={handleDelete} />
    </div>
  );
}
