import { useState } from 'react';
import type { PageSectionResponse } from '@shared';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import MarkdownSplitEditor from './MarkdownSplitEditor';

interface SectionEditorProps {
  section?: PageSectionResponse;
  nextPosition: number;
  saving: boolean;
  onSave: (data: { content: string; position: number; published: boolean }) => Promise<void>;
  onCancel: () => void;
}

export default function SectionEditor({
  section,
  nextPosition,
  saving,
  onSave,
  onCancel,
}: SectionEditorProps) {
  const [content, setContent] = useState(section?.content ?? '');
  const [published, setPublished] = useState(section?.published ?? true);
  const position = section?.position ?? nextPosition;

  const handleSave = () => onSave({ content, position, published });

  return (
    <div className="space-y-4">
      <MarkdownSplitEditor value={content} onChange={setContent} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={published} onCheckedChange={setPublished} />
          <Label>Published</Label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save Section'}
          </Button>
        </div>
      </div>
    </div>
  );
}
