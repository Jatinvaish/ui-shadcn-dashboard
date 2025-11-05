

// app/(auth)/auth/microsoft/callback/page.tsx
"use client";
//TODO
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

export default function MicrosoftCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const userParam = searchParams.get("user");
      const error = searchParams.get("error");

      if (error) {
        toast.error("Microsoft authentication failed");
        router.push("/sign-in?error=microsoft_auth_failed");
        return;
      }

      if (!accessToken || !refreshToken || !userParam) {
        toast.error("Missing authentication data");
        router.push("/sign-in?error=microsoft_auth_failed");
        return;
      }

      try {
        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store tokens and user data
        const cookieOptions = {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };

        Cookies.set('accessToken', accessToken, cookieOptions);
        Cookies.set('refreshToken', refreshToken, cookieOptions);
        Cookies.set('user', JSON.stringify(user), cookieOptions);

        toast.success("Successfully signed in with Microsoft!");

        // Redirect based on onboarding status
        if (user.onboardingRequired) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to process callback:", err);
        toast.error("Authentication processing failed");
        router.push("/sign-in?error=microsoft_auth_failed");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-600" />
        <div className="text-gray-600">Completing sign in with Microsoft...</div>
      </div>
    </div>
  );
}