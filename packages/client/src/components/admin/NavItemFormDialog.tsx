import { useState } from 'react';
import type { NavigationItemResponse, CreateNavItemInput } from '@shared';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FormField from './FormField';

type FormData = Omit<CreateNavItemInput, 'navigationId'>;

interface NavItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: NavigationItemResponse | null;
  loading: boolean;
  onSubmit: (data: FormData) => Promise<void>;
}

function initForm(item: NavigationItemResponse | null): FormData {
  if (item) return { name: item.name, href: item.href, position: item.position, alignment: item.alignment, newTab: item.newTab };
  return { name: '', href: '', position: 0, alignment: 'LEFT', newTab: false };
}

export default function NavItemFormDialog({ open, onOpenChange, item, loading, onSubmit }: NavItemFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <NavItemForm item={item} loading={loading} onSubmit={onSubmit} />}
      </DialogContent>
    </Dialog>
  );
}

function NavItemForm({ item, loading, onSubmit }: Pick<NavItemFormDialogProps, 'item' | 'loading' | 'onSubmit'>) {
  const [form, setForm] = useState(() => initForm(item));
  const [error, setError] = useState<ApiError | null>(null);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fe = (field: string) => error?.isValidation && error.fields?.[field] ? String(error.fields[field]) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await onSubmit(form); } catch (err) { if (err instanceof ApiError) setError(err); }
  };

  return (
    <>
      <DialogHeader><DialogTitle>{item ? 'Edit Nav Item' : 'Add Nav Item'}</DialogTitle></DialogHeader>
      {error && !error.isValidation && <p className="text-sm text-destructive">{error.message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" error={fe('name')}>
          <Input value={form.name} onChange={(e) => setField('name', e.target.value)} />
        </FormField>
        <FormField label="Href" error={fe('href')}>
          <Input value={form.href} onChange={(e) => setField('href', e.target.value)} />
        </FormField>
        <FormField label="Position" error={fe('position')}>
          <Input type="number" value={form.position} onChange={(e) => setField('position', Number(e.target.value))} />
        </FormField>
        <FormField label="Alignment" error={fe('alignment')}>
          <div className="flex gap-2">
            {(['LEFT', 'RIGHT'] as const).map((a) => (
              <Button key={a} type="button" size="sm" variant={form.alignment === a ? 'default' : 'outline'} onClick={() => setField('alignment', a)}>{a}</Button>
            ))}
          </div>
        </FormField>
        <div className="flex items-center gap-2">
          <Switch checked={form.newTab} onCheckedChange={(v) => setField('newTab', v)} />
          <Label>Open in new tab</Label>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : item ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </form>
    </>
  );
}
