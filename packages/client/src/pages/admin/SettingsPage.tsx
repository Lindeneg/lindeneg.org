import { Separator } from '@/components/ui/separator';
import UserPhotoSection from '@/components/admin/UserPhotoSection';
import CacheSection from '@/components/admin/CacheSection';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function SettingsPage() {
  useDocumentTitle('Admin — Settings — Lindeneg');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <UserPhotoSection />
      <Separator />
      <CacheSection />
    </div>
  );
}
