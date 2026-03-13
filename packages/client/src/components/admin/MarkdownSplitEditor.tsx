import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

interface MarkdownSplitEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownSplitEditor({ value, onChange }: MarkdownSplitEditorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-75 font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="min-h-75 rounded-md border p-4">
          <MarkdownRenderer content={value} />
        </div>
      </div>
    </div>
  );
}
