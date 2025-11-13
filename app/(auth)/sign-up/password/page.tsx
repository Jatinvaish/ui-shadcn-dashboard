// app/(auth)/sign-up/password/page.tsx - Updated UI to match sign-in
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  register as registerAction,
  clearError,
} from "@/store/slices/authSlice";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SignUpPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const { isLoading, error, requiresVerification, verificationEmail } =
    useAppSelector((state) => state.auth);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (!email) {
      router.push("/sign-up");
    }
  }, [email, router]);

  useEffect(() => {
    if (requiresVerification && verificationEmail) {
      router.push(`/verify?email=${encodeURIComponent(verificationEmail)}`);
    }
  }, [requiresVerification, verificationEmail, router]);

  const onSubmit = async (data: PasswordFormValues) => {
    if (!email) {
      return;
    }

    try {
      dispatch(clearError());
      await dispatch(
        registerAction({
          email: email,
          password: data.password,
        })
      ).unwrap();
    } catch (err: any) {
      console.error("Registration failed:", err);
    }
  };

  if (!email) {
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
            Create Password
          </CardTitle>
          <CardDescription className="text-xs pt-0">
            Create a secure password for {email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                {/* Back button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit px-2 h-8 text-xs -mt-2"
                  onClick={() => router.push("/sign-up")}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Change email
                </Button>

                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}

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
                              placeholder="Enter your password"
                              disabled={isLoading}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                {/* Password Requirements */}
                <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-md">
                  <p className="font-medium mb-1.5">Password must contain:</p>
                  <ul className="space-y-1 list-none">
                    <li className="flex items-start gap-2">
                      <span className={form.watch("password")?.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                        {form.watch("password")?.length >= 8 ? "✓" : "○"}
                      </span>
                      <span>At least 8 characters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className={/[A-Z]/.test(form.watch("password") || "") ? "text-green-600" : "text-muted-foreground"}>
                        {/[A-Z]/.test(form.watch("password") || "") ? "✓" : "○"}
                      </span>
                      <span>One uppercase letter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className={/[a-z]/.test(form.watch("password") || "") ? "text-green-600" : "text-muted-foreground"}>
                        {/[a-z]/.test(form.watch("password") || "") ? "✓" : "○"}
                      </span>
                      <span>One lowercase letter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className={/[0-9]/.test(form.watch("password") || "") ? "text-green-600" : "text-muted-foreground"}>
                        {/[0-9]/.test(form.watch("password") || "") ? "✓" : "○"}
                      </span>
                      <span>One number</span>
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 font-semibold text-sm mt-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
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