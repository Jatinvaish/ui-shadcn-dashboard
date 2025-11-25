"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Badge } from "@/components/ui/badge"
import { PlanCard } from "./components/plan-card"
import { fetchPlans, selectPlans, selectSubscriptionLoading } from "@/store/slices/subscriptionSlice"
import type { AppDispatch } from "@/store/store"
import { Check, Loader2 } from "lucide-react"

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const dispatch = useDispatch<AppDispatch>()
  const plans = useSelector(selectPlans)
  const isLoading = useSelector(selectSubscriptionLoading)

  useEffect(() => {
    dispatch(fetchPlans())
  }, [dispatch])

  const transformedPlans = plans.map((plan) => ({
    id: plan.planSlug || String(plan.id),
    name: plan.planName,
    description: `Perfect for ${plan.planType}`,
    price: plan.isFree ? 0 : (plan.priceMonthly || "Custom"),
    monthlyPrice: plan.priceMonthly || 0,
    annualPrice: plan.priceYearly || 0,
    features: [
      { name: `Up to ${plan.maxStaff || "unlimited"} users`, included: true },
      { name: `${plan.maxStorageGb || "unlimited"} GB storage`, included: !!plan.maxStorageGb },
      { name: `${plan.maxCampaigns || "unlimited"} campaigns`, included: !!plan.maxCampaigns },
      ...(plan.features ? Object.entries(plan.features).map(([key, value]) => ({
        name: key.replace(/([A-Z])/g, ' $1').trim(),
        included: !!value
      })) : [])
    ],
    cta: plan.isFree ? "Get Started" : plan.planTier === "enterprise" ? "Contact Sales" : `Upgrade to ${plan.planName}`,
    highlighted: plan.planTier === "pro",
    badge: plan.planTier === "pro" ? "Popular" : undefined,
  }))

  const allFeatures = Array.from(
    new Set(transformedPlans.flatMap((plan) => plan.features.map((f) => f.name)))
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 lg:space-y-12">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground mt-2 text-lg">Choose the perfect plan for your needs</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`text-sm font-medium transition-colors ${
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
            className={`text-sm font-medium transition-colors ${
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

      <div className="grid gap-6 lg:grid-cols-3">
        {transformedPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billingCycle={billingCycle} />
        ))}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Feature Comparison</h2>
          <p className="text-muted-foreground mt-1">Compare all features across our plans</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
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
                <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
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
    </div>
  )
}