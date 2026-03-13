import { Pencil, Trash2 } from 'lucide-react';
import type { PageSectionResponse } from '@shared';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface SectionRowProps {
  section: PageSectionResponse;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export default function SectionRow({ section, onEdit, onDelete, onToggle }: SectionRowProps) {
  const preview = section.content.slice(0, 80) + (section.content.length > 80 ? '...' : '');
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <span className="text-xs text-muted-foreground">#{section.position}</span>
      <Switch checked={section.published} onCheckedChange={onToggle} />
      <span className="flex-1 truncate text-sm">{preview}</span>
      <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}
