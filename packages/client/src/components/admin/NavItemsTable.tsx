import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { NavigationResponse, NavigationItemResponse, CreateNavItemInput } from '@shared';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import NavItemFormDialog from './NavItemFormDialog';
import NavItemRow from './NavItemRow';
import { useCreateNavItem, useUpdateNavItem, useDeleteNavItem } from '@/hooks/use-admin-navigation';

interface Props { navigation: NavigationResponse; onRefetch: () => void; }

export default function NavItemsTable({ navigation, onRefetch }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItemResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NavigationItemResponse | null>(null);

  const { mutate: create, loading: creating } = useCreateNavItem();
  const { mutate: update, loading: updating } = useUpdateNavItem();
  const { mutate: remove, loading: deleting } = useDeleteNavItem();

  const sorted = [...navigation.items].sort((a, b) => a.position - b.position);

  const openCreate = () => { setEditingItem(null); setFormOpen(true); };
  const openEdit = (item: NavigationItemResponse) => { setEditingItem(item); setFormOpen(true); };

  const handleSubmit = async (data: Omit<CreateNavItemInput, 'navigationId'>) => {
    if (editingItem) {
      await update(editingItem.id, data);
      toast.success('Nav item updated');
    } else {
      await create({ ...data, navigationId: navigation.id });
      toast.success('Nav item created');
    }
    setFormOpen(false);
    onRefetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      toast.success('Nav item deleted');
      setDeleteTarget(null);
      onRefetch();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Navigation Items</h3>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />Add Item
        </Button>
      </div>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Href</TableHead>
            <TableHead className="text-center">Position</TableHead>
            <TableHead>Alignment</TableHead>
            <TableHead>New Tab</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => (
            <NavItemRow key={item.id} item={item} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </TableBody>
      </Table>
      </div>
      <NavItemFormDialog open={formOpen} onOpenChange={setFormOpen} item={editingItem} loading={creating || updating} onSubmit={handleSubmit} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} itemName={deleteTarget?.name ?? ''} loading={deleting} onConfirm={handleDelete} />
    </div>
  );
}
