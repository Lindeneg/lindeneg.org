import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import type { NavigationItemResponse } from '@shared';
import { useNavigation } from '@/hooks/use-navigation';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import NavItem from './NavItem';
import MobileNav from './MobileNav';

const FALLBACK_ITEMS: NavigationItemResponse[] = [
  { id: 'home', name: 'Home', href: '/', position: 0, alignment: 'RIGHT', newTab: false },
];

export default function DynamicNav() {
  const { brandName, leftItems, rightItems, loading, error } = useNavigation();
  const { theme, toggleTheme } = useTheme();

  const displayedRight = error && rightItems.length === 0 ? FALLBACK_ITEMS : rightItems;
  const allItems = error && rightItems.length === 0
    ? FALLBACK_ITEMS
    : [...leftItems, ...rightItems];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
          >
            {brandName}
          </Link>
          {loading && <NavSkeletons />}
          {leftItems.length > 0 && (
            <div className="hidden items-center gap-1 md:flex">
              {leftItems.map((item) => <NavItem key={item.id} item={item} />)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            {loading && <NavSkeletons />}
            {displayedRight.map((item) => <NavItem key={item.id} item={item} />)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
          <MobileNav brandName={brandName} items={allItems} />
        </div>
      </div>
    </nav>
  );
}

function NavSkeletons() {
  return (
    <div className="hidden items-center gap-4 md:flex">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}
