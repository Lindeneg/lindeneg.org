import { Pencil, Trash2 } from 'lucide-react';
import type { PageResponse } from '@shared';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PageTableProps {
  pages: PageResponse[];
  onEdit: (page: PageResponse) => void;
  onDelete: (page: PageResponse) => void;
  onTogglePublished: (page: PageResponse) => void;
  onManageSections: (page: PageResponse) => void;
}

export default function PageTable({
  pages,
  onEdit,
  onDelete,
  onTogglePublished,
  onManageSections,
}: PageTableProps) {
  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Published</TableHead>
          <TableHead className="text-center">Sections</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page) => (
          <TableRow key={page.id}>
            <TableCell className="font-medium">{page.name}</TableCell>
            <TableCell className="text-muted-foreground">{page.slug}</TableCell>
            <TableCell>
              <Switch
                checked={page.published}
                onCheckedChange={() => onTogglePublished(page)}
              />
            </TableCell>
            <TableCell className="text-center">
              <Button variant="ghost" size="sm" onClick={() => onManageSections(page)}>
                {page.sections.length}
              </Button>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(page.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(page)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(page)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
