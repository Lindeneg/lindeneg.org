import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateNavigation } from '@/hooks/use-admin-navigation';

interface BrandNameEditorProps {
  navigationId: string;
  currentName: string;
  onSaved: () => void;
}

export default function BrandNameEditor({ navigationId, currentName, onSaved }: BrandNameEditorProps) {
  const [name, setName] = useState(currentName);
  const { mutate: update, loading } = useUpdateNavigation();

  const handleSave = async () => {
    try {
      await update(navigationId, { brandName: name });
      toast.success('Brand name updated');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Brand Name</Label>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button size="sm" disabled={loading || name === currentName} onClick={handleSave}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
