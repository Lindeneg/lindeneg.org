import type { PostSummaryResponse } from '@shared';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PostRow from './PostRow';

interface PostTableProps {
  posts: PostSummaryResponse[];
  onEdit: (post: PostSummaryResponse) => void;
  onDelete: (post: PostSummaryResponse) => void;
  onTogglePublished: (post: PostSummaryResponse) => void;
}

export default function PostTable({ posts, onEdit, onDelete, onTogglePublished }: PostTableProps) {
  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Thumbnail</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Published</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <PostRow key={post.id} post={post} onEdit={onEdit} onDelete={onDelete} onTogglePublished={onTogglePublished} />
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
