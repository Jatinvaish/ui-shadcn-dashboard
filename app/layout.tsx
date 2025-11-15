// app/layout.tsx - Fix hydration + Provider order

"use client";

import React, { useEffect, useState, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadUserFromCookies, selectAuthInitialized, selectIsAuthenticated } from "@/store/slices/authSlice";
import { fetchMyAccessibleMenus, selectMenuPermissionsInitialized } from "@/store/slices/menu-permissions.slice";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { fontVariables } from "@/lib/fonts";
import NextTopLoader from "nextjs-toploader";
import { ActiveThemeProvider } from "@/components/active-theme";
import { DEFAULT_THEME } from "@/lib/themes";
import "./globals.css";
import { Toaster } from "sonner";
import ToasterProvider from "@/components/guards/reactToast";
import '../lib/axios-interceptor';

const PUBLIC_ROUTES = [
  '/sign-in', '/', '/sign-up', '/login', '/register',
  '/forgot-password', '/reset-password', '/verify',
  '/verify-email', '/auth', '/errors', '/_next', '/api',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const authInitialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const permissionsInitialized = useAppSelector(selectMenuPermissionsInitialized);
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const initStartedRef = useRef(false);
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initStartedRef.current) return;
    
    if (isPublic) {
      setIsInitializing(false);
      return;
    }

    const initAuth = async () => {
      initStartedRef.current = true;
      
      try {
        const userResult = await dispatch(loadUserFromCookies()).unwrap();
        if (!userResult?.user) {
          setIsInitializing(false);
          return;
        }
        
        await dispatch(fetchMyAccessibleMenus()).unwrap();
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [dispatch, isPublic]);

  if (!mounted) return null;
  if (isPublic) return <>{children}</>;

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authInitialized) return null;
  if (isAuthenticated && !permissionsInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeSettings = {
    preset: DEFAULT_THEME.preset,
    scale: DEFAULT_THEME.scale,
    radius: DEFAULT_THEME.radius,
    contentLayout: DEFAULT_THEME.contentLayout,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={cn("bg-background group/layout font-sans", fontVariables)}>
        <Provider store={store}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <ActiveThemeProvider initialTheme={themeSettings}>
              <AuthInitializer>
                <NextTopLoader color="var(--primary)" showSpinner={false} height={2} />
                {children}
                <Toaster />
                <ToasterProvider />
              </AuthInitializer>
            </ActiveThemeProvider>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}