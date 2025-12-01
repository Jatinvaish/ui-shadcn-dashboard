"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Lock, CheckCircle2, Loader2 } from "lucide-react"
import { changeSubscription, fetchMySubscription } from "@/store/slices/subscriptionSlice"
import type { AppDispatch } from "@/store/store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Plan {
  id: number
  plan_name: string
  plan_slug: string
  plan_tier: string
  price_monthly?: number
  price_yearly?: number
  currency?: string
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan
  billingCycle: "monthly" | "annual"
}

export function CheckoutModal({ isOpen, onClose, plan, billingCycle }: CheckoutModalProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"details" | "processing" | "success">("details")

  // Form state
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")

  const price =
    billingCycle === "annual" ? plan.price_yearly || 0 : plan.price_monthly || 0
  const savings = billingCycle === "annual" && plan.price_monthly 
    ? (plan.price_monthly * 12 - (plan.price_yearly || 0)).toFixed(2)
    : null

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned
    return formatted.substring(0, 19) // 16 digits + 3 spaces
  }

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`
    }
    return cleaned
  }

  const handleSubmit = async () => {
    // Validation
    if (paymentMethod === "card") {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        toast.error("Please fill in all card details")
        return
      }

      if (cardNumber.replace(/\s/g, "").length !== 16) {
        toast.error("Invalid card number")
        return
      }

      if (expiryDate.length !== 5) {
        toast.error("Invalid expiry date")
        return
      }

      if (cvv.length !== 3) {
        toast.error("Invalid CVV")
        return
      }
    }

    setIsProcessing(true)
    setPaymentStep("processing")

    try {
      // Simulate payment processing (fake payment)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Call backend to update subscription
      await dispatch(
        changeSubscription({
          planId: plan.id,
          billingCycle: billingCycle === "annual" ? "yearly" : "monthly",
          changeReason: "Plan upgrade via checkout"
        })
      ).unwrap()

      // Refresh subscription data
      await dispatch(fetchMySubscription())

      setPaymentStep("success")
      
      // Auto close and redirect after 2 seconds
      setTimeout(() => {
        onClose()
        router.push("/dashboard")
        toast.success("Subscription updated successfully!")
      }, 2000)
    } catch (error: any) {
      console.error("Payment failed:", error)
      toast.error(error?.message || "Payment failed. Please try again.")
      setPaymentStep("details")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setPaymentStep("details")
      // Reset form
      setCardNumber("")
      setCardName("")
      setExpiryDate("")
      setCvv("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {paymentStep === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Purchase</DialogTitle>
              <DialogDescription>
                Secure checkout for {plan.plan_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Order Summary */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="font-medium">{plan.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Billing</span>
                    <span className="font-medium capitalize">{billingCycle}</span>
                  </div>
                  {savings && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Annual Savings</span>
                      <span className="font-medium">-${savings}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${price}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label className="mb-2">Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Credit/Debit Card</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Card Details */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                      />
                      <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Secure 256-bit SSL encrypted payment</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isProcessing} className="flex-1">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay ${price}</>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {paymentStep === "processing" && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-sm text-muted-foreground">Please wait while we process your payment...</p>
          </div>
        )}

        {paymentStep === "success" && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your subscription has been updated to {plan.plan_name}
            </p>
            <Badge variant="secondary">Redirecting to dashboard...</Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}