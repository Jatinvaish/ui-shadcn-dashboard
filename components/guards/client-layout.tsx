"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppDispatch } from "@/store/hooks";
import { loadUserFromCookies } from "@/store/slices/authSlice";
import { fetchMyAccessibleMenus } from "@/store/slices/menu-permissions.slice";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import GoogleAnalyticsInit from "@/lib/ga";
import { fontVariables } from "@/lib/fonts";
import NextTopLoader from "nextjs-toploader";
import { ActiveThemeProvider } from "@/components/active-theme";
import { DEFAULT_THEME } from "@/lib/themes";

import "./globals.css";
import { Toaster } from "sonner";
import ToasterProvider from "./reactToast";

// ---------------- AUTH INITIALIZER ----------------
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadUserFromCookies()).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        dispatch(fetchMyAccessibleMenus());
      }
    });
  }, [dispatch]);

  return <>{children}</>;
}

// ---------------- CLIENT ROOT LAYOUT ----------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Retrieve cookies for theme settings (runs client-side here)
  const themeSettings = {
    preset: DEFAULT_THEME.preset,
    scale: DEFAULT_THEME.scale,
    radius: DEFAULT_THEME.radius,
    contentLayout: DEFAULT_THEME.contentLayout,
  };

  const bodyAttributes = Object.fromEntries(
    Object.entries(themeSettings)
      .filter(([_, value]) => value)
      .map(([key, value]) => [
        `data-theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
        value,
      ])
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn("bg-background group/layout font-sans", fontVariables)}
        {...bodyAttributes}
      >
        <Provider store={store}>
          <AuthInitializer>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <ActiveThemeProvider initialTheme={themeSettings}>
                <NextTopLoader
                  color="var(--primary)"
                  showSpinner={false}
                  height={2}
                  shadow-sm="none"
                />
                {children}
                <Toaster />
                <ToasterProvider />
                {process.env.NODE_ENV === "production" ? (
                  <GoogleAnalyticsInit />
                ) : null}
              </ActiveThemeProvider>
            </ThemeProvider>
          </AuthInitializer>
        </Provider>
      </body>
    </html>
  );
}
