
// ==================== header.tsx ====================
import { HeaderBreadcrumbs } from './header-breadcrumbs';
import { HeaderLogo } from './header-logo';
import { HeaderToolbar } from './header-toolbar';
import { useLayout } from './context';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const { isMobile } = useLayout();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.querySelector('[role="content"]');
      if (mainContent) {
        setIsScrolled(mainContent.scrollTop > 10);
      }
    };

    const mainContent = document.querySelector('[role="content"]');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
      return () => mainContent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <header className={cn(
      'fixed z-10 top-0 left-0 right-0 flex items-stretch shrink-0 border-b h-[var(--header-height-mobile)] lg:h-[var(--header-height)] duration-300 backdrop-blur-md bg-background/80 transition-[width,height]',
    )}>
      <div className="flex-1 flex items-stretch justify-between gap-2.5 lg:ps-0 lg:pe-5">
        <div className="flex items-stretch gap-x-6">
          <HeaderLogo />
          {!isMobile && (
            <>
              <Separator orientation="vertical" className="data-[orientation=vertical]:h-4 self-center" />
              <div className="flex items-center">
                <HeaderBreadcrumbs />
              </div>
            </>
          )}
        </div>
        <div className="flex items-center pe-5 lg:pe-0">
          <HeaderToolbar />
        </div>
      </div>
    </header>
  );
}
