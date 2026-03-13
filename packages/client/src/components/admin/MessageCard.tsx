import { useState } from 'react';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { ContactMessageResponse } from '@shared';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { useUpdateMessage, useDeleteMessage } from '@/hooks/use-messages';

interface MessageCardProps { message: ContactMessageResponse; onChanged: () => void; }

export default function MessageCard({ message, onChanged }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutate: update } = useUpdateMessage();
  const { mutate: remove, loading: deleting } = useDeleteMessage();

  const handleExpand = async () => {
    setExpanded(!expanded);
    if (!message.read) {
      try { await update(message.id, { read: true }); onChanged(); }
      catch (err) { if (err instanceof ApiError) toast.error(err.message); }
    }
  };

  const toggleRead = async () => {
    try { await update(message.id, { read: !message.read }); onChanged(); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  const handleDelete = async () => {
    try { await remove(message.id); toast.success('Message deleted'); setDeleteOpen(false); onChanged(); }
    catch (err) { if (err instanceof ApiError) toast.error(err.message); }
  };

  return (
    <Card className={message.read ? 'opacity-75' : ''}>
      <CardHeader className="cursor-pointer pb-2" onClick={handleExpand}>
        <div className="flex items-center gap-3">
          {!message.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-sm ${message.read ? '' : 'font-semibold'}`}>{message.name}</span>
              <span className="truncate text-xs text-muted-foreground">{message.email}</span>
            </div>
            {!expanded && <p className="mt-1 truncate text-sm text-muted-foreground">{message.message}</p>}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleDateString()}</span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <p className="mb-3 whitespace-pre-wrap text-sm">{message.message}</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={toggleRead}>
              {message.read ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" />Mark unread</> : <><Eye className="mr-1.5 h-3.5 w-3.5" />Mark read</>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button>
          </div>
          <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} itemName="this message" loading={deleting} onConfirm={handleDelete} />
        </CardContent>
      )}
    </Card>
  );
}
