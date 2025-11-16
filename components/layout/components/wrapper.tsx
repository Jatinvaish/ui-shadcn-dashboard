// components/layout/wrapper.tsx - DYNAMIC WIDTH
import { useLayout } from './context';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { HeaderBreadcrumbs } from './header-breadcrumbs';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function Wrapper({ children }: { children: React.ReactNode }) {
  const { isMobile, activeSecondaryMenu } = useLayout();
  const [enableTransitions, setEnableTransitions] = useState(false);

  // Adjust sidebar width based on active menu
  const sidebarWidth = activeSecondaryMenu === 'chat' 
    ? 'var(--sidebar-collapsed-width)' 
    : 'var(--sidebar-width)';

  useEffect(() => {
    const id = requestAnimationFrame(() => setEnableTransitions(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden w-full">
      <Header />
      {!isMobile && <Sidebar />}      

      <div 
        className={cn(
          'flex-1 overflow-hidden',
          enableTransitions ? 'transition-all duration-300' : 'transition-none'
        )}
        style={{
          paddingLeft: isMobile ? 0 : sidebarWidth,
        }}
      >
        <main className="h-full overflow-y-auto" role="content">
          <div className="p-5 pt-[calc(var(--header-height-mobile)+1.25rem)] lg:pt-[calc(var(--header-height)+1.25rem)]">
            {isMobile && <div className="mb-5"><HeaderBreadcrumbs /></div>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}