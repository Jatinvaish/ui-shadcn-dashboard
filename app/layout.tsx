// app/layout.tsx - REMOVE duplicate permission calls
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadUserFromCookies, selectAuthInitialized } from "@/store/slices/authSlice";
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
import { isPublicRoute } from '@/lib/route-menu-map';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const authInitialized = useAppSelector(selectAuthInitialized);
  
  const [mounted, setMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const initStartedRef = useRef(false);
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initStartedRef.current) return;
    
    const initAuth = async () => {
      initStartedRef.current = true;
      
      if (isPublic) {
        console.log('✅ Public route - skip auth');
        setAuthLoading(false);
        return;
      }

      console.log('🔄 Loading user from cookies...');
      
      try {
        setAuthLoading(true);
        await dispatch(loadUserFromCookies()).unwrap();
        console.log('✅ User loaded');
      } catch (error: any) {
        console.error('❌ Auth load error:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [dispatch, isPublic]);

  if (!mounted) return null;
  
  if (isPublic) return <>{children}</>;
  
  if (authLoading || !authInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
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