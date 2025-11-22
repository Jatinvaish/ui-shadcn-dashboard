// middleware.ts - UPDATED FOR MVP
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route configurations
const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/accept-invitation",
  "/auth", // For OAuth callbacks
];

const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/accept-invitation",
  "/verify"
];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/settings"
];

const ONBOARDING_REQUIRED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes, static files, and public assets
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/" // Allow homepage
  ) {
    return NextResponse.next();
  }

  // Get tokens and user data from cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const userCookie = request.cookies.get("user")?.value;

  // Check route type
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const requiresOnboarding = ONBOARDING_REQUIRED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // ==================== CASE 1: No Access Token ====================
  if (!accessToken) {
    // Allow public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect to sign-in for protected routes
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";

    // Add redirect parameter for protected routes
    if (isProtectedRoute) {
      url.searchParams.set("session_expired", "true");
      url.searchParams.set("redirect", pathname);
    }

    return NextResponse.redirect(url);
  }

  // ==================== CASE 2: Parse User Data ====================
  let userData: any = null;
  try {
    if (userCookie) {
      userData = JSON.parse(userCookie);
    }
  } catch (e) {
    console.error("[Middleware] Failed to parse user cookie:", e);

    // Invalid user cookie - clear auth and redirect
    const response = NextResponse.redirect(
      new URL("/sign-in?error=invalid_session", request.url)
    );
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    response.cookies.delete("user");
    return response;
  }

  // If we have a token but no user data, something is wrong
  if (!userData && !isPublicRoute) {
    const response = NextResponse.redirect(
      new URL("/sign-in?error=invalid_session", request.url)
    );
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    response.cookies.delete("user");
    return response;
  }

  // ==================== CASE 3: Check Onboarding Status ====================
  const onboardingComplete =
    userData?.onboardingRequired === false ||
    userData?.onboardingCompleted === true;

  // User needs onboarding but trying to access protected routes
  if (onboardingComplete && pathname === "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // User needs onboarding but trying to access protected routes
  if (!onboardingComplete && requiresOnboarding && pathname !== "/onboarding") {
    // ✅ Exception: if user just accepted invitation, allow dashboard access
    const justAcceptedInvitation = request.headers.get('x-invitation-accepted') === 'true';

    if (justAcceptedInvitation) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }
  // ==================== CASE 4: Authenticated User on Auth Routes ====================
  if (isAuthRoute && accessToken && userData) {
    const url = request.nextUrl.clone();
    url.pathname = onboardingComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  // ==================== CASE 5: Allow Access ====================
  const response = NextResponse.next();

  // Add user context headers for server components (optional)
  if (userData) {
    response.headers.set("x-user-id", String(userData.id || ""));
    response.headers.set("x-user-email", userData.email || "");
    response.headers.set("x-user-type", userData.userType || "");
    response.headers.set("x-onboarding-complete", String(onboardingComplete));

    // Add tenant/organization ID if available
    if (userData.tenantId) {
      response.headers.set("x-tenant-id", String(userData.tenantId));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};