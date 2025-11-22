// app/(auth)/accept-invitation/page.tsx
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { acceptInvite, login, clearError } from "@/store/slices/authSlice";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api/v1';

// Validation schema
const acceptInviteSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);

  const token = searchParams.get("token");

  const form = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) {
        toast.error("Invalid invitation link");
        router.push("/sign-in");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/auth/invitation/details?token=${token}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Invalid or expired invitation");
        }

        const data = await response.json();
        setInvitationDetails(data.data);

        // Pre-fill name if available
        if (data.data.invitee_name) {
          const nameParts = data.data.invitee_name.split(' ');
          form.setValue('firstName', nameParts[0] || '');
          form.setValue('lastName', nameParts.slice(1).join(' ') || '');
        }
      } catch (err: any) {
        console.error("Failed to fetch invitation:", err);
        toast.error(err.message || "Failed to load invitation");
        setTimeout(() => router.push("/sign-in"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token, router, form]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      toast.success("Account created successfully! Welcome aboard!");
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onSubmit = async (data: AcceptInviteFormValues) => {
    if (!token) {
      toast.error("Invalid invitation token");
      return;
    }

    try {
      dispatch(clearError());

      // Accept invitation
      const result = await dispatch(acceptInvite({
        token,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      })).unwrap();

      // Auto-login after accepting invitation
      if (result.user?.email) {
        toast.success("Invitation accepted! Logging you in...");

        // ✅ Store user with onboarding completed
        const userData = {
          ...result.user,
          onboardingRequired: false,
          onboardingCompleted: true,
        };

        Cookies.set("user", JSON.stringify(userData), {
          expires: 7,
          path: "/",
          secure: true,
          sameSite: "strict"
        });

        Cookies.set("accessToken", result.accessToken, {
          expires: 7,
          path: "/",
          secure: true,
          sameSite: "strict"
        });

        // ✅ Redirect to dashboard, NOT onboarding
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Accept invitation error:", err);
      // Error is already shown by Redux
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-96 rounded-2xl border-0 bg-accent">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationDetails) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
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
            Accept Invitation
          </CardTitle>
          <CardDescription className="text-xs pt-0">
            Complete your profile to join {invitationDetails.tenant_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invitation Info */}
          <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  You've been invited as <span className="text-xs text-muted-foreground mt-0.5 break-words">
                    {invitationDetails.role_display_name || invitationDetails.role_name}
                  </span>
                </p>

                {invitationDetails.invitee_email && (
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    Email:  {invitationDetails.invitee_email}
                  </p>
                )}

              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-3">
                {/* First Name */}
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="firstName"
                            placeholder="Enter your first name"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Last Name */}
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="lastName"
                            placeholder="Enter your last name"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password (min. 8 characters)"
                              disabled={isLoading}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              disabled={isLoading}
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
                </div>

                {/* Confirm Password */}
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              disabled={isLoading}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              disabled={isLoading}
                            >
                              {showConfirmPassword ? (
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
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-10 font-semibold text-sm mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Accept Invitation & Sign In"
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/sign-in" className="underline text-foreground hover:text-primary">
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}