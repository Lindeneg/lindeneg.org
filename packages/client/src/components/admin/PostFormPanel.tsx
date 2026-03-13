import { useState } from 'react';
import type { PostResponse, CreatePostInput } from '@shared';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import FormField from './FormField';
import MarkdownSplitEditor from './MarkdownSplitEditor';
import ImageUpload from './ImageUpload';

interface PostFormPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostResponse | null;
  loading: boolean;
  onSubmit: (input: CreatePostInput) => Promise<void>;
}

function initForm(post: PostResponse | null): CreatePostInput {
  if (post) return { title: post.title, content: post.content, published: post.published, thumbnail: post.thumbnail };
  return { title: '', content: '', published: false, thumbnail: '' };
}

export default function PostFormPanel({ open, onOpenChange, post, loading, onSubmit }: PostFormPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-[75vw] data-[side=right]:lg:max-w-[60vw] overflow-y-auto">
        {open && <PostForm post={post} loading={loading} onSubmit={onSubmit} />}
      </SheetContent>
    </Sheet>
  );
}

function PostForm({ post, loading, onSubmit }: Pick<PostFormPanelProps, 'post' | 'loading' | 'onSubmit'>) {
  const [form, setForm] = useState(() => initForm(post));
  const [error, setError] = useState<ApiError | null>(null);

  const setField = <K extends keyof CreatePostInput>(key: K, value: CreatePostInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fe = (field: string) => error?.isValidation && error.fields?.[field] ? String(error.fields[field]) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await onSubmit(form); } catch (err) { if (err instanceof ApiError) setError(err); }
  };

  return (
    <>
      <SheetHeader><SheetTitle>{post ? 'Edit Post' : 'New Post'}</SheetTitle></SheetHeader>
      {error && !error.isValidation && <p className="px-4 text-sm text-destructive">{error.message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 p-4 pt-0">
        <FormField label="Title" error={fe('title')}>
          <Input value={form.title} onChange={(e) => setField('title', e.target.value)} />
        </FormField>
        <div className="flex items-center gap-2">
          <Switch checked={form.published} onCheckedChange={(v) => setField('published', v)} />
          <Label>Published</Label>
        </div>
        <div className="space-y-1">
          <Label>Thumbnail</Label>
          <ImageUpload value={form.thumbnail ?? ''} onChange={(v) => setField('thumbnail', v)} />
        </div>
        <MarkdownSplitEditor value={form.content} onChange={(v) => setField('content', v)} />
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : post ? 'Update' : 'Create'}</Button>
      </form>
    </>
  );
}
