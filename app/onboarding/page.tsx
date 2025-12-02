"use client";
import type React from "react";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  Sparkles,
  Mail,
  Phone,
  User,
  TrendingUp,
  Briefcase,
  DollarSign,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/api";

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dealFrequency: string;
  followersCount: string;
  staffCount: string;
  creatorsManaged: string;
  yearlyRevenue: string;
  brandStaffCount: string;
  creatorsPartneredMonthly: string;
  organizationName: string;
  website: string;
  stageName: string;
  bio: string;
  industry: string;
  timezone: string;
}

interface UserTypeOption {
  id: "creator" | "agency" | "brand";
  title: string;
  description: string;
  icon: LucideIcon;
}

interface StepConfig {
  field: keyof FormData;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  type: "text" | "email" | "tel" | "number" | "chips";
  options?: string[];
}

interface CurrentStepConfig {
  type: "userTypeSelection" | "input";
  config?: StepConfig;
}

const OnboardingFlow: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [userType, setUserType] = useState<"creator" | "agency" | "brand" | "">("");
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dealFrequency: "",
    followersCount: "",
    staffCount: "",
    creatorsManaged: "",
    yearlyRevenue: "",
    brandStaffCount: "",
    creatorsPartneredMonthly: "",
    organizationName: "",
    website: "",
    stageName: "",
    bio: "",
    industry: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const images = [
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=800&fit=crop"
  ];

  const [imageIndex, setImageIndex] = useState(0);

  const userTypes: UserTypeOption[] = [
    {
      id: "creator",
      title: "Creator",
      description: "Individual content creator",
      icon: Sparkles
    },
    {
      id: "agency",
      title: "Talent Agency",
      description: "Manage multiple creators",
      icon: Building2
    },
    {
      id: "brand",
      title: "Brand",
      description: "Partner with creators",
      icon: Users
    }
  ];

  const commonSteps: StepConfig[] = [
    {
      field: "firstName",
      label: "What's your first name?",
      placeholder: "John",
      icon: User,
      type: "text"
    },
    {
      field: "lastName",
      label: "What's your last name?",
      placeholder: "Doe",
      icon: User,
      type: "text"
    },
    {
      field: "phone",
      label: "Contact number",
      placeholder: "+1 (555) 000-0000",
      icon: Phone,
      type: "tel"
    }
  ];

  const creatorSteps: StepConfig[] = [
    {
      field: "stageName",
      label: "What's your stage name? (Optional)",
      placeholder: "Creative Name",
      icon: Sparkles,
      type: "text"
    },
    {
      field: "bio",
      label: "Tell us about yourself",
      placeholder: "Brief bio about your content...",
      icon: User,
      type: "text"
    },
    {
      field: "dealFrequency",
      label: "How often do you collaborate with brands?",
      placeholder: "Select frequency",
      icon: TrendingUp,
      type: "chips",
      options: ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Rarely"]
    },
    {
      field: "followersCount",
      label: "How many followers do you have?",
      placeholder: "Select range",
      icon: UsersRound,
      type: "chips",
      options: [
        "Under 1K",
        "1K - 10K",
        "10K - 50K",
        "50K - 100K",
        "100K - 500K",
        "500K - 1M",
        "Over 1M"
      ]
    }
  ];

  const agencySteps: StepConfig[] = [
    {
      field: "organizationName",
      label: "What's your agency name?",
      placeholder: "Agency Name",
      icon: Building2,
      type: "text"
    },
    {
      field: "industry",
      label: "What industry do you focus on?",
      placeholder: "e.g., Entertainment, Fashion, Tech",
      icon: Briefcase,
      type: "text"
    },
    {
      field: "staffCount",
      label: "How many staff members do you have?",
      placeholder: "Select range",
      icon: Briefcase,
      type: "chips",
      options: ["1-5", "6-10", "11-25", "26-50", "51-100", "Over 100"]
    },
    {
      field: "creatorsManaged",
      label: "How many creators do you manage?",
      placeholder: "Select range",
      icon: UsersRound,
      type: "chips",
      options: ["1-10", "11-25", "26-50", "51-100", "101-250", "Over 250"]
    },
    {
      field: "yearlyRevenue",
      label: "What is your yearly revenue?",
      placeholder: "Select range",
      icon: DollarSign,
      type: "chips",
      options: [
        "Under $100K",
        "$100K - $500K",
        "$500K - $1M",
        "$1M - $5M",
        "$5M - $10M",
        "Over $10M"
      ]
    }
  ];

  const brandSteps: StepConfig[] = [
    {
      field: "organizationName",
      label: "What's your brand name?",
      placeholder: "Brand Name",
      icon: Building2,
      type: "text"
    },
    {
      field: "website",
      label: "What's your website?",
      placeholder: "https://example.com",
      icon: Mail,
      type: "text"
    },
    {
      field: "industry",
      label: "What industry are you in?",
      placeholder: "e.g., Fashion, Beauty, Tech",
      icon: Briefcase,
      type: "text"
    },
    {
      field: "brandStaffCount",
      label: "How many staff members do you have?",
      placeholder: "Select range",
      icon: Briefcase,
      type: "chips",
      options: ["1-10", "11-50", "51-100", "101-500", "501-1000", "Over 1000"]
    },
    {
      field: "creatorsPartneredMonthly",
      label: "How many creators do you partner with monthly?",
      placeholder: "Select range",
      icon: UsersRound,
      type: "chips",
      options: ["1-5", "6-15", "16-30", "31-50", "51-100", "Over 100"]
    }
  ];

  const getTotalSteps = (): number => {
    if (!userType) return 1;
    let total = 1 + commonSteps.length;
    if (userType === "creator") total += creatorSteps.length;
    if (userType === "agency") total += agencySteps.length;
    if (userType === "brand") total += brandSteps.length;
    return total;
  };

  const getCurrentStepConfig = (): CurrentStepConfig | null => {
    if (currentStep === 0) return { type: "userTypeSelection" };

    const adjustedStep = currentStep - 1;

    if (adjustedStep < commonSteps.length) {
      return { type: "input", config: commonSteps[adjustedStep] };
    }

    const typeSpecificStep = adjustedStep - commonSteps.length;

    if (userType === "creator" && typeSpecificStep < creatorSteps.length) {
      return { type: "input", config: creatorSteps[typeSpecificStep] };
    }

    if (userType === "agency" && typeSpecificStep < agencySteps.length) {
      return { type: "input", config: agencySteps[typeSpecificStep] };
    }

    if (userType === "brand" && typeSpecificStep < brandSteps.length) {
      return { type: "input", config: brandSteps[typeSpecificStep] };
    }

    return null;
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = (): boolean => {
    const stepConfig = getCurrentStepConfig();

    if (stepConfig?.type === "userTypeSelection") {
      if (!userType) {
        setError("Please select who you are");
        return false;
      }
    }

    if (stepConfig?.type === "input" && stepConfig.config) {
      const field = stepConfig.config.field;
      const value = formData[field];

      const optionalFields = ["stageName", "bio", "website", "industry"];
      if (optionalFields.includes(field) && (!value || value.trim() === "")) {
        return true;
      }

      if (!value || value.trim() === "") {
        setError(
          `Please ${stepConfig.config.type === "chips" ? "select" : "enter"} your ${stepConfig.config.label.toLowerCase()}`
        );
        return false;
      }

      if (field === "phone") {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
        if (!phoneRegex.test(value)) {
          setError("Please enter a valid phone number");
          return false;
        }
      }

      if (field === "website" && value) {
        const urlRegex = /^https?:\/\/.+\..+/;
        if (!urlRegex.test(value)) {
          setError("Please enter a valid website URL");
          return false;
        }
      }
    }

    setError("");
    return true;
  };

  const handleNext = (): void => {
    if (!validateStep()) return;

    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep((prev) => prev + 1);
      setImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setImageIndex((prev) => (prev - 1 + images.length) % images.length);
      setError("");
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Prepare metadata
      const metadata: Record<string, any> = {};

      if (userType === "agency") {
        if (formData.dealFrequency) metadata.dealFrequency = formData.dealFrequency;
        if (formData.staffCount) metadata.staffCount = formData.staffCount;
        if (formData.creatorsManaged) metadata.creatorsManaged = formData.creatorsManaged;
        if (formData.yearlyRevenue) metadata.yearlyRevenue = formData.yearlyRevenue;
      } else if (userType === "brand") {
        if (formData.brandStaffCount) metadata.brandStaffCount = formData.brandStaffCount;
        if (formData.creatorsPartneredMonthly)
          metadata.creatorsPartneredMonthly = formData.creatorsPartneredMonthly;
      } else if (userType === "creator") {
        if (formData.dealFrequency) metadata.dealFrequency = formData.dealFrequency;
        if (formData.followersCount) metadata.followersCount = formData.followersCount;
      }

      let response;

      // Call appropriate API
      if (userType === "agency") {
        response = await AuthService.createAgency({
          name: formData.organizationName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          timezone: formData.timezone || undefined,
          industry: formData.industry || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        });
      } else if (userType === "brand") {
        response = await AuthService.createBrand({
          name: formData.organizationName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          industry: formData.industry || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        });
      } else if (userType === "creator") {
        response = await AuthService.createCreator({
          firstName: formData.firstName,
          lastName: formData.lastName,
          stageName: formData.stageName || undefined,
          phone: formData.phone || undefined,
          bio: formData.bio || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        });
      }

      // ✅ Validate response structure
      if (!response || typeof response !== "object") {
        throw new Error("Invalid response from server");
      }

      // ✅ CRITICAL: Extract data from wrapped response
      // Your API returns: { success, statusCode, message, data: { actual data here } }
      const result = response.data || response;

      console.log("✅ Onboarding API Response:", {
        fullResponse: response,
        extractedResult: result,
        hasAccessToken: !!result.accessToken,
        hasRefreshToken: !!result.refreshToken,
        hasUser: !!result.user,
        hasTenantId: !!result.tenantId || !!result.user?.tenantId
      });

      // ✅ Extract tenantId from the result
      const tenantId = result.tenantId || result.user?.tenantId;

      if (!tenantId) {
        console.error("❌ No tenantId in response:", { response, result });
        throw new Error("Tenant ID missing from response");
      }

      // ✅ Extract tokens and user data
      const accessToken = result.accessToken;
      const refreshToken = result.refreshToken;
      const userData = result.user;

      if (!accessToken || !refreshToken || !userData) {
        console.error("❌ Missing auth data:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUserData: !!userData
        });
        throw new Error("Incomplete authentication data in response");
      }

      // ✅ Update cookies with complete auth data including tenantId
      AuthService.updateAuthCookies({
        accessToken,
        refreshToken,
        user: {
          ...userData,
          tenantId, // ✅ Explicitly set tenantId
          onboardingRequired: false,
          onboardingCompleted: true
        }
      });

      // ✅ Wait for cookies to be written
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log("✅ Cookies updated successfully:", {
        tenantId,
        userId: userData.id,
        userType: userData.userType
      });

      console.log("✅ Redirecting to dashboard...");

      // ✅ Hard navigation to dashboard (forces middleware re-read)
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("❌ Onboarding error:", err);

      let errorMessage = "Something went wrong. Please try again.";

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const isLastStep = currentStep === getTotalSteps() - 1;

  return (
    <div className="bg-accent h-screen w-screen overflow-hidden">
      {/* ... rest of your JSX remains exactly the same ... */}
      <div className="h-full w-full">
        <div className="grid h-full md:grid-cols-2">
          {/* Left Content Section */}
          <div className="bg-accent flex h-full flex-col justify-center overflow-y-auto p-8 md:p-12">
            <div className="mx-auto w-full max-w-md space-y-6">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">
                    Step {currentStep + 1} of {getTotalSteps()}
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">
                    {currentStep === 0
                      ? 0
                      : Math.round(((currentStep + 1) / getTotalSteps()) * 100)}{" "}
                    %
                  </span>
                </div>
                <div className="bg-muted h-1 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${currentStep === 0 ? 0 : ((currentStep + 1) / getTotalSteps()) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="space-y-5">
                {currentStep === 0 && (
                  <div className="animate-in fade-in slide-in-from-right-4 space-y-4 duration-700">
                    <div>
                      <h1 className="text-foreground mb-2 text-3xl font-bold md:text-4xl">
                        Who are you?
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Choose the option that best describes you
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {userTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              setUserType(type.id);
                              setError("");
                            }}
                            className={`group w-full rounded-lg border p-3.5 text-left transition-all duration-300 ${
                              userType === type.id
                                ? "border-primary bg-primary/5 text-card-foreground"
                                : "border-border bg-accent"
                            }`}>
                            <div className="flex items-start gap-2.5">
                              <div className="bg-primary/10 flex-shrink-0 rounded-md p-1.5">
                                <Icon className="text-primary h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-foreground mb-0.5 text-sm font-semibold">
                                  {type.title}
                                </h3>
                                <p className="text-muted-foreground text-xs">{type.description}</p>
                              </div>
                              <div
                                className={`mt-1 h-4 w-4 flex-shrink-0 rounded-full border transition-all ${
                                  userType === type.id
                                    ? "border-primary bg-primary"
                                    : "border-border"
                                }`}>
                                {userType === type.id && (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <div className="bg-primary-foreground h-1 w-1 rounded-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentStep > 0 &&
                  (() => {
                    const stepConfig = getCurrentStepConfig();
                    if (!stepConfig || stepConfig.type !== "input" || !stepConfig.config)
                      return null;

                    const {
                      label,
                      placeholder,
                      icon: Icon,
                      field,
                      type,
                      options
                    } = stepConfig.config;

                    return (
                      <div className="animate-in fade-in slide-in-from-right-4 space-y-4 duration-700">
                        <div>
                          <h1 className="text-foreground mb-2 text-3xl font-bold md:text-4xl">
                            {label}
                          </h1>
                          <p className="text-muted-foreground text-sm">
                            {type === "chips"
                              ? "Select the option that best fits"
                              : "Please provide your information"}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {type === "chips" && options ? (
                            <div className="flex flex-wrap gap-2">
                              {options.map((option) => (
                                <button
                                  key={option}
                                  onClick={() => handleInputChange(field, option)}
                                  className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                                    formData[field] === option
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-accent text-foreground border-border"
                                  }`}>
                                  {option}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <Input
                                id={field}
                                type={type}
                                value={formData[field]}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                placeholder={placeholder}
                                className="border-border bg-accent text-foreground focus:border-primary focus:ring-primary/10 h-10 pl-9 text-sm focus:ring-0"
                                autoFocus
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    if (isLastStep) {
                                      handleSubmit();
                                    } else {
                                      handleNext();
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {error && (
                  <div className="bg-destructive/10 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-2 rounded-lg border p-2.5 text-xs duration-300">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="bg-accent border-border h-10 px-4 text-sm transition-all">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Back
                    </Button>
                  )}

                  {!isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="bg-primary text-primary-foreground h-10 flex-1 text-sm font-medium transition-all">
                      Continue
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-primary text-primary-foreground h-10 flex-1 text-sm font-medium transition-all">
                      {isSubmitting ? (
                        <>
                          <div className="border-primary-foreground mr-2 h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
                          Creating...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Showcase Section */}
          <div className="bg-muted/30 relative hidden overflow-hidden md:flex">
            <div className="absolute inset-0">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === imageIndex ? "opacity-100" : "opacity-0"
                  }`}>
                  <img src={img} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              ))}
            </div>

            <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setImageIndex(idx)}
                  className={`rounded-full transition-all duration-500 ${
                    idx === imageIndex ? "h-2 w-8 bg-white" : "h-2 w-2 bg-white/40"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="relative z-10 flex flex-col justify-end p-10 text-white">
              <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Join Our Community</span>
                </div>
                <h2 className="max-w-md text-4xl leading-tight font-bold">
                  Build Amazing Partnerships
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-white/80">
                  Connect with thousands of creators, agencies, and brands to create meaningful
                  collaborations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
