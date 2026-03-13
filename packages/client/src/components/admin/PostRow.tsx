import { Pencil, Trash2, ImageOff } from 'lucide-react';
import type { PostSummaryResponse } from '@shared';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';

interface PostRowProps {
  post: PostSummaryResponse;
  onEdit: (post: PostSummaryResponse) => void;
  onDelete: (post: PostSummaryResponse) => void;
  onTogglePublished: (post: PostSummaryResponse) => void;
}

export default function PostRow({ post, onEdit, onDelete, onTogglePublished }: PostRowProps) {
  return (
    <TableRow>
      <TableCell>
        {post.thumbnail ? (
          <img src={post.thumbnail} alt="" className="h-8 w-12 rounded object-cover" />
        ) : (
          <div className="flex h-8 w-12 items-center justify-center rounded bg-muted">
            <ImageOff className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{post.title}</TableCell>
      <TableCell className="text-muted-foreground">/{post.slug}</TableCell>
      <TableCell>
        <Switch checked={post.published} onCheckedChange={() => onTogglePublished(post)} />
      </TableCell>
      <TableCell>{post.author.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(post.updatedAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(post)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(post)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
