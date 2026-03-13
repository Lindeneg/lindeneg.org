import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Navigation,
  PenSquare,
  MessageSquare,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pages', label: 'Pages', icon: FileText, end: false },
  { to: '/admin/navigation', label: 'Navigation', icon: Navigation, end: false },
  { to: '/admin/blog', label: 'Blog', icon: PenSquare, end: false },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare, end: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
] as const;

export default function AdminSidebar() {

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold tracking-tight"
        >
          Admin
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      end={item.end ?? false}
                      className={({ isActive }) =>
                        isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
