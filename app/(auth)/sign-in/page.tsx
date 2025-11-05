'use client';
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, clearError } from "@/store/slices/authSlice";
import {
  signInSchema,
  type SignInFormValues,
} from "@/lib/validations/auth.schemas";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api/v1';


export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, requiresVerification, user } =
    useAppSelector((state) => state.auth);

  const sessionExpired = searchParams.get("session_expired");
  const authError = searchParams.get("error");

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (authError) {
      const errorMessages: Record<string, string> = {
        google_auth_cancelled: "Google sign-in was cancelled",
        google_auth_failed: "Google authentication failed",
        microsoft_auth_cancelled: "Microsoft sign-in was cancelled",
        microsoft_auth_failed: "Microsoft authentication failed",
      };
      toast.error(errorMessages[authError] || "Authentication failed");
    }
  }, [authError]);

  useEffect(() => {
    if (sessionExpired) {
      toast.error("Your session has expired. Please login again.");
    }
  }, [sessionExpired]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.onboardingRequired) {
        toast.success("Login successful! Complete your onboarding.");
        router.push("/onboarding");
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (requiresVerification) {
      const email = form.getValues("email");
      if (email) {
        toast.error("Please verify your email first");
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }
    }
  }, [requiresVerification, form, router]);

  const onSubmit = async (data: SignInFormValues) => {
    try {
      dispatch(clearError());
      await dispatch(login(data)).unwrap();
    } catch (err: any) {
      console.error("Login error:", err);
      // Error is already handled by Redux and displayed
    }
  };

  const handleSocialAuth = (provider: 'google' | 'microsoft') => {
    setSocialLoading(provider);
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
      <Card className="mx-auto w-96">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email Address"
                            disabled={isLoading || socialLoading !== null}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      
                      className="ml-auto inline-block text-sm underline">
                      Forgot your password?
                    </Link>
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              disabled={isLoading || socialLoading !== null}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              disabled={isLoading || socialLoading !== null}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <Input id="password" type="password" required /> */}
                </div>


                <Button type="submit" className="w-full"
                  disabled={isLoading || socialLoading !== null}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>

                <div className="my-1">
                  <div className="flex items-center gap-3">
                    <div className="w-full border-t" />
                    <span className="text-muted-foreground shrink-0  ">or continue with</span>
                    <div className="w-full border-t" />
                  </div>
                </div>

                {/* Google Sign-In */}
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-10 text-xs justify-start text-left gap-1.5 cursor-pointer"
                  disabled={isLoading || socialLoading !== null}
                  onClick={() => handleSocialAuth('google')}
                >
                  {socialLoading === 'google' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </Button>

                {/* Microsoft Sign-In */}
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-10 text-xs justify-start text-left gap-1.5 cursor-pointer"
                  disabled={isLoading || socialLoading !== null}
                  onClick={() => handleSocialAuth('microsoft')}
                >
                  {socialLoading === 'microsoft' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                      >
                        <path d="M0 0h11.377v11.372H0z" fill="#F25022" />
                        <path d="M12.623 0H24v11.372H12.623z" fill="#7FBA00" />
                        <path d="M0 12.623h11.377V24H0z" fill="#00A4EF" />
                        <path d="M12.623 12.623H24V24H12.623z" fill="#FFB900" />
                      </svg>
                      Sign in with Microsoft
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
