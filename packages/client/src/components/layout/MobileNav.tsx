import { Menu } from 'lucide-react';
import type { NavigationItemResponse } from '@shared';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import NavItem from './NavItem';

interface MobileNavProps {
  brandName: string;
  items: NavigationItemResponse[];
}

export default function MobileNav({ brandName, items }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetHeader>
          <SheetTitle>{brandName}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4">
          {items.map((item) => (
            <NavItem key={item.id} item={item} mobile />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
