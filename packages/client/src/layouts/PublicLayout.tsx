import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import DynamicNav from '@/components/layout/DynamicNav';
import Footer from '@/components/layout/Footer';

export default function PublicLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(4px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DynamicNav />
      <main ref={mainRef} className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
