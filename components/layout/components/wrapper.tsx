// wrapper.tsx - DYNAMIC PADDING BASED ON SECONDARY SIDEBAR
import { useLayout } from './context';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { HeaderBreadcrumbs } from './header-breadcrumbs';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function Wrapper({ children }: { children: React.ReactNode }) {
  const { isMobile, showSecondarySidebar, isSidebarOpen } = useLayout();
  const [enableTransitions, setEnableTransitions] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEnableTransitions(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden w-full">
      <Header />
      {!isMobile && <Sidebar />}      

      <div className={cn(
        'flex-1 overflow-hidden',
        showSecondarySidebar 
          ? 'lg:ps-[var(--sidebar-width)] lg:in-data-[sidebar-open=false]:ps-[var(--sidebar-collapsed-width)]'
          : 'lg:ps-[var(--sidebar-collapsed-width)]',
        enableTransitions ? 'transition-all duration-300' : 'transition-none'
      )}>
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