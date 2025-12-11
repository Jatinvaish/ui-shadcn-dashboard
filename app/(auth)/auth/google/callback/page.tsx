// app/auth/google/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { toast } from "react-hot-toast";
import { Loader2, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";

export default function GoogleCallbackPage() {
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

        if (!accessToken || !refreshToken || !userParam) {
          setError("Authentication failed - missing credentials");
          toast.error("Authentication failed - missing credentials");
          router.push("/sign-in");
          return;
        }

        let user;
        try {
          user = JSON.parse(decodeURIComponent(userParam));
        } catch {
          setError("Failed to decode user information");
          toast.error("Failed to decode user information");
          router.push("/sign-in");
          return;
        }

        // Save state in Redux
        dispatch(
          setCredentials({
            user,
            accessToken,
            refreshToken,
          })
        );

        // Cookie settings
        const cookieOptions = {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          path: "/",
        };

        Cookies.set("accessToken", accessToken, cookieOptions);
        Cookies.set("refreshToken", refreshToken, cookieOptions);
        Cookies.set("user", JSON.stringify(user), cookieOptions);

        toast.success("Successfully signed in with Google!");

        // Redirect user
        router.push(user.onboardingRequired ? "/onboarding" : "/dashboard");
      } catch (err) {
        console.error("Error processing Google callback:", err);
        setError("Authentication failed - please try again");
        toast.error("Authentication failed - please try again");
        router.push("/sign-in");
      }
    };

    // Only run once on mount
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center h-screen py-4">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <div className="text-destructive font-semibold">{error}</div>
            <div className="text-sm text-muted-foreground">
              Redirecting to sign-in...
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div className="text-foreground font-medium">
              Completing authentication...
            </div>
            <div className="text-sm text-muted-foreground">Please wait</div>
          </>
        )}
      </div>
    </div>
  );
}
