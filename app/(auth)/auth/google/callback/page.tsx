// app/auth/google/callback/page.tsx - NEW FILE
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const userParam = searchParams.get('user');

        if (!accessToken || !refreshToken || !userParam) {
          toast.error('Authentication failed - missing credentials');
          router.push('/sign-in');
          return;
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store credentials in Redux and cookies
        dispatch(setCredentials({
          user,
          accessToken,
          refreshToken,
        }));

        // Store in cookies as well (for persistence)
        const cookieOptions = {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };

        Cookies.set('accessToken', accessToken, cookieOptions);
        Cookies.set('refreshToken', refreshToken, cookieOptions);
        Cookies.set('user', JSON.stringify(user), cookieOptions);

        toast.success('Successfully signed in with Google!');

        // Redirect based on onboarding status
        if (user.onboardingRequired) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error processing Google callback:', error);
        toast.error('Authentication failed - please try again');
        router.push('/sign-in');
      }
    };

    handleCallback();
  }, [searchParams, router, dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Completing Google sign-in...</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while we redirect you
        </p>
      </div>
    </div>
  );
}