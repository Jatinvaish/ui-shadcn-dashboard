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
  type: "text" | "email" | "tel" | "number"
}

interface CurrentStepConfig {
  type: "userTypeSelection" | "input"
  config?: StepConfig
}

const OnboardingFlow: React.FC = () => {
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
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

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
    {
      field: "email",
      label: "Your email address",
      placeholder: "john@example.com",
      icon: Mail,
      type: "email",
    },
  ]

  const creatorSteps: StepConfig[] = [
    {
      field: "dealFrequency",
      label: "How often do you collaborate with brands or campaigns?",
      placeholder: "e.g., Weekly, Monthly, Quarterly",
      icon: TrendingUp,
      type: "text",
    },
    {
      field: "followersCount",
      label: "How many followers or subscribers do you have?",
      placeholder: "e.g., 10,000",
      icon: UsersRound,
      type: "text",
    },
  ]

  const agencySteps: StepConfig[] = [
    {
      field: "staffCount",
      label: "How many staff members do you have?",
      placeholder: "e.g., 5",
      icon: Briefcase,
      type: "number",
    },
    {
      field: "creatorsManaged",
      label: "How many creators do you manage?",
      placeholder: "e.g., 20",
      icon: UsersRound,
      type: "number",
    },
    {
      field: "yearlyRevenue",
      label: "What is your yearly revenue?",
      placeholder: "e.g., $500,000",
      icon: DollarSign,
      type: "text",
    },
  ]

  const brandSteps: StepConfig[] = [
    {
      field: "brandStaffCount",
      label: "How many staff members do you have?",
      placeholder: "e.g., 10",
      icon: Briefcase,
      type: "number",
    },
    {
      field: "creatorsPartneredMonthly",
      label: "How many creators do you partner with each month?",
      placeholder: "e.g., 15",
      icon: UsersRound,
      type: "number",
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

      if (!value || value.trim() === "") {
        setError(`Please enter your ${stepConfig.config.label.toLowerCase()}`)
        return false
      }

      if (field === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          setError("Please enter a valid email address")
          return false
        }
      }

      if (field === "phone") {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
        if (!phoneRegex.test(value)) {
          setError("Please enter a valid phone number")
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
    }
  }

  const handleBack = (): void => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setError("")
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateStep()) return

    setIsSubmitting(true)
    setError("")

    try {
      if (userType === "creator") {
        await AuthService.createCreator({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          stageName: `${formData.firstName} ${formData.lastName}`,
          bio: `${formData.dealFrequency} collaborations, ${formData.followersCount} followers`,
        })
      } else if (userType === "agency") {
        await AuthService.createAgency({
          name: `${formData.firstName} ${formData.lastName} Agency`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          timezone: "UTC",
          industry: `Staff: ${formData.staffCount}, Creators: ${formData.creatorsManaged}, Revenue: ${formData.yearlyRevenue}`,
        })
      } else if (userType === "brand") {
        await AuthService.createBrand({
          name: `${formData.firstName} ${formData.lastName} Brand`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          website: "",
          industry: `Staff: ${formData.brandStaffCount}, Monthly Partnerships: ${formData.creatorsPartneredMonthly}`,
        })
      }

      console.log("Onboarding completed successfully")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLastStep = currentStep === getTotalSteps() - 1

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-2"
      style={{ "--animation-duration": "20s" } as React.CSSProperties}
    >
      <div className="w-full max-w-6xl rounded-2xl overflow-hidden">
        <div className="mb-6 px-8 md:px-10 pt-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Step {currentStep + 1} of {getTotalSteps()}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(((currentStep + 1) / getTotalSteps()) * 100)}%
            </span>
          </div>
          <div className="h-0.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / getTotalSteps()) * 100}%` }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="grid md:grid-cols-2 min-h-[550px]">
            {/* Left Content Section */}
            <div className="p-8 md:p-12 flex flex-col justify-center bg-card">
              <div className="space-y-5">
                {currentStep === 0 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1.5">Who are you?</h1>
                      <p className="text-xs text-muted-foreground">Choose the option that best describes you</p>
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
                            className={`w-full p-3.5 rounded-lg border transition-all duration-300 text-left group ${
                              userType === type.id
                                ? "border-primary bg-primary/5 text-card-foreground"
                                : "border-border bg-background hover:border-primary/40"
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
                                className={`w-4 h-4 rounded-full border transition-all flex-shrink-0 mt-1 ${
                                  userType === type.id ? "border-primary bg-primary" : "border-border"
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

                    const { label, placeholder, icon: Icon, field, type } = stepConfig.config

                    return (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1.5">{label}</h1>
                          <p className="text-xs text-muted-foreground">Please provide your information</p>
                        </div>

                        <div className="space-y-2">
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
                              className="pl-9 h-8 text-xs border-border bg-background text-foreground focus:border-primary focus:ring-0 focus:ring-primary/10"
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
                      className="h-8 px-3 text-xs bg-background border-border hover:bg-accent hover:text-accent-foreground"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Back
                    </Button>
                  )}

                  {!isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
                    >
                      Continue
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-2.5 h-2.5 border border-primary-foreground border-t-transparent rounded-full animate-spin mr-1" />
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

            {/* Right Showcase Section */}
            <div className="hidden md:flex bg-primary p-10 relative overflow-hidden flex-col justify-center items-center">
              <div className="absolute inset-0 opacity-[0.08]">
                <div className="absolute top-10 -left-20 w-80 h-80 bg-primary-foreground rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-20 w-80 h-80 bg-primary-foreground rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                <div className="space-y-5">
                  {currentStep === 0 && (
                    <>
                      <div className="w-14 h-14 mx-auto bg-white/5 backdrop-blur-xl rounded-lg flex items-center justify-center border border-white/15">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <h2 className="text-2xl font-bold text-primary-foreground leading-tight">
                        Welcome to Our Platform
                      </h2>
                      <p className="text-xs text-primary-foreground/75 max-w-xs leading-relaxed">
                        Join thousands of creators, agencies, and brands building amazing partnerships
                      </p>
                    </>
                  )}

                  {currentStep > 0 && userType && (
                    <>
                      <div className="w-14 h-14 mx-auto bg-white/5 backdrop-blur-xl rounded-lg flex items-center justify-center border border-white/15">
                        {(() => {
                          const selectedType = userTypes.find((t) => t.id === userType)
                          const Icon = selectedType?.icon
                          return Icon ? <Icon className="w-6 h-6 text-primary-foreground" /> : null
                        })()}
                      </div>
                      <h2 className="text-2xl font-bold text-primary-foreground leading-tight capitalize">
                        {userType} Setup
                      </h2>
                      <p className="text-xs text-primary-foreground/75 max-w-xs leading-relaxed">
                        We're excited to have you join our community. Just a few more details to get started.
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-2.5 bg-white/5 backdrop-blur-xl rounded-md border border-white/10">
                            <div className="text-sm font-bold text-primary-foreground mb-0.5">
                              {i === 1 ? "10k+" : i === 2 ? "500+" : "99%"}
                            </div>
                            <div className="text-xs text-primary-foreground/70">
                              {i === 1 ? "Users" : i === 2 ? "Agencies" : "Satisfaction"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 px-8 text-xs text-muted-foreground">
          Already have an account?{" "}
          <button className="text-primary hover:text-primary/90 font-medium transition-colors">Sign in</button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow
