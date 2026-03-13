import { LogOut } from 'lucide-react';
import { useAuthContext } from '@/hooks/use-auth-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
            <UserInitials name={user.name} photo={user.photo} />
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

function UserInitials({ name, photo }: { name: string; photo: string | null }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  if (photo) {
    return <img src={photo} alt={name} className="h-7 w-7 rounded-full object-cover" />;
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {initials}
    </div>
  );
}
