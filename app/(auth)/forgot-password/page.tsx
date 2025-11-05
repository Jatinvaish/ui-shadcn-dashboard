"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { forgotPassword, clearError } from "@/store/slices/authSlice";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      const result = await dispatch(forgotPassword(email)).unwrap();
      toast.success("Password reset instructions have been sent to your email");
    } catch (error: any) {
      console.error("Forgot password error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
      <Card className="mx-auto w-96">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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