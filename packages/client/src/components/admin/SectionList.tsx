import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { PageResponse, PageSectionResponse } from '@shared';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import SectionEditor from './SectionEditor';
import SectionRow from './SectionRow';
import { useCreateSection, useUpdateSection, useDeleteSection } from '@/hooks/use-pages';

interface SectionListProps { page: PageResponse; onRefetch: () => void; }

export default function SectionList({ page, onRefetch }: SectionListProps) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageSectionResponse | null>(null);
  const { mutate: create, loading: creating } = useCreateSection();
  const { mutate: update, loading: updating } = useUpdateSection();
  const { mutate: remove, loading: deleting } = useDeleteSection();

  const sorted = [...page.sections].sort((a, b) => a.position - b.position);
  const nextPos = sorted.length > 0 ? sorted[sorted.length - 1].position + 1 : 0;

  const handleSave = async (data: { content: string; position: number; published: boolean }) => {
    try {
      if (editingId === 'new') { await create({ pageId: page.id, ...data }); toast.success('Section created'); }
      else if (editingId) { await update(editingId, data); toast.success('Section updated'); }
      setEditingId(null);
      onRefetch();
    } catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  const handleToggle = async (s: PageSectionResponse) => {
    try { await update(s.id, { published: !s.published }); onRefetch(); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget.id); toast.success('Section deleted'); setDeleteTarget(null); onRefetch(); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  if (editingId) {
    const section = editingId !== 'new' ? sorted.find((s) => s.id === editingId) : undefined;
    return <SectionEditor section={section} nextPosition={nextPos} saving={creating || updating} onSave={handleSave} onCancel={() => setEditingId(null)} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sections for {page.name}</h3>
        <Button size="sm" variant="outline" onClick={() => setEditingId('new')}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />Add Section
        </Button>
      </div>
      {sorted.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No sections yet.</p>}
      {sorted.map((s) => (
        <SectionRow key={s.id} section={s} onEdit={() => setEditingId(s.id)} onDelete={() => setDeleteTarget(s)} onToggle={() => handleToggle(s)} />
      ))}
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} itemName="this section" loading={deleting} onConfirm={handleDelete} />
    </div>
  );
}
