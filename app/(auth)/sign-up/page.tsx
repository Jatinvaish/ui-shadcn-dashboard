// app/(auth)/sign-up/page.tsx - Updated UI to match sign-in
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type EmailFormValues = z.infer<typeof emailSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api/v1';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const authError = searchParams.get("error");

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (authError) {
      const errorMessages: Record<string, string> = {
        google_auth_cancelled: "Google sign-up was cancelled",
        google_auth_failed: "Google authentication failed",
        microsoft_auth_cancelled: "Microsoft sign-up was cancelled",
        microsoft_auth_failed: "Microsoft authentication failed",
      };
      toast.error(errorMessages[authError] || "Authentication failed");
    }
  }, [authError]);

  const onSubmit = async (data: EmailFormValues) => {
    router.push(`/sign-up/password?email=${encodeURIComponent(data.email)}`);
  };

  const handleSocialAuth = (provider: 'google' | 'microsoft') => {
    setSocialLoading(provider);
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <div className="flex items-center justify-center h-screen py-4">
      <Card className="mx-auto w-96 rounded-2xl border-0 bg-accent">
        <CardHeader className="text-center pb-2 space-y-0.5">
          <div className="inline-flex items-center gap-2 mb-0 justify-center pr-3">
            <img
              src="/fluera_new_logo.png"
              alt="Fluera logo"
              className="h-9 w-30"
            />
          </div>
          <CardTitle className="text-2xl font-bold pt-0.5 mt-3">
            Sign Up
          </CardTitle>
          <CardDescription className="text-xs pt-0">
            Enter your email below to create your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-2">
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
                            disabled={socialLoading !== null}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 font-semibold text-sm mt-1"
                  disabled={socialLoading !== null}
                >
                  Continue
                </Button>

                <div className="my-1">
                  <div className="flex items-center gap-3">
                    <div className="w-full border-t" />
                    <span className="text-sm text-muted-foreground shrink-0 primary">OR</span>
                    <div className="w-full border-t" />
                  </div>
                </div>
                {/* Google Sign-Up */}
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-10 text-xs justify-start text-left gap-1.5 cursor-pointer"
                  disabled={socialLoading !== null}
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
                      Sign up with Google
                    </>
                  )}
                </Button>

                {/* Microsoft Sign-Up */}
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-10 text-xs justify-start text-left gap-1.5 cursor-pointer"
                  disabled={socialLoading !== null}
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
                      Sign up with Microsoft
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}