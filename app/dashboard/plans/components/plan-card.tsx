"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface Feature {
  name: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  description: string
  price: number | string
  monthlyPrice: number
  annualPrice: number
  features: Feature[]
  cta: string
  highlighted?: boolean
  badge?: string
}

interface PlanCardProps {
  plan: Plan
  billingCycle: "monthly" | "annual"
}

export function PlanCard({ plan, billingCycle }: PlanCardProps) {
  const displayPrice =
    plan.price === "Custom" ? "Custom" : billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice

  const billingPeriod = plan.price === "Custom" ? "" : billingCycle === "annual" ? "/year" : "/month"

  return (
    <Card
      className={`relative flex flex-col transition-all duration-300 ${
        plan.highlighted ? "border-primary/50 shadow-lg lg:scale-105" : "hover:shadow-md"
      }`}
    >
      {plan.badge && (
        <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">
          {plan.badge}
        </Badge>
      )}

      <CardHeader className={plan.badge ? "pt-6" : ""}>
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
        {/* Features List */}
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

        {/* CTA Button */}
        <Button variant={"outline"} className="w-full" size="lg">
          {plan.cta}
        </Button>
      </CardContent>
    </Card>
  )
}
