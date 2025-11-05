"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPassword } from "@/store/slices/authSlice";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      toast.error("Password reset token is missing");
      router.push("/forgot-password");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await dispatch(resetPassword({ token, newPassword })).unwrap();
      toast.success("Password reset successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (error: any) {
      console.error("Reset password error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
      <Card className="mx-auto w-96">
        <CardHeader>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
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
              </div>

              {/* Password Requirements */}
              {newPassword && (
                <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-md">
                  <p className="font-medium mb-1.5">Password must contain:</p>
                  <ul className="space-y-1 list-none">
                    <li className="flex items-start gap-2">
                      <span
                        className={
                          passwordValidation.minLength
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {passwordValidation.minLength ? "✓" : "○"}
                      </span>
                      <span>At least 8 characters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        className={
                          passwordValidation.hasUpperCase
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {passwordValidation.hasUpperCase ? "✓" : "○"}
                      </span>
                      <span>One uppercase letter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        className={
                          passwordValidation.hasLowerCase
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {passwordValidation.hasLowerCase ? "✓" : "○"}
                      </span>
                      <span>One lowercase letter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        className={
                          passwordValidation.hasNumber
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {passwordValidation.hasNumber ? "✓" : "○"}
                      </span>
                      <span>One number</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        className={
                          passwordValidation.hasSpecialChar
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {passwordValidation.hasSpecialChar ? "✓" : "○"}
                      </span>
                      <span>One special character</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">
                  Passwords do not match
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !passwordValidation.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Remember your password?{" "}
            <Link href="/sign-in" className="underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}