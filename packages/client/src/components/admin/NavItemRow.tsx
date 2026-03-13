import { Pencil, Trash2 } from 'lucide-react';
import type { NavigationItemResponse } from '@shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';

interface NavItemRowProps {
  item: NavigationItemResponse;
  onEdit: (item: NavigationItemResponse) => void;
  onDelete: (item: NavigationItemResponse) => void;
}

export default function NavItemRow({ item, onEdit, onDelete }: NavItemRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="text-muted-foreground">{item.href}</TableCell>
      <TableCell className="text-center">{item.position}</TableCell>
      <TableCell><Badge variant="outline">{item.alignment}</Badge></TableCell>
      <TableCell>{item.newTab ? 'Yes' : 'No'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
