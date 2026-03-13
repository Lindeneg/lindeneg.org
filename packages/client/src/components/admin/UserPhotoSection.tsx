import { toast } from 'sonner';
import { ApiError } from '@/lib/errors';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useUserPhoto, useUploadPhoto, useDeletePhoto } from '@/hooks/use-user-photo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ImageUpload from './ImageUpload';

export default function UserPhotoSection() {
  const { user } = useAuthContext();
  const { photo, loading, refetch } = useUserPhoto();
  const { mutate: upload, loading: uploading } = useUploadPhoto();
  const { mutate: remove, loading: removing } = useDeletePhoto();

  const initials = user?.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '';

  const handleUpload = async (image: string) => {
    if (!image) return;
    try {
      await upload(image);
      toast.success('Photo updated');
      refetch();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  };

  const handleRemove = async () => {
    try {
      await remove();
      toast.success('Photo removed');
      refetch();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  };

  if (loading) return <Skeleton className="h-24 w-24 rounded-full" />;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Profile Photo</h2>
      <div className="flex items-center gap-4">
        {photo ? (
          <img src={photo} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
            {initials}
          </div>
        )}
        <div className="space-y-2">
          <ImageUpload value="" onChange={handleUpload} />
          {photo && (
            <Button variant="outline" size="sm" disabled={removing} onClick={handleRemove}>
              {removing ? 'Removing...' : 'Remove Photo'}
            </Button>
          )}
        </div>
      </div>
      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
    </div>
  );
}
