// ==================== context.tsx ====================
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { TooltipProvider } from '@/components/ui/tooltip';

const HEADER_HEIGHT = "60px";
const SIDEBAR_WIDTH = "300px";
const SIDEBAR_COLLAPSED_WIDTH = "60px";
const TOOLBAR_HEIGHT = "54px";

interface LayoutState {
  style: React.CSSProperties;
  bodyClassName: string;
  isMobile: boolean;
  isSidebarOpen: boolean;
  sidebarToggle: () => void;
  activeSecondaryMenu: string;
  setActiveSecondaryMenu: (menu: string) => void;
  showSecondarySidebar: boolean;
  setShowSecondarySidebar: (show: boolean) => void;
}

const LayoutContext = createContext<LayoutState | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
  style?: React.CSSProperties;
  bodyClassName?: string;
}

export function LayoutProvider({ children, style: customStyle, bodyClassName = '' }: LayoutProviderProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSecondaryMenu, setActiveSecondaryMenu] = useState('dashboard');
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(false);

  const defaultStyle: React.CSSProperties = {
    '--sidebar-width': SIDEBAR_WIDTH,
    '--sidebar-collapsed-width': SIDEBAR_COLLAPSED_WIDTH,
    '--header-height': HEADER_HEIGHT,
    '--toolbar-height': TOOLBAR_HEIGHT,
  } as React.CSSProperties;

  const style: React.CSSProperties = {
    ...defaultStyle,
    ...customStyle,
  };

  const sidebarToggle = () => setIsSidebarOpen((open) => !open);

  useEffect(() => {
    if (bodyClassName) {
      const body = document.body;
      const existingClasses = body.className;
      body.className = `${existingClasses} ${bodyClassName}`.trim();
      return () => {
        body.className = existingClasses;
      };
    }
  }, [bodyClassName]);

  return (
    <LayoutContext.Provider
      value={{
        bodyClassName,
        style,
        isMobile,
        isSidebarOpen,
        sidebarToggle,
        activeSecondaryMenu,
        setActiveSecondaryMenu,
        showSecondarySidebar,
        setShowSecondarySidebar
      }}
    >
      <div
        data-slot="layout-wrapper"
        className="flex grow"
        data-sidebar-open={isSidebarOpen}
        data-show-secondary-sidebar={showSecondarySidebar}
        style={style}
      >
        <TooltipProvider delayDuration={0}>
          {children}
        </TooltipProvider>
      </div>
    </LayoutContext.Provider>
  );
}

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};