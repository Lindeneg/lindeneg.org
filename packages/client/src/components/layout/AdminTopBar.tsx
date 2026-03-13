import { LogOut } from 'lucide-react';
import { useAuthContext } from '@/hooks/use-auth-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AuthorAvatar from '@/components/shared/AuthorAvatar';

export default function AdminTopBar() {
  const { user, logout } = useAuthContext();

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1" />
      {user && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <AuthorAvatar name={user.name} photo={user.photo} className="h-7 w-7 text-xs" />
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      )}
    </header>
  );
}
