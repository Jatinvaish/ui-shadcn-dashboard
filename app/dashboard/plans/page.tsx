"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckoutModal } from "./components/checkout-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  fetchPlans, 
  fetchMySubscription,
  selectPlans, 
  selectCurrentSubscription,
  selectSubscriptionLoading, 
  selectSubscriptionError 
} from "@/store/slices/subscriptionSlice"
import type { AppDispatch } from "@/store/store"

interface TransformedPlan {
  id: string
  rawId: number
  name: string
  description: string
  price: number | string
  monthlyPrice: number
  annualPrice: number
  features: Array<{ name: string; included: boolean }>
  cta: string
  highlighted?: boolean
  badge?: string
  isCurrent?: boolean
  plan_tier: string
}

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<TransformedPlan | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const plans = useSelector(selectPlans)
  const currentSubscription = useSelector(selectCurrentSubscription)
  const isLoading = useSelector(selectSubscriptionLoading)
  const error = useSelector(selectSubscriptionError)

  useEffect(() => {
    dispatch(fetchPlans())
    dispatch(fetchMySubscription())
  }, [dispatch])

  const transformedPlans: TransformedPlan[] = plans.map((plan) => {
    const isCurrent = currentSubscription?.subscription_plan_id === plan.id

    return {
      id: plan.plan_slug || String(plan.id),
      rawId: plan.id,
      name: plan.plan_name,
      description: `Perfect for ${plan.plan_type}`,
      price: plan.is_free ? 0 : (plan.price_monthly || "Custom"),
      monthlyPrice: plan.price_monthly || 0,
      annualPrice: plan.price_yearly || 0,
      features: [
        { name: `Up to ${plan.max_staff || "unlimited"} users`, included: true },
        { name: `${plan.max_storage_gb || "unlimited"} GB storage`, included: !!plan.max_storage_gb },
        { name: `${plan.max_campaigns || "unlimited"} campaigns`, included: !!plan.max_campaigns },
        { name: `${plan.max_invitations || "unlimited"} invitations`, included: !!plan.max_invitations },
        { name: `${plan.max_integrations || "unlimited"} integrations`, included: !!plan.max_integrations },
        { name: "Priority Support", included: !!plan.priority_support },
        { name: "Custom Branding", included: !!plan.custom_branding },
        { name: "White Label", included: !!plan.white_label },
        { name: "SSO Enabled", included: !!plan.sso_enabled },
      ],
      cta: plan.is_free 
        ? "Get Started" 
        : plan.plan_tier === "enterprise" 
        ? "Contact Sales" 
        : `Upgrade to ${plan.plan_name}`,
      highlighted: plan.plan_tier === "pro" && !isCurrent,
      badge: plan.plan_tier === "pro" && !isCurrent ? "Popular" : undefined,
      isCurrent,
      plan_tier: plan.plan_tier
    }
  })

  const allFeatures = Array.from(
    new Set(transformedPlans.flatMap((plan) => plan.features.map((f) => f.name)))
  )

  const handleUpgrade = (plan: TransformedPlan) => {
    if (plan.plan_tier === "enterprise") {
      // Handle enterprise contact sales
      window.location.href = "mailto:sales@example.com"
      return
    }

    setSelectedPlan(plan)
    setIsCheckoutOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="space-y-8 lg:space-y-12">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Simple, Transparent Pricing</h1>
            <p className="text-muted-foreground mt-2 text-lg">Choose the perfect plan for your needs</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`text-sm cursor-pointer font-medium transition-colors ${
                billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === "annual" ? "bg-primary" : "bg-muted"
              }`}
            >
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-background transition-transform ${
                  billingCycle === "annual" ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`text-sm cursor-pointer font-medium transition-colors ${
                billingCycle === "annual" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              {billingCycle === "annual" && (
                <Badge variant="outline" className="ml-2 inline-flex">
                  Save 16%
                </Badge>
              )}
            </button>
          </div>
        </div>

        {transformedPlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No plans available</p>
          </div>
        ) : (
          <>
            {/* Plans Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {transformedPlans.map((plan) => {
                const displayPrice =
                  plan.price === "Custom" ? "Custom" : billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice
                const billingPeriod = plan.price === "Custom" ? "" : billingCycle === "annual" ? "/year" : "/month"

                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col transition-all duration-300 ${
                      plan.isCurrent
                        ? "border-primary shadow-lg ring-2 ring-primary/20"
                        : plan.highlighted
                        ? "border-primary/50 shadow-lg lg:scale-105"
                        : "hover:shadow-md"
                    }`}
                  >
                    {plan.isCurrent && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        Current Plan
                      </Badge>
                    )}

                    {!plan.isCurrent && plan.badge && (
                      <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2">
                        {plan.badge}
                      </Badge>
                    )}

                    <CardHeader className={plan.badge || plan.isCurrent ? "pt-6" : ""}>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>

                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          {typeof displayPrice === "string" ? (
                            <span className="text-3xl font-bold">{displayPrice}</span>
                          ) : (
                            <>
                              <span className="text-4xl font-bold">${displayPrice}</span>
                              <span className="text-muted-foreground text-sm">{billingPeriod}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col">
                      <ul className="mb-8 space-y-3 flex-1">
                        {plan.features
                          .filter((feature) => feature.included)
                          .map((feature, index) => (
                            <li key={index} className="flex items-center gap-3">
                              <Check className="h-5 w-5 shrink-0 text-green-600" />
                              <span className="text-sm">{feature.name}</span>
                            </li>
                          ))}
                      </ul>

                      <Button
                        variant={plan.isCurrent ? "outline" : "default"}
                        className="w-full"
                        size="lg"
                        onClick={() => !plan.isCurrent && handleUpgrade(plan)}
                        disabled={plan.isCurrent}
                      >
                        {plan.isCurrent ? "Current Plan" : plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Feature Comparison Table */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Feature Comparison</h2>
                <p className="text-muted-foreground mt-1">Compare all features across our plans</p>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Feature</th>
                      {transformedPlans.map((plan) => (
                        <th key={plan.id} className="px-6 py-3 text-center text-sm font-semibold">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFeatures.map((featureName, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">{featureName}</td>
                        {transformedPlans.map((plan) => {
                          const feature = plan.features.find((f) => f.name === featureName)
                          return (
                            <td key={`${plan.id}-${featureName}`} className="px-6 py-4 text-center">
                              {feature?.included ? (
                                <Check className="mx-auto h-5 w-5 text-green-600" />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false)
            setSelectedPlan(null)
          }}
          plan={{
            id: selectedPlan.rawId,
            plan_name: selectedPlan.name,
            plan_slug: selectedPlan.id,
            plan_tier: selectedPlan.plan_tier,
            price_monthly: selectedPlan.monthlyPrice,
            price_yearly: selectedPlan.annualPrice,
            currency: "USD"
          }}
          billingCycle={billingCycle}
        />
      )}
    </>
  )
}