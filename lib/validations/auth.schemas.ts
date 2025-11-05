// lib/validations/auth.schemas.ts - UPDATED
import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verificationSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});

// ✅ UPDATED: Changed organizationType to match backend tenant types
export const onboardingSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  organizationType: z.enum(["agency", "brand", "creator"]), // ✅ Changed from agency_admin, brand_admin
  organizationName: z.string().min(2, "Organization name is required"),
  phone: z.string().optional(),
  timezone: z.string().optional(),
});

// ✅ Agency Schema - Updated field name
export const agencySchema = z.object({
  name: z.string().min(2, "Agency name is required"), // ✅ Changed from organizationName
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  industry: z.string().optional(),
});

// ✅ Brand Schema - Updated field name
export const brandSchema = z.object({
  name: z.string().min(2, "Brand name is required"), // ✅ Changed from brandName
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  industry: z.string().optional(),
  description: z.string().optional(),
});

// ✅ Creator Schema - No changes needed
export const creatorSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  stageName: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;
export type VerificationFormValues = z.infer<typeof verificationSchema>;
export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
export type AgencyFormValues = z.infer<typeof agencySchema>;
export type BrandFormValues = z.infer<typeof brandSchema>;
export type CreatorFormValues = z.infer<typeof creatorSchema>;