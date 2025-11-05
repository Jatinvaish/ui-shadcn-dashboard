// app/(auth)/verify/page.tsx - Updated UI to match sign-in
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  verifyRegistration,
  resendVerification,
  clearError,
} from "@/store/slices/authSlice";
import {
  verificationSchema,
  type VerificationFormValues,
} from "@/lib/validations/auth.schemas";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

export default function VerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const email = searchParams.get("email") || "";
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const code = watch("code");
  const codeArray = code.padEnd(6, " ").split("").slice(0, 6);

  useEffect(() => {
    if (!email) {
      router.push("/sign-up");
    }
  }, [email, router]);

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Email verified successfully!");
      router.push("/onboarding");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      handleSubmit(onSubmit)();
    }
  }, [code]);

  const onSubmit = async (data: VerificationFormValues) => {
    try {
      dispatch(clearError());
      await dispatch(verifyRegistration({ email, code: data.code })).unwrap();
    } catch (err) {
      console.error("Verification failed:", err);
      toast.error("Invalid verification code");
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    try {
      setResendLoading(true);
      setResendSuccess(false);
      dispatch(clearError());

      await dispatch(resendVerification(email)).unwrap();

      setResendSuccess(true);
      setCountdown(60);
      setValue("code", "");
      toast.success("Verification code sent!");
    } catch (err) {
      console.error("Resend failed:", err);
      toast.error("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "");

    if (digit.length > 1) {
      const digits = digit.slice(0, 6);
      setValue("code", digits, { shouldValidate: true });

      const lastIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const currentCode = code.split("");
    currentCode[index] = digit;
    const newCode = currentCode.join("").slice(0, 6);
    setValue("code", newCode, { shouldValidate: true });

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !codeArray[index].trim() && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pastedData) {
      setValue("code", pastedData, { shouldValidate: true });
      const lastIndex = Math.min(pastedData.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
      <Card className="mx-auto w-96">
        <CardHeader>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            We sent a verification code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              {resendSuccess && (
                <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  Verification code sent successfully!
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-center gap-2">
                  {codeArray.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el: any) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit.trim()}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={isLoading}
                      className="w-12 h-12 text-center text-lg font-semibold"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {errors.code && (
                  <p className="text-sm text-destructive text-center">
                    {errors.code.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center text-sm">
                Didn&apos;t receive the code?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm underline"
                  onClick={handleResendCode}
                  disabled={resendLoading || countdown > 0}
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend code in ${countdown}s`
                  ) : (
                    "Resend verification code"
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/sign-in"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}