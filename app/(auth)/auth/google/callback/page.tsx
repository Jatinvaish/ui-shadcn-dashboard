// app/auth/callback/page.tsx - Updated UI to match sign-in
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const userParam = searchParams.get("user");
        const errorParam = searchParams.get("error");

        if (errorParam) {
          const errorMessages: Record<string, string> = {
            google_auth_cancelled: "Google sign-in was cancelled",
            google_auth_failed: "Google authentication failed",
            microsoft_auth_cancelled: "Microsoft sign-in was cancelled",
            microsoft_auth_failed: "Microsoft authentication failed",
          };
          
          setError(errorMessages[errorParam] || "Authentication failed");
          setTimeout(() => router.push("/sign-in"), 3000);
          return;
        }

        if (!accessToken || !refreshToken || !userParam) {
          console.error("❌ Missing auth data in callback");
          setError("Authentication data missing");
          setTimeout(() => router.push("/sign-in"), 3000);
          return;
        }

        const user = JSON.parse(decodeURIComponent(userParam));
        console.log("✅ Social auth successful:", user.email);

        // Store in cookies
        Cookies.set("accessToken", accessToken, { expires: 7, path: "/" });
        Cookies.set("refreshToken", refreshToken, { expires: 7, path: "/" });
        Cookies.set("user", JSON.stringify(user), { expires: 7, path: "/" });

        // Update Redux store
        dispatch(setUser(user));

        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirect based on onboarding status
        if (user.onboardingRequired) {
          console.log("→ Redirecting to onboarding");
          router.push("/onboarding");
        } else {
          console.log("→ Redirecting to dashboard");
          router.push("/dashboard");
        }
      } catch (err: any) {
        console.error("❌ Callback error:", err);
        setError("Failed to complete authentication");
        setTimeout(() => router.push("/sign-in"), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams, dispatch]);

  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <div className="text-destructive font-semibold">{error}</div>
            <div className="text-sm text-muted-foreground">Redirecting to sign-in...</div>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div className="text-foreground font-medium">Completing authentication...</div>
            <div className="text-sm text-muted-foreground">Please wait</div>
          </>
        )}
      </div>
    </div>
  );
}