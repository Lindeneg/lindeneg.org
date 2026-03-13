import { NavLink } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import {
  SheetClose,
} from '@/components/ui/sheet';

interface NavItemProps {
  item: { name: string; href: string; newTab: boolean };
  mobile?: boolean;
}

export default function NavItem({ item, mobile = false }: NavItemProps) {
  const isExternal = item.href.startsWith('http') || item.newTab;

  if (mobile) {
    const content = isExternal ? (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {item.name}
        <ExternalLink className="h-3 w-3" />
      </a>
    ) : (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          `rounded-md px-3 py-2 text-sm transition-colors ${
            isActive
              ? 'bg-accent font-medium text-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`
        }
      >
        {item.name}
      </NavLink>
    );
    return <SheetClose asChild>{content}</SheetClose>;
  }

  if (isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {item.name}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `px-3 py-1.5 text-sm transition-colors ${
          isActive
            ? 'font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`
      }
    >
      {item.name}
    </NavLink>
  );
}
