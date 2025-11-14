"use client"
import type React from "react"
import { useState } from "react"
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
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/api"

interface FormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  dealFrequency: string
  followersCount: string
  staffCount: string
  creatorsManaged: string
  yearlyRevenue: string
  brandStaffCount: string
  creatorsPartneredMonthly: string
  organizationName: string
  website: string
  stageName: string
  bio: string
  industry: string
  timezone: string
}

interface UserTypeOption {
  id: "creator" | "agency" | "brand"
  title: string
  description: string
  icon: LucideIcon
}

interface StepConfig {
  field: keyof FormData
  label: string
  placeholder: string
  icon: LucideIcon
  type: "text" | "email" | "tel" | "number" | "chips"
  options?: string[]
}

interface CurrentStepConfig {
  type: "userTypeSelection" | "input"
  config?: StepConfig
}

const OnboardingFlow: React.FC = () => {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [userType, setUserType] = useState<"creator" | "agency" | "brand" | "">("")
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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const images = [
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=800&fit=crop",
  ]

  const [imageIndex, setImageIndex] = useState(0)

  const userTypes: UserTypeOption[] = [
    {
      id: "creator",
      title: "Creator",
      description: "Individual content creator",
      icon: Sparkles,
    },
    {
      id: "agency",
      title: "Talent Agency",
      description: "Manage multiple creators",
      icon: Building2,
    },
    {
      id: "brand",
      title: "Brand",
      description: "Partner with creators",
      icon: Users,
    },
  ]

  const commonSteps: StepConfig[] = [
    {
      field: "firstName",
      label: "What's your first name?",
      placeholder: "John",
      icon: User,
      type: "text",
    },
    {
      field: "lastName",
      label: "What's your last name?",
      placeholder: "Doe",
      icon: User,
      type: "text",
    },
    {
      field: "phone",
      label: "Contact number",
      placeholder: "+1 (555) 000-0000",
      icon: Phone,
      type: "tel",
    },
  ]

  const creatorSteps: StepConfig[] = [
    {
      field: "stageName",
      label: "What's your stage name? (Optional)",
      placeholder: "Creative Name",
      icon: Sparkles,
      type: "text",
    },
    {
      field: "bio",
      label: "Tell us about yourself",
      placeholder: "Brief bio about your content...",
      icon: User,
      type: "text",
    },
    {
      field: "dealFrequency",
      label: "How often do you collaborate with brands?",
      placeholder: "Select frequency",
      icon: TrendingUp,
      type: "chips",
      options: ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Rarely"],
    },
    {
      field: "followersCount",
      label: "How many followers do you have?",
      placeholder: "Select range",
      icon: UsersRound,
      type: "chips",
      options: ["Under 1K", "1K - 10K", "10K - 50K", "50K - 100K", "100K - 500K", "500K - 1M", "Over 1M"],
    },
  ]

  const agencySteps: StepConfig[] = [
    {
      field: "organizationName",
      label: "What's your agency name?",
      placeholder: "Agency Name",
      icon: Building2,
      type: "text",
    },
    {
      field: "industry",
      label: "What industry do you focus on?",
      placeholder: "e.g., Entertainment, Fashion, Tech",
      icon: Briefcase,
      type: "text",
    },
    {
      field: "staffCount",
      label: "How many staff members do you have?",
      placeholder: "Select range",
      icon: Briefcase,
      type: "chips",
      options: ["1-5", "6-10", "11-25", "26-50", "51-100", "Over 100"],
    },
    {
      field: "creatorsManaged",
      label: "How many creators do you manage?",
      placeholder: "Select range",
      icon: UsersRound,
      type: "chips",
      options: ["1-10", "11-25", "26-50", "51-100", "101-250", "Over 250"],
    },
    {
      field: "yearlyRevenue",
      label: "What is your yearly revenue?",
      placeholder: "Select range",
      icon: DollarSign,
      type: "chips",
      options: ["Under $100K", "$100K - $500K", "$500K - $1M", "$1M - $5M", "$5M - $10M", "Over $10M"],
    },
  ]

  const brandSteps: StepConfig[] = [
    {
      field: "organizationName",
      label: "What's your brand name?",
      placeholder: "Brand Name",
      icon: Building2,
      type: "text",
    },
    {
      field: "website",
      label: "What's your website?",
      placeholder: "https://example.com",
      icon: Mail,
      type: "text",
    },
    {
      field: "industry",
      label: "What industry are you in?",
      placeholder: "e.g., Fashion, Beauty, Tech",
      icon: Briefcase,
      type: "text",
    },
    {
      field: "brandStaffCount",
      label: "How many staff members do you have?",
      placeholder: "Select range",
      icon: Briefcase,
      type: "chips",
      options: ["1-10", "11-50", "51-100", "101-500", "501-1000", "Over 1000"],
    },
    {
      field: "creatorsPartneredMonthly",
      label: "How many creators do you partner with monthly?",
      placeholder: "Select range",
      icon: UsersRound,
      type: "chips",
      options: ["1-5", "6-15", "16-30", "31-50", "51-100", "Over 100"],
    },
  ]

  const getTotalSteps = (): number => {
    if (!userType) return 1
    let total = 1 + commonSteps.length
    if (userType === "creator") total += creatorSteps.length
    if (userType === "agency") total += agencySteps.length
    if (userType === "brand") total += brandSteps.length
    return total
  }

  const getCurrentStepConfig = (): CurrentStepConfig | null => {
    if (currentStep === 0) return { type: "userTypeSelection" }

    const adjustedStep = currentStep - 1

    if (adjustedStep < commonSteps.length) {
      return { type: "input", config: commonSteps[adjustedStep] }
    }

    const typeSpecificStep = adjustedStep - commonSteps.length

    if (userType === "creator" && typeSpecificStep < creatorSteps.length) {
      return { type: "input", config: creatorSteps[typeSpecificStep] }
    }

    if (userType === "agency" && typeSpecificStep < agencySteps.length) {
      return { type: "input", config: agencySteps[typeSpecificStep] }
    }

    if (userType === "brand" && typeSpecificStep < brandSteps.length) {
      return { type: "input", config: brandSteps[typeSpecificStep] }
    }

    return null
  }

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateStep = (): boolean => {
    const stepConfig = getCurrentStepConfig()

    if (stepConfig?.type === "userTypeSelection") {
      if (!userType) {
        setError("Please select who you are")
        return false
      }
    }

    if (stepConfig?.type === "input" && stepConfig.config) {
      const field = stepConfig.config.field
      const value = formData[field]

      const optionalFields = ['stageName', 'bio', 'website', 'industry']
      if (optionalFields.includes(field) && (!value || value.trim() === "")) {
        return true
      }

      if (!value || value.trim() === "") {
        setError(`Please ${stepConfig.config.type === "chips" ? "select" : "enter"} your ${stepConfig.config.label.toLowerCase()}`)
        return false
      }

      if (field === "phone") {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
        if (!phoneRegex.test(value)) {
          setError("Please enter a valid phone number")
          return false
        }
      }

      if (field === "website" && value) {
        const urlRegex = /^https?:\/\/.+\..+/
        if (!urlRegex.test(value)) {
          setError("Please enter a valid website URL")
          return false
        }
      }
    }

    setError("")
    return true
  }

  const handleNext = (): void => {
    if (!validateStep()) return

    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep((prev) => prev + 1)
      setImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const handleBack = (): void => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setImageIndex((prev) => (prev - 1 + images.length) % images.length)
      setError("")
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateStep()) return

    setIsSubmitting(true)
    setError("")

    try {
      // Prepare metadata
      const metadata: Record<string, any> = {}

      if (userType === "agency") {
        if (formData.dealFrequency) metadata.dealFrequency = formData.dealFrequency
        if (formData.staffCount) metadata.staffCount = formData.staffCount
        if (formData.creatorsManaged) metadata.creatorsManaged = formData.creatorsManaged
        if (formData.yearlyRevenue) metadata.yearlyRevenue = formData.yearlyRevenue
      } else if (userType === "brand") {
        if (formData.brandStaffCount) metadata.brandStaffCount = formData.brandStaffCount
        if (formData.creatorsPartneredMonthly) metadata.creatorsPartneredMonthly = formData.creatorsPartneredMonthly
      } else if (userType === "creator") {
        if (formData.dealFrequency) metadata.dealFrequency = formData.dealFrequency
        if (formData.followersCount) metadata.followersCount = formData.followersCount
      }

      let result

      // Call appropriate API
      if (userType === "agency") {
        result = await AuthService.createAgency({
          name: formData.organizationName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          timezone: formData.timezone || undefined,
          industry: formData.industry || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        })
      } else if (userType === "brand") {
        result = await AuthService.createBrand({
          name: formData.organizationName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          industry: formData.industry || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        })
      } else if (userType === "creator") {
        result = await AuthService.createCreator({
          firstName: formData.firstName,
          lastName: formData.lastName,
          stageName: formData.stageName || undefined,
          phone: formData.phone || undefined,
          bio: formData.bio || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        })
      }

      // ✅ Validate response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from server')
      }

      // ✅ Update cookies with new auth data
      AuthService.updateAuthCookies({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          ...result.user,
          onboardingRequired: false,
          onboardingCompleted: true,
        },
      })

      // ✅ Small delay to ensure cookies are written
      await new Promise(resolve => setTimeout(resolve, 150))

      // ✅ Hard navigation to dashboard (forces middleware re-read)
      window.location.href = '/dashboard'

    } catch (err: any) {
      console.error('❌ Onboarding error:', err)
      
      // Better error messages
      let errorMessage = 'Something went wrong. Please try again.'
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  const isLastStep = currentStep === getTotalSteps() - 1

  return (
    <div className="h-screen w-screen bg-accent overflow-hidden">
      {/* ... rest of your JSX remains exactly the same ... */}
      <div className="h-full w-full">
        <div className="grid md:grid-cols-2 h-full">
          {/* Left Content Section */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-accent h-full overflow-y-auto">
            <div className="max-w-md mx-auto w-full space-y-6">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {currentStep + 1} of {getTotalSteps()}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {currentStep === 0 ? 0 : (Math.round(((currentStep + 1) / getTotalSteps()) * 100))} %
                  </span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${currentStep === 0 ? 0 : ((currentStep + 1) / getTotalSteps()) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-5">
                {currentStep === 0 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Who are you?</h1>
                      <p className="text-sm text-muted-foreground">Choose the option that best describes you</p>
                    </div>

                    <div className="space-y-2.5">
                      {userTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              setUserType(type.id)
                              setError("")
                            }}
                            className={`w-full p-3.5 rounded-lg border transition-all duration-300 text-left group ${userType === type.id
                              ? "border-primary bg-primary/5 text-card-foreground"
                              : "border-border bg-accent"
                              }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
                                <Icon className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-foreground mb-0.5">{type.title}</h3>
                                <p className="text-xs text-muted-foreground">{type.description}</p>
                              </div>
                              <div
                                className={`w-4 h-4 rounded-full border transition-all flex-shrink-0 mt-1 ${userType === type.id ? "border-primary bg-primary" : "border-border"
                                  }`}
                              >
                                {userType === type.id && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-1 h-1 bg-primary-foreground rounded-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {currentStep > 0 &&
                  (() => {
                    const stepConfig = getCurrentStepConfig()
                    if (!stepConfig || stepConfig.type !== "input" || !stepConfig.config) return null

                    const { label, placeholder, icon: Icon, field, type, options } = stepConfig.config

                    return (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">
                        <div>
                          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{label}</h1>
                          <p className="text-sm text-muted-foreground">
                            {type === "chips" ? "Select the option that best fits" : "Please provide your information"}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {type === "chips" && options ? (
                            <div className="flex flex-wrap gap-2">
                              {options.map((option) => (
                                <button
                                  key={option}
                                  onClick={() => handleInputChange(field, option)}
                                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${formData[field] === option
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-accent text-foreground border-border"
                                    }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <Input
                                id={field}
                                type={type}
                                value={formData[field]}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                placeholder={placeholder}
                                className="pl-9 h-10 text-sm border-border bg-accent text-foreground focus:border-primary focus:ring-0 focus:ring-primary/10"
                                autoFocus
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    if (isLastStep) {
                                      handleSubmit()
                                    } else {
                                      handleNext()
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                {error && (
                  <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs animate-in fade-in slide-in-from-top-2 duration-300">
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
                      className="h-10 px-4 text-sm bg-accent border-border transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  )}

                  {!isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="flex-1 h-10 text-sm bg-primary text-primary-foreground font-medium transition-all"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 h-10 text-sm bg-primary text-primary-foreground font-medium transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
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
          <div className="hidden md:flex bg-muted/30 relative overflow-hidden">
            <div className="absolute inset-0">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === imageIndex ? "opacity-100" : "opacity-0"
                    }`}
                >
                  <img
                    src={img}
                    alt={`Slide ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              ))}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setImageIndex(idx)}
                  className={`transition-all duration-500 rounded-full ${idx === imageIndex
                    ? "w-8 h-2 bg-white"
                    : "w-2 h-2 bg-white/40"
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="relative z-10 p-10 flex flex-col justify-end text-white">
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Join Our Community</span>
                </div>
                <h2 className="text-4xl font-bold leading-tight max-w-md">
                  Build Amazing Partnerships
                </h2>
                <p className="text-white/80 text-sm max-w-md leading-relaxed">
                  Connect with thousands of creators, agencies, and brands to create meaningful collaborations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow